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

    constructor(private authService: AuthService) {
      authService.firebaseUser.subscribe(firebaseUser => {
          if (firebaseUser) {
              this.firebaseUser = firebaseUser;
          }
      });

      authService.kaocUser.subscribe(kaocUser => {
          if (kaocUser) {
              this.kaocUser = kaocUser;
          }
      });
    }

    ngOnInit() {
    }
}
