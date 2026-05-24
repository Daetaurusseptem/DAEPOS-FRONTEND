import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Branch, InventoryItem, Product, UserRole } from 'src/app/interfaces/models.interface';
import { InventoryService } from 'src/app/services/inventory.service';
import { AuthService } from 'src/app/services/auth.service';
import { BranchService } from 'src/app/services/branch.service';
import { SupplierService } from 'src/app/services/provider.service';
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
  itemType: 'product' | 'raw_material' = 'product';
  defaultSupplierId: string = '';

  // Filtros y ordenamiento
  stockFilter: 'all' | 'low' | 'normal' = 'all';
  stockSortDirection: 'none' | 'asc' | 'desc' = 'none';

  toggleStockSort(): void {
    if (this.stockSortDirection === 'none') {
      this.stockSortDirection = 'asc';
    } else if (this.stockSortDirection === 'asc') {
      this.stockSortDirection = 'desc';
    } else {
      this.stockSortDirection = 'none';
    }
  }

  get displayedItems(): InventoryItem[] {
    let filtered = [...this.items];

    // 1. Filtrado por Stock
    if (this.stockFilter === 'low') {
      filtered = filtered.filter(item => item.stock < 10);
    } else if (this.stockFilter === 'normal') {
      filtered = filtered.filter(item => item.stock >= 10);
    }

    // 2. Ordenamiento por Stock
    if (this.stockSortDirection === 'asc') {
      filtered.sort((a, b) => a.stock - b.stock);
    } else if (this.stockSortDirection === 'desc') {
      filtered.sort((a, b) => b.stock - a.stock);
    }

    return filtered;
  }

  constructor(
    private inventoryService: InventoryService,
    private authService: AuthService,
    private branchService: BranchService,
    private router: Router,
    private supplierService: SupplierService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.userRole = this.authService.role;

    // Detectar si redirige con auto-filtro de stock bajo desde el Dashboard
    this.route.queryParams.subscribe(params => {
      if (params['filter'] === 'low') {
        this.stockFilter = 'low';
      }
    });

    this.loadItems();
    if (this.userRole === 'companyAdmin' || this.userRole === 'admin') {
      this.getBranches();
      this.loadCompanySuppliers();
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

    this.inventoryService.getInventory(companyId, this.searchTerm, this.itemType, branchId).subscribe({
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

  setItemType(type: 'product' | 'raw_material'): void {
    this.itemType = type;
    this.currentPage = 1;
    this.loadItems();
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

  loadCompanySuppliers() {
    const companyId = this.authService.companyId || this.authService.company?._id;
    if (!companyId) return;
    this.supplierService.getCompanySuppliers(companyId).subscribe({
      next: (resp) => {
        if (resp.ok && resp.suppliers && resp.suppliers.length > 0) {
          this.defaultSupplierId = resp.suppliers[0]._id;
        }
      }
    });
  }

  adjustStock(item: InventoryItem) {
    if (!item || !item._id) return;
    const companyId = this.authService.companyId || this.authService.company?._id;
    if (!companyId) return;

    Swal.fire({
      title: 'Entrada Rápida / Reabastecer',
      html: `
        <div class="text-start mb-3">
          <label class="form-label fw-bold text-secondary small mb-1">Producto / Insumo</label>
          <div class="p-2 bg-light rounded border text-dark fw-bold">${item.name}</div>
        </div>
        <div class="row g-2 mb-3 text-start">
          <div class="col-6">
            <label class="form-label fw-bold text-secondary small mb-1">Stock Actual</label>
            <div class="p-2 bg-light rounded border text-center font-mono fw-bold">${item.stock} ${item.measurement || 'U'}</div>
          </div>
          <div class="col-6">
            <label class="form-label fw-bold text-secondary small mb-1">Stock a Sumar</label>
            <input type="number" id="swal-input-qty" class="form-control text-center font-mono fw-bold" placeholder="Ej. 10" min="1" style="height: 38px;">
          </div>
        </div>
        <div class="text-start mb-3">
          <label class="form-label fw-bold text-secondary small mb-1">Costo Unitario ($)</label>
          <input type="number" id="swal-input-cost" class="form-control font-mono" placeholder="Ej. 15.50" value="${item.costPrice || ''}" step="0.01" style="height: 38px;">
          <small class="text-muted" style="font-size: 0.75rem;">Se utilizará para calcular el costo promedio ponderado.</small>
        </div>
        <div class="text-start mb-2">
          <label class="form-label fw-bold text-secondary small mb-1">Condición / Concepto</label>
          <select id="swal-input-reason" class="form-select" style="height: 38px;">
            <option value="Compra Directa (Caja Chica)">Compra directa del dueño (Caja Chica)</option>
            <option value="Conteo Físico (Inventario)">Ajuste por conteo físico (Inventario)</option>
            <option value="Devolución de Cliente">Devolución de cliente</option>
            <option value="Proveedor Local (Informal)">Proveedor local (Sin orden formal)</option>
            <option value="Otros Motivos">Otros motivos</option>
          </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Confirmar Reabastecimiento',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0f172a',
      cancelButtonColor: '#6c757d',
      preConfirm: () => {
        const qtyInput = document.getElementById('swal-input-qty') as HTMLInputElement;
        const costInput = document.getElementById('swal-input-cost') as HTMLInputElement;
        const reasonInput = document.getElementById('swal-input-reason') as HTMLSelectElement;
        
        const qty = parseInt(qtyInput.value, 10);
        const costPrice = parseFloat(costInput.value);
        const reason = reasonInput.value;

        if (isNaN(qty) || qty <= 0) {
          Swal.showValidationMessage('Por favor ingresa una cantidad a sumar válida (mínimo 1)');
          return false;
        }
        if (isNaN(costPrice) || costPrice < 0) {
          Swal.showValidationMessage('Por favor ingresa un costo unitario válido');
          return false;
        }
        return { qty, costPrice, reason };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const { qty, costPrice, reason } = result.value;
        const userName = this.authService.usuario?.name || this.authService.usuario?.username || 'Administrador';

        Swal.fire({
          title: 'Registrando entrada...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // 1. Crear Agenda de Reabastecimiento con Estatus 'pending'
        const restockData = {
          company: companyId,
          supplier: (item.supplier as any)?._id || item.supplier || this.defaultSupplierId,
          branch: (item.branch as any)?._id || item.branch,
          expectedDate: new Date(),
          itemsSummary: `Ajuste Rápido: +${qty} unidades de ${item.name}`,
          status: 'pending',
          notes: `Reabastecimiento directo registrado por ${userName} (Rol: ${this.userRole}) bajo condiciones: "${reason}".`,
          isRecurring: false,
          recurrence: 'none',
          items: [{
            type: item.product ? 'Product' : 'RawMaterial',
            itemRef: (item.product as any)?._id || item.product || (item.rawMaterial as any)?._id || item.rawMaterial,
            quantity: qty,
            costPrice: costPrice
          }]
        };

        this.supplierService.createRestockSchedule(restockData).subscribe({
          next: (createResp: any) => {
            if (createResp.ok && createResp.restock?._id) {
              // 2. Auto-completar el reabastecimiento para gatillar la lógica del backend (weighted average cost y suma de stock)
              this.supplierService.updateRestockStatus(createResp.restock._id, { status: 'completed' }).subscribe({
                next: (updateResp) => {
                  if (updateResp.ok) {
                    Swal.fire({
                      title: '¡Reabastecimiento Exitoso!',
                      text: `Se añadieron +${qty} unidades al stock de "${item.name}" con éxito.`,
                      icon: 'success',
                      confirmButtonColor: '#0f172a'
                    });
                    this.loadItems();
                  } else {
                    Swal.fire('Error', 'No se pudo completar la carga del stock en el servidor', 'error');
                  }
                },
                error: (err) => {
                  Swal.fire('Error', err.error?.message || 'Error completando el stock', 'error');
                }
              });
            } else {
              Swal.fire('Error', 'No se pudo crear la orden de reabastecimiento', 'error');
            }
          },
          error: (err) => {
            Swal.fire('Error', err.error?.message || 'Error en el servidor al generar la orden', 'error');
          }
        });
      }
    });
  }
}
