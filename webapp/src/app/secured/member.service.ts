import { PaymentService } from '../payment/payment.service';
import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Member } from './Member';
import { Observable, Observer } from 'rxjs';
import { first } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { AngularFireFunctions } from '@angular/fire/functions';
import { NgxSpinnerService } from 'ngx-spinner';
import { Membership } from './Membership';
import { Router, NavigationExtras } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  membersCollection: AngularFirestoreCollection<Member>;
  members: Observable<Member[]>;
  public membershipDetails: Membership;
  public routedFrom: string;
  public kaocUserDocId: string;
  public message: string;

  constructor(public db: AngularFirestore,
    private ngFireFunctions: AngularFireFunctions,
    private spinner: NgxSpinnerService,
    private paymentService: PaymentService,
    private router: Router) {
    this.message='';
    this.routedFrom = "memberprofile";
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

  async getMemberById(docId): Promise<any> {
    this.spinner.show();
    console.log("Inside MemberService..getMemberDetails.member.docId=" + docId);
    await this.ngFireFunctions.httpsCallable('getCurrentMembershipDataByMemberId')({ kaocUserId: docId })
      .toPromise()
      .then(resp => {
        this.membershipDetails = resp;
        this.routedFrom = 'listmembers';
        this.spinner.hide();
        //console.log("got result" + JSON.stringify(resp));
      })
      .catch(err => {
        this.spinner.hide();
        console.error({ err });
      });
 }

  getAllMembers() {
    return this.members;
  }

  async addMember(members, membership, payment, memberStatus) {

    this.spinner.show();

    await this.ngFireFunctions.httpsCallable('addOrUpdateMemberAndMembership')({
      members, membership, payment
    })
      .toPromise()
      .then(result => {
        console.log('got result' + JSON.stringify(result));
        console.log('PaymentService.processPayment.paymentMode = ' + payment.paymentMethod);

        this.kaocUserDocId = result['userIds'][0];

        const membershipId = result['membershipId'];
        const memberEmail = members[0]['emailId'];
        const notes = "FOR KAOC MEMBERSHIP. ID: " + membershipId + ". emailId: " + memberEmail;
        console.log("notes: " + notes);
        const paymentDocumentRefNo = result['paymentId'] + '#' + notes;
        console.log("paymentDocumentRefNo=" + paymentDocumentRefNo);

        if (payment.paymentMethod === 'Square' && null != paymentDocumentRefNo) {
          this.paymentService.startSquarePayment(payment, paymentDocumentRefNo, notes);
        } /*else {
          console.log('ERROR: Unsupported payment method ' + paymentForm.paymentMethod);
        } */
        this.message=this.getProcessMsg(memberStatus,payment.paymentMethod);
        this.spinner.hide();
      }, err => {
        console.error('Error while adding member ' + err);
        this.spinner.hide();
      });
  }

  getProcessMsg (memberStatus , paymentMethod) {
    if (this.isNullField(memberStatus) || memberStatus==='Active' ) {

      return "Member details saved successfully"
    } else {
      if ( memberStatus==='InActive' && paymentMethod === 'Square' ) {
        return "Member details saved and payment initiated"
      } else {
        return "Member details saved successfully"
      }

    }
  }

  isNullField(fieldValue) {

    if (fieldValue === '' || fieldValue === null || fieldValue === undefined) {
      return true;
    } else {
      return false;
    }
  }

}
