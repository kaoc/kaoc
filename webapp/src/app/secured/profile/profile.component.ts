// import { PaypalPaymentComponent } from './../../payment/paypal-payment/paypal-payment.component';
import { Component, OnInit } from '@angular/core';
import { AuthService, UserInfoExt } from '../auth/auth.service';
import { Member } from '../Member';
import { Event } from '../Event';
import { AngularFireFunctions } from '@angular/fire/functions';
import { MatSnackBar } from '@angular/material';
import { MemberService } from '../member.service';
import { EventService } from '../event.service';
import { Membership } from '../Membership';
import { Router, ActivatedRoute } from '@angular/router';
import { ADMIN_MEMBER_CHECKIN, SECURED_CONTEXT } from 'src/app/URLConstants';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
    firebaseUser: UserInfoExt = {} as UserInfoExt;
    kaocUser: Member;
    kaocMembers: Member[];
    kaocUserId: string;
    membership: Membership;
    upcomingEvents: Event[];
    memberQRCodeImageData: string;
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
    isAdminView = false;

    constructor(
      private router: Router,
      private activatedRoute: ActivatedRoute,
      private authService: AuthService,
      private fns: AngularFireFunctions,
      private snackBar: MatSnackBar,
      private memberService: MemberService,
      private eventService: EventService) {

      const queryByMemberId = this.activatedRoute.snapshot.paramMap.get('id');
      if (queryByMemberId) {

          this.isAdminView = true; // Indicates that an admin is looking at the user profile.
          this.firebaseUser = null; // An admin user viewing other users profile. So don't set the firebaseUser
                                    // Firebase user is effectively the logged in user.

          // Looking for a specific user profile.
          this.loadMembershipDetails(queryByMemberId).then(membershipData => {
              let kaocUser = null;

              if (membershipData
                  && membershipData.members
                  && membershipData.members.length > 0) {
                  kaocUser = membershipData.members.find(member => member.kaocUserId === queryByMemberId);
              }

              if (kaocUser) {
                this.profileState = 'kaocUserFound';
                this.kaocUser = kaocUser;
                this.kaocUserId = kaocUser.kaocUserId;
              } else {
                  this.profileState = 'kaocUserNotFound';
              }
          }).catch(e => {
              console.error(`Failed to load user profile for kaocUserId: ${this.kaocUserId}`);
          });

          // For user profile loaded by admin. load the upcoming events
          this.eventService
              .getUpcomingEvents()
              .then(events => this.upcomingEvents =  events)
              .catch(e => {
                  this.upcomingEvents = null;
              });
      } else {
          // load current logged users profile.
          authService.firebaseUser.subscribe(firebaseUser => {
              if (firebaseUser) {
                  this.firebaseUser = firebaseUser;
              }
          });

          authService.kaocUser.subscribe(kaocUser => {
              if (kaocUser) {
                  this.profileState = 'kaocUserFound';
                  this.kaocUser = kaocUser;
                  this.kaocUserId = kaocUser.kaocUserId;
                  this.loadMembershipDetails(kaocUser.kaocUserId);
              } else {
                  this.profileState = 'kaocUserNotFound';
              }
          });
      }
    }

    performMemberEventCheckIn(kaocUserId, kaocEventId) {
        const redirectURL = `/${SECURED_CONTEXT}/${ADMIN_MEMBER_CHECKIN}`
            .replace(':memberId', kaocUserId)
            .replace(':eventId', kaocEventId);
        this.router.navigateByUrl(redirectURL);
    }

    loadMembershipDetails(kaocUserId: string): Promise<Membership> {
        return this.memberService.getMembershipData(kaocUserId)
            .then(membership => {
                this.membership = membership;
                this.membershipDetailsLoaded = true;
                return membership;
            })
            .catch(e => {
                this.membership = null;
                this.membershipDetailsLoaded = true;
                return null;
            }).then(membershipData => {
                if (this.membership && this.membershipDetailsLoaded) {
                    this.memberService.getMemberQRCode(kaocUserId)
                    .then(qrCodeData => {
                        this.memberQRCodeImageData = qrCodeData.qrCodeImage;
                    });
                }
                return membershipData;
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
        if (this.kaocUserId) {
            this.router.navigateByUrl('/secured/user/memberprofile/' + this.kaocUserId);
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
