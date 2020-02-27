import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ProfileComponent } from './profile/profile.component';
import { SecuredComponent } from './secured.component';
import { AuthGuardService } from './auth/auth-guard.service';
import { AdminComponent } from '../admin/admin.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { SearchUsersComponent } from './admin/search-users/search-users.component';
import { MemberProfileComponent } from './admin/member-profile/member-profile.component';
import { ListMemberProfilesComponent } from './admin/list-member-profiles/list-member-profiles.component';


const routes: Routes = [{
    path: 'secured',
    component: SecuredComponent,
    children : [{
        path: 'login',
        component: LoginComponent
    }, {
        path: 'verify',
        component: VerifyEmailComponent
    }, {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [AuthGuardService],
        data: {
            expectedRole: 'member'
        }
    }, {
        path: 'admin/search',
        pathMatch: 'prefix',
        component: SearchUsersComponent,
        canActivate: [AuthGuardService],
        data: {
            expectedRole: 'admin'
        }
    }, {
        path: 'admin/memberprofile',
        component: MemberProfileComponent,
        canActivate: [AuthGuardService],
        data: {
            expectedRole: 'admin'
        }
    }, {
        path: 'admin/memberprofile/:id',
        component: MemberProfileComponent,
        canActivate: [AuthGuardService],
        data: {
            expectedRole: 'admin'
        }
    }, {
        path: 'admin/listmembers',
        component: ListMemberProfilesComponent,
        canActivate: [AuthGuardService],
        data: {
            expectedRole: 'admin'
        }
    }, {
        path: 'admin',
        component: AdminComponent,
        canActivate: [AuthGuardService],
        data: {
            expectedRole: 'admin'
        }
    }, {
        path: '',
        pathMatch: 'full',
        redirectTo: 'profile'
    }]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SecuredRoutingModule {}
