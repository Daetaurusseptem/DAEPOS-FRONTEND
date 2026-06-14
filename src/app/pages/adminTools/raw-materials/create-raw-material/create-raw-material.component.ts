import { Component, OnInit } from '@angular/core';
import { RawMaterialsService, RawMaterial } from 'src/app/services/raw-materials.service';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-raw-material',
  templateUrl: './create-raw-material.component.html',
  styleUrls: ['./create-raw-material.component.css'],
})
export class CreateRawMaterialComponent implements OnInit {
  newMaterial: RawMaterial = {
    name: '',
    description: '',
    measurementUnit: 'g',
  };

  constructor(
    private rawMaterialsService: RawMaterialsService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {}

  addRawMaterial() {
    const companyId = this.authService.companyId || this.authService.company?._id;
    if (!companyId) return;

    Swal.fire({
      title: '¿Deseas añadir este material?',
      text: 'Confirma la adición del nuevo insumo maestro al catálogo',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, añadir',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.rawMaterialsService.createRawMaterial(this.newMaterial, companyId).subscribe({
          next: (resp) => {
            if (resp.ok) {
              Swal.fire('¡Éxito!', 'Insumo maestro añadido correctamente', 'success').then(() => {
                this.router.navigate(['dashboard/admin/raw-materials']);
              });
            } else {
              Swal.fire('Error', resp.message || 'No se pudo añadir el material', 'error');
            }
          },
          error: (error) => {
            console.error('Error al añadir material:', error);
            Swal.fire('Error', 'No se pudo añadir el material', 'error');
          },
        });
      }
    });
  }
}
