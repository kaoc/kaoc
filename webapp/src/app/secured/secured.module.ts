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



@NgModule({
  declarations: [
    ProfileComponent,
    SecuredComponent,
    AdminComponent,
    LoginComponent,
    VerifyEmailComponent],
  imports: [
    CommonModule,
    SecuredRoutingModule,
    NgxAuthFirebaseUIModule,
    MatCardModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule
  ]
})
export class SecuredModule { }
