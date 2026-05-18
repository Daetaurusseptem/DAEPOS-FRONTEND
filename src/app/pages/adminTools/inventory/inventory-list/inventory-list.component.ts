import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Branch, InventoryItem, Product, UserRole } from 'src/app/interfaces/models.interface';
import { InventoryService } from 'src/app/services/inventory.service';
import { AuthService } from 'src/app/services/auth.service';
import { BranchService } from 'src/app/services/branch.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-inventory-stock-list',
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.css']
})
export class InventoryStockListComponent implements OnInit {
  items: InventoryItem[] = [];
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  searchTerm: string = '';
  visiblePages: number[] = [];
  branches: Branch[] = [];
  selectedBranchId: string = '';
  userRole!: UserRole;

  constructor(
    private inventoryService: InventoryService,
    private authService: AuthService,
    private branchService: BranchService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.userRole = this.authService.role;
    this.loadItems();
    if (this.userRole === 'companyAdmin' || this.userRole === 'admin') {
      this.getBranches();
    }
  }

  getBranches() {
    const companyId = this.authService.companyId || this.authService.company?._id;
    if (!companyId) return;

    this.branchService.getBranchesByCompany(companyId).subscribe({
      next: (resp) => {
        if (resp.ok) {
          this.branches = resp.branches;
        }
      }
    });
  }

  loadItems(): void {
    const companyId = this.authService.companyId || this.authService.company?._id;
    if (!companyId) return;

    let branchId = this.selectedBranchId;
    if (!branchId && this.userRole === 'admin') {
       branchId = this.authService.branch?._id || this.authService.branch;
    }

    this.inventoryService.getInventory(companyId, this.searchTerm, 'product', branchId).subscribe({
      next: (data) => {
        this.items = data.items || [];
        this.totalItems = data.totalItems as number || 0; 
        this.totalPages = data.totalPages || 1;
        this.currentPage = data.currentPage || 1;
        this.generateVisiblePages();
      },
      error: (error) => {
        console.error('Error al obtener items:', error);
      }
    });
  }

  cambiarPagina(pagina: number): void {
    if (pagina > 0 && (this.totalPages === 0 || pagina <= this.totalPages)) {
      this.currentPage = pagina;
      this.loadItems();
    }
  }

  crearItem() {
    this.router.navigate(['/dashboard/admin/inventory/new']);
  }

  asProduct(product: any): Product {
    return product as Product;
  }

  deleteItem(idItem: string | undefined) {
    if (!idItem) return;
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esto eliminará definitivamente el stock seleccionado',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then((res) => {
      if (res.isConfirmed) {
        this.inventoryService.deleteInventoryItem(idItem).subscribe({
          next: (response) => {
            if (response.ok === true) {
              this.items = this.items.filter(item => item._id !== idItem);
              Swal.fire('Eliminado', 'Registro eliminado', 'success');
              this.loadItems();
            }
          },
          error: (error) => {
            console.error('Error eliminando item:', error);
          }
        });
      }
    });
  }

  generateVisiblePages(): void {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    this.visiblePages = pages;
  }
}
