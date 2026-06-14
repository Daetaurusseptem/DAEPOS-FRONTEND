import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from 'src/app/services/product.service';
import { AuthService } from 'src/app/services/auth.service';
import { Product } from 'src/app/interfaces/models.interface';
import { map } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'products-list',
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.css'],
})
export class ProductsListComponent implements OnInit {
  companyId: any;
  products!: Product[];
  companyName!: string;
  searchTerm$ = new Subject<string>();
  currentPage: number = 1;
  limit: number = 5;
  totalPages!: number;
  visiblePages: number[] = [];

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {
    if (this.authService.usuario.role == 'sysadmin') {
      this.activatedRoute.params.subscribe((params) => {
        this.companyId = params['id'];
      });
    } else if (this.authService.usuario.role == 'admin' || this.authService.usuario.role == 'companyAdmin') {
      this.companyId = this.authService.companyId;
    }
  }

  ngOnInit(): void {
    this.getProducts(this.companyId);
    this.initializeSearch();
  }

  getProducts(idEmpresa: string, page: number = 1): void {
    this.productService.searchProductCompany('', page, this.limit, idEmpresa).subscribe((response: any) => {
      this.products = response.products!;
      this.totalPages = response.totalPages!;
      this.currentPage = page;
      this.generateVisiblePages();
    });
  }

  buscarProducto(term: string): void {
    if (term.trim() === '') {
      // Si el campo de búsqueda está vacío, obtenemos todos los productos de nuevo
      this.getProducts(this.companyId);
    } else {
      // Llamamos al servicio de búsqueda
      this.productService.searchProductCompany(term, 1, this.limit, this.companyId).subscribe((response: any) => {
        this.products = response.products!;
        this.totalPages = response.totalPages!;
        this.currentPage = 1;
      });
    }
  }

  initializeSearch(): void {
    this.searchTerm$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((term) => {
      this.buscarProducto(term);
    });
  }

  crearProducto(): void {
    if (this.authService.usuario.role == 'sysadmin') {
      this.router.navigateByUrl(`/dashboard/sysadmin/product/new/${this.companyId}`);
    } else if (this.authService.usuario.role == 'admin' || this.authService.usuario.role == 'companyAdmin') {
      this.router.navigateByUrl(`/dashboard/admin/product/new`);
    }
  }

  eliminarProducto(id: string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el producto permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.productService.deleteProduct(id).subscribe(
          () => {
            this.products = this.products.filter((product) => product._id !== id);
            Swal.fire('Eliminado', 'El producto ha sido eliminado correctamente.', 'success');
          },
          (error: any) => {
            console.error('Error al eliminar producto', error);
            Swal.fire('Error', 'Hubo un problema al eliminar el producto.', 'error');
          },
        );
      }
    });
  }

  editarProducto(id: string): void {
    if (this.authService.usuario.role == 'sysadmin') {
      this.router.navigateByUrl(`/dashboard/sysadmin/product/edit/${id}/${this.companyId}`);
    } else if (this.authService.usuario.role == 'admin' || this.authService.usuario.role == 'companyAdmin') {
      this.router.navigateByUrl(`/dashboard/admin/product/edit/${id}`);
    }
  }

  cambiarPagina(pagina: number): void {
    if (pagina > 0 && pagina <= this.totalPages) {
      this.getProducts(this.companyId, pagina);
    }
  }

  generateVisiblePages(): void {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    this.visiblePages = pages;
  }

  showBulkImport = false;

  openBulkImport() {
    this.showBulkImport = true;
  }

  handleBulkImportClose(success: boolean) {
    this.showBulkImport = false;
    if (success) {
      this.getProducts(this.companyId, 1);
    }
  }
}
