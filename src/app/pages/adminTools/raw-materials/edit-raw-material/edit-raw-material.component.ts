import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RawMaterialsService, RawMaterial } from 'src/app/services/raw-materials.service';
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
    private rawMaterialsService: RawMaterialsService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.rawMaterialId = this.route.snapshot.paramMap.get('id')!;
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      measurementUnit: ['g', Validators.required],
      description: ['']
    });
    this.loadRawMaterial();
  }

  loadRawMaterial(): void {
    this.rawMaterialsService.getRawMaterial(this.rawMaterialId).subscribe({
      next: (response) => {
        if (response && response.rawMaterial) {
          const rm = response.rawMaterial;
          this.editForm.patchValue({
            name: rm.name,
            measurementUnit: rm.measurementUnit || 'g',
            description: rm.description || ''
          });
        }
      },
      error: (error) => {
        console.error('Error fetching raw material', error);
        Swal.fire('Error', 'No se pudo cargar el material', 'error');
      }
    });
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

    const updatedMaterial: Partial<RawMaterial> = {
      name: this.editForm.value.name,
      measurementUnit: this.editForm.value.measurementUnit,
      description: this.editForm.value.description
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
        this.rawMaterialsService.updateRawMaterial(this.rawMaterialId, updatedMaterial).subscribe({
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
