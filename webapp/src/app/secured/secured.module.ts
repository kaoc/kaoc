import { PaypalPaymentComponent } from './../payment/paypal-payment/paypal-payment.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SecuredRoutingModule } from './secured-routing.module';
import { ProfileComponent } from './profile/profile.component';
import { SecuredComponent } from './secured.component';
import { AdminComponent } from './admin/admin.component';
import { NgxAuthFirebaseUIModule } from 'ngx-auth-firebaseui';
import { LoginComponent } from './login/login.component';
import { MatCardModule} from '@angular/material/card';
import { MatFormFieldModule} from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule} from '@angular/forms';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { SearchUsersComponent } from './admin/search-users/search-users.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { UserTableComponent } from './admin/user-table/user-table.component';
import { MaterialModule } from '../material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MemberProfileComponent } from './admin/member-profile/member-profile.component';
import { ListMemberProfilesComponent } from './admin/list-member-profiles/list-member-profiles.component';
import { DialogWinComponent } from './admin/dialog-win/dialog-win.component';
import { ConfirmDelComponent } from './admin/member-profile/confirm-del.component';
import { ProfileLinkStatusComponent } from './profile-link-status/profile-link-status.component';




@NgModule({
  declarations: [
    ProfileComponent,
    SecuredComponent,
    AdminComponent,
    LoginComponent,
    VerifyEmailComponent,
    SearchUsersComponent,
    UserTableComponent,
    MemberProfileComponent,
    ListMemberProfilesComponent,
    DialogWinComponent,
    ConfirmDelComponent,
    ProfileLinkStatusComponent,
    PaypalPaymentComponent
  ],
  imports: [
    CommonModule,
    SecuredRoutingModule,
    NgxAuthFirebaseUIModule,
    MatCardModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
    NgxSpinnerModule,
    MaterialModule,
    FlexLayoutModule
  ],
  exports: [
    UserTableComponent ,DialogWinComponent ,ConfirmDelComponent
  ],
  entryComponents: [  DialogWinComponent , ConfirmDelComponent],

})
export class SecuredModule { }
