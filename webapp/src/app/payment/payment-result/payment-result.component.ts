import { Component, OnInit } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';

@Component({
  selector: 'payment-result',
  templateUrl: './payment-result.component.html',
  styleUrls: ['./payment-result.component.css']
})
export class PaymentResultComponent implements OnInit {

  constructor(private ngFireFunctions: AngularFireFunctions ) {
  }

  ngOnInit() {
    // this.ngFireFunctions.httpsCallable('updatePayment', {paymentId: "gmMAGLnfysI0v9UQ0L0A", paymentState:"Paid"});
  }

}
