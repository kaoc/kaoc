import { AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Payment } from './Payment';
import { AngularFireModule } from '@angular/fire';
import { Component, OnInit } from '@angular/core';
import { FormBuilder ,Validators, FormGroup } from '@angular/forms';
import { PaymentService } from './payment.service';
<<<<<<< HEAD
import { AngularFireFunctions } from '@angular/fire/functions';
import { MatDialog } from '@angular/material';
import { SpinnerComponent } from '../common/spinner/spinner.component';
=======

import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Payment } from './Payment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

>>>>>>> updating payment result component

@Component({
  selector: 'payment',
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

  paymentDocumentRefNo = 'ABCedfGhijklMn0P';

  ngOnInit() {
    this.paymentForm = this.formBuilder.group({
      paymode:  ['', Validators.required],
      amount: '',
      referenceNo:  '',
      memo:  '',
    });
  }

  submitPayment(referenceNo) {
    console.log('Processing Payment for ReferenceNo=' + referenceNo);
    const dialogRef = this.dialog.open(SpinnerComponent , {
      width: '400px',
      height: '200px',
        panelClass: 'kaoc-modalbox'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The Payment processing dialog was closed');
    });

    this.paymentService.processPayment(this.paymentForm.value , referenceNo);
    console.log('PaymentService.processPayment.formDetails ' + JSON.stringify(this.paymentForm.value));

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

    this.paymentService.processPayment(this.paymentForm.value, referenceNo);
  }

}
