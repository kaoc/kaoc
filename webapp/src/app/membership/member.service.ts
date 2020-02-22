import { PaymentService } from '../payment/payment.service';
import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Member } from './Member';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { AngularFireFunctions } from '@angular/fire/functions';
import { NgxSpinnerService } from 'ngx-spinner';
import { Membership } from './Membership';
import { Route } from '@angular/compiler/src/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  membersCollection: AngularFirestoreCollection<Member>;
  members: Observable<Member[]>;
  public membershipDetails : Membership;
  public routedFrom: string ;

  constructor(public db: AngularFirestore,
    private ngFireFunctions: AngularFireFunctions,
    private spinner: NgxSpinnerService,
    private paymentService: PaymentService,
    private route: Router ) {
     this.routedFrom="memberprofile";
     this.membersCollection = this.db.collection<Member>('kaocUsers', ref => ref.orderBy('lastName', 'asc'));
    // this.members = this.membersCollection.valueChanges();

    this.members = this.membersCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Member;
       // console.log('members data' + JSON.stringify(data));
        data.docId = a.payload.doc.id;
        return data;
      }))
    );
  }

  getMemberDetails (member : Member) {
    this.spinner.show();
    console.log("Inside MemberService..getMemberDetails.member.docId=" + member.docId);

    var addMessage = this.ngFireFunctions.httpsCallable('getCurrentMembershipDataByMemberId')({ kaocUserId: member.docId })
      .pipe(first())
      .subscribe(resp => {
        this.routedFrom="listmembers"
        this.membershipDetails = resp;
        this.spinner.hide();
        this.route.navigateByUrl('memberprofile');

      }, err => {
        this.spinner.hide();
        console.error({ err });
      });
  
  }

  getAllMembers() {
    return this.members;
  }

  addMember(members, membership, payment) {

    this.spinner.show();

    this.ngFireFunctions.httpsCallable('addOrUpdateMemberAndMembership')({
      members, membership, payment
    })
      .subscribe(result => {
        console.log('got result' + JSON.stringify(result));

        console.log('PaymentService.processPayment.paymentMode = ' + payment.paymentMethod);
        const paymentDocumentRefNo = result['paymentId'];
        const membershipId = result['membershipId'];
        console.log ("paymentDocumentRefNo="  + paymentDocumentRefNo );
        console.log ("membershipId="  + membershipId );
        if (payment.paymentMethod === 'Square' && null!=paymentDocumentRefNo) {
          this.paymentService.startSquarePayment(payment, paymentDocumentRefNo);
        } /*else {
          console.log('ERROR: Unsupported payment method ' + paymentForm.paymentMethod);
        } */
        this.spinner.hide();
      }, err => {
        console.error( 'Error while adding member ' +  err );
        this.spinner.hide();
      } );

    /*console.log("addMember service called" + JSON.stringify(member));
    this.membersCollection.doc("ID_1002").set({
      emailId: member.emailId,
      firstName: member.firstName,
      lastName: member.lastName,
      mobileNo: member.mobileNo,
      preferredNotification: member.preferredNotification
    }) */

    //this.membersCollection.add(member);
  }
}
