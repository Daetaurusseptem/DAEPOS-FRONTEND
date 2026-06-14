import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

//USERS
import { UserListComponent } from './users/users-list/users-list.component';
import { UserEditComponent } from './users/edit-user/edit-user.component';
import { CreateUserComponent } from './users/create-user/create-user.component';

//COMPANIES
import { CompanyListComponent } from './companies/company-list/company-list.component';
import { EditCompanyComponent } from './companies/edit-company/edit-company.component';
import { CreateCompanyComponent } from './companies/create-company/create-company.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { CompanyDetailsComponent } from './companies/company-details/company-details.component';
import { AddSubscriptionComponent } from './companies/add-suscription/add-suscription.component';
import { SelectSubscriptionsComponent } from './subscriptions/select-subscriptions/select-subscriptions.component';
import { ComponentsModule } from 'src/app/components/components.module';
import { AdminToolsModule } from '../adminTools/admin-tools.module';
import { NgxPaginationModule } from 'ngx-pagination';

// DASHBOARD & SaaS Control Tower
import { SysadminDashboardComponent } from './dashboard/sysadmin-dashboard.component';
import { SysadminTransactionsComponent } from './transactions/sysadmin-transactions.component';
import { SysadminLogsComponent } from './logs/sysadmin-logs.component';
import { SysadminSubscriptionsComponent } from './subscriptions/sysadmin-subscriptions.component';
import { SysadminSubscriptionDetailComponent } from './subscriptions/detail/sysadmin-subscription-detail.component';
import { SysadminUsersComponent } from './sysadmin-users/sysadmin-users.component';

// TIERS (Subscription Plans)
import { TiersComponent } from './tiers/tiers.component';
import { GlobalSettingsComponent } from './global-settings/global-settings.component';
import { ManualPaymentsComponent } from './manual-payments/manual-payments.component';

@NgModule({
  declarations: [
    UserEditComponent,
    CompanyListComponent,
    EditCompanyComponent,
    CreateCompanyComponent,
    CompanyDetailsComponent,
    AddSubscriptionComponent,
    SelectSubscriptionsComponent,
    UserListComponent,
    SysadminDashboardComponent,
    SysadminTransactionsComponent,
    SysadminLogsComponent,
    SysadminSubscriptionsComponent,
    SysadminSubscriptionDetailComponent,
    SysadminUsersComponent,
    TiersComponent,
    GlobalSettingsComponent,
    ManualPaymentsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    NgSelectModule,
    ComponentsModule,
    AdminToolsModule,
    NgxPaginationModule,
  ],
})
export class SysAdmintoolsModule {}
