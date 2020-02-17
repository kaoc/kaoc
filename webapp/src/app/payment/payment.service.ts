import { Injectable } from '@angular/core';
import { PlatformUtilsService } from '../utils/platform-utils.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  public showspinner: boolean = false;
  public processStatus: string = '';
  constructor(public platformUtils: PlatformUtilsService) { }

  startSquarePayment(paymentForm, referenceNo: string) {
    const os = this.platformUtils.getMobileOperatingSystem();
    // The URL where the Point of Sale app will send the transaction results.
    // This also needs to updated for the Point of Sale api app settings in SquareUp site
    // eg) https://developer.squareup.com/apps/sq0idp-SwIIqsQfPszLsEDFFyupkg/point-of-sale-api
    const callbackUrl = 'https://kaocproject.firebaseapp.com/squareprocesspaymentresult';

    // Your application ID
    // Obtained from https://developer.squareup.com/apps/sq0idp-SwIIqsQfPszLsEDFFyupkg
    const applicationId = 'sq0idp-SwIIqsQfPszLsEDFFyupkg';

    // The total and currency code should come from your transaction flow.
    const transactionTotalInCents = paymentForm.paymentAmount * 2;
    const currencyCode = 'USD';

    if (os === 'iOS') {
      const sdkVersion = "1.3";
      const data = {
        "state": referenceNo,
        "callback_url": callbackUrl,
        "client_id": applicationId,
        "version": sdkVersion,
        "amount_money":
        {
          "amount": transactionTotalInCents,
          "currency_code": currencyCode
        },
        "options":
        {
          "auto_return":true,
          "clear_default_fees":false,
          "supported_tender_types":["CREDIT_CARD","CASH"]
        }
      };

      console.log("iOS Calling window.location");
      window.location.href = "square-commerce-v1://payment/create?data=" + encodeURIComponent(JSON.stringify(data));
    } else if (os === 'Android') {
      // The version of the Point of Sale SDK that you are using.
      const sdkVersion = 'v2.0';

      // Configure the allowable tender types
      const tenderTypes = 'com.squareup.pos.TENDER_CARD,' +
                          'com.squareup.pos.TENDER_CASH';

      const posUrl =
        'intent:#Intent;' +
        'action=com.squareup.pos.action.CHARGE;' +
        'S.com.squareup.pos.REQUEST_METADATA=' + referenceNo + ';' +
        'package=com.squareup;' +
        'S.com.squareup.pos.WEB_CALLBACK_URI=' + callbackUrl + ';' +
        'S.com.squareup.pos.CLIENT_ID=' + applicationId + ';' +
        'S.com.squareup.pos.API_VERSION=' + sdkVersion + ';' +
        'i.com.squareup.pos.TOTAL_AMOUNT=' + transactionTotalInCents + ';' +
        'S.com.squareup.pos.CURRENCY_CODE=' + currencyCode + ';' +
        'S.com.squareup.pos.TENDER_TYPES=' + tenderTypes + ';' +
        'l.com.squareup.pos.AUTO_RETURN_TIMEOUT_MS=3200;' +
        'end';

      // DEBUG: For cloud/local testing
      // posUrl = 'https://kaocproject.firebaseapp.com/squareprocesspaymentresult?com.squareup.pos.CLIENT_TRANSACTION_ID=8a48b3b7-df80-4e2e-811b-43bd6d2f279c&com.squareup.pos.REQUEST_METADATA='+ referenceNo;
      // posUrl = 'http://localhost:4200/squareprocesspaymentresult?com.squareup.pos.CLIENT_TRANSACTION_ID=8a48b3b7-df80-4e2e-811b-43bd6d2f279c&com.squareup.pos.REQUEST_METADATA='+ referenceNo;
      console.log(posUrl);
      window.open(posUrl);
    } else {
      console.log('ERROR: startSquarePayment: Unsupported Mobile OS')
    }
  }
}
