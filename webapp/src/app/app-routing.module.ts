import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { KaocHistoryComponent } from './static/about/kaoc-history/kaoc-history.component';
import { KaocByeLawComponent } from './static/about/kaoc-bye-law/kaoc-bye-law.component';
import { HomeComponent } from './common/home/home.component';
import { MadhuramMalayalamComponent } from './activities/madhuram-malayalam/madhuram-malayalam.component';
import { SquarePaymentResultComponent } from './payment/square-payment-result/square-payment-result.component';

const routes: Routes = [
  { path: '', component: HomeComponent  },
  { path: 'kaochistory', component: KaocHistoryComponent },
  { path: 'kaocbylaw', component: KaocByeLawComponent },
  { path: 'squareprocesspaymentresult' , component: SquarePaymentResultComponent}
  //{ path : 'madhuram-malayalam' , component: MadhuramMalayalamComponent}

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
