import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { Category, Product, Supplier, User, Company, InventoryItem } from 'src/app/interfaces/models.interface';
import { CompanyService } from 'src/app/services/company.service';
import { UsersService } from 'src/app/services/users.service';
import { AuthService } from 'src/app/services/auth.service';
import { ProductService } from 'src/app/services/product.service';
import { SupplierService } from 'src/app/services/provider.service';
import { CategoryService } from 'src/app/services/category.service';
import { ModalService } from 'src/app/services/modal.service';
import { InventoryService } from 'src/app/services/inventory.service';
import Swal from 'sweetalert2';
import { TabSelectedService } from 'src/app/service/tab-selected.service';

@Component({
  selector: 'app-company-details',
  templateUrl: './company-details.component.html',
  styleUrls: ['./company-details.component.css']
})
export class CompanyDetailsComponent implements OnInit {
  items: InventoryItem[] = [];
  company!: Company;
  admin!: User;
  id: string = '';
  users: User[] = [];
  products: Product[] = [];
  suppliers: Supplier[] = [];
  categories: Category[] = [];
  totalItems: number = 0;
  currentPage: number = 1;
  adminId: string = '';
  userRole!: 'admin' | 'sysadmin' | 'user';

  itemsPerPage: number = 10;
  searchTerm: string = '';
  tabSelected: 'usuarios' | 'productos' | 'suscripciones' | 'proveedores' | 'categorias' | 'inventario' = localStorage.getItem('tabSelected') as any || 'usuarios';
  
  tabsArray = [
    { name: 'usuarios', icon: 'bi bi-people-fill' },
    { name: 'productos', icon: 'bi bi-bag-fill' },
    { name: 'inventario', icon: 'bi bi-box-fill' },
    { name: 'categorias', icon: 'bi bi-bag-fill' },
    { name: 'proveedores', icon: 'bi bi-file-earmark-person' },
    { name: 'suscripciones', icon: 'bi bi-card-checklist' }
  ];

  constructor(
    private companyService: CompanyService,
    private userService: UsersService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private productService: ProductService,
    private suppliersService: SupplierService,
    private categoryService: CategoryService,
    private modalService: ModalService,
    private inventoryService: InventoryService,
    private tabSelectedService: TabSelectedService
  ) {
    this.adminId = this.authService.idUsuario;
    this.userRole = this.authService.role;
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {  
      this.id = params['id'];
      if (this.id) {
        this.getCompany(this.id);
        this.getUsers();
        this.getInventoryCompany();
      }
    });
  }

  getCompany(id: string) {
    return this.companyService.getCompany(id)
      .pipe(map(item => item.company))
      .subscribe(company => {
        this.company = company!;
        if (company?.adminId) {
          this.getAdmin(company.adminId);
        }
      });
  }

  getAdmin(adminId: string) {
    this.userService.getUserById(adminId)
      .pipe(map(item => item.user))
      .subscribe(adminCompany => {
        this.admin = adminCompany!;
      });
  }

  changeTab(tab: any) {
    this.tabSelected = tab;
    this.tabSelectedService.updateTabSelected(tab);
    
    switch (tab) {
      case 'usuarios':
        this.getUsers();
        break;
      case 'productos':
        this.getProducts(this.id);
        break;
      case 'inventario':
        this.getInventoryCompany();
        break;
      case 'proveedores':
        this.getSuppliers(this.id);
        break;
      case 'categorias':
        this.getCategories(this.id);
        break;
    }
  }

  getUsers() {
    this.userService.getAllUsersOfCompany(this.id)
      .pipe(map(item => item.users || []))
      .subscribe(users => {
        this.users = users;
      });
  }

  getProducts(idEmpresa: string) {
    this.productService.getCompanyProductsSysadmin(idEmpresa)
      .pipe(map(item => item.products || []))
      .subscribe(products => {
        this.products = products;
      });
  }

  getSuppliers(idEmpresa: string) {
    this.suppliersService.getCompanySuppliers(idEmpresa)
      .pipe(map(i => i.suppliers || []))
      .subscribe(suppliers => {
        this.suppliers = suppliers;
      });
  }

  getCategories(idEmpresa: string) {
    this.categoryService.getCompanyCategories(idEmpresa)
      .pipe(map(i => i.categories || []))
      .subscribe(categories => {
        this.categories = categories;
      });
  }

  getInventoryCompany() {
    this.inventoryService.getInventory(this.id, this.searchTerm)
      .pipe(map(item => item.items || []))
      .subscribe(items => {
        this.items = items;
      });
  }

  deleteItem(idItem: string | undefined) {
    if (!idItem) return;

    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esto eliminará definitivamente el stock seleccionado',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    })
    .then(res => {
      if (res.isConfirmed) {
        this.inventoryService.deleteInventoryItem(idItem)
          .subscribe({
            next: () => {
              Swal.fire('Eliminado', 'Registro eliminado', 'success');
              this.getInventoryCompany();
            },
            error: (err) => {
              console.error('Error deleting item', err);
              Swal.fire('Error', 'No se pudo eliminar el item', 'error');
            }
          });
      }
    });
  }

  asProduct(product: any): Product {
    return product as Product;
  }

  abrirModal(element: Company | User | Product, tipo: 'empresas' | 'usuarios' | 'productos') {
    const { _id, img } = element as any;
    this.modalService.abrirModal(img, tipo, _id!);
  }

  pageChanged(event: any): void {
    this.currentPage = event;
    this.getInventoryCompany();
  }

  editItem() {
    // Implement edit logic if needed
  }
}
