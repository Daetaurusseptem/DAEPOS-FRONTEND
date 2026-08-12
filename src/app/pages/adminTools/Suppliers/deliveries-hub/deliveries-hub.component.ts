import { Component, OnInit } from '@angular/core';
import { SupplierService } from 'src/app/services/provider.service';
import { BranchService } from 'src/app/services/branch.service';
import { AuthService } from 'src/app/services/auth.service';
import { ProductService } from 'src/app/services/product.service';
import { CategoryService } from 'src/app/services/category.service';
import { RawMaterialsService } from 'src/app/services/raw-materials.service';
import { Branch, Supplier, Category, Product } from 'src/app/interfaces/models.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-deliveries-hub',
  templateUrl: './deliveries-hub.component.html',
  styleUrls: ['./deliveries-hub.component.css'],
})
export class CentralizedDeliveriesComponent implements OnInit {
  companyId!: string;
  branches: Branch[] = [];
  suppliers: Supplier[] = [];
  categories: Category[] = [];
  allRestocks: any[] = [];
  filteredRestocks: any[] = [];

  // Autocomplete state
  supplierFilterSearchText: string = '';
  showFilterSupplierDropdown: boolean = false;
  supplierModalSearchText: string = '';
  showModalSupplierDropdown: boolean = false;

  // New Restock Form State
  showScheduleModal: boolean = false;
  newRestock = {
    branch: '',
    supplier: '',
    expectedDate: '',
    itemsSummary: '',
    isRecurring: false,
    recurrence: 'none',
    recurrenceDays: 0,
    notes: '',
  };
  restockItemsList: {
    productId: string;
    productName: string;
    quantity: number;
    itemType?: string;
    searchText?: string;
    showDropdown?: boolean;
    measurementUnit?: string;
    packs?: number;
    unitsPerPack?: number;
  }[] = [];
  suppliedProducts: any[] = [];
  allCompanyProducts: any[] = [];

  // Filters
  selectedBranch: string = '';
  selectedSupplier: string = '';
  selectedStatus: string = 'pending';

  // KPIs
  kpiPendingToday: number = 0;
  kpiOverdue: number = 0;
  kpiWeeklyInvestment: number = 0;

  // Inspect Modal Bindings
  showInspectModal: boolean = false;
  selectedRestockForInspect: any = null;
  inspectedItems: {
    productId?: string;
    type?: string;
    name: string;
    quantity: number;
    costPrice: number;
    verified: boolean;
    agreedCost?: number | null;
    varianceNote?: string;
  }[] = [];
  payFromRegister: boolean = true;
  canVerifyRestock: boolean = false;

  // Quick Product registration
  showQuickProductModal: boolean = false;
  quickProduct = {
    name: '',
    brand: '',
    category: '',
    isComposite: false,
  };

  constructor(
    private supplierService: SupplierService,
    private branchService: BranchService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private rawMaterialsService: RawMaterialsService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.companyId = this.authService.companyId || this.authService.company?._id || '';

    const user = this.authService.usuario;
    const permissions = (user as any).permissions || [];
    this.canVerifyRestock =
      this.authService.role === 'companyAdmin' ||
      this.authService.role === 'admin' ||
      permissions.includes('verify_restock');

    if (this.authService.role !== 'companyAdmin') {
      this.selectedBranch = this.authService.branch?._id || this.authService.branch || '';
    }

    this.loadBranches();
    this.loadSuppliers();
    this.loadCategories();
    this.loadAllRestocks();
    this.loadAllCompanyProducts();
  }

  loadBranches() {
    this.branchService.getBranchesByCompany(this.companyId).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          const allBranches = resp.branches || [];
          if (this.authService.role !== 'companyAdmin') {
            const myBranchId = this.authService.branch?._id || this.authService.branch || '';
            this.branches = allBranches.filter((b: any) => b._id === myBranchId);
          } else {
            this.branches = allBranches;
          }
        }
      },
    });
  }

  loadSuppliers() {
    this.supplierService.getCompanySuppliers(this.companyId).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.suppliers = resp.suppliers || [];
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

  loadAllRestocks() {
    this.supplierService.getCompanyRestocks(this.companyId).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.allRestocks = resp.restocks || [];
          this.applyFilters();
          this.calculateKPIs();
        }
      },
    });
  }

  applyFilters() {
    this.filteredRestocks = this.allRestocks.filter((r) => {
      // 1. Branch filter
      if (this.selectedBranch) {
        const bId = typeof r.branch === 'object' ? r.branch?._id : r.branch;
        if (bId !== this.selectedBranch) return false;
      }

      // 2. Supplier filter
      if (this.selectedSupplier) {
        const sId = typeof r.supplier === 'object' ? r.supplier?._id : r.supplier;
        if (sId !== this.selectedSupplier) return false;
      }

      // 3. Status filter
      if (this.selectedStatus && this.selectedStatus !== 'all') {
        if (r.status !== this.selectedStatus) return false;
      }

      return true;
    });
  }

  calculateKPIs() {
    const todayStr = new Date().toISOString().substring(0, 10);
    this.kpiPendingToday = 0;
    this.kpiOverdue = 0;
    this.kpiWeeklyInvestment = 0;

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const targetBranch =
      this.authService.role !== 'companyAdmin' ? this.authService.branch?._id || this.authService.branch || '' : '';

    this.allRestocks.forEach((r) => {
      if (targetBranch) {
        const bId = typeof r.branch === 'object' ? r.branch?._id : r.branch;
        if (bId !== targetBranch) return;
      }

      if (r.status === 'pending') {
        const expected = new Date(r.expectedDate);
        expected.setHours(0, 0, 0, 0);

        const expStr = expected.toISOString().substring(0, 10);
        if (expStr === todayStr) {
          this.kpiPendingToday++;
        } else if (expected.getTime() < todayDate.getTime()) {
          this.kpiOverdue++;
        }

        // Calculate expected cost
        if (r.items && r.items.length > 0) {
          r.items.forEach((it: any) => {
            this.kpiWeeklyInvestment += (it.quantity || 0) * (it.costPrice || 0);
          });
        }
      }
    });
  }

  // Modals operations
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
          agreedCost: null,
          varianceNote: '',
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
            agreedCost: null,
            varianceNote: '',
          };
        }
        return {
          productId: '',
          type: 'Product',
          name: trimmed,
          quantity: 1,
          costPrice: 0,
          verified: false,
          agreedCost: null,
          varianceNote: '',
        };
      });
    }

    // Cargar acuerdos de precios pactados vigentes para el proveedor de esta entrega
    const sId = typeof restock.supplier === 'object' ? restock.supplier?._id : restock.supplier;
    this.supplierService.getSupplierAgreements(this.companyId, sId).subscribe({
      next: (resp: any) => {
        const agreements = resp.agreements || [];
        const bId = typeof restock.branch === 'object' ? restock.branch?._id : restock.branch;

        this.inspectedItems.forEach((it: any) => {
          if (!it.productId) return;

          // 1. Acuerdo específico de sucursal
          let agreement = agreements.find((ag: any) => {
            const agProdId = typeof ag.product === 'object' ? ag.product?._id : ag.product;
            const agBranchId = typeof ag.branch === 'object' ? ag.branch?._id : ag.branch;
            return agProdId === it.productId && agBranchId === bId && ag.status === 'active';
          });

          // 2. Acuerdo general
          if (!agreement) {
            agreement = agreements.find((ag: any) => {
              const agProdId = typeof ag.product === 'object' ? ag.product?._id : ag.product;
              return agProdId === it.productId && !ag.branch && ag.status === 'active';
            });
          }

          if (agreement) {
            it.agreedCost = agreement.agreedCost;
            if (!it.costPrice) {
              it.costPrice = agreement.agreedCost;
            }
          }
        });
      },
    });

    this.showInspectModal = true;
  }

  closeInspectModal() {
    this.showInspectModal = false;
    this.selectedRestockForInspect = null;
  }

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

    const sId =
      typeof this.selectedRestockForInspect.supplier === 'object'
        ? this.selectedRestockForInspect.supplier?._id
        : this.selectedRestockForInspect.supplier;

    const formData = new FormData();
    formData.append('name', this.quickProduct.name);
    formData.append('brand', this.quickProduct.brand);
    formData.append('categories', this.quickProduct.category);
    formData.append('isComposite', String(this.quickProduct.isComposite));
    formData.append('supplier', sId);
    formData.append('status', 'pending_verification');

    this.productService.createProduct(this.companyId, formData).subscribe({
      next: (resp: any) => {
        const saved = resp.savedProduct;
        Swal.fire('¡Producto Creado!', 'Se agregó como [Por Verificar] de forma flexible', 'success');
        this.showQuickProductModal = false;

        this.inspectedItems.push({
          productId: saved._id,
          type: 'Product',
          name: saved.name,
          quantity: 1,
          costPrice: 0,
          verified: true,
        });
      },
      error: () => {
        Swal.fire('Error', 'No se pudo registrar el producto', 'error');
      },
    });
  }

  hasPriceVariance(it: any): boolean {
    return it.verified && it.agreedCost !== null && it.agreedCost !== undefined && it.costPrice > it.agreedCost;
  }

  isInspectionValid(): boolean {
    const verifiedItems = this.inspectedItems.filter((it) => it.verified);
    if (verifiedItems.length === 0) return false;
    return !verifiedItems.some((it) => this.hasPriceVariance(it) && !it.varianceNote?.trim());
  }

  completeInspection() {
    const verifiedItems = this.inspectedItems.filter((it) => it.verified);
    if (verifiedItems.length === 0) {
      Swal.fire('Atención', 'Debes verificar al menos un artículo para recibir la entrega', 'warning');
      return;
    }

    if (!this.isInspectionValid()) {
      Swal.fire(
        'Atención',
        'Hay artículos con costos superiores al pactado. Por favor, ingresa la justificación (Nota de Desviación de Costo) en cada uno.',
        'warning',
      );
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
            agreedCost: it.agreedCost || undefined,
            varianceNote: this.hasPriceVariance(it) ? it.varianceNote : undefined,
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
                this.loadAllRestocks();
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
            this.loadAllRestocks();
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

  resetFilters() {
    if (this.authService.role !== 'companyAdmin') {
      this.selectedBranch = this.authService.branch?._id || this.authService.branch || '';
    } else {
      this.selectedBranch = '';
    }
    this.selectedSupplier = '';
    this.supplierFilterSearchText = '';
    this.selectedStatus = 'pending';
    this.applyFilters();
  }

  // --- NUEVAS FUNCIONALIDADES: Flujo Rápido de Agendamiento y Autocompletado ---

  loadAllCompanyProducts() {
    this.productService.searchProductCompany('', 1, 1000, this.companyId).subscribe({
      next: (resp: any) => {
        const prods = (resp.products || []).map((p: any) => ({ ...p, itemType: 'Product' }));
        this.rawMaterialsService.getCompanyRawMaterials(this.companyId).subscribe({
          next: (rmResp: any) => {
            const rms = (rmResp.rawMaterials || []).map((rm: any) => ({ ...rm, itemType: 'RawMaterial' }));
            this.allCompanyProducts = [...prods, ...rms];
          },
        });
      },
    });
  }

  get filteredSuppliersForFilter(): Supplier[] {
    if (!this.supplierFilterSearchText) return this.suppliers;
    return this.suppliers.filter((s) => s.name.toLowerCase().includes(this.supplierFilterSearchText.toLowerCase()));
  }

  get filteredSuppliersForModal(): Supplier[] {
    if (!this.supplierModalSearchText) return this.suppliers;
    return this.suppliers.filter((s) => s.name.toLowerCase().includes(this.supplierModalSearchText.toLowerCase()));
  }

  selectSupplierInFilter(supplier: Supplier | null) {
    if (supplier) {
      this.selectedSupplier = supplier._id || '';
      this.supplierFilterSearchText = supplier.name;
    } else {
      this.selectedSupplier = '';
      this.supplierFilterSearchText = '';
    }
    this.showFilterSupplierDropdown = false;
    this.applyFilters();
  }

  openScheduleModal() {
    this.newRestock = {
      branch: this.branches[0]?._id || this.selectedBranch || '',
      supplier: '',
      expectedDate: new Date().toISOString().substring(0, 10),
      itemsSummary: '',
      isRecurring: false,
      recurrence: 'none',
      recurrenceDays: 0,
      notes: '',
    };
    this.supplierModalSearchText = '';
    this.restockItemsList = [
      {
        productId: '',
        productName: '',
        quantity: 1,
        itemType: 'Product',
        searchText: '',
        showDropdown: false,
        measurementUnit: '',
        packs: undefined,
        unitsPerPack: undefined,
      },
    ];
    this.suppliedProducts = this.allCompanyProducts; // Default to all products to prevent empty list issue
    this.showScheduleModal = true;
  }

  closeScheduleModal() {
    this.showScheduleModal = false;
  }

  addRestockItemRow() {
    this.restockItemsList.push({
      productId: '',
      productName: '',
      quantity: 1,
      itemType: 'Product',
      searchText: '',
      showDropdown: false,
      measurementUnit: '',
      packs: undefined,
      unitsPerPack: undefined,
    });
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

  onSupplierSelectedInModal(supplier: Supplier) {
    this.newRestock.supplier = supplier._id || '';
    this.supplierModalSearchText = supplier.name;
    this.showModalSupplierDropdown = false;

    // Remove strict supplier filtering to allow selecting any company product
    this.suppliedProducts = this.allCompanyProducts;

    // Resetear lista de artículos al cambiar de proveedor
    this.restockItemsList = [
      {
        productId: '',
        productName: '',
        quantity: 1,
        itemType: 'Product',
        searchText: '',
        showDropdown: false,
        measurementUnit: '',
        packs: undefined,
        unitsPerPack: undefined,
      },
    ];
  }

  getFilteredProductsForDropdown(idx: number): any[] {
    const text = this.restockItemsList[idx].searchText || '';
    if (!text) return this.suppliedProducts.filter((p) => !p.isComposite).slice(0, 50); // limit to 50 for performance
    const lowerText = text.toLowerCase();
    return this.suppliedProducts
      .filter(
        (p) =>
          !p.isComposite && ((p.name || '').toLowerCase().includes(lowerText) || (p.brand && p.brand.toLowerCase().includes(lowerText))),
      )
      .slice(0, 50);
  }

  selectProductForRestockRow(idx: number, prod: any) {
    this.restockItemsList[idx].productId = prod._id || '';
    this.restockItemsList[idx].productName = prod.name || '';
    this.restockItemsList[idx].itemType = prod.itemType || 'Product';
    this.restockItemsList[idx].searchText = prod.name;
    this.restockItemsList[idx].showDropdown = false;
    this.restockItemsList[idx].measurementUnit =
      prod.measurementUnit || (prod.itemType === 'RawMaterial' ? 'U' : 'Pza');
    this.restockItemsList[idx].packs = undefined;
    this.restockItemsList[idx].unitsPerPack = undefined;
  }

  updateItemQuantityFromMultiplier(idx: number) {
    const item = this.restockItemsList[idx];
    if (item.packs && item.unitsPerPack) {
      item.quantity = item.packs * item.unitsPerPack;
    }
  }

  saveRestockSchedule() {
    const validItems = this.restockItemsList.filter((it) => it.productId && it.quantity > 0);
    if (!this.newRestock.supplier) {
      Swal.fire('Error', 'Por favor selecciona un proveedor', 'error');
      return;
    }
    if (validItems.length === 0) {
      Swal.fire('Error', 'Por favor selecciona al menos un producto e indica su cantidad', 'error');
      return;
    }
    if (!this.newRestock.branch || !this.newRestock.expectedDate) {
      Swal.fire('Error', 'Por favor completa todos los campos requeridos', 'error');
      return;
    }

    // Formatear itemsSummary automáticamente
    const summary = validItems.map((row) => `${row.quantity} ${row.productName}`).join(', ');

    this.newRestock.itemsSummary = summary;

    const payload = {
      ...this.newRestock,
      company: this.companyId,
      status: 'pending',
      items: validItems.map((it) => ({
        type: it.itemType || 'Product',
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
          this.loadAllRestocks();
        }
      },
      error: () => {
        Swal.fire('Error', 'Hubo un error al guardar el recordatorio', 'error');
      },
    });
  }
}
