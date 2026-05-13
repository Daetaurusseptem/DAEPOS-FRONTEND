import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Category, Product, Supplier, User, Company, Recipe, InventoryItem } from 'src/app/interfaces/models.interface';
import { CompanyService } from 'src/app/services/company.service';
import { UsersService } from 'src/app/services/users.service';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { UsuarioModel } from 'src/app/models/usuario.model';
import { CategoryService } from 'src/app/services/category.service';
import { ProductService } from 'src/app/services/product.service';
import { InventoryService } from 'src/app/services/inventory.service';
import { ModalService } from 'src/app/services/modal.service';
import { SupplierService } from 'src/app/services/provider.service';
import { TabSelectedService } from 'src/app/service/tab-selected.service';

@Component({
  selector: 'app-company-admin-home',
  templateUrl: './company-admin-home.component.html',
  styleUrls: ['./company-admin-home.component.css']
})
export class CompanyAdminHomeComponent implements OnInit {
  items: InventoryItem[] = [];
  categories: Category[] = [];
  suppliers: Supplier[] = [];
  products: Product[] = [];
  users: User[] = [];
  recipes: Recipe[] = [];

  tabSelected: 'usuarios' | 'productos' | 'suscripciones' | 'proveedores' | 'categorias' | 'items' | 'recetas' | 'estadisticas' | 'inventario' = localStorage.getItem('tabSelected') as any;
  tabsArray = [
    { name: 'usuarios', icon: 'bi bi-people-fill' },
    { name: 'productos', icon: 'bi bi-bag-fill' },
    { name: 'inventario', icon: 'bi bi-box-fill' },
    { name: 'categorias', icon: 'bi bi-bag-fill' },
    { name: 'proveedores', icon: 'bi bi-file-earmark-person' },
    { name: 'estadisticas', icon: 'bi bi-bar-chart-fill' },
  ];

  company!: Company;
  admin!: UsuarioModel;
  id: string = '';

  constructor(
    private companyService: CompanyService,
    private userService: UsersService,
    private inventoryService: InventoryService,
    private categoryService: CategoryService,
    private suppliersService: SupplierService,
    private productService: ProductService,
    private authService: AuthService,
    private modalService: ModalService,
    private tabSelectedService: TabSelectedService
  ) { }

  ngOnInit(): void {
    if (localStorage.getItem('tabSelected') == null) {
      this.tabSelected = 'usuarios';
    }
    this.admin = this.authService.usuario;
    this.changeTab(this.tabSelected);
    this.getUsers();
    this.getAdminCompany(this.admin.id);
  }

  getAdminCompany(id: string) {
    return this.userService.getCompanyAdmin(id)
      .pipe(map(item => item.company))
      .subscribe(company => {
        this.company = company!;
      });
  }

  getCategories() {
    const companyId = this.authService.companyId || this.authService.company?._id;
    if (!companyId) return;
    this.categoryService.getCompanyCategories(companyId)
      .pipe(map(i => i.categories || []))
      .subscribe(categories => {
        this.categories = categories;
      });
  }

  getSuppliers() {
    const companyId = this.authService.companyId || this.authService.company?._id;
    if (!companyId) return;
    this.suppliersService.getCompanySuppliers(companyId)
      .pipe(map(i => i.suppliers || []))
      .subscribe(suppliers => {
        this.suppliers = suppliers;
      });
  }

  getUsers() {
    this.userService.getAllNonAdminUsersOfCompany(this.authService.usuario.id)
      .pipe(map(item => item.users || []))
      .subscribe(users => {
        this.users = users;
      });
  }

  getProducts(idEmpresa: string) {
    this.productService.getCompanyProducts(idEmpresa)
      .pipe(map(item => item.products || []))
      .subscribe(products => {
        this.products = products;
      });
  }

  getInventoryCompany(id: string) {
    this.inventoryService.getInventory(id)
      .pipe(map(item => item.items || []))
      .subscribe(items => {
        this.items = items;
      });
  }

  changeTab(tab: 'usuarios' | 'productos' | 'items' | 'suscripciones' | 'proveedores' | 'categorias' | 'inventario' | 'recetas' | 'estadisticas') {
    const companyId = this.authService.companyId || this.authService.company?._id || '';
    switch (tab) {
      case 'usuarios':
        this.tabSelectedService.updateTabSelected(tab);
        this.getUsers();
        break;
      case 'productos':
        this.tabSelectedService.updateTabSelected(tab);
        this.getProducts(companyId);
        break;
      case 'inventario':
        this.tabSelectedService.updateTabSelected(tab);
        this.getInventoryCompany(companyId);
        break;
      case 'proveedores':
        this.tabSelectedService.updateTabSelected(tab);
        this.getSuppliers();
        break;
      case 'categorias':
        this.tabSelectedService.updateTabSelected(tab);
        this.getCategories();
        break;
      default:
        break;
    }
    this.tabSelected = tab;
  }

  abrirModal(element: Company | User, tipo: 'empresas' | 'usuarios' | 'productos') {
    const { _id } = element;
    this.modalService.abrirModal(element.img, tipo, _id!);
  }
}
