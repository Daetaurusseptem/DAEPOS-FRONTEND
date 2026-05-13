import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioModel } from 'src/app/models/usuario.model';
import { AuthService } from 'src/app/services/auth.service';
import { MenuService } from 'src/app/services/menu.service';
import { SidebarService } from 'src/app/services/sidebar.service';

@Component({
  selector: 'app-dashboard-sidebar',
  templateUrl: './dashboard-sidebar.component.html',
  styleUrls: ['./dashboard-sidebar.component.css']
})
export class DashboardSidebarComponent implements OnInit {
  menuItems: any[] = [];
  usuario!: UsuarioModel;
  isCollapsed: boolean = true;

  constructor(
    private menuService: MenuService,
    private authService: AuthService,
    private router: Router,
    public sidebarService: SidebarService
  ) {
    this.usuario = this.authService.usuario;
  }

  ngOnInit(): void {
    this.menuItems = this.menuService.menu.map(item => ({...item, isOpen: false}));
    this.sidebarService.isCollapsed$.subscribe(collapsed => {
      this.isCollapsed = collapsed;
    });
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  toggleSubmenu(menuItem: any): void {
    menuItem.isOpen = !menuItem.isOpen;
  }

  logOut(): void {
    this.authService.borrarLocalStorage();
    this.router.navigateByUrl('login');
  }
}
