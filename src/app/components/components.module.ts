import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { DashboardSidebarComponent } from './dashboard-sidebar/dashboard-sidebar.component';
import { ModalImgComponent } from './shared/img-modal/img-modal.component';
import { CreateUserReComponent } from './shared/create-user/create-user.component';
import { UserListComponent } from './shared/user-list/user-list.component';
import { SpinnerComponent } from './shared/loading-spinner/loading-spinner.component';
import { LoadingDataSpinnerComponent } from './shared/loading-data-spinner/loading-data-spinner.component';
import { InventoryListComponent } from './shared/inventory-list/inventory-list.component';
import { TabsMenuComponent } from './shared/tabs-menu/tabs-menu.component';
import { BackButtonComponent } from './shared/back-button/back-button.component';
import { AlphanumericKeyboardComponent } from './shared/alphanumeric-keyboard/alphanumeric-keyboard.component';
import { UserCajasComponent } from './user-cajas/user-cajas.component';

import { CajaDetailComponent } from './caja-detail/caja-detail.component';
import { BulkImportComponent } from './shared/bulk-import/bulk-import.component';
import { NotificationCenterComponent } from './notification-center/notification-center.component';

@NgModule({
  declarations: [
    NavbarComponent,
    FooterComponent,
    DashboardSidebarComponent,
    ModalImgComponent,
    CreateUserReComponent,
    UserListComponent,
    SpinnerComponent,
    LoadingDataSpinnerComponent,
    InventoryListComponent,
    TabsMenuComponent,
    BackButtonComponent,
    AlphanumericKeyboardComponent,
    UserCajasComponent,

    CajaDetailComponent,
    BulkImportComponent,
    NotificationCenterComponent,
  ],
  exports: [
    NavbarComponent,
    FooterComponent,
    DashboardSidebarComponent,
    ModalImgComponent,
    UserListComponent,
    SpinnerComponent,
    LoadingDataSpinnerComponent,
    CreateUserReComponent,
    InventoryListComponent,
    TabsMenuComponent,
    BackButtonComponent,
    AlphanumericKeyboardComponent,
    BulkImportComponent,

    NotificationCenterComponent,
  ],
  imports: [CommonModule, MatCardModule, MatToolbarModule, MatIconModule, FormsModule, ReactiveFormsModule, RouterLink],
})
export class ComponentsModule {}
