import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Member } from './Member';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  membersCollection: AngularFirestoreCollection<Member>;
  members: Observable<Member[]>;

  constructor(public db: AngularFirestore) {
    this.membersCollection = this.db.collection<Member>('members', ref => ref.orderBy('lastName', 'asc'));
    // this.members = this.membersCollection.valueChanges();

    this.members = this.membersCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Member;
        console.log("members data" + JSON.stringify(data));
        //data.id = a.payload.doc.id; commented due to error.
        return data;
      }))
    );
  }

  getAllMembers() {
    return this.members;
  }

   addMember(member: Member) {
    console.log("addMember service called" + JSON.stringify(member));
    /*this.membersCollection.doc("ID_1002").set({
      emailId: member.emailId,
      firstName: member.firstName,
      lastName: member.lastName,
      mobileNo: member.mobileNo,
      preferredNotification: member.preferredNotification
    }) */

    //this.membersCollection.add(member);
  }
}
