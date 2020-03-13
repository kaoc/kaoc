import { Component, OnInit } from '@angular/core';
import { AuthService, UserInfoExt } from '../auth/auth.service';
import { Member } from '../Member';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
    firebaseUser: UserInfoExt;
    kaocUser: Member;

    // possible values something in lines of - maybe an enum?
    // loading,
    // kaocUserNotFound,
    // kaocUserFound,
    // kaocUserLinkEmailSent
    profileState = 'loading';

    constructor(private authService: AuthService) {
      authService.firebaseUser.subscribe(firebaseUser => {
          if (firebaseUser) {
              this.firebaseUser = firebaseUser;
          }
      });

      authService.kaocUser.subscribe(kaocUser => {
          if (kaocUser) {
              this.profileState = 'kaocUserFound';
              this.kaocUser = kaocUser;
          } else {
              this.profileState = 'kaocUserNotFound';
          }
      });
    }

    linkWithOtherEmail(email: string): void {
        // TODO - Call service
        // then
        this.profileState = 'kaocUserLinkEmailSent';
    }

    createNewProfile(): void {
        // TODO - Call service
        // then show success (using snackBar?)
        // and wait for kaocUserProfile to be available (done above)
    }

    ngOnInit() {
    }
}
