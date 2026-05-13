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





@NgModule({
  declarations: [
    UserEditComponent,
    
    CompanyListComponent,
    EditCompanyComponent,
    CreateCompanyComponent,
    CompanyDetailsComponent,
    AddSubscriptionComponent,
    SelectSubscriptionsComponent,
    UserListComponent
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
    NgSelectModule
  ]
})
export class SysAdmintoolsModule { }
