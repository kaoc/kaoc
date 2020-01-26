import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MemberProfileComponent } from './membership/member-profile/member-profile.component';
import { ListMemberProfilesComponent } from './membership/list-member-profiles/list-member-profiles.component';
import { KaocHistoryComponent } from './about/kaoc-history/kaoc-history.component';
import { KaocByeLawComponent } from './about/kaoc-bye-law/kaoc-bye-law.component';
import { AdminComponent } from './admin/admin.component';
import { HomeComponent } from './common/home/home.component';
import { DefaultComponent } from './default/default.component';
import { MadhuramMalayalamComponent } from './activities/madhuram-malayalam/madhuram-malayalam.component';

const routes: Routes = [
  { path: '', component: HomeComponent  },
  { path: 'admin', component: AdminComponent },
  { path: 'kaochistory', component: KaocHistoryComponent },
  { path: 'kaocbyelaw', component: KaocByeLawComponent },
  { path: 'memberprofile', component: MemberProfileComponent },
  { path: 'listmembers', component: ListMemberProfilesComponent },
  { path : 'madhuram-malayalam' , component: MadhuramMalayalamComponent}

];

/*const routes: Routes = [
  //{ path: '', redirectTo: '', pathMatch: 'full' },
  {
    path: '', component: HomeComponent,
    children: [{
      path: 'kaochistory',
      component: KaocHistoryComponent
    }, {
      path: 'kaocbyelaw',
      component: KaocByeLawComponent
    }]
  },
]; */

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
