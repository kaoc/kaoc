import { Component, OnInit } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { PlatformUtilsService } from '../../utils/platform-utils.service';

@Component({
  selector: 'square-payment-result',
  templateUrl: './square-payment-result.component.html',
  styleUrls: ['./square-payment-result.component.css']
})
export class SquarePaymentResultComponent implements OnInit {
  // paymentId received as REQUEST_METADATA in URL params
  public kaocPaymentsDocId: string;

  public squareServerPaymentRefId: string;
  public errorCode: string;
  public errorDescription: string;

  constructor(private ngFireFunctions: AngularFireFunctions,
              public platformUtils: PlatformUtilsService) {
    this.kaocPaymentsDocId = 'INVALID_KAOC_PAYMENTS_DOC_ID';
    this.squareServerPaymentRefId = 'INVALID_SQUARE_SERVER_PAYMENTS_REF_ID';
    this.errorCode = 'SUCCESS';
    this.errorDescription = 'ERROR_DESCRIPTION';
  }

  ngOnInit() {
    const responseUrl: string = window.location.href;
    this.parseCallbackUrlAndSetIds(responseUrl);
    const updatePayment = this.ngFireFunctions.httpsCallable('updatePayment');
    updatePayment({paymentId : this.kaocPaymentsDocId, payment: {paymentStatus : 'Paid'}}).toPromise().then((result) => {
        console.log('updatePayment returned paymentId ' + result);
      }).catch((error) => {
        // Getting the Error details.
        console.log('updatePayment error.code ' +  error.code);
        console.log('updatePayment error.message ' +  error.message);
        console.log('updatePayment error.details ' +  error.details);
      });
  }

  // Get the URL parameters and puts them in an array
  getUrlParams(URL) {
    const vars = {};
    const parts = URL.replace(/[?&]+([^=&]+)=([^&]*)/gi,
                              function(m, key, value) {
                                vars[key] = value;
                              });
    return vars;
  }

  // get the data URL and encode in JSON
  parseCallbackUrlAndSetIds(responseUrl: string) {
    const os = this.platformUtils.getMobileOperatingSystem();
    console.log('Mobile OS = ' + os);
    if (os === 'iOS') {
      console.log('iOS parseCallbackUrlAndSetIds responseUrl: ' + responseUrl);
      const url = new URL(responseUrl);
      const data = decodeURI(url.searchParams.get('data'));
      console.log('iOS parseCallbackUrlAndSetIds data: ' + data);

      // If successful, Square Point of Sale returns the following parameters.
      const REQUEST_METADATA_STR = 'state';
      const TRANSACTION_ID_STR = 'transaction_id';
      const STATUS_STR = 'status';
      const ERROR_CODE_STR = 'error_code';

      const transactionInfo = JSON.parse(data);

      if (transactionInfo[STATUS_STR] === 'ok') {
        this.kaocPaymentsDocId = transactionInfo[REQUEST_METADATA_STR];
        this.squareServerPaymentRefId = transactionInfo[TRANSACTION_ID_STR];
      } else {
        console.log('ERROR: iOS Square error code: ' + transactionInfo[ERROR_CODE_STR]);
      }
    } else if (this.platformUtils.getMobileOperatingSystem() === 'Android') {
      // If successful, Square Point of Sale returns the following parameters.
      const REQUEST_METADATA_STR = 'com.squareup.pos.REQUEST_METADATA';
      const SERVER_TRANSACTION_ID_STR = 'com.squareup.pos.SERVER_TRANSACTION_ID';

      // If there's an error, Square Point of Sale returns the following parameters.
      const ERROR_CODE_STR = 'com.squareup.pos.ERROR_CODE';
      const ERROR_DESCRIPTION_STR = 'com.squareup.pos.ERROR_DESCRIPTION';

      const transactionInfo = this.getUrlParams(responseUrl);
      // console.log('DEBUG: Android transactionInfo: ' + JSON.stringify(transactionInfo));

      if (ERROR_CODE_STR in transactionInfo) {
        this.errorCode =  transactionInfo[ERROR_CODE_STR];
        this.errorDescription = transactionInfo[ERROR_DESCRIPTION_STR];
      } else {
        this.kaocPaymentsDocId = transactionInfo[REQUEST_METADATA_STR];
        this.squareServerPaymentRefId = transactionInfo[SERVER_TRANSACTION_ID_STR];
      }
    } else {
      console.log('Transaction done in unsupported OS');
    }
  }
}
