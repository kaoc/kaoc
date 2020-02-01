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

    const memberData = {
        first_name: importedMembershipData.firstName,
        last_name: importedMembershipData.lastName,
        phone_number: importedMembershipData.phoneNumber,
        email_id: importedMembershipData.emailId,
        member_number: importedMembershipData.memberNumber
    };
    var spouseData = null;

    if(importedMembershipData.spouseEmailId) {
        spouseData = {
            first_name: importedMembershipData.spouseFirstName,
            last_name: importedMembershipData.spouseLastName,
            phone_number: importedMembershipData.spousePhoneNumber,
            email_id: importedMembershipData.spouseEmailId,
            member_number: importedMembershipData.spouseMemberNumber
        }
    }
    var result = {};

    // 1. Add member
    return addOrUpdateMember(memberData).then(pMemberId=> {
        result.userId = pMemberId;
        if(spouseData) {
            // 2. Add spouse.
            return addOrUpdateMember(spouseData);
        }
    }).then(spouseMemberId => {
        if(spouseMemberId) {
            result.spouseUserId = spouseMemberId;
        }

        // 3. Add membership for main member
        if(membershipYear && membershipType) {
            return addMembership(result.userId, membershipYear, membershipType);
        }
    }).then(membershipId => {
        if(membershipId) {
            result.membershipId = membershipId;
        }
        if(membershipYear && membershipType && spouseData) {
            // 4. Add membership for spouse
            return addMembership(result.spouseUserId, membershipYear, membershipType);
        }
    }).then(spouseMembershipId=> {
        if(spouseMembershipId) {
            result.spouseMembershipId = spouseMembershipId;
        }
        res.status(200).send(result);
    });
});

function addOrUpdateMember(memberObject) {
    if(!(memberObject 
            && memberObject.email_id 
            && memberObject.first_name 
            && memberObject.last_name)) {
        throw new Error(`Invalid Member object ${JSON.stringify(memberObject)}`);        
    }
    // Step 1 Validate if the member already exist. 
    let userCollectionRef = admin.firestore().collection('/kaoc_users');
    let query = userCollectionRef.where('email_id', "==", memberObject.email_id);
    return query.get().then(querySnapShot => {
        if(querySnapShot.empty) {
            // User does not exist. 
            // add a new one
            console.log(`User record for email id ${memberObject.email_id} does not exist. Creating one.`)
            return userCollectionRef.add(memberObject);
        } else {
            console.log(`User record for email id ${memberObject.email_id} already exist. Updating record.`)
            // User exists. Update the document reference. 
            return querySnapShot.docs[0].ref.update(memberObject);
        }
    }).then(result => {
        return query.get();
    }).then(querySnapShot => {
        return querySnapShot.docs[0].ref.id;
    });
}

function addMembership(userId, year, membershipType) {
    const membershipStartTime = admin.firestore.Timestamp.fromMillis(Date.parse(`01 Jan ${year} 00:00:00 MST`));
    const membershipEndTime = admin.firestore.Timestamp.fromMillis(Date.parse(`31 Dec ${year} 23:59:59 MST`));
    const memberRef = admin.firestore().doc(`/kaoc_users/${userId}`);

    return memberRef.get().then(userSnapshot => {
        // Validate the member first. 
        if(!userSnapshot.exists) {
            throw new Error(`Invalid user id ${userId}. Membership cannot be added.`);
        } else {
            let membershipCollectionRef = admin
                        .firestore()
                        .collection('/kaoc_membership');
            let membershipQueryRef = membershipCollectionRef                                
                        .where('kaoc_user_id', "==", memberRef)
                        .where('start_date', "==", membershipStartTime)
                        .where('end_time', "==", membershipEndTime);
            return membershipQueryRef
            .get()
            .then(querySnapShot => {
                if(querySnapShot.empty) {
                    // Membership does not exist
                    console.log(`Membership does not exist for ${userId} for year - ${year}. Creeating new entry `);
                    return membershipCollectionRef.add({
                        'kaoc_user_id' : memberRef,
                        'start_date' : membershipStartTime,
                        'end_time' : membershipEndTime,
                        'membership_type': membershipType
                    });
                } else {
                    console.log(`Membership already exist for ${userId} for year - ${year}.`);
                    return querySnapShot.docs[0].ref;
                }
            }).then(membershipDocRef=> {
                return membershipDocRef.get();
            }).then(membershipSnapShot => {
                return membershipSnapShot.id;
            });                                    
        }
    });
}