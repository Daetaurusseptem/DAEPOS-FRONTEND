import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { Category, Company, Product, Supplier, Recipe } from 'src/app/interfaces/models.interface';
import { AuthService } from 'src/app/services/auth.service';
import { CategoryService } from 'src/app/services/category.service';
import { CompanyService } from 'src/app/services/company.service';
import { ModalService } from 'src/app/services/modal.service';
import { ProductService } from 'src/app/services/product.service';
import { SupplierService } from 'src/app/services/provider.service';
import { RecipesService } from 'src/app/services/recipes.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-update-product',
  templateUrl: './update-product.component.html',
  styleUrls: ['./update-product.component.css'],
})
export class UpdateProductComponent implements OnInit {
  product!: Product;
  id: string = '';
  Categories: Category[] = [];
  suppliers: Supplier[] = [];
  recipes: Recipe[] = [];
  empresas!: Company[];
  isComposite: boolean = false;

  constructor(
    private companyService: CompanyService,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private router: Router,
    private categoryService: CategoryService,
    private authService: AuthService,
    private productService: ProductService,
    private supplierService: SupplierService,
    private recipeService: RecipesService,
    private modalService: ModalService
  ) {
    if (this.authService.role == 'admin') {
      this.activatedRoute.params.subscribe((params) => {
        this.id = params['id'];
        this.getProduct(this.id);
        this.loadCategories();
        this.loadSuppliers();
        this.loadRecipes();
      });
    } else if (this.authService.role == 'sysadmin') {
      this.activatedRoute.params.subscribe((params) => {
        this.id = params['id'];
        this.productService
          .getProduct(this.id)
          .pipe(
            map((item) => {
              return item.product;
            })
          )
          .subscribe((product) => {
            this.product = product!;
            this.isComposite = this.product.isComposite;
            this.loadCategories();
            this.loadSuppliers();
            this.loadRecipes();
            this.productForm.setValue({
              categories: this.product.categories!,
              name: this.product.name,
              description: this.product.description,
              brand: this.product.brand,
              supplier: this.product.supplier,
              isComposite: this.product.isComposite,
              recipe: this.product.recipe || '',
            });
          });
      });
    }
  }

  productForm: FormGroup = this.fb.group({
    categories: [[], Validators.required],
    name: ['', Validators.required],
    description: ['', Validators.required],
    brand: ['', Validators.required],
    supplier: ['', Validators.required],
    isComposite: [false, Validators.required],
    recipe: [''],
  });

  ngOnInit(): void {
    this.companyService
      .getCompanies()
      .pipe(
        map((item) => {
          return item.companies;
        })
      )
      .subscribe((empresas) => {
        this.empresas = empresas!;
      });
  }

  loadCategories() {
    this.categoryService
      .getCompanyCategories(this.authService.companyId)
      .pipe(
        map((item) => {
          return item.categories;
        })
      )
      .subscribe((categories) => {
        this.Categories = categories!;
      });
  }

  loadSuppliers() {
    this.supplierService
      .getCompanySuppliers(this.authService.companyId)
      .pipe(
        map((item) => {
          console.log(item);
          return item.suppliers;
        })
      ) 
      .subscribe((suppliers) => {
        
        this.suppliers = suppliers!;
      });
  }

  loadRecipes() {
    this.recipeService
      .getCompanyRecipes(this.authService.companyId)
      .pipe(
        map((item) => {
          return item.recipes;
        })
      )
      .subscribe((recipes) => {
        this.recipes = recipes!;
      });
  }

  getProduct(id: string) {
    return this.productService
      .getProduct(id)
      .pipe(
        map((item) => {
          return item.product;
        })
      )
      .subscribe((product) => {
        this.product = product!;
        this.isComposite = this.product.isComposite;
        console.log(product);
        this.productForm.setValue({
          categories: this.product.categories!,
          name: this.product.name,
          description: this.product.description,
          brand: this.product.brand,
          supplier: this.product.supplier._id,
          isComposite: this.product.isComposite,
          recipe: this.product.recipe || null,
        });
      });
  }

  onIsCompositeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value === 'true';
    this.isComposite = value;
    if (!value) {
      this.productForm.get('recipe')!.setValue('');
    }
  }

  updateProduct() {
    if (this.productForm.valid) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: 'Se actualizará el producto.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, actualizar',
      }).then((result) => {
        if (result.isConfirmed) {
          this.productService
            .updateProduct(this.product._id!, this.productForm.value)
            .subscribe(
              (response) => {
                Swal.fire(
                  '¡Actualizado!',
                  'El producto ha sido actualizado correctamente.',
                  'success'
                );
                if (this.authService.role === 'admin') {
                  this.router.navigateByUrl('/dashboard/admin/products');
                } else if (this.authService.role === 'sysadmin') {
                  this.router.navigateByUrl(`/dashboard/sysadmin/companies`);
                }
              },
              (error) => {
                console.error('Error al actualizar producto', error);
                Swal.fire(
                  '¡Error!',
                  'Hubo un problema al actualizar el producto.',
                  'error'
                );
              }
            );
        }
      });
    }
  }

  campoNoValido(campo: string): boolean {
    const control = this.productForm.get(campo);
    return !!control && control.invalid && control.touched;
  }

  abrirModal(
    element: Product,
    tipo: 'empresas' | 'usuarios' | 'productos'
  ) {
    const { _id } = element;
    this.modalService.abrirModal(element.img, tipo, _id!);
  }
}
