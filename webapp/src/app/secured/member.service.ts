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

  addMember(members, membership, payment) {

    this.spinner.show();

    this.ngFireFunctions.httpsCallable('addOrUpdateMemberAndMembership')({
      members, membership, payment
    })
      .toPromise()
      .then(result => {
        console.log('got result' + JSON.stringify(result));
        console.log('PaymentService.processPayment.paymentMode = ' + payment.paymentMethod);

        const paymentDocumentRefNo = result['paymentId'];
        const membershipId = result['membershipId'];
        
        console.log("paymentDocumentRefNo=" + paymentDocumentRefNo);
        console.log("membershipId=" + membershipId);
        if (payment.paymentMethod === 'Square' && null != paymentDocumentRefNo) {
          this.paymentService.startSquarePayment(payment, paymentDocumentRefNo);
        } /*else {
          console.log('ERROR: Unsupported payment method ' + paymentForm.paymentMethod);
        } */
        this.spinner.hide();
      }, err => {
        console.error('Error while adding member ' + err);
        this.spinner.hide();
      });

  }
}