import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgChartsModule } from 'ng2-charts';

import { ComponentsModule } from 'src/app/components/components.module';
import { CreateCompanyUserComponent } from './users/create-company-user/create-company-user.component';
import { CompanyUsersComponent } from './users/company-users/company-users.component';
import { CreateCompanyCategoryComponent } from './Categories/create-company-catregory/create-company-category.component';
import { CategoriesListComponent } from './Categories/categories-list/categories-list.component';
import { InventoryStockListComponent } from './inventory/inventory-list/inventory-list.component';
import { CreateProductComponent } from './products/create-product/create-product.component';
import { CreateSupplierComponent } from './Suppliers/create-supplier/create-supplier.component';
import { UpdateProductComponent } from './products/update-product/update-product.component';
import { ProductsListComponent } from './products/products-list/products-list.component';
import { UpdateSuppliersComponent } from './Suppliers/update-suppliers/update-suppliers.component';
import { AddInventoryComponent } from './inventory/add-inventory/add-inventory.component';
import { SuppliersListComponent } from './Suppliers/suppliers-list/suppliers-list.component';
import { EditCategoryComponent } from './Categories/edit-category/edit-category.component';
import { RecipeListComponent } from './Recipes/recipe-list/recipe-list.component';
import { CreateRecipeComponent } from './Recipes/create-recipe/create-recipe.component';
import { EditRecipeComponent } from './Recipes/edit-recipe/edit-recipe.component';
import { UpdateInventoryComponent } from './inventory/update-inventory/update-inventory.component';
import { RawMaterialListComponent } from './raw-materials/raw-material-list/raw-material-list.component';
import { CreateRawMaterialComponent } from './raw-materials/create-raw-material/create-raw-material.component';
import { EditRawMaterialComponent } from './raw-materials/edit-raw-material/edit-raw-material.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { ManagePrintersComponent } from './manage-printers/manage-printers.component';
import { BranchListComponent } from './branches/branch-list/branch-list.component';
import { BranchFormComponent } from './branches/branch-form/branch-form.component';
import { BranchAdminHomeComponent } from './branch-admin-home/branch-admin-home.component';
import { CreateStockTransferComponent } from './inventory/transfers/create-transfer/create-transfer.component';
import { StockTransferListComponent } from './inventory/transfers/transfer-list/stock-transfer-list.component';
import { SupplierDetailsComponent } from './Suppliers/supplier-details/supplier-details.component';
import { CentralizedDeliveriesComponent } from './Suppliers/deliveries-hub/deliveries-hub.component';
import { CustomersListComponent } from './customers/customers-list.component';
import { PromotionsListComponent } from './promotions/promotions-list.component';
import { LiveRegistersComponent } from './live-registers/live-registers.component';
import { CajasHistorialComponent } from './cajas-historial/cajas-historial.component';
import { PendingVerificationsComponent } from './audits/pending-verifications/pending-verifications.component';

@NgModule({
  declarations: [
    CreateCompanyUserComponent,
    CompanyUsersComponent,
    CreateCompanyCategoryComponent,
    CategoriesListComponent,
    InventoryStockListComponent,
    CreateProductComponent,
    CreateSupplierComponent,
    UpdateProductComponent,
    ProductsListComponent,
    UpdateSuppliersComponent,
    AddInventoryComponent,
    SuppliersListComponent,
    EditCategoryComponent,
    RecipeListComponent,
    CreateRecipeComponent,
    EditRecipeComponent,
    UpdateInventoryComponent,
    RawMaterialListComponent,
    CreateRawMaterialComponent,
    EditRawMaterialComponent,
    StatisticsComponent,
    ManagePrintersComponent,
    BranchListComponent,
    BranchFormComponent,
    BranchAdminHomeComponent,
    CreateStockTransferComponent,
    StockTransferListComponent,
    SupplierDetailsComponent,
    CentralizedDeliveriesComponent,
    CustomersListComponent,
    PromotionsListComponent,
    LiveRegistersComponent,
    CajasHistorialComponent,
    PendingVerificationsComponent,
  ],
  exports: [
    InventoryStockListComponent,
    ProductsListComponent,
    CategoriesListComponent,
    SuppliersListComponent,
    SupplierDetailsComponent,
    CentralizedDeliveriesComponent,
    UpdateInventoryComponent,
    StatisticsComponent,
    BranchAdminHomeComponent,
    CustomersListComponent,
    PromotionsListComponent,
    LiveRegistersComponent,
    CajasHistorialComponent,
  ],
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    ComponentsModule,
    NgxPaginationModule,
    NgSelectModule,
    NgChartsModule,
  ],
})
export class AdminToolsModule {}
