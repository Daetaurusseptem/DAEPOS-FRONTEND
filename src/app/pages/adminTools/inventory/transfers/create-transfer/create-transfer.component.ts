import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Branch, Product, UserRole } from 'src/app/interfaces/models.interface';
import { AuthService } from 'src/app/services/auth.service';
import { BranchService } from 'src/app/services/branch.service';
import { ProductService } from 'src/app/services/product.service';
import { StockTransferService } from 'src/app/services/stock-transfer.service';
import { InventoryService } from 'src/app/services/inventory.service';
import { LoggerService } from 'src/app/services/logger.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-stock-transfer',
  templateUrl: './create-transfer.component.html',
  styleUrls: ['./create-transfer.component.css'],
})
export class CreateStockTransferComponent implements OnInit {
  companyId!: string;
  branches: Branch[] = [];
  products: any[] = [];
  availableStock: number = 0;
  loadingStock: boolean = false;

  transfer = {
    product: '',
    fromBranch: '',
    toBranch: '',
    quantity: 0,
    notes: '',
  };

  submitting = false;

  constructor(
    private authService: AuthService,
    private branchService: BranchService,
    private productService: ProductService,
    private transferService: StockTransferService,
    private inventoryService: InventoryService,
    private router: Router,
    private logger: LoggerService,
  ) {}

  ngOnInit(): void {
    this.companyId = (this.authService.companyId || this.authService.company?._id) as string;
    if (!this.companyId) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadInitialData();
  }

  checkStock() {
    if (this.transfer.product && this.transfer.fromBranch) {
      this.loadingStock = true;
      this.inventoryService
        .getStockByProductAndBranch(this.transfer.product, this.transfer.fromBranch, this.companyId)
        .subscribe({
          next: (resp: any) => {
            this.availableStock = resp.stock || 0;
            this.loadingStock = false;
          },
          error: () => {
            this.availableStock = 0;
            this.loadingStock = false;
          },
        });
    }
  }

  loadInitialData() {
    // Cargar Sucursales
    this.branchService.getBranchesByCompany(this.companyId).subscribe({
      next: (resp: any) => {
        if (resp.ok) this.branches = resp.branches;
      },
    });

    // Cargar Productos
    this.productService.getCompanyProducts(this.companyId).subscribe({
      next: (resp: any) => {
        this.logger.log('Productos cargados:', resp);
        if (resp.ok) this.products = resp.products || [];
      },
      error: (err: any) => console.error('Error cargando productos:', err),
    });
  }

  onSubmit() {
    if (this.transfer.fromBranch === this.transfer.toBranch) {
      Swal.fire('Error', 'La sucursal de origen y destino deben ser diferentes', 'error');
      return;
    }

    if (this.transfer.quantity <= 0) {
      Swal.fire('Error', 'La cantidad debe ser mayor a cero', 'error');
      return;
    }

    this.submitting = true;
    const payload = {
      ...this.transfer,
      company: this.companyId,
      createdBy: this.authService.idUsuario,
    };

    this.transferService.createTransfer(payload).subscribe({
      next: (resp: any) => {
        this.submitting = false;
        if (resp.ok) {
          Swal.fire('Éxito', 'Traspaso realizado correctamente', 'success');
          this.router.navigate(['/dashboard/admin/inventory']);
        }
      },
      error: (err: any) => {
        this.submitting = false;
        Swal.fire('Error', err.error.message || 'Error al procesar el traspaso', 'error');
      },
    });
  }
}
