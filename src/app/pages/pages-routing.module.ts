import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { OverviewComponent } from './dashboard/overview/overview.component';
import { ReportsComponent } from './dashboard/reports/reports.component';
import { PagesComponent } from './pages.component';
// ... otros componentes de páginas

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./children-routes.module').then(m => m.childrenPagesRouting)
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
