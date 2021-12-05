import {
    ADMIN_LIST_MEMBERS,
    ADMIN_VIEW_MEMBER_PROFILE,
    ADMIN_MEMBER_PROFILE,
    ADMIN_SEARCH, PROFILE,
    USER_MEMBER_PROFILE,
    ADMIN_SCANNER
} from './../URLConstants';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ProfileComponent } from './profile/profile.component';
import { SecuredComponent } from './secured.component';
import { AuthGuardService } from './auth/auth-guard.service';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { SearchUsersComponent } from './admin/search-users/search-users.component';
import { MemberProfileComponent } from './admin/member-profile/member-profile.component';
import { ListMemberProfilesComponent } from './admin/list-member-profiles/list-member-profiles.component';
import { ProfileLinkStatusComponent } from './profile-link-status/profile-link-status.component';
import { LOGIN, PROFILE_LINK_STATUS, SECURED_CONTEXT, VERIFY } from '../URLConstants';
import { ScannerComponent } from './scanner/scanner.component';


const routes: Routes = [{
    path: SECURED_CONTEXT,
    component: SecuredComponent,
    children : [{
        path: LOGIN,
        component: LoginComponent
    }, {
        path: VERIFY,
        component: VerifyEmailComponent
    }, {
      path: PROFILE_LINK_STATUS,
      component: ProfileLinkStatusComponent,
      canActivate: [AuthGuardService],
      data: {
          expectedRole: 'member'
      }
    }, {
        path: PROFILE,
        component: ProfileComponent,
        canActivate: [AuthGuardService],
        data: {
            expectedRole: 'member'
        }
    }, {
      path: USER_MEMBER_PROFILE,
      component: MemberProfileComponent,
      canActivate: [AuthGuardService],
      data: {
          expectedRole: 'member'
      }
    }, {
        path: ADMIN_SEARCH,
        pathMatch: 'prefix',
        component: SearchUsersComponent,
        canActivate: [AuthGuardService],
        data: {
            expectedRole: 'admin'
        }
    }, {
        path: ADMIN_MEMBER_PROFILE,
        component: MemberProfileComponent,
        canActivate: [AuthGuardService],
        data: {
            expectedRole: 'admin'
        }
    }, {
        path: `${ADMIN_MEMBER_PROFILE}/:id`,
        component: MemberProfileComponent,
        canActivate: [AuthGuardService],
        data: {
            expectedRole: 'admin'
        }
    }, {
        path: ADMIN_VIEW_MEMBER_PROFILE,
        component: ProfileComponent,
        canActivate: [AuthGuardService],
        data: {
            expectedRole: 'admin'
        }
    }, {
        path: ADMIN_LIST_MEMBERS,
        component: ListMemberProfilesComponent,
        canActivate: [AuthGuardService],
        data: {
            expectedRole: 'admin'
        }
    }, {
        path: ADMIN_SCANNER,
        component: ScannerComponent,
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
