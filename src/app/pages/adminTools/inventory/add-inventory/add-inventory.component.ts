import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { Product, InventoryItem } from 'src/app/interfaces/models.interface';
import { AuthService } from 'src/app/services/auth.service';
import { InventoryService } from 'src/app/services/inventory.service';
import { ProductService } from 'src/app/services/product.service';
import { RawMaterialsService } from 'src/app/services/raw-materials.service';
import { BranchService } from 'src/app/services/branch.service';
import { SupplierService } from 'src/app/services/provider.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-inventory',
  templateUrl: './add-inventory.component.html',
  styleUrls: ['./add-inventory.component.css']
})
export class AddInventoryComponent implements OnInit {

  inventoryForm!: FormGroup;
  companyId!: string;
  userRole!: string;
  
  // Products
  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedProduct: any;

  // Raw Materials
  rawMaterials: any[] = [];
  filteredRawMaterials: any[] = [];
  selectedRawMaterial: any;

  // Branches
  branches: any[] = [];

  // Suppliers
  suppliers: any[] = [];

  // Selection toggle
  itemType: 'product' | 'raw_material' = 'product';

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private inventoryService: InventoryService,
    private rawMaterialsService: RawMaterialsService,
    private branchService: BranchService,
    private supplierService: SupplierService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.companyId = this.authService.companyId || this.authService.company?._id || '';
    this.userRole = this.authService.role || '';
    
    if (!this.companyId) {
      this.router.navigateByUrl('/dashboard');
      return;
    }

    this.inventoryForm = this.fb.group({
      name: ['', Validators.required],
      barCode: [''],
      product: [''],
      rawMaterial: [''],
      branch: ['', Validators.required],
      supplier: [''],
      stock: [0, [Validators.required, Validators.min(0)]],
      costPrice: [0, [Validators.required, Validators.min(0)]],
      sellingPrice: [0, [Validators.required, Validators.min(0)]],
      measurement: ['unit', Validators.required],
      expirationDate: [''],
      receivedDate: [new Date().toISOString().substring(0, 10), Validators.required],
      modifications: this.fb.array([])
    });

    // Auto-fill branch for managers/users
    if (this.userRole === 'admin' || this.userRole === 'user') {
      const bId = this.authService.branch?._id || this.authService.branch || '';
      this.inventoryForm.patchValue({ branch: bId });
    }

    this.loadInitialProducts();
    this.loadRawMaterials();
    this.loadSuppliers();
    
    if (this.userRole === 'companyAdmin') {
      this.loadBranches();
    }
    
    this.setupFormValidators();
  }

  get modifications(): FormArray {
    return this.inventoryForm.get('modifications') as FormArray;
  }

  addModification(): void {
    const modificationGroup = this.fb.group({
      name: ['', Validators.required],
      extraPrice: [0, [Validators.required, Validators.min(0)]],
      isExclusive: [false, Validators.required],
      rawMaterial: [''],
      quantityToDeduct: [0, [Validators.min(0)]]
    });
    this.modifications.push(modificationGroup);
  }

  removeModification(index: number): void {
    this.modifications.removeAt(index);
  }

  setItemType(type: 'product' | 'raw_material'): void {
    this.itemType = type;
    this.setupFormValidators();
    
    // Clear selections
    this.selectedProduct = null;
    this.selectedRawMaterial = null;
    this.inventoryForm.patchValue({
      name: '',
      product: '',
      rawMaterial: '',
      measurement: 'unit',
      sellingPrice: 0
    });
    
    // Clear formarray modifications
    while (this.modifications.length !== 0) {
      this.modifications.removeAt(0);
    }
  }

  setupFormValidators(): void {
    const productControl = this.inventoryForm.get('product');
    const rawMaterialControl = this.inventoryForm.get('rawMaterial');
    const sellingPriceControl = this.inventoryForm.get('sellingPrice');
    
    if (this.itemType === 'product') {
      productControl?.setValidators([Validators.required]);
      rawMaterialControl?.clearValidators();
      sellingPriceControl?.setValidators([Validators.required, Validators.min(0)]);
    } else {
      rawMaterialControl?.setValidators([Validators.required]);
      productControl?.clearValidators();
      sellingPriceControl?.clearValidators();
    }
    
    productControl?.updateValueAndValidity();
    rawMaterialControl?.updateValueAndValidity();
    sellingPriceControl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.inventoryForm.valid) {
      const newItem: Partial<InventoryItem> = {
        ...this.inventoryForm.value,
        company: this.companyId
      };

      // Si es materia prima, borrar explícitamente el campo producto
      if (this.itemType === 'raw_material') {
        delete (newItem as any).product;
      } else {
        delete (newItem as any).rawMaterial;
      }

      Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Quieres guardar este registro de inventario?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, guardar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.inventoryService.createInventoryItem(newItem).subscribe({
            next: (resp: any) => {
              if (resp.ok) {
                Swal.fire('¡Registro Guardado!', '', 'success');
                this.router.navigateByUrl('/dashboard/admin/inventory');
              } else {
                Swal.fire('Error', resp.msg || 'Hubo un problema al guardar el registro', 'error');
              }
            },
            error: (error: any) => {
              console.error('Error al crear item de inventario', error);
              Swal.fire('Error', 'Hubo un error inesperado', 'error');
            }
          });
        }
      });
    }
  }

  loadInitialProducts(): void {
    this.productService.searchProductCompany('', 1, 10, this.companyId)
      .pipe(map((response: any) => response.products))
      .subscribe((products: any) => {
        this.products = products || [];
        this.filteredProducts = products || [];
      });
  }

  onSearchProduct(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    if (searchTerm) {
      this.productService.searchProductCompany(searchTerm, 1, 10, this.companyId)
        .pipe(map((response: any) => response.products))
        .subscribe((products: any) => {
          this.filteredProducts = products || [];
        });
    } else {
      this.loadInitialProducts();
    }
  }

  onSelectProduct(product: Product): void {
    this.selectedProduct = product;
    this.inventoryForm.patchValue({ 
      product: product._id,
      name: product.name 
    });
    this.filteredProducts = [];
    
    // Auto-select supplier if the product has one
    if (product.supplier) {
      this.inventoryForm.patchValue({ supplier: product.supplier });
    }
  }

  loadRawMaterials(): void {
    this.rawMaterialsService.getCompanyRawMaterials(this.companyId)
      .pipe(map(resp => resp.rawMaterials || []))
      .subscribe(items => {
        this.rawMaterials = items;
        this.filteredRawMaterials = items;
      });
  }

  onSearchRawMaterial(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    if (searchTerm) {
      this.filteredRawMaterials = this.rawMaterials.filter(rm => 
        rm.name.toLowerCase().includes(searchTerm)
      );
    } else {
      this.filteredRawMaterials = [...this.rawMaterials];
    }
  }

  onSelectRawMaterial(rawMaterial: any): void {
    this.selectedRawMaterial = rawMaterial;
    this.inventoryForm.patchValue({ 
      rawMaterial: rawMaterial._id,
      name: rawMaterial.name,
      measurement: rawMaterial.measurementUnit
    });
    this.filteredRawMaterials = [];
  }

  loadSuppliers(): void {
    this.supplierService.getCompanySuppliers(this.companyId).subscribe(resp => {
      this.suppliers = resp.items || [];
    });
  }

  loadBranches(): void {
    this.branchService.getBranchesByCompany(this.companyId).subscribe(resp => {
      if (resp.ok) {
        this.branches = resp.branches || [];
      }
    });
  }
}
