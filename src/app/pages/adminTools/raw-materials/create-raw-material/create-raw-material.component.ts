import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs';
import { InventoryItem, Supplier } from 'src/app/interfaces/models.interface';
import { AuthService } from 'src/app/services/auth.service';
import { InventoryService } from 'src/app/services/inventory.service';
import { SupplierService } from 'src/app/services/provider.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-raw-material',
  templateUrl: './create-raw-material.component.html',
  styleUrls: ['./create-raw-material.component.css']
})
export class CreateRawMaterialComponent implements OnInit {
  rawMaterials: InventoryItem[] = [];
  suppliers: Supplier[] = [];

  newMaterial: Partial<InventoryItem> = {
    name: '',
    stock: 0,
    costPrice: 0,
    measurement: 'kg',
    receivedDate: new Date().toISOString().substring(0, 10),
    company: ''
  };

  constructor(
    private inventoryService: InventoryService,
    private supplierService: SupplierService,
    private authService: AuthService,
    private router: Router,
  ) { }

  ngOnInit() {
    this.getSuppliers();
  }

  getSuppliers() {
    const companyId = this.authService.companyId || this.authService.company?._id;
    if (!companyId) return;

    this.supplierService.getCompanySuppliers(companyId)
      .pipe(map(resp => resp.suppliers || []))
      .subscribe({
        next: (data) => {
          this.suppliers = data;
        },
        error: (err) => console.error('Error fetching suppliers:', err)
      });
  }

  addRawMaterial() {
    this.newMaterial.company = this.authService.companyId || this.authService.company?._id || '';
    
    Swal.fire({
      title: '¿Deseas añadir este material?',
      text: 'Confirma la adición del nuevo material de inventario',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, añadir',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.inventoryService.createInventoryItem(this.newMaterial)
          .subscribe({
            next: (resp) => {
              if (resp.ok) {
                Swal.fire('¡Éxito!', 'Material añadido correctamente', 'success').then(() => {
                  this.router.navigate(['dashboard/admin/raw-materials']);
                });
              } else {
                Swal.fire('Error', resp.msg || 'No se pudo añadir el material', 'error');
              }
            },
            error: (error) => {
              console.error('Error al añadir material:', error);
              Swal.fire('Error', 'No se pudo añadir el material', 'error');
            }
          });
      }
    });
  }
}
