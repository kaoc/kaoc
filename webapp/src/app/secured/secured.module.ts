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
import { MemberProfileComponent } from './admin/edit-member-profile/member-profile.component';
import { ListMemberProfilesComponent } from './admin/list-member-profiles/list-member-profiles.component';
import { DialogWinComponent } from './admin/dialog-win/dialog-win.component';
import { ConfirmDelComponent } from './admin/edit-member-profile/confirm-del.component';
import { ProfileLinkStatusComponent } from './profile-link-status/profile-link-status.component';

import {AppHeaderComponent} from '../_layout/app-header/app-header.component';
import {AppFooterComponent} from '../_layout/app-footer/app-footer.component';

import {JwPaginationModule} from 'jw-angular-pagination';
import { ScannerComponent } from './scanner/scanner.component';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { EventMembershipCheckinComponent } from './admin/event-membership-checkin/event-membership-checkin.component';
import { EventTicketCheckinComponent } from './admin/event-ticket-checkin/event-ticket-checkin.component';
import { EventTicketsComponent } from './event-tickets/event-tickets.component';
import { EventManagementComponent } from './admin/event-management/event-management.component';
import { AdminFunctionsComponent } from './admin/admin-functions/admin-functions.component';
import { ViewMemberProfileComponent } from './admin/view-member-profile/view-member-profile.component';
import { MemberPaymentComponent } from './member-payment/member-payment.component';


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
    PaypalPaymentComponent,
    AppHeaderComponent,
    AppFooterComponent,
    ScannerComponent,
    EventMembershipCheckinComponent,
    EventTicketCheckinComponent,
    EventTicketsComponent,
    EventManagementComponent,
    AdminFunctionsComponent,
    ViewMemberProfileComponent,
    MemberPaymentComponent
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
    FlexLayoutModule,
    JwPaginationModule,
    ZXingScannerModule
  ],
  exports: [
    UserTableComponent, DialogWinComponent, ConfirmDelComponent, AppHeaderComponent, AppFooterComponent
  ],
  entryComponents: [  DialogWinComponent , ConfirmDelComponent],

})
export class SecuredModule { }
