import { AngularFireModule } from '@angular/fire';
import { Component, OnInit } from '@angular/core';
import { FormBuilder ,Validators, FormGroup } from '@angular/forms';
import { PaymentService } from './payment.service';
import { AngularFireFunctions } from '@angular/fire/functions';
import { MatDialog } from '@angular/material';
import { SpinnerComponent } from '../common/spinner/spinner.component';

@Component({
  selector: 'payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  paymentForm: FormGroup;
  paymentList: string[] = ['Cash', 'Cheque', 'Square' ];

  paymentDocumentRefNo="ABCedfGhijklMn0P";

  constructor(private _formBuilder: FormBuilder,
              private paymentService: PaymentService,
	            public dialog: MatDialog,
              private ngFireFunctions: AngularFireFunctions ) {
               // ngFireFunctions.httpsCallable("updatePayment", {a,b})
              }

  ngOnInit() {
    this.paymentForm = this._formBuilder.group({
      paymode:  ['', Validators.required],
      amount:'',
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
    console.log("PaymentService.processPayment.formDetails " + JSON.stringify(this.paymentForm.value));

  }

}
