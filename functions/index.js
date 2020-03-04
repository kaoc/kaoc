const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

const emailUser = functions.config().smtp.username;
const emailPassword = functions.config().smtp.password;
const mailTransportOptions = {
    "service" : "gmail",
    "auth":{
        "user": emailUser,
        "pass": emailPassword
    }
};

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

exports.handleUserAdded = functions.auth.user().onCreate((user) => {
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

    return _addOrUpdateMember(kaocMemberData);
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
    return _assertAdminRole(context)
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
    return _assertAdminRole(context) 
    .catch(e=> {
        throw new functions.https.HttpsError(
            'permission-denied', 
            'User does not have the authorization to perform this operation');
    })
    .then(authResult => {
        const kaocUserId = data.memberId || data.kaocUserId;
        // look up the current year memebership
        let kaocUserRef = admin.firestore().doc(`/kaocUsers/${kaocUserId}`);
        const currentTime = admin.firestore.Timestamp.fromMillis(new Date());
        let result = {};
        let kaocMemberRefs = [kaocUserRef];
    
        const membershipColRef = admin.firestore().collection('/kaocMemberships');
        //TODO - Resolve the recursive thens
        return membershipColRef.where('kaocUserRefs', 'array-contains', kaocUserRef)
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
    })
});

var testing = false;

/**
 * Ensures that the user in the context is an admin user. 
 * 
 * @param {Conext} context 
 */
function _assertAdminRole(context) {
    if(testing) {
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
    return _assertAdminRole(context)
    .catch(e=> {
        throw new functions.https.HttpsError(
                    'permission-denied', 
                    'User does not have the authorization to perform this operation');
    })
    .then(result => {
        // TODO change name to kaocPaymentId
        console.log('updatePayment called for ' + data.paymentId);
        let paymentId = data.paymentId;
        let paymentDetailsObj = data.payment;
        if(!data.payment) {
            paymentDetailsObj = data;
            delete paymentDetailsObj.paymentId;
        }
        return _updatePayment(paymentId, paymentDetailsObj, context.auth);
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
            memberObject.ageGroup = memberObject.ageGroup || "ageGroup";
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
    paymentStatus = paymentStatus || 'Paid';
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
            'paymentStatus': paymentStatus || 'Paid',
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
                paymentStatus = 'Pending';
            } else {
                paymentStatus = 'Paid';
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
            && paymentDoc.paymentStatus === 'Paid' 
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
    email.from = email.from || emailUser;
    console.log(`Sending Email ${JSON.stringify(email)}`);
    return mailTransport.sendMail(email)
    .then(result =>{
        console.log(`Email sent. Removing email record`, result);
        return emailSnapShot.ref.delete();
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