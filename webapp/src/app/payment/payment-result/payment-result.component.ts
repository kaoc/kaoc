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
    const updatePayment = this.ngFireFunctions.httpsCallable('updatePayment');
    updatePayment({paymentId : 'sQpi1Iy9mepeXDpVAW7s', payment: {paymentStatus : 'Paid'}});
  }

  /**
   * Determine the mobile operating system.
   * This function returns one of 'iOS', 'Android', or 'unknown'.
   *
   * @returns {String}
   */
  getMobileOperatingSystem() {
    const userAgent = navigator.userAgent || navigator.vendor;

    if (/android/i.test(userAgent)) {
        return 'Android';
    }
    if (/iPad|iPhone|iPod/.test(userAgent)) {
        return 'iOS';
    }
    return 'unknown OS';
  }

}
