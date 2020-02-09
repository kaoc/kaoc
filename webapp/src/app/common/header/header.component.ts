import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/secured/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  isKaocCommitteeMember:boolean = true;
  kaocCommitteeMemberAccessType:string = 'RW';
  loggedIn = false;

  constructor(private authService: AuthService, private router: Router) {
    authService.firebaseUser.subscribe(firebaseUser => {
      if (typeof firebaseUser !== 'undefined') {
          this.loggedIn = (firebaseUser != null);
      }
    });
  }

  navigateToLoginPage() {
      this.router.navigate(['/secured/login']);
  }

  ngOnInit() {
  }

}
