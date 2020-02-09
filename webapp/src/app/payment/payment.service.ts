import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

<<<<<<< HEAD
  public showspinner: boolean = false;
  public processStatus: string = '';
  constructor() { }
=======
  constructor() {}
>>>>>>> updating payment result component

  processPayment(paymentForm, referenceNo) {

    console.log("PaymentService.processPayment.paymentMode=" + paymentForm.paymode);

    if (paymentForm.paymode === 'Cash' || paymentForm.paymode === 'Cheque') {
      console.log("Make member active");
    }
    else if (paymentForm.paymode === 'Square') {
      this.showspinner = true;
      this.processStatus = "Transaction in progress , please wait.."
      console.log("===>>>> PaymentService.processPayment.Square implementation logic goes here");
      startSquarePayment(paymentForm);
      setTimeout(() => {
        this.processStatus = "Transaction Complete for reference number " +  referenceNo;
        this.showspinner = false;
      },5000 )

    } else if (paymentForm.paymode === 'Paypal') {
      console.log("===>>>> PaymentService.processPayment.Paypal implementation logic goes here");
    }
  }
}

function startSquarePayment(paymentForm) {
  console.log('===>>>> PaymentService.processPayment.Square implementation logic goes here'  );
  // The URL where the Point of Sale app will send the transaction results.
  // This also needs to updated for the Point of Sale api app settings in SquareUp site
  // eg) https://developer.squareup.com/apps/sq0idp-SwIIqsQfPszLsEDFFyupkg/point-of-sale-api
  const callbackUrl = 'https://kaocproject.firebaseapp.com/processpaymentresult';

  // Your application ID
  // Obtained from https://developer.squareup.com/apps/sq0idp-SwIIqsQfPszLsEDFFyupkg
  const applicationId = 'sq0idp-SwIIqsQfPszLsEDFFyupkg';

  // The total and currency code should come from your transaction flow.
  // For now, we are hardcoding them.
  const transactionTotal = paymentForm.amount;
  const currencyCode = 'USD';

  // The version of the Point of Sale SDK that you are using.
  const sdkVersion = 'v2.0';

  // Configure the allowable tender types
  const tenderTypes =
    'com.squareup.pos.TENDER_CASH, ' +
    'com.squareup.pos.TENDER_CARD, ' +
    'com.squareup.pos.TENDER_CARD_ON_FILE, ' +
    'com.squareup.pos.TENDER_CASH, ' +
    'com.squareup.pos.TENDER_OTHER';

  let posUrl =
    'intent:#Intent;' +
    'action=com.squareup.pos.action.CHARGE;' +
    'S.com.squareup.pos.REQUEST_METADATA=' + 'gmMAGLnfysI0v9UQ0L0A' + ';' +
    'package=com.squareup;' +
    'S.com.squareup.pos.WEB_CALLBACK_URI=' + callbackUrl + ';' +
    'S.com.squareup.pos.CLIENT_ID=' + applicationId + ';' +
    'S.com.squareup.pos.API_VERSION=' + sdkVersion + ';' +
    'i.com.squareup.pos.TOTAL_AMOUNT=' + transactionTotal + ';' +
    'S.com.squareup.pos.CURRENCY_CODE=' + currencyCode + ';' +
    'S.com.squareup.pos.TENDER_TYPES=' + tenderTypes + ';' +
    'l.com.squareup.pos.AUTO_RETURN_TIMEOUT_MS=3200;' +
    'end';

  console.log(posUrl);

  window.open(posUrl);
}
