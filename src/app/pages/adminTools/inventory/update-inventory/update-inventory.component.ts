import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import * as moment from 'moment';
import { InventoryItem } from 'src/app/interfaces/models.interface';
import { InventoryService } from 'src/app/services/inventory.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-update-inventory',
  templateUrl: './update-inventory.component.html',
  styleUrls: ['./update-inventory.component.css']
})
export class UpdateInventoryComponent implements OnInit {

  inventoryId!: string;
  inventoryItem!: InventoryItem;
  inventoryForm: FormGroup;

  constructor(
    private inventoryService: InventoryService,
    private fb: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.inventoryForm = this.fb.group({
      name: ['', Validators.required],
      barCode: [''],
      stock: [0, [Validators.required, Validators.min(0)]],
      costPrice: [0, [Validators.required, Validators.min(0)]],
      sellingPrice: [0, [Validators.required, Validators.min(0)]],
      measurement: ['unit', Validators.required],
      expirationDate: ['', Validators.required],
      receivedDate: ['', Validators.required],
      modifications: this.fb.array([])
    });
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      this.inventoryId = params['id'];
      this.loadInventoryItem();
    });
  }

  loadInventoryItem() {
    this.inventoryService.getInventoryItemById(this.inventoryId)
      .pipe(map(response => response.inventoryItem || response.item))
      .subscribe(item => {
        if (!item) return;
        this.inventoryItem = item;
        const exp = item.expirationDate ? this.formatDate(item.expirationDate.toString()) : '';
        const rec = item.receivedDate ? this.formatDate(item.receivedDate.toString()) : '';
        this.inventoryForm.patchValue({
          name: item.name,
          barCode: item.barCode || '',
          stock: item.stock,
          costPrice: item.costPrice,
          sellingPrice: item.sellingPrice,
          measurement: item.measurement,
          expirationDate: exp,
          receivedDate: rec,
        });
        this.setModifications(item.modifications || []);
      });
  }

  formatDate(isoString: string): string {
    return moment(isoString).format('YYYY-MM-DD');
  }

  get modifications(): FormArray {
    return this.inventoryForm.get('modifications') as FormArray;
  }

  setModifications(modifications: any[]) {
    this.modifications.clear();
    modifications.forEach(mod => {
      this.modifications.push(this.fb.group({
        name: [mod.name, Validators.required],
        extraPrice: [mod.extraPrice, [Validators.required, Validators.min(0)]],
        isExclusive: [mod.isExclusive || false, Validators.required]
      }));
    });
  }

  addModification() {
    this.modifications.push(this.fb.group({
      name: ['', Validators.required],
      extraPrice: [0, [Validators.required, Validators.min(0)]],
      isExclusive: [false, Validators.required]
    }));
  }

  removeModification(index: number) {
    this.modifications.removeAt(index);
  }

  updateInventory() {
    if (this.inventoryForm.valid) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Quieres actualizar este ítem de inventario?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, actualizar',
        cancelButtonText: 'Cancelar'
      }).then(response => {
        if (response.isConfirmed) {
          const updatedItem = {
            ...this.inventoryForm.value,
            expirationDate: moment(this.inventoryForm.value.expirationDate).toISOString(),
            receivedDate: moment(this.inventoryForm.value.receivedDate).toISOString(),
          };
          this.inventoryService.updateInventoryItem(this.inventoryId, updatedItem).subscribe({
            next: () => {
              Swal.fire('¡Actualizado!', 'El inventario ha sido actualizado correctamente', 'success');
              this.router.navigateByUrl('/dashboard/admin/inventory');
            },
            error: (err) => {
              console.error('Error al actualizar inventario', err);
              Swal.fire('Error', 'Hubo un problema al actualizar el inventario', 'error');
            }
          });
        }
      });
    }
  }
}
