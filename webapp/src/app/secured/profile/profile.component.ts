import { PaypalPaymentComponent } from './../../payment/paypal-payment/paypal-payment.component';
import { Component, OnInit } from '@angular/core';
import { AuthService, UserInfoExt } from '../auth/auth.service';
import { Member } from '../Member';
import { AngularFireFunctions } from '@angular/fire/functions';
import { MatSnackBar } from '@angular/material';
import { MemberService } from '../member.service';
import { Membership } from '../Membership';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
    firebaseUser: UserInfoExt;
    kaocUser: Member;
    membership: Membership;
    EMAIL_REGEXP = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;

    // possible values something in lines of - maybe an enum?
    // loading,
    // kaocUserNotFound,
    // kaocUserFound,
    // kaocUserLinkEmailSent
    profileState = 'loading';
    emailIdToLink: string;
    validEmailIdToLink = false;
    membershipDetailsLoaded = false;

    constructor(
      private router: Router,
      private authService: AuthService,
      private fns: AngularFireFunctions,
      private snackBar: MatSnackBar,
      private memberServie: MemberService) {
      authService.firebaseUser.subscribe(firebaseUser => {
          if (firebaseUser) {
              this.firebaseUser = firebaseUser;
          }
      });

      authService.kaocUser.subscribe(kaocUser => {
          if (kaocUser) {
              this.profileState = 'kaocUserFound';
              this.kaocUser = kaocUser;
              this.memberServie
                    .getMembershipData(kaocUser.kaocUserId)
                    .then(membership => {
                        this.membership = membership;
                        this.membershipDetailsLoaded = true;
                    })
                    .catch(e => {
                        this.membership = null;
                        this.membershipDetailsLoaded = true;
                    });
          } else {
              this.profileState = 'kaocUserNotFound';
          }
      });
    }

    setEmailIdToLink(value) {
        this.emailIdToLink = value;
        this.validEmailIdToLink = this.EMAIL_REGEXP.test(value);
    }

    linkWithOtherEmail(email: string): void {
      if (this.EMAIL_REGEXP.test(email)) {
          this.fns.httpsCallable('requestEmailProfileLinking')({
            emailId: email
          }).toPromise().then(success => {
            this.profileState = 'kaocUserLinkEmailSent';
          }).catch(e => {
            this.snackBar.open('Failed to request profile linking ' + e.message);
          });
      } else {
        this.snackBar.open('Invalid Email Id.', null, {duration: 5000});
      }
    }

    editUserProfile() {
        if (this.kaocUser) {
            this.router.navigateByUrl('/secured/admin/memberprofile/'+this.kaocUser.kaocUserId);
        }
    }

    /**
     * Creates a new profile for the current loggied in user using the login profile.
     */
    createNewProfile(): void {
        this.fns.httpsCallable('createNewProfile')({
        }).toPromise().then(success => {
          this.authService.reloadUserProfile();
        }).catch(e => {
          this.snackBar.open('Failed to create user profile ' + e.message);
        });
    }


    ngOnInit() {
    }
}
