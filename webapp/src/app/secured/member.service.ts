import { PaymentService } from '../payment/payment.service';
import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Member } from './Member';
import { Observable, Observer } from 'rxjs';
import { first } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { AngularFireFunctions } from '@angular/fire/functions';
import { NgxSpinnerService } from 'ngx-spinner';
import { Membership, MembershipReportDetails } from './Membership';
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
  // addMember updates paymentDocumentRefNo
  public paymentDocumentRefNo: string;
  public message: string;
  public membershipId: string;
  public memberEmail: string;

  constructor(public db: AngularFirestore,
    private ngFireFunctions: AngularFireFunctions,
    private spinner: NgxSpinnerService,
    private paymentService: PaymentService,
    private router: Router) {
    this.message = '';
    this.routedFrom = 'memberprofile';
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

  /**
   * TODO - Refactor this service to simply return a promise with the value.
   *
   * @param docId
   */
  async getMemberById(docId): Promise<any> {
    this.spinner.show();
    console.log('Inside MemberService..getMemberDetails.member.docId=' + docId);
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

    /**
     * Fetches and returns the membership data for the given kaoc user id.
     * NOTE - This membership data is not saved in any instance variable.
     * Calling ths method will result in a call to the backend.
     *
     * @param kaocUserId - KAOC User ID.
     */
    getMembershipData(kaocUserId: string): Promise<Membership> {
        return this.ngFireFunctions
                    .httpsCallable('getCurrentMembershipDataByMemberId')({kaocUserId})
                    .toPromise().then(membershipData => {
                        console.log('Obtained membership data');
                        return membershipData;
                    }).catch(e => {
                        console.error(`Error fetching membership data for ${kaocUserId}`);
                        throw e;
                    });
    }

    getMembershipQRCode(kaocUserId: string): Promise<any> {
        return this.ngFireFunctions
        .httpsCallable('getMembershipQRCode')({kaocUserId})
        .toPromise().then(membershipQRCodeData => {
            console.log('Obtained membership qr code data');
            return membershipQRCodeData;
        }).catch(e => {
            console.error(`Error fetching membership qr code data for ${kaocUserId}`);
            throw e;
        });
    }

    /**
     * Fetches and returns the membership report for the given year
     *
     * @param year - Membership Year
     */
  getMembershipReport(year: number): Promise<Array<MembershipReportDetails>> {
      return this.ngFireFunctions
                  .httpsCallable('getMembershipReport')({year})
                  .toPromise().then(membershipReportData => {
                      console.log(`Obtained membership report with ${membershipReportData.length} records`);
                      return membershipReportData;
                  }).catch(e => {
                      console.error(`Error fetching membership report for year: ${year}`);
                      throw e;
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
        this.membershipId = result['membershipId'];
        this.memberEmail  = members[0]['emailId'];

        const notes = 'FOR KAOC MEMBERSHIP. ID: ' + this.membershipId + '. emailId: ' + this.memberEmail;
        console.log('notes: ' + notes);

        this.paymentDocumentRefNo = result['paymentId'];
        console.log('paymentDocumentRefNo=' + this.paymentDocumentRefNo);

        // No spinner required for Paypal
        if (payment.paymentMethod === 'Paypal') {
          this.spinner.hide();
          return;
        }

        if (this.paymentDocumentRefNo === null) {
          console.log('paymentDocumentRefNo is null. Check addOrUpdateMemberAndMembership call');
        } else if (payment.paymentMethod === 'Square') {
          const squarePaymentRef  = this.paymentDocumentRefNo + '#' + notes;
          this.paymentService.startSquarePayment(payment, squarePaymentRef, notes);
        }

        this.message = this.getProcessMsg(memberStatus, payment.paymentMethod);
        this.spinner.hide();
      }, err => {
        console.error('Error while adding member ' + err);
        this.spinner.hide();
      });
  }

  getProcessMsg (memberStatus , paymentMethod) {
    if (this.isNullField(memberStatus) || memberStatus === 'Active' ) {
      return 'Member details saved successfully';
    }

    if ( memberStatus === 'InActive' &&
         ((paymentMethod === 'Square') || (paymentMethod === 'Paypal')) ) {
      return 'Member details saved and proceeding with ' + paymentMethod + ' payment';
    }

    return 'Member details saved successfully';
  }

  isNullField(fieldValue) {

    if (fieldValue === '' || fieldValue === null || fieldValue === undefined) {
      return true;
    } else {
      return false;
    }
  }

}
