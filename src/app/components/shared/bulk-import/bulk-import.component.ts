import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import * as Papa from 'papaparse';
import { ProductService } from 'src/app/services/product.service';
import { SupplierService } from 'src/app/services/provider.service';
import { Supplier } from 'src/app/interfaces/models.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-bulk-import',
  templateUrl: './bulk-import.component.html',
  styleUrls: ['./bulk-import.component.css'],
})
export class BulkImportComponent {
  @Input() companyId!: string;
  @Output() importClosed = new EventEmitter<boolean>();

  parsedData: any[] = [];
  errors: any[] = [];
  suppliers: Supplier[] = [];
  isDragging = false;
  isProcessing = false;
  autoCreateCategories = true;
  supplierId = '';

  constructor(
    private productService: ProductService,
    private supplierService: SupplierService,
  ) {}

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.supplierService.getCompanySuppliers(this.companyId).subscribe((res) => {
      this.suppliers = res.suppliers || [];
      if (this.suppliers.length > 0) {
        this.supplierId = this.suppliers[0]._id as string; // Seleccionamos el primero por defecto
      }
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.handleFile(event.target.files[0]);
    }
  }

  handleFile(file: File) {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      Swal.fire('Error', 'Por favor selecciona un archivo CSV válido', 'error');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          Swal.fire('Atención', 'Hubo problemas leyendo algunas filas del CSV', 'warning');
        }

        // Mapeamos los datos a la estructura que espera nuestro backend
        this.parsedData = result.data.map((row: any) => ({
          barCode: row['SKU_Codigo'],
          name: row['Nombre'],
          brand: row['Marca'] || 'N/A',
          categoryName: row['Categoria'],
          costPrice: parseFloat(row['Precio_Compra']) || 0,
          sellingPrice: parseFloat(row['Precio_Venta']) || 0,
          stock: parseInt(row['Stock_Actual']) || 0,
          measurement: row['Unidad_Medida'] || 'unit',
        }));

        this.validateData();
      },
    });
  }

  validateData() {
    this.errors = [];
    this.parsedData.forEach((item, index) => {
      if (!item.barCode) this.errors.push(`Fila ${index + 1}: SKU_Codigo es obligatorio`);
      if (!item.name) this.errors.push(`Fila ${index + 1}: Nombre es obligatorio`);
    });
  }

  downloadTemplate() {
    const templateData = [
      {
        SKU_Codigo: '750123456789',
        Nombre: 'Coca Cola 600ml',
        Marca: 'Coca Cola',
        Categoria: 'Bebidas',
        Precio_Compra: '10.50',
        Precio_Venta: '15.00',
        Stock_Actual: '50',
        Unidad_Medida: 'unit',
      },
    ];

    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_productos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  uploadData() {
    if (this.errors.length > 0) {
      Swal.fire('No se puede cargar', 'Por favor corrige los errores antes de continuar', 'error');
      return;
    }

    this.isProcessing = true;
    const payload = {
      items: this.parsedData,
      autoCreateCategories: this.autoCreateCategories,
      supplierId: this.supplierId,
    };

    this.productService.bulkUploadProducts(this.companyId, payload).subscribe({
      next: (res) => {
        this.isProcessing = false;
        Swal.fire('Éxito', res.msg, 'success');
        this.importClosed.emit(true); // true indica que hubo cambios
      },
      error: (err) => {
        this.isProcessing = false;
        Swal.fire('Error', err.error?.msg || 'Error en la carga masiva', 'error');
      },
    });
  }

  closeModal() {
    this.importClosed.emit(false);
  }
}
