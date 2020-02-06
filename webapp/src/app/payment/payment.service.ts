import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  constructor() { }

  processPayment (paymentForm) {

    console.log("PaymentService.processPayment.paymentMode=" + paymentForm.paymode);

    if ( paymentForm.paymode==='Zelle' ||  paymentForm.paymode==='Cash' || paymentForm.paymode==='Cheque')
    {
      console.log("Make member active");
    }
    else if ( paymentForm.paymode==='Square' )
    {
      console.log("===>>>> PaymentService.processPayment.Square implementation logic goes here"  );
    } else if ( paymentForm.paymode==='Paypal' )
    {
      console.log("===>>>> PaymentService.processPayment.Paypal implementation logic goes here"  );
    }
  }
}
