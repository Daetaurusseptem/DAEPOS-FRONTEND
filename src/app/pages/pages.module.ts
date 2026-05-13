import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ComponentsModule } from '../components/components.module';
import { PagesRoutingModule } from './pages-routing.module';

import { OverviewComponent } from './dashboard/overview/overview.component';
import { ReportsComponent } from './dashboard/reports/reports.component';
import { RouterLink } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatInputModule } from '@angular/material/input';

import { CompanyAdminHomeComponent } from './adminTools/company-admin-home/company-admin-home.component';
import { ProductsComponent } from './adminTools/products/products.component';
import { CompanyUsersComponent } from './adminTools/users/company-users/company-users.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { PagesComponent } from './pages.component';

import { SysAdmintoolsModule } from './sysAdminTools/sys-admintools.module';
import { AdminToolsModule } from './adminTools/admin-tools.module';
import { NgxPaginationModule } from 'ngx-pagination';
import { UserToolsModule } from './userTools/user-tools.module';

import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { DashboardPageComponent } from './dashboard/dashboard-page/dashboard-page.component';

@NgModule({
  declarations: [
    LoginComponent,
    LandingPageComponent,
    OverviewComponent,
    ReportsComponent,
    CompanyAdminHomeComponent,
    ProductsComponent,
    PageNotFoundComponent,
    PagesComponent,
    DashboardPageComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule,
    PagesRoutingModule,
    RouterLink,
    NgSelectModule,
    MatInputModule,
    SysAdmintoolsModule,
    AdminToolsModule,
    NgxPaginationModule,
    UserToolsModule,
    MatPaginatorModule,
    MatTableModule
  ]
})
export class PagesModule { }
