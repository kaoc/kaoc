import { Component, OnInit, Input } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase/app';
import {AuthProvider} from 'ngx-auth-firebaseui';
import { FormGroup, AbstractControl, Validators, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';
import { HeaderText, IHeaderText } from 'src/app/utility/HeaderText';

export const EMAIL_REGEX = new RegExp(['^(([^<>()[\\]\\\.,;:\\s@\"]+(\\.[^<>()\\[\\]\\\.,;:\\s@\"]+)*)',
  '|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.',
  '[0-9]{1,3}\])|(([a-zA-Z\\-0-9]+\\.)+',
  '[a-zA-Z]{2,}))$'].join(''));

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  providers = AuthProvider;
  supportedProviders: string[];
  activity  = 'login';
  passReset = false;
  public resetPasswordFormGroup: FormGroup;
  resetPasswordEmailFormControl: AbstractControl;
  @Input() resetPasswordErrorRequiredText = 'E-mail is required to reset the password!';
  @Input() resetPasswordErrorPatternText = 'Please enter a valid e-mail address';
  @Input() resetPasswordInstructionsText = 'Reset requested. Check your e-mail instructions.';


  constructor(
    private fireAuth: AngularFireAuth,
    private snackBar: MatSnackBar,
    private router: Router,
    private headerText: HeaderText) {
    this.supportedProviders = [AuthProvider.Google, AuthProvider.Facebook, AuthProvider.EmailAndPassword];

    this.headerText.setHeaderText({
      title: 'Login'
    } as IHeaderText);
  }
  ngOnInit() {
    this._initResetPasswordFormGroupBuilder();
  }

  handleLoginError(e) {
    this.snackBar.open(e.message, 'Ok', {duration: 5000});
  }

  private _initResetPasswordFormGroupBuilder() {
    this.resetPasswordFormGroup = new FormGroup({
      email: this.resetPasswordEmailFormControl = new FormControl('',
        [
          Validators.required,
          Validators.pattern(EMAIL_REGEX)
        ])
    });
  }

  resetPassword() {
    this.fireAuth.auth.sendPasswordResetEmail(this.resetPasswordEmailFormControl.value, {
      url : window.location.origin,
    }).then(() => {
      this.passReset = true;
    }).catch(e => {
      this.snackBar.open(e.message, 'Ok', {duration: 5000});
    });
  }

  handleRegistrationSuccess() {
    this.snackBar.open('Registration Sucessful. Please verify your email to continue.', 'Success', {duration: 5000});
  }

  handleRegistrationError(e) {
    this.snackBar.open(e.message, 'Ok', {duration: 5000});
  }
}
