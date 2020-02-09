
import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  constructor() { }

  processPayment(paymentForm) {

    console.log('PaymentService.processPayment.paymentMode=' + paymentForm.paymode);

    if ( paymentForm.paymode === 'Zelle' ||  paymentForm.paymode==='Cash' || paymentForm.paymode === 'Cheque') {
      console.log('Make member active');
    } else if ( paymentForm.paymode === 'Square' ) {
      startSquarePayment(paymentForm);
    } else if ( paymentForm.paymode==='Paypal' ) {
      console.log('===>>>> PaymentService.processPayment.Paypal implementation logic goes here'  );
    }
  }
}

function startSquarePayment(paymentForm) {
  console.log('===>>>> PaymentService.processPayment.Square implementation logic goes here'  );
  // The URL where the Point of Sale app will send the transaction results.
  //const callbackUrl = 'https://us-central1-kaocproject.cloudfunctions.net/squareServerPaymentCallback';
  const callbackUrl = 'http://192.168.0.136:4200/processpaymentresult';

  // Your application ID
  // Obtained from https://developer.squareup.com/apps/sq0idp-SwIIqsQfPszLsEDFFyupkg
  const applicationId = 'sq0idp-SwIIqsQfPszLsEDFFyupkg';

  // The total and currency code should come from your transaction flow.
  // For now, we are hardcoding them.
  let transactionTotal = paymentForm.amount;
  const currencyCode = 'USD';

  // The version of the Point of Sale SDK that you are using.
  const sdkVersion = 'v2.0';

  // Configure the allowable tender types
  const tenderTypes = 'com.squareup.pos.TENDER_CASH, com.squareup.pos.TENDER_CARD, com.squareup.pos.TENDER_CARD_ON_FILE, com.squareup.pos.TENDER_CASH, com.squareup.pos.TENDER_OTHER';

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
    'end';

  //  posUrl = 'intent://scan/#Intent;scheme=zxing;package=com.google.zxing.client.android;end';


  //  posUrl = "intent:#Intent;action=com.squareup.pos.action.CHARGE;package=com.squareup;S.browser_fallback_url=" + /*payment.fallback_url*/ "_blank" + ";S.com.squareup.pos.WEB_CALLBACK_URI=" +
  //   "abcd" + ";S.com.squareup.pos.CLIENT_ID=" + applicationId + ";S.com.squareup.pos.API_VERSION=v2.0;i.com.squareup.pos.TOTAL_AMOUNT=" + "0.01" + ";S.com.squareup.pos.CURRENCY_CODE=" +
  //   "USD" + ";S.com.squareup.pos.TENDER_TYPES=com.squareup.pos.TENDER_CARD;end";

  // posUrl = "intent:#Intent;" + "action=com.squareup.pos.action.CHARGE;" + "package=com.squareup;" + "S.com.squareup.pos.WEB_CALLBACK_URI="+callbackUrl+";S.com.squareup.pos.CLIENT_ID="+applicationId+";S.com.squareup.pos.API_VERSION=v2.0;"+
  // "i.com.squareup.pos.TOTAL_AMOUNT=0.01;S.com.squareup.pos.CURRENCY_CODE=USD;S.com.squareup.pos.TENDER_TYPES=com.squareup.pos.TENDER_CARD;end";

  console.log(posUrl);

  window.open(posUrl);
}
