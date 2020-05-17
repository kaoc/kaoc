import { Component, OnInit, AfterViewChecked, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { environment } from '../../../environments/environment';

// Unused. We get paypal object from paypal js script. This is added just for compilation
declare let paypal: any;

@Component({
  selector: 'app-paypal',
  templateUrl: './paypal-payment.component.html',
  styleUrls: ['./paypal-payment.component.css']
})

export class PaypalPaymentComponent implements OnInit {
  @Input() kaocPaymentsDocId: string;
  @Input() paymentAmount: number;
  @Input() paymentDescription: string;
  @ViewChild('paypal', { static: true }) paypalElement: ElementRef;

  @Output() paypalStatusEvent = new EventEmitter();
  paymentStatus = 'Pending';
  didRenderPaypal = false;

  constructor(private ngFireFunctions: AngularFireFunctions) {
  }

  ngOnInit() {
    if (!this.didRenderPaypal) {
      this.loadPaypalScript().then(() => {
        paypal.Buttons({
          createOrder: (data, actions) => {
            return actions.order.create({
                purchase_units: [
                  {
                    description: this.paymentDescription,
                    amount: {
                      currency_code: 'USD',
                      value: this.paymentAmount
                    }
                  }
                ]
            });
          },
          onApprove: async (data, actions) => {
            const order = await actions.order.capture();
            this.paymentStatus = 'Paid';
            console.log(order);
            this.updatePaymentDb(order.id, this.paymentStatus);
          },
          onError: err => {
            this.paymentStatus = 'Failed';
            console.log(err);
            this.updatePaymentDb('Transaction Error: No External Ref', this.paymentStatus);
          }
        })
        .render(this.paypalElement.nativeElement);
      });
    }
  }

  private loadPaypalScript(): Promise<any> {
    this.didRenderPaypal = true;
    return new Promise((resolve, reject) => {
      const scriptElement = document.createElement('script');
      scriptElement.src =
        'https://www.paypal.com/sdk/js?client-id=' + environment.paypal.clientId;
      scriptElement.onload = resolve;
      document.body.appendChild(scriptElement);
    });
  }

  private updatePaymentDb(paymentId: string, paymentResult: string) {
    console.log('updatePaymentDb called with paymentId=' + paymentId + ' status=' + paymentResult);
    console.log('this.kaocPaymentsDocId=' + this.kaocPaymentsDocId);

    const updatePayment = this.ngFireFunctions.httpsCallable('updatePayment');
    updatePayment({paymentId: this.kaocPaymentsDocId, payment: {paymentStatus: paymentResult, paymentExternalSystemRef: paymentId}}).toPromise().then((result) => {
        console.log('updatePayment returned paymentId ' + result);
        this.paypalStatusEvent.emit(this.paymentStatus);
    }).catch((error) => {
      // Getting the Error details.
      console.log('updatePayment error.code ' +  error.code);
      console.log('updatePayment error.message ' +  error.message);
      console.log('updatePayment error.details ' +  error.details);
    });
  }
}
