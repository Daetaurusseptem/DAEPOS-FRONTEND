import { Component, OnInit } from '@angular/core';
import { SupplierService } from 'src/app/services/provider.service';
import { BranchService } from 'src/app/services/branch.service';
import { AuthService } from 'src/app/services/auth.service';
import { ProductService } from 'src/app/services/product.service';
import { CategoryService } from 'src/app/services/category.service';
import { Branch, Supplier, Category } from 'src/app/interfaces/models.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-deliveries-hub',
  templateUrl: './deliveries-hub.component.html',
  styleUrls: ['./deliveries-hub.component.css']
})
export class CentralizedDeliveriesComponent implements OnInit {

  companyId!: string;
  branches: Branch[] = [];
  suppliers: Supplier[] = [];
  categories: Category[] = [];
  allRestocks: any[] = [];
  filteredRestocks: any[] = [];

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
  inspectedItems: { productId?: string; type?: string; name: string; quantity: number; costPrice: number; verified: boolean }[] = [];
  payFromRegister: boolean = true;
  canVerifyRestock: boolean = false;

  // Quick Product registration
  showQuickProductModal: boolean = false;
  quickProduct = {
    name: '',
    brand: '',
    category: '',
    isComposite: false
  };

  constructor(
    private supplierService: SupplierService,
    private branchService: BranchService,
    private productService: ProductService,
    private categoryService: CategoryService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.companyId = this.authService.companyId || this.authService.company?._id || '';
    
    const user = this.authService.usuario;
    const permissions = (user as any).permissions || [];
    this.canVerifyRestock = this.authService.role === 'companyAdmin' || 
                            this.authService.role === 'admin' || 
                            permissions.includes('verify_restock');

    if (this.authService.role !== 'companyAdmin') {
      this.selectedBranch = this.authService.branch?._id || this.authService.branch || '';
    }

    this.loadBranches();
    this.loadSuppliers();
    this.loadCategories();
    this.loadAllRestocks();
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
      }
    });
  }

  loadSuppliers() {
    this.supplierService.getCompanySuppliers(this.companyId).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.suppliers = resp.suppliers || [];
        }
      }
    });
  }

  loadCategories() {
    this.categoryService.getCompanyCategories(this.companyId).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.categories = resp.categories || [];
        }
      }
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
      }
    });
  }

  applyFilters() {
    this.filteredRestocks = this.allRestocks.filter(r => {
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
    todayDate.setHours(0,0,0,0);

    const targetBranch = this.authService.role !== 'companyAdmin' 
      ? (this.authService.branch?._id || this.authService.branch || '') 
      : '';

    this.allRestocks.forEach(r => {
      if (targetBranch) {
        const bId = typeof r.branch === 'object' ? r.branch?._id : r.branch;
        if (bId !== targetBranch) return;
      }

      if (r.status === 'pending') {
        const expected = new Date(r.expectedDate);
        expected.setHours(0,0,0,0);

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
          verified: true
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
            verified: false
          };
        }
        return {
          productId: '',
          type: 'Product',
          name: trimmed,
          quantity: 1,
          costPrice: 0,
          verified: false
        };
      });
    }

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
      isComposite: false
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

    const sId = typeof this.selectedRestockForInspect.supplier === 'object' 
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
          verified: true
        });
      },
      error: () => {
        Swal.fire('Error', 'No se pudo registrar el producto', 'error');
      }
    });
  }

  completeInspection() {
    const verifiedItems = this.inspectedItems.filter(it => it.verified);
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
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = {
          status: 'completed',
          payFromRegister: this.payFromRegister,
          items: verifiedItems.map(it => ({
            type: it.type || 'Product',
            itemRef: it.productId || undefined,
            quantity: it.quantity,
            costPrice: it.costPrice || 0
          }))
        };

        this.supplierService.updateRestockStatus(this.selectedRestockForInspect._id, payload).subscribe({
          next: (resp: any) => {
            if (resp.ok) {
              Swal.fire({
                title: '¡Entrega Recibida!',
                text: 'La mercancía ha sido auditada e ingresada automáticamente al inventario activo.',
                icon: 'success',
                confirmButtonText: 'Aceptar'
              }).then(() => {
                this.showInspectModal = false;
                this.loadAllRestocks();
              });
            }
          },
          error: (err) => {
            Swal.fire('Error', err.error?.message || 'No se pudo completar la recepción', 'error');
          }
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
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.supplierService.deleteRestock(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Entrega cancelada correctamente', 'success');
            this.loadAllRestocks();
          }
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
    this.selectedStatus = 'pending';
    this.applyFilters();
  }
}
