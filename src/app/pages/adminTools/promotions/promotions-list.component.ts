import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Promotion } from 'src/app/interfaces/models.interface';
import { PromotionService } from 'src/app/services/promotion.service';
import { AuthService } from 'src/app/services/auth.service';
import { BranchService } from 'src/app/services/branch.service';
import { CategoryService } from 'src/app/services/category.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-promotions-list',
  templateUrl: './promotions-list.component.html',
  styleUrls: ['./promotions-list.component.css']
})
export class PromotionsListComponent implements OnInit {
  promotions: Promotion[] = [];
  companyId: string = '';
  searchTerm: string = '';
  isLoading: boolean = false;
  userRole: string = '';

  branches: any[] = [];
  categories: any[] = [];

  // Create / Edit modal
  showModal: boolean = false;
  isEditMode: boolean = false;
  promotionForm!: FormGroup;
  editingPromotionId: string = '';

  constructor(
    private fb: FormBuilder,
    private promotionService: PromotionService,
    private authService: AuthService,
    private branchService: BranchService,
    private categoryService: CategoryService
  ) {
    this.companyId = this.authService.companyId || (this.authService.company as any)?._id || '';
  }

  ngOnInit(): void {
    this.userRole = this.authService.role || this.authService.usuario?.role || '';
    this.initForm();
    this.loadPromotions();
    this.loadBranches();
    this.loadCategories();
  }

  initForm() {
    let defaultBranches: string[] = [];
    if (this.userRole === 'admin' || this.userRole === 'user') {
      const bId = this.authService.branch?._id || this.authService.branch;
      if (bId) {
        defaultBranches = [bId];
      }
    }

    this.promotionForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[A-Za-z0-9-_]+$/)]],
      description: ['', Validators.required],
      type: ['percentage', Validators.required],
      value: [10, [Validators.required, Validators.min(0.01)]],
      minPurchaseAmount: [0, [Validators.required, Validators.min(0)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      usageLimit: [null, [Validators.min(1)]],
      targetBranches: [defaultBranches],
      targetCategories: [[]]
    });
  }

  loadBranches() {
    this.branchService.getBranchesByCompany(this.companyId).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.branches = resp.branches || [];
        }
      },
      error: (err: any) => console.error('Error loading branches for select:', err)
    });
  }

  loadCategories() {
    this.categoryService.getCompanyCategories(this.companyId).subscribe({
      next: (resp: any) => {
        this.categories = resp.categories || [];
      },
      error: (err: any) => console.error('Error loading categories for select:', err)
    });
  }

  loadPromotions() {
    this.isLoading = true;
    let branchId = '';
    if (this.userRole === 'admin' || this.userRole === 'user') {
      branchId = this.authService.branch?._id || this.authService.branch || '';
    }

    this.promotionService.getPromotions(this.companyId, this.searchTerm, branchId).subscribe({
      next: (resp) => {
        if (resp.ok) {
          this.promotions = resp.promotions;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        Swal.fire('Error', 'No se pudieron obtener las promociones.', 'error');
      }
    });
  }

  onSearch(term: string) {
    this.searchTerm = term;
    this.loadPromotions();
  }

  openCreateModal() {
    this.isEditMode = false;
    this.editingPromotionId = '';

    let defaultBranches: string[] = [];
    if (this.userRole === 'admin' || this.userRole === 'user') {
      const bId = this.authService.branch?._id || this.authService.branch;
      if (bId) {
        defaultBranches = [bId];
      }
    }

    this.promotionForm.reset({
      code: '',
      description: '',
      type: 'percentage',
      value: 10,
      minPurchaseAmount: 0,
      startDate: '',
      endDate: '',
      usageLimit: null,
      targetBranches: defaultBranches,
      targetCategories: []
    });
    this.showModal = true;
  }

  openEditModal(promotion: Promotion) {
    this.isEditMode = true;
    this.editingPromotionId = promotion._id || '';
    
    // Format dates to YYYY-MM-DD for HTML input
    const formatHTMLDate = (d: any) => {
      if (!d) return '';
      const date = new Date(d);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const branchIds = promotion.targetBranches ? promotion.targetBranches.map((b: any) => typeof b === 'object' ? b._id : b) : [];
    const categoryIds = promotion.targetCategories ? promotion.targetCategories.map((c: any) => typeof c === 'object' ? c._id : c) : [];

    this.promotionForm.patchValue({
      code: promotion.code,
      description: promotion.description,
      type: promotion.type,
      value: promotion.value,
      minPurchaseAmount: promotion.minPurchaseAmount,
      startDate: formatHTMLDate(promotion.startDate),
      endDate: formatHTMLDate(promotion.endDate),
      usageLimit: promotion.usageLimit || null,
      targetBranches: branchIds,
      targetCategories: categoryIds
    });
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  onSubmitPromotion() {
    if (this.promotionForm.invalid) {
      this.promotionForm.markAllAsTouched();
      return;
    }

    const rawData = this.promotionForm.value;
    // Autouppercase coupon code
    rawData.code = rawData.code.toUpperCase();

    if (this.userRole === 'admin' || this.userRole === 'user') {
      const bId = this.authService.branch?._id || this.authService.branch;
      if (bId) {
        rawData.targetBranches = [bId];
      }
    }

    if (this.isEditMode) {
      this.promotionService.updatePromotion(this.editingPromotionId, rawData).subscribe({
        next: (resp) => {
          if (resp.ok) {
            Swal.fire('Éxito', 'Promoción actualizada correctamente.', 'success');
            this.closeModal();
            this.loadPromotions();
          }
        },
        error: (err) => {
          Swal.fire('Error', err.error?.message || 'No se pudo actualizar la promoción.', 'error');
        }
      });
    } else {
      this.promotionService.createPromotion(rawData, this.companyId).subscribe({
        next: (resp) => {
          if (resp.ok) {
            Swal.fire('Éxito', 'Promoción creada correctamente.', 'success');
            this.closeModal();
            this.loadPromotions();
          }
        },
        error: (err) => {
          Swal.fire('Error', err.error?.message || 'No se pudo crear la promoción.', 'error');
        }
      });
    }
  }

  togglePromotionStatus(promotion: Promotion) {
    const nextStatus = !promotion.isActive;
    this.promotionService.updatePromotion(promotion._id!, { isActive: nextStatus }).subscribe({
      next: () => {
        Swal.fire('Éxito', `Promoción ${nextStatus ? 'activada' : 'desactivada'} con éxito.`, 'success');
        this.loadPromotions();
      },
      error: (err) => {
        Swal.fire('Error', 'No se pudo cambiar el estado de la promoción.', 'error');
      }
    });
  }

  deletePromotion(id: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esto!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.promotionService.deletePromotion(id).subscribe({
          next: () => {
            Swal.fire('Eliminada', 'La promoción ha sido eliminada.', 'success');
            this.loadPromotions();
          },
          error: (err) => {
            Swal.fire('Error', 'No se pudo eliminar la promoción.', 'error');
          }
        });
      }
    });
  }

  isExpired(endDate: any): boolean {
    if (!endDate) return false;
    return new Date(endDate).getTime() < new Date().setHours(0, 0, 0, 0);
  }

  getBranchNames(branchIds: any[]): string {
    if (!branchIds || branchIds.length === 0) return 'Todas las Sucursales';
    const names = branchIds.map(id => {
      const bId = typeof id === 'object' ? id._id : id;
      const b = this.branches.find(x => x._id === bId);
      return b ? b.name : 'Sucursal';
    });
    return names.join(', ');
  }

  getCategoryNames(categoryIds: any[]): string {
    if (!categoryIds || categoryIds.length === 0) return 'Todas las Categorías';
    const names = categoryIds.map(id => {
      const cId = typeof id === 'object' ? id._id : id;
      const c = this.categories.find(x => x._id === cId);
      return c ? c.name : 'Categoría';
    });
    return names.join(', ');
  }
}
