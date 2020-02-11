import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css']
})
export class VerifyEmailComponent implements OnInit {
  emailSent = false;

  constructor(private angularFireAuth: AngularFireAuth) { }

  ngOnInit() {
  }

  verifyEmail(): void {
    this.angularFireAuth.auth.currentUser.sendEmailVerification({
      url: window.location.origin + '/secured/profile'
    }).then(()=> {
      this.emailSent = true;
    });
  }

}
