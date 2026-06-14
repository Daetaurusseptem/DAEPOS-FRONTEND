import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { Category, Product, Recipe, Supplier } from 'src/app/interfaces/models.interface';
import { AuthService } from 'src/app/services/auth.service';
import { CategoryService } from 'src/app/services/category.service';
import { ModalService } from 'src/app/services/modal.service';
import { ProductService } from 'src/app/services/product.service';
import { SupplierService } from 'src/app/services/provider.service';

import { RecipesService } from 'src/app/services/recipes.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-product',
  templateUrl: './create-product.component.html',
  styleUrls: ['./create-product.component.css'],
})
export class CreateProductComponent implements OnInit {
  suppliers!: Supplier[];
  Categories!: Category[];
  recipes!: Recipe[];
  companyId = '';
  isComposite = false;

  productForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private categoryService: CategoryService,
    private supplierService: SupplierService,
    private productService: ProductService,
    private recipeService: RecipesService,
    private modal: ModalService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    if (this.authService.usuario.role === 'sysadmin') {
      this.activatedRoute.params.subscribe((params) => {
        this.companyId = params['id'];
      });
    } else {
      this.companyId = this.authService.companyId;
    }

    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      brand: ['', Validators.required],
      supplier: [''],
      categories: [[], Validators.required],
      isComposite: [false, Validators.required],
      recipe: [''],
      // Campos de Inventario Unificados
      barCode: [''],
      stock: [0, [Validators.required, Validators.min(0)]],
      costPrice: [0, [Validators.required, Validators.min(0)]],
      sellingPrice: [0, [Validators.required, Validators.min(0)]],
      unitOfMeasure: ['unit', Validators.required],
    });

    this.loadCategories();
    this.loadSuppliers();
    this.loadRecipes();

    // Suscribirse a los cambios en el campo isComposite
    this.productForm.get('isComposite')!.valueChanges.subscribe((value) => {
      this.isComposite = value;
      const supplierControl = this.productForm.get('supplier');

      if (value) {
        // Es compuesto: quitamos proveedor
        supplierControl!.clearValidators();
        supplierControl!.setValue(null);
      } else {
        // Es simple: quitamos receta, requerimos proveedor
        this.productForm.get('recipe')!.setValue('');
        supplierControl!.setValidators([Validators.required]);
      }
      supplierControl!.updateValueAndValidity();
    });

    // Set initial state
    this.productForm.get('supplier')!.setValidators([Validators.required]);
    this.productForm.get('supplier')!.updateValueAndValidity();
  }

  loadCategories() {
    this.categoryService
      .getCompanyCategories(this.companyId)
      .pipe(map((item) => item.categories))
      .subscribe((categories: any) => {
        this.Categories = categories!;
      });
  }

  loadSuppliers() {
    this.supplierService
      .getCompanySuppliers(this.companyId)
      .pipe(map((item) => item.suppliers))
      .subscribe((suppliers: any) => {
        this.suppliers = suppliers!;
      });
  }

  loadRecipes() {
    this.recipeService
      .getCompanyRecipes(this.companyId)
      .pipe(map((item) => item.recipes))
      .subscribe((recipes: any) => {
        this.recipes = recipes!;
      });
  }

  onIsCompositeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value === 'true';
    this.isComposite = value;
    if (!value) {
      this.productForm.get('recipe')!.setValue('');
    }
  }

  onSubmit() {
    if (this.productForm.valid) {
      Swal.fire({
        title: 'Crear Producto',
        text: '¿Estás seguro de crear este producto?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí',
        cancelButtonText: 'No',
      }).then((res) => {
        if (res.isConfirmed) {
          const formValue = { ...this.productForm.value };
          if (!this.isComposite || !formValue.recipe) {
            delete formValue.recipe;
          }
          this.productService.createProduct(this.companyId, formValue).subscribe({
            next: (r: any) => {
              if (r.ok) {
                Swal.fire('Registro Guardado', '', 'success');
                this.router.navigate(['/dashboard/admin/products']);
              } else {
                Swal.fire('Registro No Guardado', '', 'error');
              }
            },
            error: (error: any) => {
              console.error('Error al crear producto', error);
              Swal.fire('Error', 'Hubo un problema al crear el producto', 'error');
            },
          });
        }
      });
    }
  }
}
