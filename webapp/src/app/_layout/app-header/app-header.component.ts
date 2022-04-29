import { Component, OnInit } from '@angular/core';
import {LinkMenuItem} from 'ngx-auth-firebaseui';
import {AuthService} from '../../secured/auth/auth.service';
import { Router, NavigationEnd, ActivatedRoute, NavigationStart } from '@angular/router';
import { getHeaderText } from './headerText';

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
  titleInfo = {
    title: '',
    subTitle: ''
  };

  constructor(private authService: AuthService, private router: Router, private currentActivatedRoute: ActivatedRoute) {
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

  navigateToUrl(url) {
    window.location.href=url;
  }

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.titleInfo = getHeaderText(event.url);
        console.log(this.titleInfo , event.url);
      }
    });
    // const state = this.router.routerState;
    // console.log(state);
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
