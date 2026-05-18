import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { Product, InventoryItem } from 'src/app/interfaces/models.interface';
import { AuthService } from 'src/app/services/auth.service';
import { InventoryService } from 'src/app/services/inventory.service';
import { ProductService } from 'src/app/services/product.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-inventory',
  templateUrl: './add-inventory.component.html',
  styleUrls: ['./add-inventory.component.css']
})
export class AddInventoryComponent implements OnInit {

  inventoryForm!: FormGroup;
  companyId!: string;
  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedProduct: any;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private inventoryService: InventoryService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.companyId = this.authService.companyId || this.authService.company?._id || '';
    
    if (!this.companyId) {
      this.router.navigateByUrl('/dashboard');
      return;
    }

    this.inventoryForm = this.fb.group({
      name: ['', Validators.required],
      barCode: [''],
      product: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
      costPrice: [0, [Validators.required, Validators.min(0)]],
      sellingPrice: [0, [Validators.required, Validators.min(0)]],
      measurement: ['unit', Validators.required],
      expirationDate: [''],
      receivedDate: [new Date().toISOString().substring(0, 10), Validators.required],
      modifications: this.fb.array([])
    });

    this.loadInitialProducts();
  }

  get modifications(): FormArray {
    return this.inventoryForm.get('modifications') as FormArray;
  }

  addModification(): void {
    const modificationGroup = this.fb.group({
      name: ['', Validators.required],
      extraPrice: [0, [Validators.required, Validators.min(0)]],
      isExclusive: [false, Validators.required]
    });
    this.modifications.push(modificationGroup);
  }

  removeModification(index: number): void {
    this.modifications.removeAt(index);
  }

  onSubmit(): void {
    if (this.inventoryForm.valid) {
      const newItem: Partial<InventoryItem> = {
        ...this.inventoryForm.value,
        company: this.companyId
      };

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
  }
}
