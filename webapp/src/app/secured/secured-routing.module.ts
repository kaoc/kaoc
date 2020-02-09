import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ProfileComponent } from './profile/profile.component';
import { SecuredComponent } from './secured.component';
import { AuthGuardService } from './auth/auth-guard.service';
import { AdminComponent } from '../admin/admin.component';


const routes: Routes = [{
  path: 'secured',
  component: SecuredComponent,
  children : [
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [AuthGuardService],
        data: {
            expectedRole: 'member'
        }
    },
    {
        path: 'admin',
        component: AdminComponent,
        canActivate: [AuthGuardService],
        data: {
            expectedRole: 'admin'
        }
    },
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'profile'
    }
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SecuredRoutingModule {}
