import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Branch, InventoryItem, Product, UserRole } from 'src/app/interfaces/models.interface';
import { InventoryService } from 'src/app/services/inventory.service';
import { AuthService } from 'src/app/services/auth.service';
import { BranchService } from 'src/app/services/branch.service';
import { SupplierService } from 'src/app/services/provider.service';
import { ProductService } from 'src/app/services/product.service';
import { RawMaterialsService } from 'src/app/services/raw-materials.service';
import { forkJoin } from 'rxjs';
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
  systemSupplierId: string = '';
  suppliersList: any[] = [];

  // Datos para Entregas y Recepción Rápida
  companyId: string = '';
  pendingDeliveries: any[] = [];
  suppliers: any[] = [];
  allCompanyProducts: any[] = [];
  
  showUnplannedRestockModal: boolean = false;
  unplannedRestock: { supplier: string; notes: string; payFromRegister: boolean } = { supplier: '', notes: '', payFromRegister: true };
  unplannedItems: any[] = [];
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
    private productsService: ProductService,
    private rawMaterialsService: RawMaterialsService,
    private route: ActivatedRoute,
  ) {
    this.companyId = (this.authService.usuario?.company as any)?._id || (this.authService.usuario?.company as any) || '';
  }

  ngOnInit(): void {
    this.userRole = this.authService.role;

    // Detectar si redirige con auto-filtro de stock bajo desde el Dashboard
    this.route.queryParams.subscribe(params => {
      if (params['filter'] === 'low') {
        this.stockFilter = 'low';
      }
    });

    this.loadItems();
    if (this.companyId) {
      this.loadPendingDeliveries();
      this.loadInitialData();
    }
    if (this.userRole === 'companyAdmin' || this.userRole === 'admin') {
      this.getBranches();
      this.loadCompanySuppliers();
    }
  }

  loadPendingDeliveries() {
    this.supplierService.getCompanyRestocks(this.companyId).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          const today = new Date().toISOString().split('T')[0];
          this.pendingDeliveries = resp.restocks.filter((r: any) => {
            const expDate = new Date(r.expectedDate).toISOString().split('T')[0];
            const branchMatch = this.userRole === 'companyAdmin' ? true : r.branch?._id === this.selectedBranchId;
            return r.status === 'pending' && branchMatch && expDate <= today;
          });
        }
      }
    });
  }

  loadInitialData() {
    forkJoin({
      suppliers: this.supplierService.getCompanySuppliers(this.companyId),
      products: this.productsService.getCompanyProducts(this.companyId),
      materials: this.rawMaterialsService.getCompanyRawMaterials(this.companyId)
    }).subscribe({
      next: (res: any) => {
        this.suppliers = res.suppliers?.suppliers || [];
        const prods = (res.products?.products || []).map((p: any) => ({ ...p, itemType: 'Product' }));
        const mats = (res.materials?.rawMaterials || []).map((m: any) => ({ ...m, itemType: 'RawMaterial' }));
        this.allCompanyProducts = [...prods, ...mats];
      }
    });
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
    if (item.product && (item.product as any).isComposite) {
      this.restockCompositeProduct(item);
      return;
    }
    const companyId = this.authService.companyId || this.authService.company?._id;
    if (!companyId) return;

    const currentSupplierId = (item.supplier as any)?._id || item.supplier;
    const currentSupplierName = this.suppliersList.find(s => s._id === currentSupplierId)?.name || '';
    
    // Generar opciones de proveedores para la lista desplegable personalizada
    let supplierOptionsHtml = '';
    let hasRealSuppliers = false;
    this.suppliersList.forEach(supplier => {
      if (supplier.name !== 'Ajustes Internos de Sistema') {
        supplierOptionsHtml += `<li class="list-group-item list-group-item-action py-2 px-2" style="font-size:0.85rem;" data-id="${supplier._id}">${supplier.name}</li>`;
        hasRealSuppliers = true;
      }
    });

    if (!hasRealSuppliers) {
      supplierOptionsHtml = `<li class="list-group-item text-muted py-2 px-2 bg-light disabled" style="font-size:0.85rem;">No tienes proveedores oficiales registrados.<br><b>Escribe el nombre de tu proveedor informal en el campo.</b></li>`;
    }

    Swal.fire({
      title: 'Entrada Rápida / Reabastecer',
      customClass: {
        htmlContainer: 'overflow-visible' // Clase para permitir que el dropdown sobresalga
      },
      html: `
        <style>
          .swal2-html-container { overflow: visible !important; }
        </style>
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
          <label class="form-label fw-bold text-secondary small mb-1">Proveedor / Origen (Buscar...)</label>
          <div class="position-relative">
            <input type="text" id="swal-input-supplier-search" class="form-control" placeholder="Busca un proveedor oficial o escribe uno informal..." value="${currentSupplierName}" autocomplete="off" style="height: 38px;">
            <ul id="swal-supplier-dropdown" class="list-group position-absolute w-100 shadow-sm" style="display: none; max-height: 150px; overflow-y: auto; z-index: 9999; cursor: pointer; border-radius: 0 0 4px 4px;">
              ${supplierOptionsHtml}
            </ul>
          </div>
          <small class="text-muted" style="font-size: 0.75rem;">Si no está en la lista, simplemente escribe su nombre.</small>
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
      didOpen: () => {
        const searchInput = document.getElementById('swal-input-supplier-search') as HTMLInputElement;
        const dropdown = document.getElementById('swal-supplier-dropdown') as HTMLUListElement;
        const items = dropdown.querySelectorAll('.list-group-item-action');

        // Mostrar lista al enfocar o hacer click
        searchInput.addEventListener('focus', () => {
          dropdown.style.display = 'block';
        });
        searchInput.addEventListener('click', () => {
          dropdown.style.display = 'block';
        });

        // Filtrar lista al escribir
        searchInput.addEventListener('input', (e: any) => {
          const filter = e.target.value.toLowerCase();
          dropdown.style.display = 'block';
          items.forEach((item: any) => {
            const text = item.textContent?.toLowerCase() || '';
            if (text.includes(filter)) {
              item.style.display = 'block';
            } else {
              item.style.display = 'none';
            }
          });
        });

        // Seleccionar item
        items.forEach((item: any) => {
          item.addEventListener('click', () => {
            searchInput.value = item.textContent || '';
            dropdown.style.display = 'none';
          });
        });

        // Cerrar al clickear fuera
        document.addEventListener('click', (e: any) => {
          if (e.target !== searchInput && e.target !== dropdown) {
            dropdown.style.display = 'none';
          }
        });
      },
      preConfirm: () => {
        const qtyInput = document.getElementById('swal-input-qty') as HTMLInputElement;
        const costInput = document.getElementById('swal-input-cost') as HTMLInputElement;
        const reasonInput = document.getElementById('swal-input-reason') as HTMLSelectElement;
        const supplierSearchInput = document.getElementById('swal-input-supplier-search') as HTMLInputElement;
        
        const qty = parseInt(qtyInput.value, 10);
        const costPrice = parseFloat(costInput.value);
        const reason = reasonInput.value;
        const typedSupplier = supplierSearchInput.value.trim();

        if (isNaN(qty) || qty <= 0) {
          Swal.showValidationMessage('Por favor ingresa una cantidad a sumar válida (mínimo 1)');
          return false;
        }
        if (isNaN(costPrice) || costPrice < 0) {
          Swal.showValidationMessage('Por favor ingresa un costo unitario válido');
          return false;
        }
        if (!typedSupplier) {
          Swal.showValidationMessage('El proveedor o referencia es obligatorio');
          return false;
        }
        
        const officialSupplier = this.suppliersList.find(s => s.name.toLowerCase() === typedSupplier.toLowerCase());
        let supplierId = 'informal';
        let informalName = '';

        if (officialSupplier) {
           supplierId = officialSupplier._id;
        } else {
           supplierId = 'informal';
           informalName = typedSupplier;
        }
        
        return { qty, costPrice, reason, supplierId, informalName };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const { qty, costPrice, reason, supplierId, informalName } = result.value;
        const userName = this.authService.usuario?.name || this.authService.usuario?.username || 'Administrador';

        Swal.fire({
          title: 'Registrando entrada...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // 1. Crear Agenda de Reabastecimiento con Estatus 'pending'
        let targetSupplierId = supplierId;
        let summaryPrefix = 'Ajuste Rápido';
        let detailNote = '';

        if (supplierId === 'informal') {
          targetSupplierId = this.systemSupplierId || this.defaultSupplierId || (this.suppliersList.length > 0 ? this.suppliersList[0]._id : undefined);
          summaryPrefix = `[Informal: ${informalName}]`;
          detailNote = `Proveedor informal o referencia: ${informalName}. `;
        }

        const restockData = {
          company: companyId,
          supplier: targetSupplierId,
          branch: (item.branch as any)?._id || item.branch,
          expectedDate: new Date(),
          itemsSummary: `${summaryPrefix} +${qty} unidades de ${item.name}`,
          status: 'pending',
          notes: `${detailNote}Reabastecimiento directo registrado por ${userName} (Rol: ${this.userRole}) bajo condiciones: "${reason}".`,
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
              // 2. Auto-completar el reabastecimiento para gatillar la lógica del backend
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
                error: (err) => Swal.fire('Error', err.error?.message || 'Error completando el stock', 'error')
              });
            } else {
              Swal.fire('Error', 'No se pudo crear la orden de reabastecimiento', 'error');
            }
          },
          error: (err) => Swal.fire('Error', err.error?.message || 'Error en el servidor al generar la orden', 'error')
        });
      }
    });
  }

  restockCompositeProduct(item: InventoryItem) {
    const productId = (item.product as any)?._id || item.product;
    const branchId = (item.branch as any)?._id || item.branch || this.authService.branch?._id || this.authService.branch;
    const companyId = this.authService.companyId || this.authService.company?._id;
    
    if (!productId || !branchId) return;

    Swal.fire({
      title: 'Consultando Insumos...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.inventoryService.getRecipeStockDetails(productId, branchId).subscribe({
      next: (resp: any) => {
        if (resp.ok && resp.ingredients) {
          Swal.close();
          const missingIngredients = resp.ingredients.filter((i: any) => i.currentStock <= 0);
          
          if (missingIngredients.length === 0) {
            Swal.fire('Todo en orden', 'Este producto tiene insumos suficientes, o la receta no fue encontrada.', 'info');
            return;
          }

          let formHtml = `<div class="text-start mb-3">
              <label class="form-label fw-bold text-secondary small mb-1">Producto</label>
              <div class="p-2 bg-light rounded border text-dark fw-bold">${item.name}</div>
            </div>
            <p class="small text-muted text-start mb-3">Ingresa la cantidad a recargar (Caja Chica) para cada insumo agotado. Deja en 0 los que no desees recargar.</p>
            <div class="table-responsive text-start">
              <table class="table table-sm align-middle">
                <thead>
                  <tr class="fs-8 text-muted uppercase">
                    <th>Insumo</th>
                    <th width="100">Stock</th>
                    <th width="120">Añadir</th>
                  </tr>
                </thead>
                <tbody>`;

          missingIngredients.forEach((ing: any, i: number) => {
            formHtml += `<tr>
                <td class="fw-bold fs-7">${ing.name} <br><small class="text-muted fw-normal">(${ing.measurementUnit})</small></td>
                <td class="text-danger fw-bold font-monospace">${ing.currentStock}</td>
                <td><input type="number" id="restock-qty-${i}" class="form-control form-control-sm text-center fw-bold" min="0" value="0"></td>
              </tr>`;
          });

          formHtml += `</tbody></table></div>`;

          Swal.fire({
            title: 'Recarga Exprés de Insumos',
            html: formHtml,
            showCancelButton: true,
            confirmButtonText: 'Confirmar Recarga',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#0f172a',
            preConfirm: () => {
              const itemsToRestock: any[] = [];
              missingIngredients.forEach((ing: any, i: number) => {
                const qtyInput = document.getElementById(`restock-qty-${i}`) as HTMLInputElement;
                const qty = parseFloat(qtyInput.value);
                if (qty > 0) {
                  itemsToRestock.push({
                    type: 'RawMaterial',
                    itemRef: ing.rawMaterialId,
                    quantity: qty,
                    costPrice: 0
                  });
                }
              });

              if (itemsToRestock.length === 0) {
                Swal.showValidationMessage('No ingresaste cantidades para recargar.');
                return false;
              }
              return itemsToRestock;
            }
          }).then((result) => {
            if (result.isConfirmed && result.value) {
              const itemsToRestock = result.value;
              this.processMultipleRestock(itemsToRestock, item.name, companyId!, branchId);
            }
          });
        }
      },
      error: () => {
        Swal.fire('Error', 'No se pudieron consultar los insumos de este producto.', 'error');
      }
    });
  }

  processMultipleRestock(itemsToRestock: any[], productName: string, companyId: string, branchId: string) {
    const userName = this.authService.usuario?.name || this.authService.usuario?.username || 'Sistema';
    const targetSupplierId = this.systemSupplierId || this.defaultSupplierId || (this.suppliersList.length > 0 ? this.suppliersList[0]._id : undefined);

    if (!targetSupplierId) {
      Swal.fire('Error', 'No hay un proveedor de sistema configurado.', 'error');
      return;
    }

    Swal.fire({
      title: 'Procesando recarga...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const restockData = {
      company: companyId,
      supplier: targetSupplierId,
      branch: branchId,
      expectedDate: new Date(),
      itemsSummary: `Ajuste Rápido de ${itemsToRestock.length} insumo(s) para la receta de ${productName}`,
      status: 'pending',
      notes: `Reabastecimiento directo exprés registrado por ${userName} (Caja Chica).`,
      isRecurring: false,
      recurrence: 'none',
      items: itemsToRestock
    };

    this.supplierService.createRestockSchedule(restockData).subscribe({
      next: (createResp: any) => {
        if (createResp.ok && createResp.restock?._id) {
          this.supplierService.updateRestockStatus(createResp.restock._id, { status: 'completed' }).subscribe({
            next: (updateResp) => {
              if (updateResp.ok) {
                Swal.fire('¡Éxito!', 'Los insumos han sido reabastecidos correctamente.', 'success');
                this.loadItems();
              } else {
                Swal.fire('Error', 'No se pudo completar el ajuste de stock.', 'error');
              }
            },
            error: () => Swal.fire('Error', 'Error completando el stock', 'error')
          });
        }
      },
      error: () => Swal.fire('Error', 'No se pudo generar el reabastecimiento en el servidor.', 'error')
    });
  }

  // ---- MÉTODOS DE RECEPCIÓN Y ENTREGAS (COPIADOS DE USER-HOME / NEWSALE) ----

  inspectScheduledDelivery() {
    if (this.pendingDeliveries.length === 0) {
      Swal.fire('Sin Entregas', 'No hay entregas programadas pendientes para el día de hoy en la sucursal actual.', 'info');
      return;
    }
    const restock = this.pendingDeliveries[0];
    this.openSweetAlertInspect(restock);
  }

  openSweetAlertInspect(restock: any) {
    const itemsToInspect = restock.items || [];
    const sName = typeof restock.supplier === 'object' ? restock.supplier?.name : 'Proveedor';

    let formHtml = `<div class="text-start mb-3">
        <label class="form-label fw-bold text-secondary small mb-1">Recibiendo de</label>
        <div class="p-2 bg-light rounded border text-dark fw-bold">${sName}</div>
      </div>
      <p class="small text-muted text-start mb-3">Por favor, audita las cantidades físicas recibidas de cada insumo antes de completar la entrada.</p>
      <div class="table-responsive text-start" style="max-height: 250px; overflow-y: auto;">
        <table class="table table-sm align-middle">
          <thead style="position: sticky; top: 0; background: white; z-index: 1;">
            <tr class="fs-8 text-muted uppercase">
              <th>Insumo</th>
              <th width="100">Esperado</th>
              <th width="160" class="text-end">Recibido</th>
            </tr>
          </thead>
          <tbody>`;

    itemsToInspect.forEach((it: any, i: number) => {
      const pName = typeof it.itemRef === 'object' ? it.itemRef?.name : 'Insumo';
      const expectedQty = it.quantity || 0;
      formHtml += `<tr>
          <td class="fw-bold fs-7" style="vertical-align: middle;">${pName}</td>
          <td class="text-muted fw-bold font-monospace" style="vertical-align: middle;">${expectedQty}</td>
          <td>
            <div class="d-flex flex-column gap-1 align-items-end">
              <div class="d-flex align-items-center gap-0 bg-light px-1 py-0.5 rounded-pill border border-light-subtle">
                <input type="number" class="form-control form-control-sm text-center border-0 bg-transparent px-0" style="width: 45px; font-size: 0.75rem; font-weight: 600;" placeholder="Cjs" oninput="let p=this.value; let u=this.nextElementSibling.nextElementSibling.value; if(p&&u) document.getElementById('inspect-qty-${i}').value=p*u;">
                <span class="text-muted fw-bold mx-1" style="font-size: 0.7rem;">✕</span>
                <input type="number" class="form-control form-control-sm text-center border-0 bg-transparent px-0" style="width: 55px; font-size: 0.75rem; font-weight: 600;" placeholder="Cant" oninput="let u=this.value; let p=this.previousElementSibling.previousElementSibling.value; if(p&&u) document.getElementById('inspect-qty-${i}').value=p*u;">
              </div>
              <input type="number" id="inspect-qty-${i}" class="form-control form-control-sm text-center fw-bold text-primary w-100 shadow-sm" min="0" value="${expectedQty}">
            </div>
          </td>
        </tr>`;
    });

    formHtml += `</tbody></table></div>
      <div class="form-check text-start mt-3 p-3 bg-light border rounded shadow-sm">
        <input class="form-check-input mt-1" type="checkbox" id="pay-from-register" checked style="transform: scale(1.2);">
        <label class="form-check-label fw-bold text-dark ms-2" for="pay-from-register">
          Descontar costo del dinero de Caja Físicamente
          <small class="text-muted d-block mt-1 fw-normal" style="font-size: 0.8rem;">
            ¿El proveedor ya fue pagado por transferencia o es a crédito? <strong>Desmarca</strong> esta opción.
          </small>
        </label>
      </div>`;

    Swal.fire({
      title: 'Auditoría de Entrega',
      html: formHtml,
      showCancelButton: true,
      confirmButtonText: 'Confirmar Recepción',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
      preConfirm: () => {
        const auditedItems = [];
        for (let i = 0; i < itemsToInspect.length; i++) {
          const qtyInput = document.getElementById(`inspect-qty-${i}`) as HTMLInputElement;
          const qty = parseFloat(qtyInput.value);
          if (qty < 0) {
            Swal.showValidationMessage('Las cantidades no pueden ser negativas.');
            return false;
          }
          auditedItems.push({
            type: itemsToInspect[i].type || 'Product',
            itemRef: typeof itemsToInspect[i].itemRef === 'object' ? itemsToInspect[i].itemRef._id : itemsToInspect[i].itemRef,
            quantity: qty,
            costPrice: itemsToInspect[i].costPrice || 0
          });
        }
        const payFromRegInput = document.getElementById('pay-from-register') as HTMLInputElement;
        return { items: auditedItems, payFromRegister: payFromRegInput.checked };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const payload = {
          status: 'completed',
          payFromRegister: result.value.payFromRegister,
          items: result.value.items
        };
        this.supplierService.updateRestockStatus(restock._id, payload).subscribe({
          next: (resp: any) => {
            if (resp.ok) {
              Swal.fire('¡Éxito!', 'Mercancía recibida e ingresada al inventario correctamente.', 'success');
              this.loadPendingDeliveries();
              this.loadItems();
            }
          },
          error: (err) => {
            Swal.fire('Error', err.error?.message || 'No se pudo completar la recepción', 'error');
          }
        });
      }
    });
  }

  openUnplannedRestock() {
    this.unplannedRestock = { supplier: '', notes: 'Recepción no programada', payFromRegister: true };
    this.unplannedItems = [{ productId: '', productName: '', quantity: 1, itemType: 'Product', searchText: '', showDropdown: false, measurementUnit: '', packs: undefined, unitsPerPack: undefined, costPrice: 0 }];
    this.showUnplannedRestockModal = true;
  }

  addUnplannedItem() {
    this.unplannedItems.push({ productId: '', productName: '', quantity: 1, itemType: 'Product', searchText: '', showDropdown: false, measurementUnit: '', packs: undefined, unitsPerPack: undefined, costPrice: 0 });
  }

  removeUnplannedItem(idx: number) {
    this.unplannedItems.splice(idx, 1);
  }

  getFilteredProductsForDropdown(idx: number): any[] {
    const text = this.unplannedItems[idx].searchText;
    if (!text || text.length < 2) return [];
    const lowerText = text.toLowerCase();
    return this.allCompanyProducts.filter(p => 
      (p.name || '').toLowerCase().includes(lowerText) || (p.brand && p.brand.toLowerCase().includes(lowerText))
    ).slice(0, 50);
  }

  selectProductForUnplannedRow(idx: number, prod: any) {
    this.unplannedItems[idx].productId = prod._id || '';
    this.unplannedItems[idx].productName = prod.name || '';
    this.unplannedItems[idx].itemType = prod.itemType || 'Product';
    this.unplannedItems[idx].searchText = prod.name;
    this.unplannedItems[idx].showDropdown = false;
    this.unplannedItems[idx].measurementUnit = prod.measurementUnit || (prod.itemType === 'RawMaterial' ? 'U' : 'Pza');
    this.unplannedItems[idx].packs = undefined;
    this.unplannedItems[idx].unitsPerPack = undefined;
    this.unplannedItems[idx].costPrice = prod.costPrice || 0;
  }

  updateItemQuantityFromMultiplier(idx: number) {
    const item = this.unplannedItems[idx];
    if (item.packs && item.unitsPerPack) {
      item.quantity = item.packs * item.unitsPerPack;
    }
  }

  saveUnplannedRestock() {
    if (!this.unplannedRestock.supplier) {
      Swal.fire('Error', 'Selecciona un proveedor.', 'warning');
      return;
    }
    const validItems = this.unplannedItems.filter(it => it.productId && it.quantity > 0);
    if (validItems.length === 0) {
      Swal.fire('Error', 'Agrega al menos un producto válido a recibir.', 'warning');
      return;
    }

    const payload = {
      company: this.companyId,
      branch: this.selectedBranchId || this.authService.branch?._id || '',
      supplier: this.unplannedRestock.supplier,
      expectedDate: new Date(),
      status: 'pending',
      isRecurring: false,
      recurrence: 'none',
      notes: this.unplannedRestock.notes,
      items: validItems.map(it => ({
        type: it.itemType,
        itemRef: it.productId,
        quantity: it.quantity,
        costPrice: it.costPrice
      }))
    };

    Swal.fire({ title: 'Registrando entrada...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    this.supplierService.createRestockSchedule(payload).subscribe({
      next: (resp: any) => {
        if (resp.ok && resp.restock) {
          const updatePayload = {
            status: 'completed',
            payFromRegister: this.unplannedRestock.payFromRegister,
            items: payload.items
          };
          this.supplierService.updateRestockStatus(resp.restock._id, updatePayload).subscribe({
            next: (updateResp: any) => {
              if (updateResp.ok) {
                Swal.fire('¡Éxito!', 'La entrada no programada fue registrada y el inventario se ha actualizado.', 'success');
                this.showUnplannedRestockModal = false;
                this.loadItems();
              }
            },
            error: (err) => Swal.fire('Error', 'Se creó el registro pero falló la actualización de inventario.', 'error')
          });
        }
      },
      error: (err) => Swal.fire('Error', err.error?.message || 'No se pudo crear el registro.', 'error')
    });
  }
}
