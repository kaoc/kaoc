import { Component, OnInit, AfterViewChecked, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { AuthService } from 'src/app/secured/auth/auth.service';
import { CheckoutItems } from 'src/app/secured/Checkout';
import { environment } from '../../../environments/environment';

// Unused. We get paypal object from paypal js script. This is added just for compilation
declare let paypal: any;

@Component({
  selector: 'app-paypal',
  templateUrl: './paypal-payment.component.html',
  styleUrls: ['./paypal-payment.component.css']
})

export class PaypalPaymentComponent implements OnInit {
  @Input() kaocUserId: string;
  @Input() kaocPaymentsDocId: string;
  @Input() paymentAmount: number;
  @Input() paymentDescription: string;
  @Input() paymentType: string;
  @Input() paymentReferenceId: string;
  @Input() purchaseUnits: CheckoutItems[];
  @ViewChild('paypal', { static: true }) paypalElement: ElementRef;

  @Output() paypalStatusEvent = new EventEmitter();
  paymentStatus = 'Pending';
  didRenderPaypal = false;

  constructor(private ngFireFunctions: AngularFireFunctions, authService: AuthService) {
      authService.kaocUser.subscribe(kaocUser => {
          if (kaocUser) {
              this.kaocUserId = kaocUser.kaocUserId;
          }
      });
  }

  ngOnInit() {
    if (!this.didRenderPaypal) {
      this.loadPaypalScript().then(() => {
        paypal.Buttons({
          createOrder: (data, actions) => {

            let references = [];
            if(this.kaocUserId) {
                references.push('kaocUserId');
                references.push(this.kaocUserId);
            }
            references.push(this.paymentType);
            if(this.paymentReferenceId) {
                references.push(this.paymentReferenceId);
            }
            let paymentReferenceString = references.join(':');

            let paypalPurchaseUnits = [];
            if(this.purchaseUnits && this.purchaseUnits.length > 0) {
                this.purchaseUnits.forEach(purchaseUnit => {
                    let paypalPuchaseUnit = {
                        reference_id: purchaseUnit.type,
                        custom_id: paymentReferenceString,
                        description: this.paymentDescription,
                        amount: {
                          currency_code: 'USD',
                          value: purchaseUnit.price
                        }
                    };
                    if(this.kaocUserId) {
                      paypalPuchaseUnit['payment_instruction'] = {
                        'kaocUserId' : this.kaocUserId
                      }
                    }
                    paypalPurchaseUnits.push(paypalPuchaseUnit);
                })
            } else {
                paypalPurchaseUnits = [{
                    custom_id: paymentReferenceString,
                    description: this.paymentDescription,
                    amount: {
                      currency_code: 'USD',
                      value: this.paymentAmount
                    }
                }];
            }

            return actions.order.create({
                purchase_units: paypalPurchaseUnits
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
      if(this.kaocPaymentsDocId) {
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
      } else {
          console.log('Payment DOC id is not present. Skipping Update payment calls');
          this.paypalStatusEvent.emit(this.paymentStatus);
      }

  }
}
