const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * An API to import existing memberships to the system. 
 * The existing membership data is currently stored in excel sheet 
 * as record containing the member & spouse details. 
 */
exports.importMembership = functions.https.onRequest(async (req, res) => {
    // Grab the text parameter.
    const importedMembershipData = req.body;
    const stringifiedVersion = JSON.stringify(importedMembershipData);
    console.log(`Membership data ${stringifiedVersion}`)

    // collect membership info
    const membershipYear = importedMembershipData.membershipYear;
    const membershipType = importedMembershipData.membershipType;
    const legacyMembershipId = importedMembershipData.memberNumber; // This is to keep backward compatability with old member id
    const membership = {membershipYear, membershipType, legacyMembershipId};

    // collect payment info
    const {paymentMethod, paymentAmount, paymentNotes, checkNumber}  = importedMembershipData;
    let payment = {paymentMethod, paymentAmount, paymentNotes};
    payment.paymentExternalSystemRef = checkNumber;

    // This will effectively become the legacyMembershipId.
    let members = [];
    members.push({
        firstName: importedMembershipData.firstName,
        lastName: importedMembershipData.lastName,
        phoneNumber: importedMembershipData.phoneNumber,
        emailId: importedMembershipData.emailId,
    });

    if(importedMembershipData.spouseEmailId) {
        members.push({
            firstName: importedMembershipData.spouseFirstName,
            lastName: importedMembershipData.spouseLastName,
            phoneNumber: importedMembershipData.spousePhoneNumber,
            emailId: importedMembershipData.spouseEmailId,
        });
    }

    var result = {};
    return _addOrUpdateMemberMembershipAndPayment(members, membership, payment)
            .then(resultsX=> {
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
            );
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
    // Checking that the user is authenticated.
    if (!context.auth) {
        // TODO
        // Throwing an HttpsError so that the client gets the error details.
        //throw new functions.https.HttpsError('failed-precondition', 'The function must be called ' +
        //    'while authenticated.');
    }

    return _addOrUpdateMemberMembershipAndPayment(
            data.members, 
            data.membership,
            data.payment,
            context.auth);

});

exports.updatePayment = functions.https.onCall((data, context) => { 
    return _updatePayment(data.paymentId, data.payment, context.auth);
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
    
    let {membershipYear, membershipType, legacyMembershipId} = membership || {};
    let {paymentMethod, paymentAmount, paymentStatus, paymentExternalSystemRef, paymentNotes} = payment || {};

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
                    paymentStatus
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
        // If there are payment records, add them 
        if(paymentMethod && paymentAmount) {

            // add payment reference back to the membership record. 
            const paymentTypeRef = admin.firestore().doc(`/kaocMemberships/${membershipId}`);
            // Use the first users id for payment
            const kaocUserId = result.userIds[0];
            // The payment will be recorded as membership fee
            const paymentType = 'Membership';

            return _addPayment({
                kaocUserId, paymentMethod, 
                paymentAmount, paymentType, 
                paymentTypeRef, paymentStatus,
                paymentExternalSystemRef,
                paymentNotes                
            }, auth);
        } else {
            return Promise.resolve(null);
        }
    }).then(paymentInfo => {
        if(paymentInfo) {
            result.paymentId = paymentInfo.paymentId;
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
            && memberObject.emailId 
            && memberObject.firstName 
            && memberObject.lastName)) {
        throw new Error(`Invalid Member object ${JSON.stringify(memberObject)}`);        
    }
    console.log(`Add or Update Member ${JSON.stringify(memberObject)}`);
    
    // Step 1 Validate if the member already exist. 
    const currentTime = admin.firestore.Timestamp.fromMillis(new Date());
    let userCollectionRef = admin.firestore().collection('/kaocUsers');
    let query = userCollectionRef.where('emailId', "==", memberObject.emailId);
    return query.get().then(querySnapShot => {
        if(querySnapShot.empty) {
            // User does not exist. 
            // add a new one
            memberObject.createTime = currentTime;
            console.log(`User record for email id ${memberObject.emailId} does not exist. Creating one.`)
            return userCollectionRef.add(memberObject);
        } else {
            console.log(`User record for email id ${memberObject.emailId} already exist. Updating record.`)
            memberObject.updateTime = currentTime;
            // User exists. Update the document reference. 
            return querySnapShot.docs[0].ref.update(memberObject);
        }
    }).then(result => {
        return query.get();
    }).then(querySnapShot => {
        return querySnapShot.docs[0].ref.id;
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
    let {kaocUserIds, membershipYear, membershipType, legacyMembershipId, paymentStatus} = membership || {};

    membershipYear = membershipYear || (new Date()).getFullYear();
    paymentStatus = paymentStatus || 'Paid';
    membershipType = membershipType || 'Individual';

    console.log(`Adding membership for ${kaocUserIds}, ${membershipYear}, ${membershipType}, ${legacyMembershipId}`);
    const membershipStartTime = admin.firestore.Timestamp.fromMillis(Date.parse(`01 Jan ${membershipYear} 00:00:00 MST`));
    const membershipEndTime = admin.firestore.Timestamp.fromMillis(Date.parse(`31 Dec ${membershipYear} 23:59:59 MST`));

    const userRefs = kaocUserIds.map(kaocUserId => admin.firestore().doc(`/kaocUsers/${kaocUserId}`));

    return Promise.all(userRefs.map(userRef => userRef.get()))
        .then(userSnapshots => {
        // Validate the member first. 
        userSnapshots.forEach(userSnapShot => {
            if(!userSnapShot.exists) {
                throw new Error(`Invalid user reference ${userSnapShot.ref}. Membership cannot be added.`);
            }            
        })

        let membershipCollectionRef = admin
                    .firestore()
                    .collection('/kaocMemberships');
        let membershipQueryRef = membershipCollectionRef                                
                    .where('kaocUserRefs', "array-contains-any", userRefs)
                    .where('startTime', "==", membershipStartTime)
                    .where('endTime', "==", membershipEndTime);
        return membershipQueryRef
        .get()
        .then(querySnapShot => {
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

            if(querySnapShot.empty) {
                // Membership does not exist
                console.log(`Membership does not exist for ${kaocUserIds} for year - ${membershipYear}. Creeating new entry `);
                _addAuditFields(membershipRecord, true, auth);
                return membershipCollectionRef.add(membershipRecord);
            } else {
                _addAuditFields(membershipRecord, false, auth);
                console.log(`Membership already exist for ${kaocUserIds} for year - ${membershipYear}. Updating membership type and number with the new information.`);
                return querySnapShot.docs[0].ref.update(membershipRecord);
            }
        }).then(result=> {
            return membershipQueryRef.get();
        }).then(membershipQuerySnapShot => {
            let membershipId = membershipQuerySnapShot.docs[0].ref.id;
            console.log('Updated/New Membership Id ', membershipId);
            return membershipId;
        });                                    
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
 *      {string} paymentStatus         - The state of the payment (Unpain/Pending/PaidDeclined). Default will be Paid.
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
 */
function _addPayment(paymentObject, auth) {
    let {kaocUserId, paymentMethod, 
        paymentAmount, paymentStatus, 
        paymentType, paymentTypeRef, 
        paymentExternalSystemRef,
        paymentNotes} = paymentObject || {};

    if (!(kaocUserId && paymentMethod && paymentAmount && paymentType)) {
        return Promise.reject(new Error('Invalid payment parameters.'));
    } else {
        paymentStatus = paymentStatus || 'Paid';
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
        return admin.firestore().collection('kaocPayments')
        .add(_addAuditFields(paymentDoc, true, auth))
        .then(paymentDocRef => {
            return {
                'paymentId': paymentDocRef.id
            };
        });
    }            
}

// _updatePayment(paymentId(CUSTOMER_ID), paymentObject (paymentStatus=Paid))
function _updatePayment(paymentId, paymentObject, auth) {
    const paymentRef = admin.firestore().doc(`/kaocPayments/${paymentId}`);
    return paymentRef.get().then(paymentDocSnapshot=>{
        if(paymentDocSnapshot.exists) {
            return paymentRef.update(_addAuditFields(paymentObject, false, auth));
        } else {
            return Promise.reject(new Error(`No payment found with reference id ${paymentId}`));
        }
    }).then(result=> {
        return {paymentId};
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
 */
exports.squareServerPaymentCallback = functions.https.onRequest(async (req, res) => {
    console.log(JSON.stringify(req.query));
    console.log(JSON.stringify(req.body));
    res.status(200).send("OK");
    return Promise.resolve("OK");
});
