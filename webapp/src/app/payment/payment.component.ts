import { Component, OnInit } from '@angular/core';
import { FormBuilder ,Validators, FormGroup } from '@angular/forms';
import { PaymentService } from './payment.service';

@Component({
  selector: 'payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  paymentForm: FormGroup;
  paymentList: string[] = ['Cash', 'Cheque', 'Square', 'Paypal', 'Zelle' ];

  constructor(private _formBuilder: FormBuilder,
              private paymentService: PaymentService ) { }

  ngOnInit() {
    this.paymentForm = this._formBuilder.group({
      paymode:  ['', Validators.required],
      amount:'',
      referenceNo:  '',
      memo:  '',
    }); 
  }

 

  submitPayment() {
    console.log("PaymentService.processPayment.formDetails " + JSON.stringify(this.paymentForm.value));

    this.paymentService.processPayment(this.paymentForm.value);
  }

}
