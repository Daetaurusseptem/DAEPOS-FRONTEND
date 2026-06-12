import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsaleComponent } from './newsale/newsale.component';
import { CashRegisterComponent } from './cash-register/cash-register.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OpenCashRegisterComponent } from './open-cash-register/open-cash-register.component';
import { UserHomeComponent } from './user-home/user-home.component';
import { ConfirmSaleComponent } from './confirm-sale/confirm-sale.component';
import { SuccessSaleComponent } from './success-sale/success-sale.component';
import { CloseCashRegisterComponent } from './close-cash-register/close-cash-register.component';
import { DailySalesComponent } from './daily-sales/daily-sales.component';
import { InventoryAvailableComponent } from './inventory-available/inventory-available.component';
import { AdminToolsModule } from '../adminTools/admin-tools.module';
import { ComponentsModule } from 'src/app/components/components.module';
import { SaleDetailComponent } from './sale-detail/sale-detail.component';
import { KitchenKdsComponent } from './kitchen-kds/kitchen-kds.component';

@NgModule({
  declarations: [
    NewsaleComponent,
    CashRegisterComponent,
    OpenCashRegisterComponent,
    UserHomeComponent,
    ConfirmSaleComponent,
    SuccessSaleComponent,
    CloseCashRegisterComponent,
    DailySalesComponent,
    InventoryAvailableComponent,
    SaleDetailComponent,
    KitchenKdsComponent,
  ],
  exports: [
    NewsaleComponent,
    CashRegisterComponent,
    OpenCashRegisterComponent,
    KitchenKdsComponent,
  ],
  
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    AdminToolsModule,
    ComponentsModule
    
  ]
})
export class UserToolsModule { }
