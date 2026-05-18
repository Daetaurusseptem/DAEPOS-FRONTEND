import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SysAdminGuard } from 'src/app/guards/sys-admin.guard';
import { AuthGuardGuard } from 'src/app/guards/is-auth.guard';
import { AdminGuard } from 'src/app/guards/admin-guard.guard';
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
import { RoleGuard } from '../guards/role.guard';
import { CreateProductComponent } from './adminTools/products/create-product/create-product.component';
import { CreateSupplierComponent } from './adminTools/Suppliers/create-supplier/create-supplier.component';
import { UpdateProductComponent } from './adminTools/products/update-product/update-product.component';
import { UpdateSuppliersComponent } from './adminTools/Suppliers/update-suppliers/update-suppliers.component';
import { SupplierDetailsComponent } from './adminTools/Suppliers/supplier-details/supplier-details.component';
import { CreateCompanyCategoryComponent } from './adminTools/Categories/create-company-catregory/create-company-category.component';
import { AddInventoryComponent } from './adminTools/inventory/add-inventory/add-inventory.component';
import { OpenCashRegisterComponent } from './userTools/open-cash-register/open-cash-register.component';
import { CashRegisterGuard } from '../guards/cash-register.guard';
import { UserHomeComponent } from './userTools/user-home/user-home.component';
import { userGuard } from '../guards/user.guard';
import { NewsaleComponent } from './userTools/newsale/newsale.component';
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
import { FechaCajasComponent } from '../components/fecha-cajas/fecha-cajas.component';
import { CajaDetailComponent } from '../components/caja-detail/caja-detail.component';
import { BranchListComponent } from './adminTools/branches/branch-list/branch-list.component';
import { BranchFormComponent } from './adminTools/branches/branch-form/branch-form.component';
import { BranchAdminHomeComponent } from './adminTools/branch-admin-home/branch-admin-home.component';
import { NotificationsPageComponent } from './notifications/notifications-page.component';

const routes: Routes = [
  {
    path: '',
    component: PagesComponent,
    canActivate: [AuthGuardGuard],
    children: [
      { path: '', component: DashboardPageComponent, canActivate: [RoleGuard] },
      { path: 'overview', component: OverviewComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'notifications', component: NotificationsPageComponent },
      //SYSADMIN
      { path: 'sysadmin/users', canActivate: [SysAdminGuard], component: UserListComponent },
      { path: 'sysadmin/users/edit/:id', canActivate: [SysAdminGuard], component: UserEditComponent },
      { path: 'sysadmin/users/new', canActivate: [SysAdminGuard], component: CreateUserReComponent },
      { path: 'sysadmin/companies', canActivate: [SysAdminGuard], component: CompanyListComponent },
      { path: 'sysadmin/companies/new', canActivate: [SysAdminGuard], component: CreateCompanyComponent },
      { path: 'sysadmin/companies/edit/:id', canActivate: [SysAdminGuard], component: EditCompanyComponent },
      { path: 'sysadmin/companies/details/:id', canActivate: [SysAdminGuard], component: CompanyDetailsComponent },
      { path: 'sysadmin/companies/subscriptions/select', canActivate: [SysAdminGuard], component: SelectSubscriptionsComponent },
      { path: 'sysadmin/companies/subscription/:id', canActivate: [SysAdminGuard], component: AddSubscriptionComponent },
      { path: 'sysadmin/suppliers', canActivate: [SysAdminGuard], component: SuppliersListComponent },
      { path: 'sysadmin/suppliers/new/:id', canActivate: [SysAdminGuard], component: CreateSupplierComponent },
      { path: 'sysadmin/suppliers/edit/:id', canActivate: [SysAdminGuard], component: UpdateSuppliersComponent },
      { path: 'sysadmin/products', canActivate: [SysAdminGuard], component: ProductsListComponent },
      { path: 'sysadmin/product/new', canActivate: [SysAdminGuard], component: CreateProductComponent },
      { path: 'sysadmin/product/new/:id', canActivate: [SysAdminGuard], component: CreateProductComponent },
      { path: 'sysadmin/product/edit/:id', canActivate: [SysAdminGuard], component: UpdateProductComponent },
      { path: 'sysadmin/categories', canActivate: [SysAdminGuard], component: CategoriesListComponent },
      { path: 'sysadmin/edit-category/:id', canActivate: [SysAdminGuard], component: EditCategoryComponent },
      { path: 'sysadmin/categories/new/:id', canActivate: [SysAdminGuard], component: CreateCompanyCategoryComponent },
      //ADMIN
      { path: 'admin', canActivate: [AdminGuard], component: CompanyAdminHomeComponent },
      { path: 'admin/users', canActivate: [AdminGuard], component: UserListComponent },
      { path: 'admin/users/new', canActivate: [AdminGuard], component: CreateUserReComponent },
      { path: 'admin/users/edit/:id', canActivate: [AdminGuard], component: UserEditComponent },
      { path: 'admin/users/:userId/cajas', component: UserCajasComponent, canActivate: [AdminGuard] },
      { path: 'admin/users/:userId/cajas/:fecha', component: FechaCajasComponent, canActivate: [AdminGuard] },
      { path: 'admin/cajas/:cajaId', component: CajaDetailComponent, canActivate: [AdminGuard] },
      { path: 'admin/products', canActivate: [AdminGuard], component: ProductsListComponent },
      { path: 'admin/product/new', canActivate: [AdminGuard], component: CreateProductComponent },
      { path: 'admin/product/edit/:id', canActivate: [AdminGuard], component: UpdateProductComponent },
      { path: 'admin/suppliers', canActivate: [AdminGuard], component: SuppliersListComponent },
      { path: 'admin/suppliers/new/:id', canActivate: [AdminGuard], component: CreateSupplierComponent },
      { path: 'admin/suppliers/edit/:id', canActivate: [AdminGuard], component: UpdateSuppliersComponent },
      { path: 'admin/suppliers/details/:id', canActivate: [AdminGuard], component: SupplierDetailsComponent },
      { path: 'admin/categories', canActivate: [AdminGuard], component: CategoriesListComponent },
      { path: 'admin/edit-category/:id', canActivate: [AdminGuard], component: EditCategoryComponent },
      { path: 'admin/categories/new/:id', canActivate: [AdminGuard], component: CreateCompanyCategoryComponent },
      { path: 'admin/inventory', canActivate: [AdminGuard], component: InventoryStockListComponent },
      { path: 'admin/items', canActivate: [AdminGuard], component: InventoryStockListComponent },
      { path: 'admin/inventory/new', canActivate: [AdminGuard], component: AddInventoryComponent },
      { path: 'admin/inventory/update/:id', canActivate: [AdminGuard], component: UpdateInventoryComponent },
      { path: 'admin/inventory/transfers/new', canActivate: [AdminGuard], component: CreateStockTransferComponent },
      { path: 'admin/inventory/transfers', canActivate: [AdminGuard], component: StockTransferListComponent },
      { path: 'admin/recipes', canActivate: [AdminGuard], component: RecipeListComponent },
      { path: 'admin/recipes/new', canActivate: [AdminGuard], component: CreateRecipeComponent },
      { path: 'admin/recipes/edit/:id', canActivate: [AdminGuard], component: EditRecipeComponent },
      { path: 'admin/raw-materials', component: RawMaterialListComponent },
      { path: 'admin/ingredients', component: RawMaterialListComponent },
      { path: 'admin/raw-materials/new', component: CreateRawMaterialComponent },
      { path: 'admin/raw-materials/edit/:id', component: EditRawMaterialComponent },
      { path: 'admin/statistics', component: StatisticsComponent },
      { path: 'admin/manage-printers', component: ManagePrintersComponent },
      { path: 'admin/branches', canActivate: [AdminGuard], component: BranchListComponent },
      { path: 'admin/branches/new', canActivate: [AdminGuard], component: BranchFormComponent },
      { path: 'admin/branches/:id', canActivate: [AdminGuard], component: BranchAdminHomeComponent },
      { path: 'admin/branches/edit/:id', canActivate: [AdminGuard], component: BranchFormComponent },
      { path: 'branch', canActivate: [AdminGuard], component: BranchAdminHomeComponent },
      //USER
      { path: 'user', canActivate: [userGuard], component: UserHomeComponent },
      { path: 'user/new-sale', component: NewsaleComponent, canActivate: [AuthGuardGuard, userGuard] },
      { path: 'user/open-cash-register', component: OpenCashRegisterComponent, canActivate: [AuthGuardGuard, userGuard] },
      { path: 'user/new-sale/confirm-sale', component: ConfirmSaleComponent },
      { path: 'user/sales-success', component: SuccessSaleComponent },
      { path: 'user/sales-success/close-cash-register', component: CloseCashRegisterComponent },
      { path: 'user/daily-sales', component: DailySalesComponent, canActivate: [AuthGuardGuard, userGuard] },
      { path: 'user/sale-details/:saleId', component: SaleDetailComponent, canActivate: [AuthGuardGuard, userGuard] },
      { path: 'user/inventory-available', component: InventoryAvailableComponent, canActivate: [AuthGuardGuard, userGuard] },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class childrenPagesRouting { }
