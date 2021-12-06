const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
var QRCode = require('qrcode');
const { auth } = require('firebase-admin');

const PAYMENT_STATUS_PAID = 'Paid';
const PAYMENT_STATUS_UNPAID = 'UnPaid';
const PAYMENT_STATUS_PENDING = 'Pending';
const PAYMENT_STATUS_DECLINED = 'Declined';

var mailTransportOptions = functions.config().smtp;

const hostUrl = functions.config().host.url || 'https://kaoc.app';

// 1 month default
const defaultKeyExpirationPeriod = 1000 * 60 * 60 * 24 * 30;


admin.initializeApp();

/**
 * An API to import existing memberships to the system. 
 * The existing membership data is currently stored in excel sheet 
 * as record containing the member & spouse details. 
 */
exports.importMembership = functions.https.onRequest(async (req, res) => {

    var apiKey = req.get('apiKey');
    console.debug('Import Membership called with apiKey', apiKey);
    return validateKey(apiKey, 'importMembership')
    .catch(e=>{
        console.error(`Import membership called with invalid authentication. Reason : ${e.message}`)
        res.status(401).send('Api Key not specified or is invalid');
        //throw new functions.https.HttpsError('permission-denied', 'Api Key not specified or is invalid');
        return null;
    }).then(keyData=>{
        if(keyData) {
            console.error(`Key Data ${JSON.stringify(keyData)}`);
            // Grab the text parameter.
            const importedMembershipData = req.body;
            const stringifiedVersion = JSON.stringify(importedMembershipData);
            console.log(`Membership data ${stringifiedVersion}`)

            // collect membership info
            const membershipYear = importedMembershipData.membershipYear;
            const membershipType = importedMembershipData.membershipType;
            const legacyMembershipId = importedMembershipData.memberNumber; // This is to keep backward compatability with old member id
            const membershipId = importedMembershipData.membershipId;
            const membership = {membershipId, membershipYear, membershipType, legacyMembershipId};

            // collect payment info
            const {paymentId, paymentMethod, paymentAmount, paymentNotes, checkNumber}  = importedMembershipData;
            let payment = {kaocPaymentId: paymentId, paymentMethod, paymentAmount, paymentNotes};
            payment.paymentExternalSystemRef = checkNumber;

            // This will effectively become the legacyMembershipId.
            let members = [];
            members.push({
                kaocUserId: importedMembershipData.kaocUserId, 
                firstName: importedMembershipData.firstName,
                lastName: importedMembershipData.lastName,
                phoneNumber: importedMembershipData.phoneNumber,
                emailId: importedMembershipData.emailId,
                ageGroup: (importedMembershipData.ageGroup || "Adult")
            });

            if(importedMembershipData.spouseEmailId === importedMembershipData.emailId) {
                //special case, some records have the same emails listed for both spouse and primary member
                importedMembershipData.spouseEmailId = null;
            }

            if(importedMembershipData.spouseFirstName || importedMembershipData.spouseLastName || importedMembershipData.spouseEmailId) {
                members.push({
                    kaocUserId:importedMembershipData.spouseKaocUserId, 
                    firstName: importedMembershipData.spouseFirstName,
                    lastName: importedMembershipData.spouseLastName,
                    phoneNumber: importedMembershipData.spousePhoneNumber,
                    emailId: importedMembershipData.spouseEmailId,
                    ageGroup: (importedMembershipData.spouseAgeGroup || "Adult"),
                });
            }

            return _addOrUpdateMemberMembershipAndPayment(members, membership, payment);
        } else {
            return null;
        }
    }).then(resultsX => {
        if(resultsX) {
            var result = {};

            result.userId           = resultsX.userIds[0];
            if(resultsX.userIds.length > 1) {
                result.spouseUserId = resultsX.userIds[1];
            }
            result.membershipId     = resultsX.membershipId;
            if(resultsX.paymentId) {
                result.paymentId         = resultsX.paymentId;
            }
            res.status(200).send(result);
            return result; 
        }
        return null;
    });
});

/**
 * When a new User Login is created, check if KAOC profile exists
 * for the login email id. If so, use that information to update
 * the KAOC profile. 
 */
exports.handleUserAdded = functions.auth.user().onCreate((user) => {
    // Check if a user profile exists with the matching email id
    return admin.firestore().collection('/kaocUsers')
            .where('emailId', '==', user.email)
            .limit(1)
            .get()
            .then(kaocUserQuerySnapshot => {
                if(!kaocUserQuerySnapshot.empty) {
                    console.log(`Found kaoc profile for newly created user with email ${user.email}`);    
                
                    let kaocMemberData = {
                        'emailId': user.email,
                        'loginId': user.uid
                    };

                    // profile exists
                    if(user.displayName) {
                        var userNameSplit = displayName.split(' ');
                        var firstName = userNameSplit[0];
                        var lastName = userNameSplit[userNameSplit.length - 1];
                        kaocMemberData.firstName = firstName;
                        kaocMemberData.lastName = lastName;
                    }
                    
                    if(user.phoneNumber) {
                        kaocMemberData.phoneNumber = user.phoneNumber;
                    }
                    // add or update is called. But it is always update
                    return _addOrUpdateMember(kaocMemberData);
                } else {
                    console.log(`Could not find kaoc profile for newly created user with email ${user.email}`);
                    return null;
                }
            });
});

/**
 * Creates a new profile for the given user
 */
exports.createNewProfile = functions.https.onCall((data, context) => {
    context = _setUpTestingContext(context);

    if(!_assertAuthenticated(context)) {
        throw new functions.https.HttpsError(
            'permission-denied', 
            'This operation can only be performed by a logged in user');
    }

    return admin.auth().getUser(context.auth.uid)
        .then(user=>{
            var userNameSplit = user.displayName.split(' ');
            var firstName = userNameSplit[0];
            var lastName = userNameSplit[userNameSplit.length - 1];
        
            const kaocMemberData = {
                'emailId': user.email,
                'firstName': firstName,
                'lastName': lastName,
                'loginId': user.uid
            };
        
            if(user.phoneNumber) {
                kaocMemberData.phoneNumber = user.phoneNumber;
            }
            // add or update is called.
            return _addOrUpdateMember(kaocMemberData);

        }).catch(e=>{
            this.error('Error Creating a new profile');
            throw e;
        });
});

/**
 * HTTPS callable function for web application
 * 
 * @param {object} data 
 *  Expected Fields
 *    {Array<object>} members - Array of members
 *    {object}  membership
 *      Expected Fields
 *        {number} membershipYear
 *        {string} membershipType
 *        {string} legacyMembershipId membership group id typing together memberships for all members
 *        {string} paymentStatus - Status of payment.
 *    {object}  payment 
 *      
 */
exports.addOrUpdateMemberAndMembership = functions.https.onCall((data, context) => {
    // get all the kaoc user ids being updated. 
    // Only the user themselves (which could be any of the user being updated) or an admin
    // can execute this function.
    const kaocUserIds = data.members.map(member=>member.kaocUserId);
    console.debug(`Updating membership details for kaocUser ids ${JSON.stringify(kaocUserIds)}`);
    return _assertSelfOrAdminRole(context, kaocUserIds)
    .catch(e => {
        throw new functions.https.HttpsError(
            'permission-denied', 
            'User does not have the authorization to perform this operation');
    })
    .then(resut => {
        return _addOrUpdateMemberMembershipAndPayment(
            data.members, 
            data.membership,
            data.payment,
            context.auth
        )
    });

});

/**
 * Returns the current membership data using a member id. 
 * This method returns the result based on current membership (if available)
 * If current membership is not available previous membership records will be 
 * added. Payment records will be returned only if current membership record 
 * is present. 
 * 
 */
exports.getCurrentMembershipDataByMemberId = functions.https.onCall((data, context) => {
    const kaocUserId = data.memberId || data.kaocUserId;
    return _assertSelfOrAdminRole(context, [kaocUserId]) 
    .catch(e=> {
        throw new functions.https.HttpsError(
            'permission-denied', 
            'User does not have the authorization to perform this operation');
    })
    .then(authResult => {
        return _getCurrentMembershipDataByKaocUserId(kaocUserId);
    })
});

/**
 * Returns the details of all membership data using a given year. 
 * If the year is skipeed, the current year will be used. 
 */
 exports.getMembershipReport = functions.https.onCall((data, context) => {
    const membershipYear = data.year || new Date().getFullYear();
    return _assertAdminRole(context) 
    .catch(e=> {
        throw new functions.https.HttpsError(
            'permission-denied', 
            'User does not have the authorization to perform this operation');
    })
    .then(authResult => {
        return _getMembershipReport(membershipYear);
    });
});


/**
 * Returns current membership data by the given kaoc user id. 
 * NOTE - This method is internal does not do any permission checks.
 * The required permission checks should be performed by the calling functions.
 * 
 * @param {string} kaocUserId 
 */
function _getCurrentMembershipDataByKaocUserId(kaocUserId) {
    // look up the current year memebership
    let kaocUserRef = admin.firestore().doc(`/kaocUsers/${kaocUserId}`);
    const currentTime = admin.firestore.Timestamp.fromMillis(new Date().getTime());
    let result = {};
    let kaocMemberRefs = [kaocUserRef];

    const membershipColRef = admin.firestore().collection('/kaocMemberships');
    return membershipColRef
        .where('kaocUserRefs', 'array-contains', kaocUserRef)
        //.where('startTime', '<=', currentTime)
        //.where('endTime', '>=', currentTime)
        .orderBy('endTime', 'desc')
        .limit(1) // Get the last membership record
        .get()
        .then(querySnapShot => {
            if(!querySnapShot.empty) {
                console.log(`Membership data exists for userid ${kaocUserId}`);
                //some membership record exists. 
                let membershipRef = querySnapShot.docs[0].ref;
                let membershipRecord = querySnapShot.docs[0].data();
                let {membershipType, endTime, startTime, paymentStatus, kaocUserRefs} = membershipRecord;
                let membership = {membershipType, paymentStatus, kaocMembershipId: membershipRef.id};
                membership.startTime = startTime.toMillis();
                membership.endTime = endTime.toMillis();

                // keep a reference to all the member records to pull.
                // The user id with which the query is made is already in the array
                // Add only members other than the queried user. This is to ensure that
                // the first member in the list is the queried user itself
                kaocUserRefs.forEach(ref => {
                    if(ref.id !== kaocUserRef.id) {
                        kaocMemberRefs.push(ref);
                    }
                });

                if(endTime.toMillis() > currentTime.toMillis()) {
                    // membership is active. 
                    result.membership = membership;
                    // that means payment details should be returned
                    console.log('Querying payments for membership record');
                    return admin.firestore().collection('/kaocPayments')
                                .where('paymentTypeRef', '==', membershipRef)
                                .where('paymentType', '==', 'Membership')
                                .limit(1)
                                .get();
                } else {
                    // this is a past membership
                    result.pastMembership = membership;
                }
            } else {
                console.log(`No Membership record for userid ${kaocUserId}`);
            }
            return null;
        }).then(paymentQuerySnapshot => {
            if(paymentQuerySnapshot && !paymentQuerySnapshot.empty) {
                let {paymentMethod, paymentAmount, paymentNotes, paymentStatus, paymentExternalSystemRef} = paymentQuerySnapshot.docs[0].data();
                result.payment = {paymentMethod, paymentAmount, paymentNotes, paymentStatus, paymentExternalSystemRef, kaocPaymentId: paymentQuerySnapshot.docs[0].id};
            }
            return Promise.all(
                            kaocMemberRefs.map(kaocRef => {
                                                    return kaocRef.get();
                                                }
                                            )
                    );
        }).then(memberDocumentSnapshots => {
            result.members = memberDocumentSnapshots.map(memberDocumentSnapshot => {
                if(memberDocumentSnapshot.exists) {
                    let {firstName, lastName, emailId, phoneNumber, ageGroup} = memberDocumentSnapshot.data();
                    return {firstName, lastName, emailId, phoneNumber, ageGroup, kaocUserId: memberDocumentSnapshot.id};
                } else {
                    return {};
                }
            });
            return result;
        });
}

function _getMembershipReport(memberShipYear) {
    // look up the current year memebership
    // create a dummy date object which falls within the current year.
    let dateComparison = new Date();
    dateComparison.setFullYear(memberShipYear);

    const membershipColRef = admin.firestore().collection('/kaocMemberships');
    return membershipColRef
        .where('endTime', '>=', dateComparison)
        .orderBy('endTime')
        .get()
        .then(querySnapShots => {
            var memberships = [];
            if(!querySnapShots.empty) {
                console.log(`Membership data exists for year ${memberShipYear}`);

                var paymentAndUserRefPromises = [];
                querySnapShots.docs.forEach(membershipSnapShot=>{
                    let membershipRef = membershipSnapShot.ref;
                    let membershipRecord = membershipSnapShot.data();
                    let {membershipType, paymentStatus, legacyMembershipId, startTime} = membershipRecord;
                    
                    if(startTime.toDate().getFullYear() !== Number(memberShipYear)) {
                        console.debug(`Ignoring membership for past year  ${startTime.toDate().getFullYear()} `)
                        return;
                    }

                    let membership = {membershipType, paymentStatus, legacyMembershipId, kaocMembershipId: membershipRef.id, users:[]};
                    memberships.push(membership);

                    // fetch the users for the membership.
                    let kaocUserRefs = membershipRecord.kaocUserRefs || [];
                    console.debug('Querying users for membership record');
                    kaocUserRefs.forEach(kaocUserRef=>{
                        let userFetchPromise = kaocUserRef.get().then(userQuerySnapShot=>{
                            // console.debug(`User record exists - ${userQuerySnapShot.exists}`)
                            if(userQuerySnapShot.exists) {
                                let {firstName, lastName, emailId, ageGroup, phoneNumber} = userQuerySnapShot.data();
                                membership.users.push({firstName, lastName, emailId, ageGroup, phoneNumber});
                            }
                            return null;
                        });

                        paymentAndUserRefPromises.push(userFetchPromise);
                    });

                    // find the payment record associated with the membership
                    console.log('Querying payments for membership record');
                    let paymentFetchPromise = admin.firestore().collection('/kaocPayments')
                                .where('paymentTypeRef', '==', membershipRef)
                                .where('paymentType', '==', 'Membership')
                                .limit(1)
                                .get().then(paymentQuerySnapshot=>{
                                    console.debug(`Payment record exists - ${!paymentQuerySnapshot.empty}`)
                                    if(!paymentQuerySnapshot.empty) {
                                        let {paymentMethod, paymentAmount, paymentNotes, paymentStatus, paymentExternalSystemRef, createTime} = paymentQuerySnapshot.docs[0].data();
                                        let payment = {paymentMethod, paymentAmount, paymentNotes, paymentStatus, paymentExternalSystemRef, kaocPaymentId: paymentQuerySnapshot.docs[0].id, paymentTime: createTime.toMillis()};
                                        Object.assign(membership, payment);
                                    }
                                    return null;
                                });
                    paymentAndUserRefPromises.push(paymentFetchPromise); 
                });
                return Promise.all(paymentAndUserRefPromises).then(ref=>{
                    return memberships;
                });                
            } else {
                console.log(`No Memberships for the year ${memberShipYear}`);
            }
            return memberships;
        }).then(memberships => {
            console.log(`Obtained ${memberships.length} membership records`)
            let users = [];
            memberships.forEach(membership=>{
                membership.users.forEach(user=>{
                    // create a flat object with the membership details and user details.
                    let userMemberShipDetails =  Object.assign({}, membership, user);
                    // remove the users array from this object - otherwise it will create unnecessary recursive data.
                    delete userMemberShipDetails.users;
                    users.push(userMemberShipDetails);
                });
            });
            return users;
        });
}

var testing = true;
function _setUpTestingContext(context) {
    if(testing) {
        context = {
            auth: {
                uid     : 'Krvpwi5Jj3atza3qxsfXA2ydDTZ2',
                token: {
                    emailId : 'chandrasekhar.hari@gmail.com'
                }
            }
        };
    }
    return context;
}


function _assertAuthenticated(context) {
    if(testing) {
        return true;
    }
    // Checking that the user is authenticated.
    if (!context.auth) {
        return new Error('User not authenticated');
    }
    return true;    
}

/**
 * Ensures that the logged in user is either a user in admin role or the either of the given kaocUserIds belongs 
 * to that of the logged in user. 
 * 
 * @param {object} context 
 * @param {Array<string>} kaocUserIds 
 * @return Promise
 */
function _assertSelfOrAdminRole(context, kaocUserIds) {
    // Checking that the user is authenticated.
    if (!context || !context.auth) {
        return Promise.reject(new Error('User not authenticated'));
    }

    // first fetch the kaoc user id corresponding to current logged in user. 
    return admin.firestore().collection('/kaocUsers')
    .where('loginId', '==', context.auth.uid)
    .limit(1)
    .get()
    .then(kaocUserQuerySnapshot => {
        if(!kaocUserQuerySnapshot.empty) {    
            const loggedInKaocUserId = kaocUserQuerySnapshot.docs[0].ref.id;
            const matchedLoggedInUid = kaocUserIds.find(kaocUserId => {return loggedInKaocUserId === kaocUserId;});
            if(matchedLoggedInUid) {
                console.debug('Permission granted as self');
                // if so return true 
                return Promise.resolve(true)
            } else {
                console.debug('Permission not granted as self. Checking admin permissions');
                return _assertAdminRole(context);
            }
        } else {
            return _assertAdminRole(context);
        }
    });
}


/**
 * Ensures that the user in the context is an admin user. 
 * 
 * @param {Conext} context 
 */
function _assertAdminRole(context) {
    if(testing) {
        console.log('Allowing Admin permissions for testing.');
        return Promise.resolve(true);
    }
    // Checking that the user is authenticated.
    if (!context.auth) {
        return Promise.reject(new Error('User not authenticated'));
    }

    return admin.firestore().doc(`/kaocRoles/${context.auth.uid}`)
    .get()
    .then(docSnapShot => {
        if(docSnapShot.exists) {
            let currTimeMillis = admin.firestore.Timestamp.now().toMillis();
            let adminRecord = docSnapShot.get('admin'); 
            if(adminRecord) {
                let startTime = adminRecord.startTime;
                let endTime = adminRecord.endTime;
                console.log(`Checking admin account. Admin data found. Checking Validity. Start Time ${startTime}, End Time: ${endTime} `);

                console.log(`Start Time Millis ${startTime.toMillis()}, End Time Millis ${endTime.toMillis()}, Curr Time Millis ${currTimeMillis}`);


                if(startTime !== null 
                        && endTime !== null 
                        && startTime.toMillis() <= currTimeMillis 
                        && endTime.toMillis() >= currTimeMillis) {
                    return Promise.resolve(true);            
                } else {
                    return Promise.reject(new Error('Users admin role validity has expired'));
                }
            } else {
                return Promise.reject(new Error('User is not an admin'));
            }
        } else {
            return Promise.reject(new Error('User is not an admin'));
        }
    });
}

/**
 * Updates an existing payment record. 
 * 
 * @param data - The Payment record
 *           Expected field
 *           paymentId - The id of the existing payment
 *           paymentStatus - The new payment status.       
 */
exports.updatePayment = functions.https.onCall((data, context) => { 
    // first check if the payment record exists and that the logged in user 
    // has the authority to update the payment.
    const kaocPaymentId = data.paymentId;         // TODO change name to kaocPaymentId

    return admin.firestore().doc(`/kaocPayments/${kaocPaymentId}`).get()
    .then(paymentDocSnapshot => {
        if(paymentDocSnapshot.exists) {
            const kaocUserRef = paymentDocSnapshot.data().kaocUserRef;
            if(kaocUserRef) {
                // either the user related to the payment or the admin can update the payment.
                // NOTE - There is a slight risk in allowing the user to update the payment. We are opening up the possibility for 
                // a user to effectively update the payment status as Paid. We are relying on the UI to control
                // this process and ensure that the payment is actually verified. 
                return _assertSelfOrAdminRole(context, [kaocUserRef.id]);
            } else {
                // no user reference for payment. Only admins can update. 
                return _assertAdminRole(context);
            }
        } else {
            return Promise.reject(new Error(`Invalid payment reference ${data.paymentId}`));
        }
    })
    .catch(e => {
        throw new functions.https.HttpsError(
                    'permission-denied', 
                    'User does not have the authorization to perform this operation');
    })
    .then(result => {
        console.log('updatePayment called for ' + kaocPaymentId);
        let paymentDetailsObj = data.payment;
        if(!data.payment) {
            paymentDetailsObj = data;
            delete paymentDetailsObj.paymentId; //TODO - Change attribute name to kaocPaymentId
        }
        return _updatePayment(kaocPaymentId, paymentDetailsObj, context.auth);
    });
});   

  

/**
 * Adds or update member and membership.
 * 
 * @param {Array<Member>} members 
 * @param {object} membership
 *  Expected fields
 *      {number} membershipYear 
 *      {string} membershipType 
 *      {legacyMembershipId} legacyMembershipId 
 *      {paymentStatus} paymentStatus 
 * @param {object} payment
 *  Expected Fields
 *      {string} paymentMethod    - Payment Source {Supported Types - Check, Cash, Square, Paypal}
 *      {number} paymentAmount    - The payment amount. 
 *      {string} paymentStatus     - The state of the payment (UnPaid/Pending/Paid/Declined). Default will be Paid.
 *      {string} paymentExternalSystemRef- A reference to the payment in external system. This could be the check number, paypay id etc.
 *      {string} paymentNotes            - Any paymentNotes regarding the payment.    
 * @param {object} auth - Authentication Object
 * 
 */
function _addOrUpdateMemberMembershipAndPayment(members, membership, payment, auth) {
    let result = {};
    
    let {membershipYear, membershipType, legacyMembershipId, kaocMembershipId, startTime, endTime} = membership || {};
    let {paymentMethod, kaocPaymentId, paymentAmount, paymentStatus, paymentExternalSystemRef, paymentNotes} = payment || {};

    if(!(members && members.length > 0)) {
        throw new Error(`Invalid members parameter. There should be at least 1 member in the array`);
    }

    var addMemberPromises = [];
    members.forEach(member => {
        addMemberPromises.push(_addOrUpdateMember(member));
    });

    return Promise.all(addMemberPromises)
    .then(kaocUserIds => {
        result.userIds = kaocUserIds;
        if(membershipType) {
            membershipYear = membershipYear || (new Date()).getFullYear();
            return _addOrUpdateMembership(
                {
                    kaocUserIds, membershipYear, 
                    membershipType, legacyMembershipId, 
                    paymentStatus, kaocMembershipId,
                    startTime, endTime
                },
                auth
            );
        } else {
            return Promise.resolve(null);
        }
    }).then(membershipId => {
        if(membershipId) {
            result.membershipId = membershipId;
        }
        // If there are payment records, add/update them them 
        if(kaocPaymentId || (paymentMethod && paymentAmount)) {

            // add payment reference back to the membership record. 
            const paymentTypeRef = admin.firestore().doc(`/kaocMemberships/${membershipId}`);
            // Use the first users id for payment
            const kaocUserId = result.userIds[0];
            // The payment will be recorded as membership fee
            const paymentType = 'Membership';

            return _addOrUpdatePayment({
                kaocPaymentId,
                kaocUserId, paymentMethod, 
                paymentAmount, paymentType, 
                paymentTypeRef, paymentStatus,
                paymentExternalSystemRef,
                paymentNotes                
            }, auth);
        } else {
            return Promise.resolve(null);
        }
    }).then(paymentId => {
        if(paymentId) {
            result.paymentId = paymentId;
        }

        return result;
    });
}

/**
 * Adds or update member object
 * 
 * @param {memberObject} memberObject 
 * @return {string} - KAOC User id.
 */
function _addOrUpdateMember(memberObject) {
    if(!(memberObject 
            && (memberObject.kaocUserId || memberObject.firstName || memberObject.lastName || memberObject.emailId))) {
        throw new Error(`Invalid Member object ${JSON.stringify(memberObject)}`);        
    }
    console.log(`Add or Update Member ${JSON.stringify(memberObject)}`);
    
    // Step 1 Validate if the member already exist. 
    const currentTime = admin.firestore.Timestamp.fromMillis(new Date());
    let userCollectionRef = admin.firestore().collection('/kaocUsers');

    Object.keys(memberObject).forEach(key=> {
        if(!memberObject[key]) {
            delete memberObject[key];
        }
    });

    let query = null;
    let kaocUserRef = null;
    if(memberObject.kaocUserId) {
        kaocUserRef = userCollectionRef.doc(memberObject.kaocUserId);
        delete memberObject.kaocUserId;
    } else if(memberObject.emailId) {
        // A match can only be looked up if the user has an email. 
        // Otherwise, it is not possible to see if user is existing.
        query = userCollectionRef.where('emailId', "==", memberObject.emailId);
    } else {
        console.warn(`Adding user without kaocUserId or email id ${memberObject.firstName} ${memberObject.lastName}. Duplicate entry check cannot be perfomed.`)
    }
    return ((query !== null) ? query.get() : Promise.resolve(null))
    .then(querySnapShot => {
        if(kaocUserRef) {
            console.log(`Updaing user record ${JSON.stringify(memberObject)} using preexisting id ${kaocUserRef.id}.`)
            return kaocUserRef.update(memberObject);
        } else if(!(querySnapShot && !querySnapShot.empty)) {
            // User does not exist. 
            // add a new one
            memberObject.createTime = currentTime;
            console.log(`User record ${JSON.stringify(memberObject)} does not exist. Creating one.`);
            memberObject.ageGroup = memberObject.ageGroup || "Adult";
            return userCollectionRef.add(memberObject);
        } else {
            console.log(`User record for email id ${memberObject.emailId} already exist. Updating record.`)
            memberObject.updateTime = currentTime;
            kaocUserRef = querySnapShot.docs[0].ref;
            // User exists. Update the document reference. 
            return kaocUserRef.update(memberObject);
        }
    }).then(updateResult => {
        // The result here could be a writeResult, documentReference or a querySnapshot.
        // If the object is a querySnapshot, then the object will have 'query' field.
        // Use that to check the type of object received here.
        if(kaocUserRef) {
            // Simply return the reference id
            return kaocUserRef.id;
        } else {
            // updateResult is a document reference. 
            return updateResult.id;
        }
    });
}

/**
 * Adds or update membership for the given record. 
 * A given user can only contain 1 membership for a given year. 
 * If such a record already exist, the record will be updated 
 * with the new membership type and number. 
 * 
 * @param {object} membership
 * Expected fields
 *      {Array} kaocUserIds 
 *      {number} membershipYear
 *      {string} membershipType 
 *      {string} legacyMembershipId 
 *      {string} paymentStatus
 * @param {object} auth - Authentication Object
 * @return {string} membership id.
 */
function _addOrUpdateMembership(membership, auth) {
    let {kaocUserIds, membershipYear, membershipType, legacyMembershipId, paymentStatus, kaocMembershipId} = membership || {};

    membershipYear = membershipYear || (new Date()).getFullYear();
    paymentStatus = paymentStatus || PAYMENT_STATUS_PAID;
    membershipType = (membershipType || 'INDIVIDUAL').toUpperCase();

    console.log(`Adding membership for ${kaocUserIds}, ${membershipYear}, ${membershipType}, ${legacyMembershipId}`);
    const membershipStartTime = admin.firestore.Timestamp.fromMillis(Date.parse(`01 Jan ${membershipYear} 00:00:00 MST`));
    const membershipEndTime = admin.firestore.Timestamp.fromMillis(Date.parse(`31 Dec ${membershipYear} 23:59:59 MST`));

    const userRefs = kaocUserIds.map(kaocUserId => admin.firestore().doc(`/kaocUsers/${kaocUserId}`));

    let membershipCollectionRef;
    let membershipQueryRef;
    let membershipRef;

    return Promise
    .all(userRefs.map(userRef => userRef.get()))
    .then(userSnapshots => {
        // Validate the members first. 
        userSnapshots.forEach(userSnapShot => {
            if(!userSnapShot.exists) {
                throw new Error(`Invalid user reference ${userSnapShot.ref}. Membership cannot be added.`);
            }            
        })
        membershipCollectionRef = admin
                    .firestore()
                    .collection('/kaocMemberships');
        if(kaocMembershipId) {
            membershipRef = membershipCollectionRef.doc(kaocMembershipId);
            return null;
        } else {
            membershipQueryRef = membershipCollectionRef                                
            .where('kaocUserRefs', "array-contains-any", userRefs)
            .where('startTime', "==", membershipStartTime)
            .where('endTime', "==", membershipEndTime);
            return membershipQueryRef.get();
        }
    }).then(querySnapShot => {    
        let membershipRecord = {
            'kaocUserRefs' : userRefs,
            'startTime' : membershipStartTime,
            'endTime' : membershipEndTime,
            'membershipType': membershipType,
            'paymentStatus': paymentStatus || PAYMENT_STATUS_PAID,
        };

        if (legacyMembershipId) {
            membershipRecord.legacyMembershipId = legacyMembershipId;
        }

        if(membershipRef) {
            console.log(`Membership referred using membership id ${kaocMembershipId} `);
            _addAuditFields(membershipRecord, false, auth);
            return membershipRef.update(membershipRecord);
        } else if(querySnapShot.empty) {
            // Membership does not exist
            console.log(`Membership does not exist for ${kaocUserIds} for year - ${membershipYear}. Creeating new entry `);
            _addAuditFields(membershipRecord, true, auth);
            return membershipCollectionRef.add(membershipRecord);
        } else {
            _addAuditFields(membershipRecord, false, auth);
            console.log(`Membership already exist for ${kaocUserIds} for year - ${membershipYear}. Updating membership type and number with the new information.`);
            membershipRef = querySnapShot.docs[0].ref;
            kaocMembershipId = membershipRef.id;
            return membershipRef.update(membershipRecord);
        }
    }).then(result => {
        if(!kaocMembershipId) {
            // A new record is created. The result would be a data snaptshot at that time. 
            kaocMembershipId = result.id;
        }
        return kaocMembershipId;
    });
}

/**
 * Adds a payment record. 
 * 
 * @param {Object} paymentObject
 * Expected Fields
 *      {string} kaocUserId           - Required the KAOC user who is making the payment.
 *      {string} paymentMethod        - Payment Source {Supported Types - Check, Cash, Square, Paypal}
 *      {number} paymentAmount        - The payment amount. 
 *      {string} paymentStatus         - The state of the payment (Unpain/Pending/Paid/Declined). Default will be Paid.
 *      {string} paymentType          - Type of Payment (Membership, Event, Participant Fee etc)  
 *      {string} paymentTypeRef       - A reference related to record for which the payment is intented for. (e.g. reference to the membership group id.)
 *                                    - This field is kept loose at this time. This may or may not refer to the primary key of the record.   
 *      {string} paymentExternalSystemRef    - External system information about this payment.
 *                                          e.g. Check Number
 *                                               Paypal payement id
 *                                               Square payment id. 
 *      {string} paymentNotes                - Optional paymentNotes. 
 * 
 * @param {Object} auth - Authentication object. 
 * @return {string} kaocPaymentId
 */
function _addOrUpdatePayment(paymentObject, auth) {
    let {kaocPaymentId, kaocUserId, paymentMethod, 
        paymentAmount, paymentStatus, 
        paymentType, paymentTypeRef, 
        paymentExternalSystemRef,
        paymentNotes} = paymentObject || {};

    if (!(kaocUserId && paymentMethod && paymentAmount && paymentType)) {
        return Promise.reject(new Error('Invalid payment parameters.'));
    } else {
        // If payment status is not defined, use default based on the payment method.
        if(!paymentStatus) {
            if(paymentMethod === 'Square') {
                paymentStatus = PAYMENT_STATUS_PENDING;
            } else {
                paymentStatus = PAYMENT_STATUS_PAID;
            }
        }
        const kaocUserRef = admin.firestore().doc(`/kaocUsers/${kaocUserId}`); 
        const paymentDoc = {
            kaocUserRef,
            paymentMethod,
            paymentAmount,
            paymentStatus,
            paymentType,  
            paymentTypeRef,
            paymentExternalSystemRef,
            paymentNotes
        };

        if(kaocPaymentId) {
            console.debug(`Updating existing payment record with id ${kaocPaymentId}`);
            return _updatePayment(kaocPaymentId, paymentDoc, auth);
        } else {
            console.debug(`Creating a new payment`)
            return admin.firestore().collection('kaocPayments')
                .add(_addAuditFields(paymentDoc, true, auth))
                .then(paymentDocRef => {
                    kaocPaymentId = paymentDocRef.id;
                    return _sendPaymentEmail(paymentDoc);
                }).then((result)=>{
                    //console.debug(`PAyment record updated ${JSON.stringify(result)}`)
                    return kaocPaymentId;
                });
        }
    }            
}

// _updatePayment(paymentId(CUSTOMER_ID), paymentObject (paymentStatus=Paid))
function _updatePayment(kaocPaymentId, paymentObject, auth) {
    const paymentRef = admin.firestore().doc(`/kaocPayments/${kaocPaymentId}`);
    let paymentTypeRef = null;
    let paymentDoc = null;
    return paymentRef.get().then(paymentDocSnapshot=>{
        if(paymentDocSnapshot.exists) {
            paymentDoc = paymentDocSnapshot.data();
            paymentTypeRef = paymentDoc.paymentTypeRef;
            return paymentRef.update(_addAuditFields(paymentObject, false, auth));
        } else {
            return Promise.reject(new Error(`No payment found with reference id ${kaocPaymentId}`));
        }
    }).then(result=> {
        if(paymentTypeRef && paymentObject.paymentStatus) {
            return paymentTypeRef.get();
        }
        return null;
    }).then(paymentRefSnapshot=> {
        if(paymentRefSnapshot && paymentRefSnapshot.exists) {
            return paymentTypeRef.update({
                'paymentStatus': paymentObject.paymentStatus
            });
        }
        return null;
    }).then(result => {
        // if payment status changed, send an email
        if(paymentObject.paymentStatus !== paymentDoc.paymentStatus) {
            // paymentDoc is the object before applying the updates.
            // So instead of making another query, simply apply the changes
            // while calling the email method.
            paymentDoc = Object.assign(paymentDoc, paymentObject);
            return _sendPaymentEmail(paymentDoc);
        }
        return null;
    }).then(result => {
        return kaocPaymentId;
    });
}

/**
 * A method to consistently add audit fields to records that are inserted 
 * into database.
 * 
 * @param {Object} record - Any object which needs to be persisted to database.
 * @param {boolean} newRecord - Indicates if the record is new or not. 
 * @param {Object} auth  - Authentication Context
 */
function _addAuditFields(record, newRecord, auth) {
    if(record) {
        const currentTime = admin.firestore.Timestamp.fromMillis(new Date());
        if(newRecord) {
            record.createTime = currentTime;
            if(auth && auth.uid) {
                record.createUserLoginId = auth.uid;
            }
        }
        record.updateTime = currentTime;
        if(auth && auth.uid) {
            record.updateUserLoginId = auth.uid;
        }
    }
    return record;
}

/**
 * Callback from SquareServer after a Point of Sale is handled (from kaoc app) 
exports.squareServerPaymentCallback = functions.https.onRequest(async (req, res) => {
    console.log(JSON.stringify(req.query));
    console.log(JSON.stringify(req.body));
    res.status(200).send("OK");
    return Promise.resolve("OK");
});
 */

 /**
  * ONLY for Testing. 
exports.sendPaymentEmail = functions.https.onCall((data, context) => {
    return admin.firestore().doc(`/kaocPayments/${data.paymentId}`)
            .get()
            .then(paymentSnapShot=>{
                if(paymentSnapShot.exists) {
                    console.debug('Payment Record Found. Sending Email');
                    return _sendPaymentEmail(paymentSnapShot.data());
                } else {
                    console.debug('Could not find payment record');
                    return Promise.reject(new Error("Could not find payment record"));
                }
            });
});
  */

 /**
  * Sends out a payment email if the status is complete
  * 
  * @param {object} paymentDoc 
  */
 function _sendPaymentEmail(paymentDoc) {
    if(paymentDoc 
            && paymentDoc.paymentStatus === PAYMENT_STATUS_PAID
            && paymentDoc.paymentTypeRef
            && paymentDoc.kaocUserRef) {

        if(paymentDoc.paymentType === 'Membership') {
            let userEmail;
            let userName;
            let membershipType;
            let membershipYear;

            if(paymentDoc.kaocUserRef.path) {
                paymentDoc.kaocUserRef = paymentDoc.kaocUserRef.path;
            }

            if(paymentDoc.paymentTypeRef.path) {
                paymentDoc.paymentTypeRef = paymentDoc.paymentTypeRef.path;
            }

            console.debug('Membership Payment record found. Fetching User & Membership details for sending email');
            return admin.firestore().doc(paymentDoc.kaocUserRef)
                    .get()
                    .then(userSnapshot=>{
                        if(userSnapshot.exists) {
                            userEmail = userSnapshot.get('emailId');
                            userName = userSnapshot.get('firstName')+" "+userSnapshot.get('lastName');
                            console.debug(`User Information found - Email ${userEmail}, Username: ${userName}`);
                            return admin.firestore().doc(paymentDoc.paymentTypeRef).get();
                        } else {
                            console.error(`Invalid payment reference. Cannot find user record corresponding to the payment ${userSnapshot.ref.id}`);
                            return null;
                        }
                    })
                    .then(membershipSnapshot => {
                        if (membershipSnapshot) {
                            if(membershipSnapshot.exists) {
                                membershipType = membershipSnapshot.get('membershipType');
                                membershipYear = membershipSnapshot.get('startTime').toDate().getFullYear();
                                let currentYear = (new Date()).getFullYear(); 
                                console.debug(`Membership record found -  Type ${membershipType}, Year: ${membershipYear}`);
                                if(membershipYear !== currentYear) {
                                    console.info(`Membership is not for current year but ${membershipYear}. Not queueing email`);
                                    return null;
                                } else {
                                    return queueEmail({
                                        to: userEmail,
                                        subject: `Kerala Association Membership Payment Successful for ${membershipYear}`,
                                        html: `Hello ${userName}, <br>
                                                    You have succesfully completed a payment of ${paymentDoc.paymentAmount}$ towards KAOC membership.<br>
                                                    Membership Type: <b>${membershipType}</b><br>
                                                    Year: <b>${membershipYear}</b> <br>
                                                Thanks,
                                                KAOC Committe    
                                                `,
                                        text: `Hello ${userName}, 
                                                    You have succesfully completed a payment of ${paymentDoc.paymentAmount} towards KAOC membership.
                                                    Membership Type: ${membershipType}
                                                    Year: ${membershipYear}.
                                                Thanks,
                                                KAOC Committe    
                                                `
                                    });
                                }
                            } else {
                                console.error(`Invalid Payment reference. Cannot find membership record for ${membershipSnapshot.ref.id}`);
                                return false;
                            }
                        } else {
                            return false;
                        }
                    });
        } else {
            // TODO - Add emails for other events. 
            console.error('Payment Emails only supported for membership payments. This functionality is not implemented');
            return Promise.resolve(false);
        }
    } else {
        console.error('Payment Status could not be found or payment not in Paid Status');
        // cannot send email.
        return Promise.resolve(false);
    }
 }

/**
 * Queues email. 
 * 
 * @param {Object} email
 *      Expected Fields
 *          to: 
 *          from
 *          subject
 *          html or text 
 */
function queueEmail(email) {
    email.status = email.status || 'New';
    console.log(`Add Email Request for ${JSON.stringify(email)}`);
    return admin.firestore().collection('kaocEmails').add(email).then(emailDoc=>{
        return emailDoc.id;
    });
}

/**
 * Deliver Email 
 */
exports.deliverEmail = functions.firestore.document('kaocEmails/{emailId}').onCreate((emailSnapShot, context) => {
    const mailTransport = nodemailer.createTransport(mailTransportOptions);
    var email = emailSnapShot.data();
    email.from = email.from || mailTransportOptions.auth.user;
    console.log(`Sending Email ${JSON.stringify(email)}`);
    return mailTransport.sendMail(email)
    .then(result =>{
        console.log(`Email sent. Removing email record`, result);
        return emailSnapShot.ref.delete();
    }).catch(e=>{
        console.error(`Error Sending Email.`, e);
        console.log('Updating Status as failed');
        return emailSnapShot.ref.update({'status': 'Failed'});
    });
});

/**
 * 
 * Validates if the given key exists and is valid with the current date. 
 * 
 * @param {string} key API Key
 * @param {string} keyType Opional key type
 */
function validateKey(key, keyType) {
    if(!key) {
        return Promise.reject(new Error('Invalid key'));
    }
    return admin.firestore().doc(`/kaocKeys/${key}`)
    .get()
    .then(keySnapShot => {
        let isValid = false;
        let reason = null; 
        let keyRecord = null;

        if(keySnapShot.exists) {

            keyRecord = keySnapShot.data();
            let currTimeMillis = admin.firestore.Timestamp.now().toMillis();

            if(!keyType || keyRecord.keyType === keyType) {
                if(keyRecord.startTime) {
                    if(keyRecord.startTime.toMillis() <= currTimeMillis) {
                        if(keyRecord.endTime) {
                            if(keyRecord.endTime.toMillis() >= currTimeMillis) {
    
                                isValid = true;
                            } else {
                                isValid = false;
                                reason = 'Key is expired';
                            }
                        } else {
                            // End time not specified. So key is valid 
                            isValid = true;
                        }
                    } else {
                        isValid = false;
                        reason ='Key is not valid yet';
                    }
                } else {
                    isValid = false;
                    reason = 'Invalid Key';
                }
            } else {
                isValid = false;
                reason = 'Incorrect key type';
            }
        } else {
            isValid = false;
            reason = 'Invalid Key';
        }

        if(isValid) {
            return {
                'keyData': keyRecord.keyData
            }                        
        } else {
            throw new Error(reason);
        }
    });
}

/**
 * Creates a new key with the given type and key data. 
 * 
 * @param {string} keyType 
 * @param {Object} keyData 
 * @param {admin.firestore.Timestamp} startTime 
 * @param {admin.firestore.Timestamp} endTime 
 * @return {string} - The id of the key
 */
function createKey(keyType, keyData, startTime, endTime) {
    if(!startTime) {
        startTime = admin.firestore.Timestamp.now();
    }

    if(!endTime) {
        endTime = admin.firestore.Timestamp.fromMillis(startTime.toMillis() + defaultKeyExpirationPeriod);
    }

    return admin.firestore()
    .collection(`/kaocKeys`)
    .add({
        keyType,
        startTime, 
        endTime,
        keyData 
    }).then(keyDocRef => {
        return keyDocRef.id;
    });
}

function deleteKey(keyId) {
    if(keyId) {
        return admin.firestore()
        .doc(`/kaocKeys/${keyId}`).delete();
    } else {
        return null;
    }
}

/**
 * Request Email Profile linking for the logged in user user with the provided email id. 
 * 
 */
exports.requestEmailProfileLinking = functions.https.onCall((data, context) => {
    context = _setUpTestingContext(context);
    if(!_assertAuthenticated(context)) {
        throw new functions.https.HttpsError(
            'permission-denied', 
            'This operation can only be performed by a logged in user');
    }
    var loginId = context.auth.uid;
    var loginEmailId = context.auth.token.email;
    var emailId = data.emailId;
    if(!emailId) {
        throw new functions.https.HttpsError(
            'invalid-argument', 
            'Email id is required to link the profile');
    }
    let userDisplayName = null;

    // first look for an existing kaoc profile with the given email id.
    return admin.firestore().collection('/kaocUsers')
            .where('emailId', '==', emailId)
            .limit(1)
            .get()
            .then(kaocUserQuerySnapshot => {
                if(!kaocUserQuerySnapshot.empty) {
                    console.debug(`User record found with email id ${emailId}`);
                    userDisplayName = `${kaocUserQuerySnapshot.docs[0].get('firstName')} ${kaocUserQuerySnapshot.docs[0].get('lastName')}`;
                    return createKey(
                        'linkProfileEmail', 
                        {
                            loginId,
                            emailId,
                            loginEmailId,
                            kaocUserId: kaocUserQuerySnapshot.docs[0].ref.id
                        }
                    );
                } else {
                    console.debug(`No user record found with email id ${emailId}`);
                    return null;
                }       
            })
            .then(linkEmailProfileKeyId => {
                if(linkEmailProfileKeyId) {
                    const linkProfileUrl = `${hostUrl}/api/linkEmailProfile?key=${linkEmailProfileKeyId}`;
                    return queueEmail({
                        to: emailId,
                        subject: `Request to link Kerala Association User Profile`,
                        html: `Hello, ${userDisplayName}<br>
                                    We have received a request to link your Kerala Association Of Colorado user profile with a new login id.<br>
                                    Please verify the information and click the link below to complete the process.<br><br>
                                    New Login Email: <b>${context.auth.token.email}</b><br><br>
                                    Clicking the link below will let you login with this new email id and modify your existing Kerala Association User Profile.<br>
                                    Your email communications will still be sent to ${emailId}.<br>
                                    If you would like to modify your communication preferences to use the new email id, please login to the application
                                    and update your communication preferences.<br> 
                                    Click this link to associate with the new email <a href="${linkProfileUrl}">${linkProfileUrl}</a>
                                    <br><br>
                                Thanks,<br>
                                KAOC Committe    
                                `,
                    });
                } else {
                    // email not found - so nothing to be done here. 
                    return null;      
                }
            })
            .then(() => {
                // To not let the user figure out the state of this call, return a standard message
                // whether or not the email was sent. This is to avoid someone doing a 
                // trial and error to figure out if an email id is a registered user in 
                // the database.
                return true;
            });
}); 

exports.linkEmailProfile = functions.https.onRequest(async (req, res) => {
    
    const key = req.query.key;
    console.debug(`Request key - ${key}`);

    if(!key) {
        res.status(401).send('Profile link key not specified or is invalid');
        return null;
   }

   let keyData = null;

    return validateKey(key, 'linkProfileEmail')
    .then(data => {
        keyData = data.keyData;
        return admin.firestore().doc(`/kaocUsers/${keyData.kaocUserId}`).update({'loginId': keyData.loginId});
    })
    .then(() => {
        console.log(`Deleting Key - ${key}`);
        return deleteKey(key);
    })
    .then(() => {
        let encodedMessage = base64Encode(`Email ${keyData.emailId} has been linked to the login id ${keyData.loginEmailId}`);
        res.redirect(`${hostUrl}/secured/profileLinkStatus/${encodedMessage}`);
        return true;
    })
    .catch(e => {
        console.error('Failed. ', e);
        res.status(401).send('Profile link key not specified or is invalid');
        return null;
    });
});

// Event Services

exports.getUpcomingEvents = functions.https.onCall((data, context) => {
    context = _setUpTestingContext(context);
    if(!_assertAuthenticated(context)) {
        throw new functions.https.HttpsError(
            'permission-denied', 
            'This operation can only be performed by a logged in user');
    }

    let currTime = new Date();
    currTime.setHours(0, 0, 0, 0); //this is just to make sure that the upcoming events show up till midnight

    return admin.firestore().collection('/kaocEvents')
        .where('endTime', '>=', currTime)
        .orderBy('endTime', 'asc')
        .get()
        .then(eventQuerySnapShots => {
            let upcomingEvents = [];
            console.log(`Upcoming Events Empty ${eventQuerySnapShots.empty}`)
            if(!eventQuerySnapShots.empty) {
                eventQuerySnapShots.forEach(eventQuerySnapShot=>{
                    let eventData = _marshalEventDataFromSnapshot(eventQuerySnapShot);
                    upcomingEvents.push(eventData);
                });
            }
            console.log(`${upcomingEvents.length} Upcoming Events obtained.`)
            return upcomingEvents;
        });
});

function _getEventDetailsById(eventId) {
    return admin.firestore()
            .doc(`/kaocEvents/${eventId}`).get()
            .then(eventSnapShot=>{
                if(eventSnapShot.exists) {
                    return _marshalEventDataFromSnapshot(eventSnapShot);
                } else {
                    let errorResponse = {"msg": `Invalid Event Reference ${eventId}`};
                    throw errorResponse;
                }
            });
}

/**
 * 
 * 
 * @param {DocumentSnapshot} eventQuerySnapShot 
 * @returns 
 */
function _marshalEventDataFromSnapshot(eventQuerySnapShot) {
    if(!eventQuerySnapShot || !eventQuerySnapShot.exists) {
        return null;
    }

    let eventData =  eventQuerySnapShot.data();
    if(eventData.startTime) {
        eventData.startTime = eventData.startTime.toMillis();
    }
    if(eventData.endTime) {
        eventData.endTime = eventData.endTime.toMillis();
    }
    eventData.kaocEventId = eventQuerySnapShot.id;

    // Delete fields restricted to admins.
    delete eventData.capacity;
    delete eventData.totalAdultEventTicketCheckins;
    delete eventData.totalAdultMemberCheckins;
    delete eventData.totalChildMemberCheckins;
    delete eventData.totalChildEventTicketChecks;
    return eventData;
}


exports.performMemberEventCheckIn = functions.https.onCall((data, context) => {
    context = _setUpTestingContext(context);

    let kaocUserId = data.kaocUserId;
    let kaocEventId = data.kaocEventId;
    let numAdults   = data.numAdults;
    let numChildren = data.numChildren;

    return _assertAdminRole(context)    
                .catch(e=> {
                    throw new functions.https.HttpsError(
                        'permission-denied', 
                        'User does not have the authorization to perform this operation');
                }).then(authResponse => {
                    return _getCurrentMembershipDataByKaocUserId(kaocUserId);
                }).then(membershipData => {
                    if(membershipData 
                        && membershipData.membership 
                        && membershipData.membership.paymentStatus === PAYMENT_STATUS_PAID
                        &&  membershipData.membership.kaocMembershipId) {

                            let attendeeRef = admin.firestore().doc(`/kaocMemberships/${membershipData.membership.kaocMembershipId}`);
                            let attendeeType = 'Membership';
                            let checkInTime = new Date();
                            let eventRef = admin.firestore().doc(`/kaocEvents/${kaocEventId}`);

                            let writeBatch = admin.firestore().batch();    
                            if(numAdults > 0) {
                                for(let i=0;i<numAdults;i++) {
                                    writeBatch.set(
                                            admin.firestore().collection('/kaocEventCheckIns').doc(), 
                                            {attendeeRef, attendeeType, checkInTime, eventRef, 'userType':'Adult'});
                                }
                                // update the check in count for the event. 
                                writeBatch.update(
                                                eventRef, 
                                                {'totalAdultMemberCheckins': admin.firestore.FieldValue.increment(numAdults)}
                                            );
                            }

                            if(numChildren > 0) {
                                for(let i=0;i<numChildren;i++) {
                                    writeBatch.set(
                                            admin.firestore().collection('/kaocEventCheckIns').doc(), 
                                            {attendeeRef, attendeeType, checkInTime, eventRef, 'userType':'Child'});
                                }
                                // update the check in count for the event. 
                                writeBatch.update(
                                                eventRef, 
                                                {'totalChildMemberCheckins': admin.firestore.FieldValue.increment(numChildren)}
                                            );
                            }

                            return writeBatch.commit();
                        } else {
                            let response = {'msg': "User does not have a valid membership"};
                            throw response;
                        }
                }).then(response=> {
                    return true;
                });
});

exports.sendMemberEventPassEmail = functions.https.onCall((data, context) => {
    context = _setUpTestingContext(context);
    let kaocUserId = data.kaocUserId;
    let kaocEventId = data.kaocEventId;

    return _assertSelfOrAdminRole(context, [kaocUserId]).then(authDetails=>{
        return _sendMemberEventPassEmail(kaocUserId, kaocEventId);
    });
});

exports.sendEventPassEmail = functions.https.onCall((data, context) => {
    context = _setUpTestingContext(context);
    let kaocEventId = data.kaocEventId;

    return _assertSelfOrAdminRole(context, [kaocUserId]).then(authDetails=>{
        return _sendMemberEventPassEmail(kaocUserId, kaocEventId);
    });
});


function _sendMemberEventPassEmail(kaocUserId, kaocEventId, userDetails, membershipDetails, eventDetails) {

    let getUserDetailsPromise = null;
    if(userDetails) {
        getUserDetailsPromise = Promise.resolve(userDetails);
    } else {
        getUserDetailsPromise = admin.firestore()
                                    .doc(`/kaocUsers/${kaocUserId}`)
                                    .get()
                                    .then(
                                        userSnapShot => {
                                            if(userSnapShot.exists) {
                                                return userSnapShot.data();
                                            } else {
                                                let message = {"msg": `Invalid user reference ${kaocUserId}`};
                                                throw message;
                                            }
                                        });
    }

    return getUserDetailsPromise.then(kaocUserDetails => {
                // set User details 
                userDetails = kaocUserDetails;
                // Return membership details. 
                if(membershipDetails) {
                    return membershipDetails;
                } else {
                    return _getCurrentMembershipDataByKaocUserId(kaocUserId);
                }
            }).then(memDetails => {
                // set membership details. 
                membershipDetails = memDetails;
                if(membershipDetails 
                    && membershipDetails.membership 
                    && membershipDetails.membership.paymentStatus === PAYMENT_STATUS_PAID) {
                    // Return event details. 
                    if(eventDetails) {
                        return eventDetails;
                    } else {
                        return _getEventDetailsById(kaocEventId);
                    }
                } else {
                    let errorReason = {"msg": `No valid membership for user id ${kaocUserId}`};
                    throw errorReason;
                }
            }).then(kaocEventDetails=>{
                eventDetails = kaocEventDetails;
                // Generate QR Code now
                return _generateQRCodeDataURL(`kaocEventCheckIn:kaocMemberId:${userDetails.kaocUserId}:kaocEventId:${eventDetails.kaocEventId}`);
            }).then(qrCodeImageData => {
                
                // Queue email 
                return queueEmail({
                    to: userDetails.emailId,
                    subject: `KAOC Membership Event Pass for ${eventDetails.name}`,
                    html: `Hello ${userDetails.firstName} ${userDetails.lastName}, 
                                <br>
                                <br>
                                <p>
                                Thank you for your KAOC Membership.
                                Your membership includes pass for the following event conducted by Kerala Association of Colorado.
                                </p>
                                <h2>${eventDetails.name}</h2>
                                <p>${eventDetails.description}</p>
                                <p>Location: ${eventDetails.location}</p>
                                <p>
                                    Please use the QR below to check-in at the event venue. <br>
                                    <img src="${qrCodeImageData}" alt="Membership Check In Details">
                                </p>
                            Thanks,
                            KAOC Committe    
                            `,
                    text: `Hello ${userDetails.firstName} ${userDetails.lastName}, 
                            
                            Thank you for your KAOC Membership.
                            Your membership includes paas for the following event conducted by Kerala Association of Colorado.
                            ${eventDetails.name}
                            ${eventDetails.description}
                            Location: ${eventDetails.location}

                            We recommend creating an account at https://kaoc.app using the email ${userDetails.emailId}.
                            Once logged in, you can view your membership details and QR code that can be used to check-in 
                            at the event. 

                            Thanks,
                            KAOC Committe    
                            `
                });
            });
}

exports.getMemberEventCheckinDetails = functions.https.onCall((data, context) => {
    context = _setUpTestingContext(context);

    // use membership id for looking up event checks from a past membership.
    // Otherwise just use kaocUserId - this will return checkins using current
    // membership
    let kaocMembershipId = data.kaocMembershipId; 
    let kaocUserId = data.kaocUserId;
    let kaocEventId = data.kaocEventId;

    return _assertSelfOrAdminRole(context, [kaocUserId])    
                .catch(e=> {
                    throw new functions.https.HttpsError(
                        'permission-denied', 
                        'User does not have the authorization to perform this operation');
                }).then(authResponse => {
                    if(kaocMembershipId) {
                        // just return a fake membership object with the id. 
                        return {
                            'membership': {
                                kaocMembershipId
                            }
                        };
                    } else {
                        return _getCurrentMembershipDataByKaocUserId(kaocUserId);
                    }
                }).then(membershipData => {
                    if(membershipData 
                        && membershipData.membership 
                        &&  membershipData.membership.kaocMembershipId) {

                            let attendeeRef = admin.firestore().doc(`/kaocMemberships/${membershipData.membership.kaocMembershipId}`);
                            let attendeeType = 'Membership';
                            let eventRef = admin.firestore().doc(`/kaocEvents/${kaocEventId}`);

                            return admin.firestore()
                                .collection('/kaocEventCheckIns')
                                .where("attendeeRef", "==", attendeeRef)
                                .where("eventRef", "==", eventRef)
                                .where("attendeeType", "==", attendeeType)
                                .get()
                        } else {
                            let response = {'msg': "User does not have a valid membership"};
                            throw response;
                        }
                }).then(kaocEventCheckInsSnapShot=> {
                    let checkIns = [];
                    if(!kaocEventCheckInsSnapShot.empty) {
                        kaocEventCheckInsSnapShot.forEach(kaocEventCheckInDocRef=>{
                            let checkInData = kaocEventCheckInDocRef.data();
                            checkIns.push({
                                'kaocUserId': kaocUserId,
                                'kaocMembershipId': checkInData.attendeeRef.id,
                                'kaocEventId': checkInData.eventRef.id,
                                'userType': checkInData.userType,
                                'checkInTime': checkInData.checkInTime.toMillis()
                            });
                        });
                    }
                    return checkIns;
                });
});

exports.getMemberQRCode = functions.https.onCall((data, context) => {
    context = _setUpTestingContext(context);

    const kaocUserId = data.memberId || data.kaocUserId;
    return _assertSelfOrAdminRole(context, [kaocUserId]) 
    .catch(e => {
        throw new functions.https.HttpsError(
            'permission-denied', 
            'User does not have the authorization to perform this operation');
    })
    .then(authResult => {
        return _generateQRCodeDataURL(`kaocMemberId:${kaocUserId}`);
    }).then(qrCodeImage=>{
        console.log(`qrCode obtained for member.`)
        return {qrCodeImage};
    });
});


exports.getMembershipQRCode = functions.https.onCall((data, context) => {
    context = _setUpTestingContext(context);

    const kaocUserId = data.memberId || data.kaocUserId;
    return _assertSelfOrAdminRole(context, [kaocUserId]) 
    .catch(e => {
        throw new functions.https.HttpsError(
            'permission-denied', 
            'User does not have the authorization to perform this operation');
    })
    .then(authResult => {
        return _getCurrentMembershipDataByKaocUserId(kaocUserId);
    }).then(membershipData => {
        let kaocMembershipId = "N/A";
        if(membershipData) {
            if(membershipData.membership && membershipData.membership.kaocMembershipId) {
                kaocMembershipId = membershipData.membership.kaocMembershipId;
            } else if(membershipData.pastMembership && membershipData.pastMembership.kaocMembershipId) {
                kaocMembershipId = membershipData.pastMembership.kaocMembershipId;
            }
        } else {
            console.log("QR Code won't have valid data");
        }
        return _generateQRCodeDataURL(`kaocMembershipId:${kaocMembershipId}`);
    }).then(qrCodeImage=>{
        console.log(`qrCode obtained.`)
        return {qrCodeImage};
    });
});

/**
 * Returns a QR Code to be used to check in to an event using membership.
 */
exports.getMemberEventCheckInQRCode = functions.https.onCall((data, context) => {
    context = _setUpTestingContext(context);

    const kaocUserId = data.memberId || data.kaocUserId;
    const koacEventId = data.kaocEventId;

    return _assertSelfOrAdminRole(context, [kaocUserId]) 
    .catch(e => {
        throw new functions.https.HttpsError(
            'permission-denied', 
            'User does not have the authorization to perform this operation');
    })
    .then(authResult => {
        return _getCurrentMembershipDataByKaocUserId(kaocUserId);
    }).then(membershipData => {
        // validate membership before issuing QR Code. 
        if(membershipData && membershipData.membership && membershipData.membership.paymentStatus === PAYMENT_STATUS_PAID) {
            return _getEventDetailsById(koacEventId);
        } else {
            let errorResponse = {"msg": `User does not have an active membership ${kaocUserId}`};
            throw errorResponse;
        }
    }).then(eventDetails => {
        if(eventDetails && eventDetails.membershipAccessIncluded) {
            let memberEventCheckInCode = `kaocEventCheckIn:kaocMemberId:${kaocUserId}:kaocEventId:${koacEventId}`;
            return _generateQRCodeDataURL(memberEventCheckInCode);
        } else {
            let errorResponse = {"msg": `Invalid Event Reference ${koacEventId}. Event does not exist or does not support membership event access`};
            throw errorResponse;
        }
    }).then(qrCodeImage=>{
        console.log(`qrCode obtained.`)
        return {qrCodeImage};
    });
});


/**
 * Generates a QR Code URL from the 
 * @param {String} dataString 
 * @returns 
 */
function _generateQRCodeDataURL(dataString) {
    return QRCode
        .toDataURL(dataString)
        .then(url => {
            console.log(`QR Code generated for ${dataString}`);
            return url;
        })
        .catch(e=>console.error(`Error generating QR Code for ${dataString}`, e));
}


/**
 * Returns the encoded message string.
 * 
 * @param {string} message 
 */
function base64Encode(message) {
    let buff = new Buffer(message);
    let base64data = buff.toString('base64');
    return base64data;
}