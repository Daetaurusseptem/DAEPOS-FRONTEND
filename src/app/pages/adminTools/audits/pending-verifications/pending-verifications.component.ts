import { Component, OnInit } from '@angular/core';
import { Product, Category, Supplier, Recipe } from 'src/app/interfaces/models.interface';
import { ProductService } from 'src/app/services/product.service';
import { AuthService } from 'src/app/services/auth.service';
import { CategoryService } from 'src/app/services/category.service';
import { SupplierService } from 'src/app/services/provider.service';
import { RecipesService } from 'src/app/services/recipes.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pending-verifications',
  templateUrl: './pending-verifications.component.html',
  styleUrls: ['./pending-verifications.component.css']
})
export class PendingVerificationsComponent implements OnInit {
  companyId: string = '';
  
  pendingProducts: any[] = [];
  activeProducts: Product[] = [];
  categories: Category[] = [];
  suppliers: Supplier[] = [];
  recipes: Recipe[] = [];
  pendingAudits: any[] = []; // Para los ajustes de cajeros

  // Modals state
  showMergeModal: boolean = false;
  showFormalizeModal: boolean = false;

  selectedProductForAudit: any = null;

  // Merge form
  targetProductId: string = '';

  // Resolution form for Inventory Audits
  showResolveAuditModal: boolean = false;
  selectedAudit: any = null;
  auditResolutionData = {
    supplierId: '',
    notes: '',
    items: [] as any[]
  };

  // Formalize form
  formalizeData = {
    name: '',
    brand: '',
    supplier: '',
    categories: [] as string[],
    isComposite: false,
    recipe: '',
    barCode: '',
    costPrice: 0,
    sellingPrice: 0,
    unitOfMeasure: 'unit'
  };

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private categoryService: CategoryService,
    private supplierService: SupplierService,
    private recipeService: RecipesService
  ) {
    this.companyId = this.authService.companyId || (this.authService.usuario?.company as any)?._id || (this.authService.usuario?.company as any) || '';
  }

  ngOnInit(): void {
    if (this.companyId) {
      this.loadPendingProducts();
      this.loadActiveProducts();
      this.loadCategories();
      this.loadSuppliers();
      this.loadRecipes();
      this.loadPendingAudits();
    }
  }

  loadPendingProducts() {
    this.productService.getPendingVerificationProducts(this.companyId).subscribe({
      next: (res: any) => {
        if (res.ok) {
          this.pendingProducts = res.products;
        }
      }
    });
  }

  loadPendingAudits() {
    this.supplierService.getPendingAudits(this.companyId).subscribe({
      next: (res: any) => {
        if (res.ok) {
          this.pendingAudits = res.audits;
        }
      }
    });
  }

  loadActiveProducts() {
    this.productService.getCompanyProducts(this.companyId).subscribe({
      next: (res: any) => {
        if (res.ok) {
          // Filtrar para no mostrar los pending en el dropdown de merge
          this.activeProducts = res.products.filter((p: any) => p.status !== 'pending_verification');
        }
      }
    });
  }

  loadCategories() {
    this.categoryService.getCompanyCategories(this.companyId).subscribe({
      next: (res: any) => {
        this.categories = res.categories || [];
      }
    });
  }

  loadSuppliers() {
    this.supplierService.getCompanySuppliers(this.companyId).subscribe({
      next: (res: any) => {
        this.suppliers = res.suppliers || [];
      }
    });
  }

  loadRecipes() {
    this.recipeService.getCompanyRecipes(this.companyId).subscribe({
      next: (res: any) => {
        this.recipes = res.recipes || [];
      }
    });
  }

  // --- MERGE LOGIC ---
  openMergeModal(product: any) {
    this.selectedProductForAudit = product;
    this.targetProductId = '';
    this.showMergeModal = true;
  }

  closeMergeModal() {
    this.showMergeModal = false;
    this.selectedProductForAudit = null;
  }

  confirmMerge() {
    if (!this.targetProductId) {
      Swal.fire('Atención', 'Selecciona un producto destino', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Confirmar Fusión?',
      text: 'El inventario y las ventas se transferirán al producto seleccionado. El producto temporal será eliminado. Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, Fusionar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.productService.mergeProduct(this.selectedProductForAudit._id, this.targetProductId).subscribe({
          next: (res: any) => {
            if (res.ok) {
              Swal.fire('Fusionado', 'Producto consolidado correctamente', 'success');
              this.closeMergeModal();
              this.loadPendingProducts();
            }
          },
          error: (err) => Swal.fire('Error', 'No se pudo fusionar el producto', 'error')
        });
      }
    });
  }

  // --- FORMALIZE LOGIC ---
  openFormalizeModal(product: any) {
    this.selectedProductForAudit = product;
    const inv = product.inventoryItems?.[0] || {};
    
    this.formalizeData = {
      name: product.name || '',
      brand: product.brand || '',
      supplier: product.supplier?._id || product.supplier || '',
      categories: product.categories?.map((c: any) => c._id || c) || [],
      isComposite: product.isComposite || false,
      recipe: product.recipe?._id || product.recipe || '',
      barCode: inv.barCode || '',
      costPrice: inv.costPrice || 0,
      sellingPrice: inv.sellingPrice || 0,
      unitOfMeasure: inv.measurement || 'unit'
    };

    this.showFormalizeModal = true;
  }

  closeFormalizeModal() {
    this.showFormalizeModal = false;
    this.selectedProductForAudit = null;
  }

  confirmFormalize() {
    if (!this.formalizeData.name) {
      Swal.fire('Atención', 'El nombre es obligatorio', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Formalizar Producto?',
      text: 'El producto pasará al catálogo principal y ya no estará en estado temporal.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Formalizar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.productService.formalizeProduct(this.selectedProductForAudit._id, this.formalizeData).subscribe({
          next: (res: any) => {
            if (res.ok) {
              Swal.fire('Formalizado', 'El producto se ha integrado al catálogo activo', 'success');
              this.closeFormalizeModal();
              this.loadPendingProducts();
              this.loadActiveProducts();
            }
          },
          error: (err) => Swal.fire('Error', 'No se pudo formalizar el producto', 'error')
        });
      }
    });
  }

  // --- INVENTORY AUDIT LOGIC ---
  openResolveAuditModal(audit: any) {
    this.selectedAudit = audit;
    this.auditResolutionData = {
      supplierId: audit.supplier?._id || audit.supplier || '',
      notes: '',
      items: audit.items.map((item: any) => ({
        type: item.type,
        itemRef: item.itemRef?._id || item.itemRef,
        itemName: item.itemRef?.name || 'Insumo',
        quantity: item.quantity,
        oldCostPrice: item.costPrice,
        newCostPrice: item.costPrice || 0
      }))
    };
    this.showResolveAuditModal = true;
  }

  closeResolveAuditModal() {
    this.showResolveAuditModal = false;
    this.selectedAudit = null;
  }

  confirmResolveAudit() {
    Swal.fire({
      title: '¿Resolver Ajuste?',
      text: 'Se recalculará el costo de los insumos en base al nuevo costo unitario proporcionado.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Resolver',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.supplierService.resolveInventoryAudit(this.selectedAudit._id, this.auditResolutionData).subscribe({
          next: (res: any) => {
            if (res.ok) {
              Swal.fire('Resuelto', 'El ajuste de inventario ha sido formalizado.', 'success');
              this.closeResolveAuditModal();
              this.loadPendingAudits();
            }
          },
          error: (err) => Swal.fire('Error', 'No se pudo resolver el ajuste', 'error')
        });
      }
    });
  }
}
