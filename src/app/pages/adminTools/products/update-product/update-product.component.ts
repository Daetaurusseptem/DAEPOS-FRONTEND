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
  inventoryItem: any;
  inventoryItems: any[] = [];
  isCompanyAdmin: boolean = false;
  id: string = '';
  Categories: Category[] = [];
  suppliers: Supplier[] = [];
  recipes: Recipe[] = [];
  empresas!: Company[];
  isComposite: boolean = false;
  activeTab: 'catalog' | 'inventory' = 'catalog';
  productPlaceholder = 'assets/img/product_placeholder.png'; // Definiremos esto en el HTML

  productForm: FormGroup = this.fb.group({
    // Catálogo
    categories: [[], Validators.required],
    name: ['', Validators.required],
    description: [''],
    brand: ['', Validators.required],
    supplier: ['', Validators.required],
    isComposite: [false, Validators.required],
    isSellable: [true],
    recipe: [''],
    // Inventario
    barCode: [''],
    stock: [0, [Validators.required, Validators.min(0)]],
    costPrice: [0, [Validators.required, Validators.min(0)]],
    sellingPrice: [0, [Validators.required, Validators.min(0)]],
    unitOfMeasure: ['unit', Validators.required],
    expirationDate: [''],
    receivedDate: [''],
  });

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
    private modalService: ModalService,
  ) {
    this.isCompanyAdmin = this.authService.role === 'companyAdmin' || this.authService.role === 'sysadmin';
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      this.id = params['id'];
      this.loadProductData();
      this.loadCategories();
      this.loadSuppliers();
      this.loadRecipes();
    });

    this.loadCompanies();
  }

  loadCompanies() {
    this.companyService
      .getCompanies()
      .pipe(map((res) => res.companies))
      .subscribe((empresas) => (this.empresas = empresas!));
  }

  loadCategories() {
    this.categoryService
      .getCompanyCategories(this.authService.companyId)
      .pipe(map((res) => res.categories))
      .subscribe((categories) => (this.Categories = categories!));
  }

  loadSuppliers() {
    this.supplierService
      .getCompanySuppliers(this.authService.companyId)
      .pipe(map((res) => res.suppliers))
      .subscribe((suppliers) => (this.suppliers = suppliers!));
  }

  loadRecipes() {
    this.recipeService
      .getCompanyRecipes(this.authService.companyId)
      .pipe(map((res) => res.recipes))
      .subscribe((recipes) => (this.recipes = recipes!));
  }

  loadProductData() {
    this.productService.getProduct(this.id).subscribe({
      next: (res: any) => {
        if (!res.product) return;
        this.product = res.product;
        this.inventoryItem = res.inventoryItem;
        this.inventoryItems = res.inventoryItems || [];
        this.isComposite = this.product.isComposite;

        // Poblar formulario con datos combinados
        this.productForm.patchValue({
          categories: this.product.categories?.map((c: any) => (typeof c === 'object' ? c._id : c)) || [],
          name: this.product.name,
          description: this.product.description,
          brand: this.product.brand,
          supplier: typeof this.product.supplier === 'object' ? this.product.supplier._id : this.product.supplier,
          isComposite: this.product.isComposite,
          isSellable: this.product.isSellable !== undefined ? this.product.isSellable : true,
          recipe: this.product.recipe || '',
          // Datos de Inventario
          barCode: this.inventoryItem?.barCode || '',
          stock: this.inventoryItem?.stock || 0,
          costPrice: this.inventoryItem?.costPrice || 0,
          sellingPrice: this.inventoryItem?.sellingPrice || 0,
          unitOfMeasure: this.inventoryItem?.measurement || 'unit',
          expirationDate: this.inventoryItem?.expirationDate ? this.inventoryItem.expirationDate.split('T')[0] : '',
          receivedDate: this.inventoryItem?.receivedDate ? this.inventoryItem.receivedDate.split('T')[0] : '',
        });

        // Bloquear campos inmutables
        this.productForm.get('isComposite')?.disable();
        this.productForm.get('recipe')?.disable();
        this.productForm.get('stock')?.disable(); // El stock no se edita directamente

        if (this.isCompanyAdmin) {
          this.productForm.get('barCode')?.disable();
          this.productForm.get('costPrice')?.disable();
          this.productForm.get('sellingPrice')?.disable();
          this.productForm.get('unitOfMeasure')?.disable();
          this.productForm.get('expirationDate')?.disable();
          this.productForm.get('receivedDate')?.disable();
        }
      },
      error: (err: any) => console.error('Error loading product', err),
    });
  }

  setTab(tab: 'catalog' | 'inventory') {
    this.activeTab = tab;
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
          this.productService.updateProduct(this.product._id!, this.productForm.value).subscribe({
            next: (response: any) => {
              Swal.fire('¡Actualizado!', 'El producto ha sido actualizado correctamente.', 'success');
              if (this.authService.role === 'admin') {
                this.router.navigateByUrl('/dashboard/admin/products');
              } else if (this.authService.role === 'sysadmin') {
                this.router.navigateByUrl(`/dashboard/sysadmin/companies`);
              }
            },
            error: (error: any) => {
              console.error('Error al actualizar producto', error);
              Swal.fire('¡Error!', 'Hubo un problema al actualizar el producto.', 'error');
            },
          });
        }
      });
    }
  }

  campoNoValido(campo: string): boolean {
    const control = this.productForm.get(campo);
    return !!control && control.invalid && control.touched;
  }

  abrirModal(element: Product, tipo: 'empresas' | 'usuarios' | 'productos') {
    const { _id } = element;
    this.modalService.abrirModal(element.img, tipo, _id!);
  }
}
