import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { map } from 'rxjs';
import { InventoryItem } from 'src/app/interfaces/models.interface';
import { InventoryService } from 'src/app/services/inventory.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-raw-material',
  templateUrl: './edit-raw-material.component.html',
  styleUrls: ['./edit-raw-material.component.css']
})
export class EditRawMaterialComponent implements OnInit {

  editForm!: FormGroup;
  rawMaterialId!: string;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.rawMaterialId = this.route.snapshot.paramMap.get('id')!;
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
      costPrice: [0, [Validators.required, Validators.min(0)]],
      receivedDate: ['', Validators.required],
      expirationDate: [''],
      measurement: ['unit', Validators.required]
    });
    this.loadRawMaterial();
  }

  loadRawMaterial(): void {
    this.inventoryService.getInventoryItemById(this.rawMaterialId)
      .pipe(map(r => r.inventoryItem || r.item))
      .subscribe({
        next: (item) => {
          if (!item) return;
          const exp = item.expirationDate ? this.formatDate(item.expirationDate.toString()) : '';
          const rec = item.receivedDate ? this.formatDate(item.receivedDate.toString()) : '';
          this.editForm.patchValue({
            name: item.name,
            stock: item.stock,
            costPrice: item.costPrice,
            measurement: item.measurement || 'unit',
            expirationDate: exp,
            receivedDate: rec
          });
        },
        error: (error) => {
          console.error('Error fetching raw material', error);
          Swal.fire('Error', 'No se pudo cargar el material', 'error');
        }
      });
  }

  formatDate(isoString: string): string {
    return moment(isoString).format('YYYY-MM-DD');
  }

  regresarOrCancelar() {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas cancelar la edición?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, continuar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/dashboard/admin/raw-materials']);
      }
    });
  }

  onSubmit(): void {
    if (this.editForm.invalid) {
      Swal.fire('Formulario no válido', 'Por favor, completa los campos requeridos', 'warning');
      return;
    }

    const updatedMaterial: Partial<InventoryItem> = {
      ...this.editForm.value,
      expirationDate: this.editForm.value.expirationDate ? moment(this.editForm.value.expirationDate).toISOString() : null,
      receivedDate: moment(this.editForm.value.receivedDate).toISOString()
    };

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas actualizar este material?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.inventoryService.updateInventoryItem(this.rawMaterialId, updatedMaterial).subscribe({
          next: () => {
            Swal.fire('¡Actualizado!', 'El material ha sido actualizado correctamente', 'success');
            this.router.navigate(['/dashboard/admin/raw-materials']);
          },
          error: (error) => {
            console.error('Error actualizando material', error);
            Swal.fire('Error', 'No se pudo actualizar el material', 'error');
          }
        });
      }
    });
  }
}
