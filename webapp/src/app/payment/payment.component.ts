import { Observable } from 'rxjs';
import { Payment } from './Payment';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { PaymentService } from './payment.service';
import { AngularFireFunctions } from '@angular/fire/functions';
import { MatDialog } from '@angular/material';
import { SpinnerComponent } from '../common/spinner/spinner.component';

import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  paymentForm: FormGroup;
  paymentList: string[] = ['Cash', 'Cheque', 'Square' ];
  paymentsCollection: AngularFirestoreCollection<Payment>;
  payments: Observable<Payment[]>;

  constructor(private formBuilder: FormBuilder,
              private paymentService: PaymentService,
              public dialog: MatDialog,
              private ngFireFunctions: AngularFireFunctions ) {
 }

  paymentDocumentRefNo = 'INVALID_PAYMENT_DOCUMENT_REF_NO';

  ngOnInit() {
    this.paymentForm = this.formBuilder.group({
      paymode:  ['', Validators.required],
      amount: '',
      referenceNo:  '',
      memo:  '',
    });
  }

  submitPayment(referenceNo) {
    // TODO: This data needs to be filled up from paymentForm
    const data = {
        'members' : [{
            'firstName': 'Test FN2',
            'lastName' : 'Test LN2',
            'phoneNumber': '1231231231',
            'emailId': 'rafeeq@gmail.com'
        }, {
            'firstName': 'Test Spouse FN2',
            'lastName': 'Test Spouse LN2',
            'phoneNumber': '2342342342',
            'emailId': 'rafeeqSpouse@gmail.com'
        }],

        'membership': {
            'membershipType': 'Family'
        },

        'payment': {
            'paymentMethod': 'Square',
            'paymentAmount': 88,
            'paymentNotes': 'Test Notes',
            'paymentStatus': 'Pending',
            'paymentExternalSystemRef': 'Some Reference'
        }
    };

    const addOrUpdateMemberAndMembership = this.ngFireFunctions.httpsCallable('addOrUpdateMemberAndMembership');
    addOrUpdateMemberAndMembership(data).toPromise().then((result) => {
      // Read result of the Cloud Function.
      this.paymentDocumentRefNo = result['paymentId'];
      console.log('addOrUpdateMemberAndMembership paymentRef ' + this.paymentDocumentRefNo);
      console.log('Calling processPayment');
      // this.paymentService.processPayment(this.paymentForm.value , this.paymentDocumentRefNo);

      // OPTIONAL: TODO: Checkout if we need this
      /*
      const dialogRef = this.dialog.open(SpinnerComponent , {
        width: '400px',
        height: '200px',
          panelClass: 'kaoc-modalbox'
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log('The Payment processing dialog was closed');
      });
      */
    }).catch((error) => {
      // Getting the Error details.
      console.log('addOrUpdateMemberAndMembership error.code ' +  error.code);
      console.log('addOrUpdateMemberAndMembership error.message ' +  error.message);
      console.log('addOrUpdateMemberAndMembership error.details ' +  error.details);
    });

    /*********************** TODO: IGNORE REST - TO BE REMOVED ***************************/
    /*

    then (function(result) {

      console.log('Processing Payment for ReferenceNo=' + this.paymentDocumentRefNo);
      console.log('PaymentService.processPayment.formDetails ' + JSON.stringify(this.paymentForm.value));
      this.paymentService.processPayment(this.paymentForm.value , this.paymentDocumentRefNo);
      */


    //this.paymentsCollection = this.db.collection<Payment>('kaocPayments', ref => ref.orderBy('updateTime', 'desc'));

    //let citiesRef = this.db.collection<Payment>('kaocPayments');

    /*
    docRef.get().then(function(doc) {
        if (doc.exists) {
            console.log("Document data:", doc.data());
        } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
        }
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });

    */
    // this.payments = this.paymentsCollection.valueChanges()
    // this.members = this.membersCollection.valueChanges();

    /* this.payments = this.paymentsCollection.snapshotChanges().pipe(
                  map(actions => actions.map(a => {
                    const data = a.payload.doc.data() as Payment;
                    console.log("payment data" + JSON.stringify(data));
                    //data.id = a.payload.doc.id; commented due to error.
                    return data;
                  }))
                ); */


    //this.paymentUpdate = this.db.collection('kaocPayments', ref => ref.where('categoria','==', categoriaToFilter )).valueChanges();
  }

}
