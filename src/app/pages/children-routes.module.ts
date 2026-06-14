import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExpiredSubscriptionComponent } from './billing/expired-subscription/expired-subscription.component';

import { sysAdminGuard } from 'src/app/guards/sys-admin.guard';
import { isAuthGuard } from 'src/app/guards/is-auth.guard';
import { adminGuard } from 'src/app/guards/admin-guard.guard';
import { CompanyAdminGuard } from 'src/app/guards/company-admin.guard';
import { OverviewComponent } from './dashboard/overview/overview.component';
import { ReportsComponent } from './dashboard/reports/reports.component';
import { CompanyAdminHomeComponent } from './adminTools/company-admin-home/company-admin-home.component';
import { CompanyListComponent } from './sysAdminTools/companies/company-list/company-list.component';
import { CreateCompanyComponent } from './sysAdminTools/companies/create-company/create-company.component';
import { EditCompanyComponent } from './sysAdminTools/companies/edit-company/edit-company.component';
import { PagesComponent } from './pages.component';
import { UserEditComponent } from './sysAdminTools/users/edit-user/edit-user.component';
import { DashboardPageComponent } from './dashboard/dashboard-page/dashboard-page.component';
import { CompanyDetailsComponent } from './sysAdminTools/companies/company-details/company-details.component';
import { AddSubscriptionComponent } from './sysAdminTools/companies/add-suscription/add-suscription.component';
import { SelectSubscriptionsComponent } from './sysAdminTools/subscriptions/select-subscriptions/select-subscriptions.component';
import { CreateUserReComponent } from '../components/shared/create-user/create-user.component';
import { UserListComponent } from '../components/shared/user-list/user-list.component';
import { SysadminDashboardComponent } from './sysAdminTools/dashboard/sysadmin-dashboard.component';
import { SysadminTransactionsComponent } from './sysAdminTools/transactions/sysadmin-transactions.component';
import { SysadminLogsComponent } from './sysAdminTools/logs/sysadmin-logs.component';
import { SysadminSubscriptionsComponent } from './sysAdminTools/subscriptions/sysadmin-subscriptions.component';
import { SysadminSubscriptionDetailComponent } from './sysAdminTools/subscriptions/detail/sysadmin-subscription-detail.component';
import { SysadminUsersComponent } from './sysAdminTools/sysadmin-users/sysadmin-users.component';
import { TiersComponent } from './sysAdminTools/tiers/tiers.component';
import { GlobalSettingsComponent } from './sysAdminTools/global-settings/global-settings.component';
import { ManualPaymentsComponent } from './sysAdminTools/manual-payments/manual-payments.component';
import { RoleGuard } from '../guards/role.guard';
import { CreateProductComponent } from './adminTools/products/create-product/create-product.component';
import { CreateSupplierComponent } from './adminTools/Suppliers/create-supplier/create-supplier.component';
import { UpdateProductComponent } from './adminTools/products/update-product/update-product.component';
import { UpdateSuppliersComponent } from './adminTools/Suppliers/update-suppliers/update-suppliers.component';
import { SupplierDetailsComponent } from './adminTools/Suppliers/supplier-details/supplier-details.component';
import { CentralizedDeliveriesComponent } from './adminTools/Suppliers/deliveries-hub/deliveries-hub.component';
import { CreateCompanyCategoryComponent } from './adminTools/Categories/create-company-catregory/create-company-category.component';
import { AddInventoryComponent } from './adminTools/inventory/add-inventory/add-inventory.component';
import { OpenCashRegisterComponent } from './userTools/open-cash-register/open-cash-register.component';
import { cashRegisterGuard } from '../guards/cash-register.guard';
import { UserHomeComponent } from './userTools/user-home/user-home.component';
import { userGuard } from '../guards/user.guard';
import { NewsaleComponent } from './userTools/newsale/newsale.component';
import { KitchenKdsComponent } from './userTools/kitchen-kds/kitchen-kds.component';
import { kitchenGuard } from '../guards/kitchen.guard';
import { ProductsListComponent } from './adminTools/products/products-list/products-list.component';
import { SuppliersListComponent } from './adminTools/Suppliers/suppliers-list/suppliers-list.component';
import { CategoriesListComponent } from './adminTools/Categories/categories-list/categories-list.component';
import { InventoryStockListComponent } from './adminTools/inventory/inventory-list/inventory-list.component';
import { CashRegisterComponent } from './userTools/cash-register/cash-register.component';
import { ConfirmSaleComponent } from './userTools/confirm-sale/confirm-sale.component';
import { SuccessSaleComponent } from './userTools/success-sale/success-sale.component';
import { CloseCashRegisterComponent } from './userTools/close-cash-register/close-cash-register.component';
import { CreateStockTransferComponent } from './adminTools/inventory/transfers/create-transfer/create-transfer.component';
import { StockTransferListComponent } from './adminTools/inventory/transfers/transfer-list/stock-transfer-list.component';
import { DailySalesComponent } from './userTools/daily-sales/daily-sales.component';
import { EditCategoryComponent } from './adminTools/Categories/edit-category/edit-category.component';
import { InventoryAvailableComponent } from './userTools/inventory-available/inventory-available.component';
import { RecipeListComponent } from './adminTools/Recipes/recipe-list/recipe-list.component';
import { CreateRecipeComponent } from './adminTools/Recipes/create-recipe/create-recipe.component';
import { EditRecipeComponent } from './adminTools/Recipes/edit-recipe/edit-recipe.component';
import { UpdateInventoryComponent } from './adminTools/inventory/update-inventory/update-inventory.component';
import { RawMaterialListComponent } from './adminTools/raw-materials/raw-material-list/raw-material-list.component';
import { CreateRawMaterialComponent } from './adminTools/raw-materials/create-raw-material/create-raw-material.component';
import { EditRawMaterialComponent } from './adminTools/raw-materials/edit-raw-material/edit-raw-material.component';
import { StatisticsComponent } from './adminTools/statistics/statistics.component';
import { SaleDetailComponent } from './userTools/sale-detail/sale-detail.component';
import { ManagePrintersComponent } from './adminTools/manage-printers/manage-printers.component';
import { UserCajasComponent } from '../components/user-cajas/user-cajas.component';

import { CajaDetailComponent } from '../components/caja-detail/caja-detail.component';
import { BranchListComponent } from './adminTools/branches/branch-list/branch-list.component';
import { BranchFormComponent } from './adminTools/branches/branch-form/branch-form.component';
import { BranchAdminHomeComponent } from './adminTools/branch-admin-home/branch-admin-home.component';
import { NotificationsPageComponent } from './notifications/notifications-page.component';
import { CustomersListComponent } from './adminTools/customers/customers-list.component';
import { PromotionsListComponent } from './adminTools/promotions/promotions-list.component';
import { LiveRegistersComponent } from './adminTools/live-registers/live-registers.component';
import { CajasHistorialComponent } from './adminTools/cajas-historial/cajas-historial.component';
import { ManageBillingComponent } from './billing/manage-billing/manage-billing.component';
import { PendingVerificationsComponent } from './adminTools/audits/pending-verifications/pending-verifications.component';

const routes: Routes = [
  {
    path: '',
    component: PagesComponent,
    canActivate: [isAuthGuard],
    children: [
      { path: '', component: DashboardPageComponent, canActivate: [RoleGuard] },
      { path: 'overview', component: OverviewComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'notifications', component: NotificationsPageComponent },
      //SYSADMIN
      { path: 'sysadmin/dashboard', canActivate: [sysAdminGuard], component: SysadminDashboardComponent },
      { path: 'sysadmin/transactions', canActivate: [sysAdminGuard], component: SysadminTransactionsComponent },
      { path: 'sysadmin/logs', canActivate: [sysAdminGuard], component: SysadminLogsComponent },
      { path: 'sysadmin/subscriptions', canActivate: [sysAdminGuard], component: SysadminSubscriptionsComponent },
      {
        path: 'sysadmin/subscriptions/:id',
        canActivate: [sysAdminGuard],
        component: SysadminSubscriptionDetailComponent,
      },
      { path: 'sysadmin/users', canActivate: [sysAdminGuard], component: SysadminUsersComponent },
      { path: 'sysadmin/users/edit/:id', canActivate: [sysAdminGuard], component: UserEditComponent },
      { path: 'sysadmin/users/new', canActivate: [sysAdminGuard], component: CreateUserReComponent },
      { path: 'sysadmin/tiers', canActivate: [sysAdminGuard], component: TiersComponent },
      { path: 'sysadmin/global-settings', canActivate: [sysAdminGuard], component: GlobalSettingsComponent },
      { path: 'sysadmin/manual-payments', canActivate: [sysAdminGuard], component: ManualPaymentsComponent },
      { path: 'sysadmin/companies', canActivate: [sysAdminGuard], component: CompanyListComponent },
      { path: 'sysadmin/companies/new', canActivate: [sysAdminGuard], component: CreateCompanyComponent },
      { path: 'sysadmin/companies/edit/:id', canActivate: [sysAdminGuard], component: EditCompanyComponent },
      { path: 'sysadmin/companies/details/:id', canActivate: [sysAdminGuard], component: CompanyDetailsComponent },
      { path: 'sysadmin/tiers', canActivate: [sysAdminGuard], component: TiersComponent },
      {
        path: 'sysadmin/companies/subscriptions/select',
        canActivate: [sysAdminGuard],
        component: SelectSubscriptionsComponent,
      },
      {
        path: 'sysadmin/companies/subscription/:id',
        canActivate: [sysAdminGuard],
        component: AddSubscriptionComponent,
      },
      { path: 'sysadmin/suppliers', canActivate: [sysAdminGuard], component: SuppliersListComponent },
      { path: 'sysadmin/suppliers/new/:id', canActivate: [sysAdminGuard], component: CreateSupplierComponent },
      { path: 'sysadmin/suppliers/edit/:id', canActivate: [sysAdminGuard], component: UpdateSuppliersComponent },
      { path: 'sysadmin/products', canActivate: [sysAdminGuard], component: ProductsListComponent },
      { path: 'sysadmin/product/new', canActivate: [sysAdminGuard], component: CreateProductComponent },
      { path: 'sysadmin/product/new/:id', canActivate: [sysAdminGuard], component: CreateProductComponent },
      { path: 'sysadmin/product/edit/:id', canActivate: [sysAdminGuard], component: UpdateProductComponent },
      { path: 'sysadmin/categories', canActivate: [sysAdminGuard], component: CategoriesListComponent },
      { path: 'sysadmin/edit-category/:id', canActivate: [sysAdminGuard], component: EditCategoryComponent },
      { path: 'sysadmin/categories/new/:id', canActivate: [sysAdminGuard], component: CreateCompanyCategoryComponent },
      //ADMIN
      { path: 'admin', canActivate: [adminGuard], component: CompanyAdminHomeComponent },
      { path: 'admin/audits/pending', canActivate: [adminGuard], component: PendingVerificationsComponent },
      { path: 'admin/billing', canActivate: [CompanyAdminGuard], component: ManageBillingComponent },
      { path: 'admin/users', canActivate: [adminGuard], component: UserListComponent },
      { path: 'admin/users/new', canActivate: [adminGuard], component: CreateUserReComponent },
      { path: 'admin/users/edit/:id', canActivate: [adminGuard], component: UserEditComponent },
      { path: 'admin/users/:userId/cajas', component: UserCajasComponent, canActivate: [adminGuard] },

      { path: 'admin/cajas/:cajaId', component: CajaDetailComponent, canActivate: [adminGuard] },
      { path: 'admin/products', canActivate: [adminGuard], component: ProductsListComponent },
      { path: 'admin/product/new', canActivate: [adminGuard], component: CreateProductComponent },
      { path: 'admin/product/edit/:id', canActivate: [adminGuard], component: UpdateProductComponent },
      { path: 'admin/suppliers', canActivate: [adminGuard], component: SuppliersListComponent },
      { path: 'admin/suppliers/deliveries', canActivate: [adminGuard], component: CentralizedDeliveriesComponent },
      { path: 'admin/suppliers/new/:id', canActivate: [adminGuard], component: CreateSupplierComponent },
      { path: 'admin/suppliers/edit/:id', canActivate: [adminGuard], component: UpdateSuppliersComponent },
      { path: 'admin/suppliers/details/:id', canActivate: [adminGuard], component: SupplierDetailsComponent },
      { path: 'admin/categories', canActivate: [adminGuard], component: CategoriesListComponent },
      { path: 'admin/edit-category/:id', canActivate: [adminGuard], component: EditCategoryComponent },
      { path: 'admin/categories/new/:id', canActivate: [adminGuard], component: CreateCompanyCategoryComponent },
      { path: 'admin/inventory', canActivate: [adminGuard], component: InventoryStockListComponent },
      { path: 'admin/items', canActivate: [adminGuard], component: InventoryStockListComponent },
      { path: 'admin/inventory/new', canActivate: [adminGuard], component: AddInventoryComponent },
      { path: 'admin/inventory/update/:id', canActivate: [adminGuard], component: UpdateInventoryComponent },
      { path: 'admin/inventory/transfers/new', canActivate: [adminGuard], component: CreateStockTransferComponent },
      { path: 'admin/inventory/transfers', canActivate: [adminGuard], component: StockTransferListComponent },
      { path: 'admin/recipes', canActivate: [adminGuard], component: RecipeListComponent },
      { path: 'admin/recipes/new', canActivate: [adminGuard], component: CreateRecipeComponent },
      { path: 'admin/recipes/edit/:id', canActivate: [adminGuard], component: EditRecipeComponent },
      { path: 'admin/raw-materials', component: RawMaterialListComponent },
      { path: 'admin/ingredients', component: RawMaterialListComponent },
      { path: 'admin/raw-materials/new', component: CreateRawMaterialComponent },
      { path: 'admin/raw-materials/edit/:id', component: EditRawMaterialComponent },
      { path: 'admin/statistics', component: StatisticsComponent },
      { path: 'admin/manage-printers', component: ManagePrintersComponent },
      { path: 'admin/branches', canActivate: [adminGuard], component: BranchListComponent },
      { path: 'admin/branches/new', canActivate: [adminGuard], component: BranchFormComponent },
      { path: 'admin/branches/:id', canActivate: [adminGuard], component: BranchAdminHomeComponent },
      { path: 'admin/branches/edit/:id', canActivate: [adminGuard], component: BranchFormComponent },
      { path: 'branch', canActivate: [adminGuard], component: BranchAdminHomeComponent },
      { path: 'admin/customers', canActivate: [adminGuard], component: CustomersListComponent },
      { path: 'admin/promotions', canActivate: [adminGuard], component: PromotionsListComponent },
      { path: 'admin/live-registers', canActivate: [adminGuard], component: LiveRegistersComponent },
      { path: 'admin/cajas-historial', canActivate: [adminGuard], component: CajasHistorialComponent },
      //USER
      { path: 'user', canActivate: [userGuard], component: UserHomeComponent },
      { path: 'user/new-sale', component: NewsaleComponent, canActivate: [isAuthGuard, userGuard] },
      {
        path: 'user/open-cash-register',
        component: OpenCashRegisterComponent,
        canActivate: [isAuthGuard, userGuard],
      },
      { path: 'user/new-sale/confirm-sale', component: ConfirmSaleComponent },
      { path: 'user/sales-success', component: SuccessSaleComponent },
      { path: 'user/close-register', component: CloseCashRegisterComponent, canActivate: [isAuthGuard, userGuard] },
      { path: 'user/daily-sales', component: DailySalesComponent, canActivate: [isAuthGuard, userGuard] },
      { path: 'user/sale-details/:saleId', component: SaleDetailComponent, canActivate: [isAuthGuard, userGuard] },
      {
        path: 'user/inventory-available',
        component: InventoryAvailableComponent,
        canActivate: [isAuthGuard, userGuard],
      },
      { path: 'kitchen/kds', component: KitchenKdsComponent, canActivate: [isAuthGuard, kitchenGuard] },

      // BILLING / SUSCRIPCION (Para todos los roles que intenten acceder bloqueados)
      { path: 'billing/expired', component: ExpiredSubscriptionComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class childrenPagesRouting {}
