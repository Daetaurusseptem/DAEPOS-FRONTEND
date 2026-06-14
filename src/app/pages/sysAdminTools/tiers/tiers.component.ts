import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { SysadminService } from 'src/app/services/sysadmin.service';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-tiers',
  templateUrl: './tiers.component.html',
  styleUrls: ['./tiers.component.css'],
})
export class TiersComponent implements OnInit {
  dbPlans: any[] = [];
  stripeProducts: any[] = [];
  mergedPlans: any[] = []; // La lista que se mostrará en la tabla

  planForm: FormGroup;
  isEditing = false;
  currentEditId: string | null = null;
  loading = false;

  // Lista Estandarizada de Permisos/Features
  availableFeatures = [
    { id: 'kds', name: 'Kitchen Display System (KDS)' },
    { id: 'advanced_reports', name: 'Reportes Avanzados' },
    { id: 'inventory_transfers', name: 'Traspasos de Inventario' },
    { id: 'api_access', name: 'Acceso a API Rest' },
    { id: 'custom_roles', name: 'Roles Personalizados' },
  ];

  constructor(
    private sysadminService: SysadminService,
    private fb: FormBuilder,
  ) {
    this.planForm = this.fb.group({
      name: ['', Validators.required],
      billingType: ['stripe', Validators.required],
      stripeProductId: [{ value: '', disabled: true }],
      price: [0, [Validators.required, Validators.min(0)]],
      maxBranches: [1, [Validators.required, Validators.min(-1)]],
      maxUsers: [3, [Validators.required, Validators.min(-1)]],
      maxActiveRegisters: [1, [Validators.required, Validators.min(-1)]],
      features: this.fb.array([]),
      isActive: [true],
      isCustom: [false],
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading = true;

    // Cargar Stripe y BD al mismo tiempo
    forkJoin({
      stripe: this.sysadminService.getStripeProducts(),
      db: this.sysadminService.getPlans(),
    }).subscribe({
      next: (resp) => {
        if (resp.stripe.ok) this.stripeProducts = resp.stripe.productos;
        if (resp.db.ok) this.dbPlans = resp.db.plans;

        this.mergeData();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los datos de Stripe o la Base de Datos', 'error');
      },
    });
  }

  mergeData() {
    // Casar los productos de Stripe con los de la BD
    this.mergedPlans = this.stripeProducts.map((stripeProd) => {
      // Buscar si este producto ya fue configurado en la BD
      const dbMatch = this.dbPlans.find((plan) => plan.stripeProductId === stripeProd.id);

      return {
        isConfigured: !!dbMatch,
        _id: dbMatch ? dbMatch._id : null,
        stripeProductId: stripeProd.id,
        billingType: dbMatch ? dbMatch.billingType : 'stripe',
        name: stripeProd.name, // El nombre base viene de Stripe
        dbName: dbMatch ? dbMatch.name : stripeProd.name,
        price: dbMatch ? dbMatch.price : 0,
        maxBranches: dbMatch ? dbMatch.maxBranches : null,
        maxUsers: dbMatch ? dbMatch.maxUsers : null,
        maxActiveRegisters: dbMatch ? dbMatch.maxActiveRegisters : null,
        features: dbMatch ? dbMatch.features : [],
        isActive: dbMatch ? dbMatch.isActive : stripeProd.active,
        isCustom: dbMatch ? dbMatch.isCustom : false,
      };
    });

    // Añadir los custom que están en BD pero no en Stripe (planes manuales puramente B2B)
    const manualDbPlans = this.dbPlans.filter(
      (dbPlan) => !this.stripeProducts.some((sp) => sp.id === dbPlan.stripeProductId),
    );

    if (manualDbPlans.length > 0) {
      const formattedManuals = manualDbPlans.map((dbPlan) => ({
        isConfigured: true,
        _id: dbPlan._id,
        billingType: dbPlan.billingType || 'manual',
        stripeProductId: dbPlan.stripeProductId,
        name: dbPlan.name,
        dbName: dbPlan.name,
        price: dbPlan.price,
        maxBranches: dbPlan.maxBranches,
        maxUsers: dbPlan.maxUsers,
        maxActiveRegisters: dbPlan.maxActiveRegisters,
        features: dbPlan.features,
        isActive: dbPlan.isActive,
        isCustom: dbPlan.isCustom,
        isManualOnly: true, // Bandera para indicar que no existe en Stripe
      }));
      this.mergedPlans = [...this.mergedPlans, ...formattedManuals];
    }
  }

  // Helper para manejar Checkboxes
  onCheckboxChange(e: any) {
    const featuresArray: FormArray = this.planForm.get('features') as FormArray;
    if (e.target.checked) {
      featuresArray.push(new FormControl(e.target.value));
    } else {
      let i: number = 0;
      featuresArray.controls.forEach((item: any) => {
        if (item.value == e.target.value) {
          featuresArray.removeAt(i);
          return;
        }
        i++;
      });
    }
  }

  isFeatureChecked(featureId: string): boolean {
    const featuresArray: FormArray = this.planForm.get('features') as FormArray;
    return featuresArray.value.includes(featureId);
  }

  configurePlan(plan: any) {
    this.isEditing = plan.isConfigured;
    this.currentEditId = plan._id;

    const featuresArray: FormArray = this.planForm.get('features') as FormArray;
    featuresArray.clear();

    if (plan.features && plan.features.length > 0) {
      plan.features.forEach((f: string) => featuresArray.push(new FormControl(f)));
    }

    this.planForm.patchValue({
      name: plan.dbName || plan.name,
      billingType: plan.billingType || 'stripe',
      stripeProductId: plan.stripeProductId,
      price: plan.price || 0,
      maxBranches: plan.maxBranches !== null ? plan.maxBranches : 1,
      maxUsers: plan.maxUsers !== null ? plan.maxUsers : 3,
      maxActiveRegisters: plan.maxActiveRegisters !== null ? plan.maxActiveRegisters : 1,
      isActive: plan.isActive,
      isCustom: plan.isCustom,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.isEditing = false;
    this.currentEditId = null;
    const featuresArray: FormArray = this.planForm.get('features') as FormArray;
    featuresArray.clear();
    this.planForm.reset({
      maxBranches: 1,
      maxUsers: 3,
      maxActiveRegisters: 1,
      isActive: true,
      isCustom: false,
    });
  }

  crearPlanManual() {
    this.isEditing = false;
    this.currentEditId = null;

    const featuresArray: FormArray = this.planForm.get('features') as FormArray;
    featuresArray.clear();

    const randomId = 'manual_' + Math.random().toString(36).substring(2, 9);

    this.planForm.reset({
      name: 'Nuevo Plan B2B',
      billingType: 'manual',
      price: 0,
      maxBranches: 1,
      maxUsers: 3,
      maxActiveRegisters: 1,
      isActive: true,
      isCustom: false,
    });

    this.planForm.get('stripeProductId')?.setValue(randomId);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  savePlan() {
    if (this.planForm.invalid) return;

    // Obtener los valores crudos para incluir el stripeProductId que está disabled
    const formValue = { ...this.planForm.getRawValue() };
    this.loading = true;

    if (this.isEditing && this.currentEditId) {
      this.sysadminService.updatePlan(this.currentEditId, formValue).subscribe({
        next: () => {
          Swal.fire('Actualizado', 'Los límites han sido guardados.', 'success');
          this.cancelEdit();
          this.loadData();
        },
        error: () => {
          this.loading = false;
          Swal.fire('Error', 'No se pudo actualizar', 'error');
        },
      });
    } else {
      this.sysadminService.createPlan(formValue).subscribe({
        next: () => {
          Swal.fire('Configurado', 'Plan enlazado exitosamente al POS.', 'success');
          this.cancelEdit();
          this.loadData();
        },
        error: () => {
          this.loading = false;
          Swal.fire('Error', 'No se pudo configurar el plan', 'error');
        },
      });
    }
  }

  deletePlan(id: string) {
    Swal.fire({
      title: '¿Desvincular Plan?',
      text: 'Esto eliminará los límites asociados en el POS, pero NO borrará el producto de Stripe. Las empresas con el snapshot no se verán afectadas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desvincular',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.sysadminService.deletePlan(id).subscribe({
          next: () => {
            Swal.fire('Desvinculado', 'Límites eliminados del POS', 'success');
            this.loadData();
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar', 'error'),
        });
      }
    });
  }
}
