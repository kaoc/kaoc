import { KOAC_BYLAW, KOAC_HISTORY, KOAC_MEMBER_PROFILE, KOAC_PAYMENT, KOAC_STATIC_PAGES } from './URLConstants';
import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {KaocHistoryComponent} from './static/about/kaoc-history/kaoc-history.component';
import {KaocByeLawComponent} from './static/about/kaoc-bye-law/kaoc-bye-law.component';
import {HomeComponent} from './common/home/home.component';
import {MadhuramMalayalamComponent} from './activities/madhuram-malayalam/madhuram-malayalam.component';
import {SquarePaymentResultComponent} from './payment/square-payment-result/square-payment-result.component';
import {AppLayoutComponent} from './_layout/app-layout/app-layout.component';
import {ProfileComponent} from './secured/profile/profile.component';
import {MemberProfileComponent} from './secured/admin/edit-member-profile/member-profile.component';
import { ShellComponent } from './static/shell/shell.component';

const routes: Routes = [
  {path: '', component: HomeComponent},
  //// { path : 'madhuram-malayalam' , component: MadhuramMalayalamComponent}

  {
    path: '',
    component: AppLayoutComponent,
    children: [
      {path: KOAC_HISTORY, component: KaocHistoryComponent},
      {path: KOAC_BYLAW, component: KaocByeLawComponent},
      {path: KOAC_PAYMENT, component: SquarePaymentResultComponent},
      {path: KOAC_MEMBER_PROFILE, component: MemberProfileComponent},
      {
        path: `${KOAC_STATIC_PAGES}/:pageId`,
        component: ShellComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
