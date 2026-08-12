import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Supplier, Product, InventoryItem, Branch, Category } from 'src/app/interfaces/models.interface';
import { SupplierService } from 'src/app/services/provider.service';
import { ProductService } from 'src/app/services/product.service';
import { InventoryService } from 'src/app/services/inventory.service';
import { BranchService } from 'src/app/services/branch.service';
import { CategoryService } from 'src/app/services/category.service';
import { AuthService } from 'src/app/services/auth.service';
import { RawMaterialsService } from 'src/app/services/raw-materials.service';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-supplier-details',
  templateUrl: './supplier-details.component.html',
  styleUrls: ['./supplier-details.component.css'],
})
export class SupplierDetailsComponent implements OnInit {
  supplierId!: string;
  companyId!: string;
  supplier!: Supplier;

  // Lists
  products: any[] = [];
  suppliedProducts: any[] = [];
  suppliedInventory: InventoryItem[] = [];
  branches: Branch[] = [];
  categories: Category[] = [];
  restocks: any[] = [];

  // KPIs
  catalogCount: number = 0;
  totalStock: number = 0;
  totalInvestment: number = 0;

  // Navigation Tabs
  activeTab: 'catalog' | 'stock' | 'deliveries' = 'catalog';

  // Catalog Pagination & Search
  catalogSearchText: string = '';
  catalogCurrentPage: number = 1;
  catalogItemsPerPage: number = 20;
  catalogItemsPerPageOptions: number[] = [10, 20, 50];

  get paginatedSuppliedProducts(): any[] {
    let filtered = this.suppliedProducts;
    if (this.catalogSearchText) {
      const term = this.catalogSearchText.toLowerCase();
      filtered = filtered.filter(p => p.name?.toLowerCase().includes(term) || p.brand?.toLowerCase().includes(term));
    }
    const startIndex = (this.catalogCurrentPage - 1) * this.catalogItemsPerPage;
    return filtered.slice(startIndex, startIndex + Number(this.catalogItemsPerPage));
  }

  get catalogTotalPages(): number {
    let filtered = this.suppliedProducts;
    if (this.catalogSearchText) {
      const term = this.catalogSearchText.toLowerCase();
      filtered = filtered.filter(p => p.name?.toLowerCase().includes(term) || p.brand?.toLowerCase().includes(term));
    }
    return Math.ceil(filtered.length / this.catalogItemsPerPage) || 1;
  }

  changeCatalogPage(delta: number) {
    const newPage = this.catalogCurrentPage + delta;
    if (newPage >= 1 && newPage <= this.catalogTotalPages) {
      this.catalogCurrentPage = newPage;
    }
  }

  onCatalogFiltersChange() {
    this.catalogCurrentPage = 1;
  }

  // Permission & Role Check
  canVerifyRestock: boolean = false;
  payFromRegister: boolean = true;

  // Modals visibility toggles
  showScheduleModal: boolean = false;
  showInspectModal: boolean = false;
  showQuickProductModal: boolean = false;

  // New Restock Form Bindings
  newRestock = {
    branch: '',
    expectedDate: '',
    itemsSummary: '',
    isRecurring: false,
    recurrence: 'none',
    recurrenceDays: 0,
    notes: '',
  };

  // Inspect Restock State
  selectedRestockForInspect: any = null;
  inspectedItems: {
    productId?: string;
    type?: string;
    name: string;
    quantity: number;
    costPrice: number;
    verified: boolean;
  }[] = [];

  // Quick Product Form Bindings
  quickProduct = {
    name: '',
    brand: '',
    category: '',
    isComposite: false,
  };

  // Listado estructurado de ítems para el reabastecimiento programado
  restockItemsList: { productId: string; productName: string; quantity: number }[] = [];
  quickProductSource: 'schedule' | 'inspect' = 'schedule';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supplierService: SupplierService,
    private productService: ProductService,
    private inventoryService: InventoryService,
    private branchService: BranchService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private rawMaterialsService: RawMaterialsService
  ) {}

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id') || '';
    this.companyId = this.authService.companyId || this.authService.company?._id || '';

    if (!this.supplierId || !this.companyId) {
      this.router.navigateByUrl('/dashboard/admin/suppliers');
      return;
    }

    // Determinar permisos: verify_restock está disponible para dueños o cajeros con el permiso específico
    const user = this.authService.usuario;
    const permissions = (user as any).permissions || [];
    this.canVerifyRestock =
      this.authService.role === 'companyAdmin' ||
      this.authService.role === 'admin' ||
      permissions.includes('verify_restock');

    this.loadSupplier();
    this.loadBranches();
    this.loadCategories();
    this.loadDataAndCalculateKPIs();
    this.loadRestocks();
  }

  loadSupplier() {
    this.supplierService.getSupplier(this.supplierId).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.supplier = resp.supplier;
        }
      },
    });
  }

  loadBranches() {
    this.branchService.getBranchesByCompany(this.companyId).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.branches = resp.branches || [];
        }
      },
    });
  }

  loadCategories() {
    this.categoryService.getCompanyCategories(this.companyId).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.categories = resp.categories || [];
        }
      },
    });
  }

  loadDataAndCalculateKPIs() {
    // 1. Cargar productos y materias primas de la compañía
    forkJoin({
      prods: this.productService.searchProductCompany('', 1, 1000, this.companyId),
      raws: this.rawMaterialsService.getCompanyRawMaterials(this.companyId),
    }).subscribe({
      next: (res: any) => {
        const allProducts = res.prods.products || [];
        const allMaterials = res.raws.materials || [];
        
        // Unificar y mapear tipo
        const combined = [
          ...allProducts.map((p: any) => ({ ...p, itemType: 'product' })),
          ...allMaterials.map((m: any) => ({ ...m, itemType: 'raw' }))
        ];

        // Filtrar productos/insumos suministrados por este proveedor y excluir compuestos
        this.suppliedProducts = combined.filter((item: any) => {
          if (item.isComposite) return false;
          const sId = typeof item.supplier === 'object' ? (item.supplier as any)?._id : item.supplier;
          return sId === this.supplierId;
        });
        
        this.catalogCount = this.suppliedProducts.length;
      },
    });

    // 2. Cargar items del inventario de la compañía
    this.inventoryService.getInventory(this.companyId).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          const allInventory: InventoryItem[] = resp.items || [];
          // Filtrar items suministrados por este proveedor
          this.suppliedInventory = allInventory.filter((item) => {
            const sId = typeof item.supplier === 'object' ? (item.supplier as any)?._id : item.supplier;
            return sId === this.supplierId;
          });

          // Calcular Stock Físico e Inversión Financiera Total
          this.totalStock = 0;
          this.totalInvestment = 0;
          this.suppliedInventory.forEach((item) => {
            this.totalStock += item.stock || 0;
            this.totalInvestment += (item.stock || 0) * (item.costPrice || 0);
          });
        }
      },
    });
  }

  loadRestocks() {
    this.supplierService.getCompanyRestocks(this.companyId).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          // Filtrar restocks pertenecientes únicamente a este proveedor
          const allRestocks: any[] = resp.restocks || [];
          this.restocks = allRestocks.filter((r) => {
            const sId = typeof r.supplier === 'object' ? r.supplier?._id : r.supplier;
            return sId === this.supplierId;
          });
        }
      },
    });
  }

  // Tabs navigation
  selectTab(tab: 'catalog' | 'stock' | 'deliveries') {
    this.activeTab = tab;
  }

  // Modals operations
  openScheduleModal() {
    this.newRestock = {
      branch: this.branches[0]?._id || '',
      expectedDate: new Date().toISOString().substring(0, 10),
      itemsSummary: '',
      isRecurring: false,
      recurrence: 'none',
      recurrenceDays: 0,
      notes: '',
    };
    // Inicializar con una fila vacía para el constructor interactivo
    this.restockItemsList = [{ productId: '', productName: '', quantity: 1 }];
    this.showScheduleModal = true;
  }

  closeScheduleModal() {
    this.showScheduleModal = false;
  }

  // Operaciones del Constructor Estructurado de Re-stock
  addRestockItemRow() {
    this.restockItemsList.push({ productId: '', productName: '', quantity: 1 });
  }

  removeRestockItemRow(idx: number) {
    this.restockItemsList.splice(idx, 1);
    if (this.restockItemsList.length === 0) {
      this.addRestockItemRow();
    }
  }

  onRestockItemProductChange(idx: number) {
    const row = this.restockItemsList[idx];
    const prod = this.suppliedProducts.find((p) => p._id === row.productId);
    if (prod) {
      row.productName = prod.name || '';
    }
  }

  openQuickProductModalInSchedule() {
    this.quickProductSource = 'schedule';
    this.openQuickProductModal();
  }

  openQuickProductModalInInspect() {
    this.quickProductSource = 'inspect';
    this.openQuickProductModal();
  }

  saveRestockSchedule() {
    const validItems = this.restockItemsList.filter((it) => it.productId && it.quantity > 0);
    if (validItems.length === 0) {
      Swal.fire('Error', 'Por favor selecciona al menos un producto de la lista e indica su cantidad', 'error');
      return;
    }

    if (!this.newRestock.branch || !this.newRestock.expectedDate) {
      Swal.fire('Error', 'Por favor completa todos los campos requeridos', 'error');
      return;
    }

    // Formatear itemsSummary automáticamente a partir de los productos reales seleccionados
    const summary = validItems.map((row) => `${row.quantity} ${row.productName}`).join(', ');

    this.newRestock.itemsSummary = summary;

    const payload = {
      ...this.newRestock,
      company: this.companyId,
      supplier: this.supplierId,
      status: 'pending',
      items: validItems.map((it) => ({
        type: 'Product',
        itemRef: it.productId,
        quantity: it.quantity,
        costPrice: 0,
      })),
    };

    this.supplierService.createRestockSchedule(payload).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          Swal.fire('¡Éxito!', 'Entrega programada agendada correctamente', 'success');
          this.showScheduleModal = false;
          this.loadRestocks();
        }
      },
      error: () => {
        Swal.fire('Error', 'Hubo un error al guardar el recordatorio', 'error');
      },
    });
  }

  openInspectModal(restock: any) {
    this.selectedRestockForInspect = restock;
    this.payFromRegister = true;

    if (restock.items && restock.items.length > 0) {
      this.inspectedItems = restock.items.map((it: any) => {
        const prodName = it.itemRef?.name || it.itemRef || 'Artículo';
        return {
          productId: it.itemRef?._id || it.itemRef,
          type: it.type || 'Product',
          name: prodName,
          quantity: it.quantity || 0,
          costPrice: it.costPrice || 0,
          verified: true,
        };
      });
    } else {
      const summary = restock.itemsSummary || '';
      this.inspectedItems = summary.split(',').map((it: string) => {
        const trimmed = it.trim();
        const parts = trimmed.match(/^(\d+)\s+(.+)$/);
        if (parts) {
          return {
            productId: '',
            type: 'Product',
            name: parts[2],
            quantity: parseInt(parts[1], 10),
            costPrice: 0,
            verified: false,
          };
        }
        return {
          productId: '',
          type: 'Product',
          name: trimmed,
          quantity: 1,
          costPrice: 0,
          verified: false,
        };
      });
    }

    this.showInspectModal = true;
  }

  closeInspectModal() {
    this.showInspectModal = false;
    this.selectedRestockForInspect = null;
  }

  // Quick Product registration during inspection
  openQuickProductModal() {
    this.quickProduct = {
      name: '',
      brand: '',
      category: this.categories[0]?._id || '',
      isComposite: false,
    };
    this.showQuickProductModal = true;
  }

  closeQuickProductModal() {
    this.showQuickProductModal = false;
  }

  saveQuickProduct() {
    if (!this.quickProduct.name || !this.quickProduct.brand || !this.quickProduct.category) {
      Swal.fire('Error', 'Por favor llena todos los campos', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('name', this.quickProduct.name);
    formData.append('brand', this.quickProduct.brand);
    formData.append('categories', this.quickProduct.category);
    formData.append('isComposite', String(this.quickProduct.isComposite));
    formData.append('supplier', this.supplierId);
    formData.append('status', 'pending_verification');

    this.productService.createProduct(this.companyId, formData).subscribe({
      next: (resp: any) => {
        const saved = resp.savedProduct;
        Swal.fire('¡Producto Creado!', 'Se agregó como [Por Verificar] de forma flexible', 'success');
        this.showQuickProductModal = false;

        // Agregar al catálogo de suministro de la ficha
        this.loadDataAndCalculateKPIs();

        if (this.quickProductSource === 'schedule') {
          // Si venimos del agendador, lo agregamos a la lista de reabastecimiento programada y lo seleccionamos automáticamente
          if (this.restockItemsList.length === 1 && !this.restockItemsList[0].productId) {
            this.restockItemsList = [];
          }
          this.restockItemsList.push({
            productId: saved._id,
            productName: saved.name,
            quantity: 1,
          });
        } else {
          // Si venimos de la pantalla de inspección, lo agregamos a la checklist interactiva
          this.inspectedItems.push({
            name: saved.name,
            quantity: 1,
            costPrice: 0,
            verified: true,
          });
        }
      },
      error: () => {
        Swal.fire('Error', 'No se pudo registrar el producto', 'error');
      },
    });
  }

  completeInspection() {
    const verifiedItems = this.inspectedItems.filter((it) => it.verified);
    if (verifiedItems.length === 0) {
      Swal.fire('Atención', 'Debes verificar al menos un artículo para recibir la entrega', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Confirmar Recepción?',
      text: 'Se registrará el arribo de la mercancía con las cantidades y costos ingresados.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Completar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = {
          status: 'completed',
          payFromRegister: this.payFromRegister,
          items: verifiedItems.map((it) => ({
            type: it.type || 'Product',
            itemRef: it.productId || undefined,
            quantity: it.quantity,
            costPrice: it.costPrice || 0,
          })),
        };

        this.supplierService.updateRestockStatus(this.selectedRestockForInspect._id, payload).subscribe({
          next: (resp: any) => {
            if (resp.ok) {
              Swal.fire({
                title: '¡Entrega Recibida!',
                text: 'La mercancía ha sido auditada e ingresada automáticamente al inventario activo.',
                icon: 'success',
                confirmButtonText: 'Aceptar',
              }).then(() => {
                this.showInspectModal = false;
                this.loadRestocks();
                this.loadDataAndCalculateKPIs();
              });
            }
          },
          error: (err) => {
            Swal.fire('Error', err.error?.message || 'No se pudo completar la recepción', 'error');
          },
        });
      }
    });
  }

  deleteRestock(id: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Se eliminará de forma permanente este recordatorio de entrega.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, Eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.supplierService.deleteRestock(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Entrega cancelada correctamente', 'success');
            this.loadRestocks();
          },
        });
      }
    });
  }

  getRecurrenceLabel(r: string): string {
    if (r === 'daily') return 'Diaria';
    if (r === 'weekly') return 'Semanal';
    if (r === 'monthly') return 'Mensual';
    return 'Ninguna';
  }

  getSupplierInitials(): string {
    if (!this.supplier || !this.supplier.name) return 'PR';
    return this.supplier.name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }
}
