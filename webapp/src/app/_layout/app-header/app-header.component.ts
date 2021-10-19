import { Component, OnInit } from '@angular/core';
import {LinkMenuItem} from 'ngx-auth-firebaseui';
import {AuthService} from '../../secured/auth/auth.service';
import {Router} from '@angular/router';
import { HeaderText, IHeaderText } from 'src/app/utility/HeaderText';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss']
})
export class AppHeaderComponent implements OnInit {

  loggedIn = false;
  isAdmin = false;
  fullName: string = null;
  links: LinkMenuItem[];
  titleInfo: IHeaderText;

  constructor(private authService: AuthService, private router: Router, private headerText: HeaderText) {
    this.links = [
      {icon: 'perm_identity', text: 'KAOC Profile', callback: this.navigateToKaocProfile}
    ];
    authService.firebaseUser.subscribe(firebaseUser => {
      if (typeof firebaseUser !== 'undefined') {
        this.loggedIn = (firebaseUser != null);
        if (firebaseUser == null) {
          this.isAdmin = false;
          this.fullName = null;
        } else {
          this.fullName = firebaseUser.displayName;
        }
      }
    });
    authService.kaocRoles.subscribe(kaocRoles => {
      if (kaocRoles) {
        // TODO - check the time validity of admin.
        this.isAdmin = kaocRoles.admin != null;
      } else {
        this.isAdmin = false;
      }
    });
  }

  navigateToLoginPage() {
    this.router.navigate(['/secured/login']);
  }

  navigateToKaocProfile() {
    this.router.navigate(['secured/profile']);
  }

  ngOnInit() {
    this.headerText.getHeaderText().then((message: IHeaderText) => {
      this.titleInfo = message;
    });
    // $(window).on('scroll', () => {
    //   if ($(window).scrollTop()) {
    //     $('nav').addClass('black');
    //     // $('.topsection').addClass('topnone');
    //   } else {
    //     $('nav').removeClass('black');
    //     // $('.topsection').removeClass('topnone');
    //   }
    // });
  }

}
