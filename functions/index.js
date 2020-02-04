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

    const membershipYear = importedMembershipData.membershipYear;
    const membershipType = importedMembershipData.membershipType;
    const membershipGroupId = importedMembershipData.memberNumber; // This is to keep backward compatability with old member id
    // This will effectively become the membershipgroupid.
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
    return _addOrUpdateMemberAndMembership(members, membershipYear, membershipType, membershipGroupId).then(resultsX=> {
        result.userId           = resultsX.userIds[0];
        result.membershipId     = resultsX.membershipIds[0];
        result.membershipGroupId = resultsX.membershipGroupId;

        if(resultsX.userIds.length > 1) {
            result.spouseUserId = resultsX.userIds[1];
        }
        res.status(200).send(result);
        return result; 
    });
});

/**
 * HTTPS callable function for web application
 */
exports.addOrUpdateMemberAndMembership = functions.https.onCall((data, context) => {
    // Checking that the user is authenticated.
    if (!context.auth) {
        // TODO
        // Throwing an HttpsError so that the client gets the error details.
        //throw new functions.https.HttpsError('failed-precondition', 'The function must be called ' +
        //    'while authenticated.');
    }

    return _addOrUpdateMemberAndMembership(
            data.members, 
            data.membershipYear, data.membershipType, data.membershipGroupId, data.membershipStatus);

});
  

/**
 * Adds or update member and membership.
 * 
 * @param {Array<Member>} members 
 * @param {number} membershipYear 
 * @param {string} membershipType 
 * @param {membershipGroupId} membershipGroupId 
 * @param {membershipStatus} membershipStatus 
 */
function _addOrUpdateMemberAndMembership(members, membershipYear, membershipType, membershipGroupId, membershipStatus) {
    var result = {};
    if(!(members && members.length > 0)) {
        throw new Error(`Invalid members parameter. There should be at least 1 member in the array`);
    }

    var addMemberPromises = [];
    members.forEach(member =>{
        addMemberPromises.push(_addOrUpdateMember(member));
    });

    return Promise.all(addMemberPromises)
    .then(userIds => {

        result.userIds = userIds;
        if(membershipType) {

            membershipGroupId = membershipGroupId || userIds[0];
            membershipYear = membershipYear || (new Date()).getFullYear();

            let addMemberPromises = [];
            userIds.forEach(userId => {
                addMemberPromises.push(_addOrUpdateMembership(userId, membershipYear, membershipType, membershipGroupId, membershipStatus))
            });
            return Promise.all(addMemberPromises);
        } else {
            return null;
        }
    }).then(membershipInfos => {
        if(membershipInfos) {
            result.membershipIds = membershipInfos.map(membershipInfo=>membershipInfo.membershipId);
            result.membershipGroupId = membershipInfos[0].membershipGroupId;
        }
        return result;
    });
}

/**
 * Adds or update member object
 * 
 * @param {memberObject} memberObject 
 */
function _addOrUpdateMember(memberObject) {
    if(!(memberObject 
            && memberObject.emailId 
            && memberObject.firstName 
            && memberObject.lastName)) {
        throw new Error(`Invalid Member object ${JSON.stringify(memberObject)}`);        
    }
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
            memberObject.updateTimeTime = currentTime;
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
 * @param {string} userId 
 * @param {number} year 
 * @param {string} membershipType 
 * @param {string} membershipGroupId 
 * @param {string} membershipStatus
 */
function _addOrUpdateMembership(userId, year, membershipType, membershipGroupId, membershipStatus) {
    console.log(`Adding membership for ${userId}, ${year}, ${membershipType}, ${membershipGroupId}`);
    const membershipStartTime = admin.firestore.Timestamp.fromMillis(Date.parse(`01 Jan ${year} 00:00:00 MST`));
    const membershipEndTime = admin.firestore.Timestamp.fromMillis(Date.parse(`31 Dec ${year} 23:59:59 MST`));
    const currentTime = admin.firestore.Timestamp.fromMillis(new Date());

    const userRef = admin.firestore().doc(`/kaocUsers/${userId}`);
    if(!membershipGroupId) {
        console.warn(`Membership Number missing when adding membership for user: ${userId}. This is not a recomended practice. User id will of the user will be used as member id. `);
        membershipGroupId = userId; // Membership number should be unique across all memebers in a family. 
    }

    return userRef.get().then(userSnapshot => {
        // Validate the member first. 
        if(!userSnapshot.exists) {
            throw new Error(`Invalid user id ${userId}. Membership cannot be added.`);
        } else {
            let membershipCollectionRef = admin
                        .firestore()
                        .collection('/kaocMembership');
            let membershipQueryRef = membershipCollectionRef                                
                        .where('kaocUserRef', "==", userRef)
                        .where('startTime', "==", membershipStartTime)
                        .where('endTime', "==", membershipEndTime);
            return membershipQueryRef
            .get()
            .then(querySnapShot => {
                let membershipRecord = {
                    'kaocUserRef' : userRef,
                    'startTime' : membershipStartTime,
                    'endTime' : membershipEndTime,
                    'membershipType': membershipType,
                    'membershipGroupId': membershipGroupId,
                    'membershipStatus': membershipStatus || 'Active',
                };

                if(querySnapShot.empty) {
                    // Membership does not exist
                    console.log(`Membership does not exist for ${userId} for year - ${year}. Creeating new entry `);
                    membershipRecord.createTime = currentTime;
                    return membershipCollectionRef.add(membershipRecord);
                } else {
                    membershipRecord.updateTime = currentTime;
                    console.log(`Membership already exist for ${userId} for year - ${year}. Updating membership type and number with the new information.`);
                    return querySnapShot.docs[0].ref.update(membershipRecord);
                }
            }).then(result=> {
                return membershipQueryRef.get();
            }).then(membershipQuerySnapShot => {

                let result = {
                    'membershipId': membershipQuerySnapShot.docs[0].ref.id,
                    'membershipGroupId': membershipGroupId
                };

                console.log('Membership result ', result);
                return result;
            });                                    
        }
    });
}