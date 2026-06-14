import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RawMaterialsService, RawMaterial } from 'src/app/services/raw-materials.service';
import { AuthService } from 'src/app/services/auth.service';
import Swal from 'sweetalert2';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-raw-material-list',
  templateUrl: './raw-material-list.component.html',
  styleUrls: ['./raw-material-list.component.css'],
})
export class RawMaterialListComponent implements OnInit {
  rawMaterials: RawMaterial[] = [];

  constructor(
    private rawMaterialsService: RawMaterialsService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadRawMaterials();
  }

  loadRawMaterials(): void {
    const companyId = this.authService.companyId || this.authService.company?._id;
    if (!companyId) return;

    this.rawMaterialsService
      .getCompanyRawMaterials(companyId)
      .pipe(map((resp) => resp.rawMaterials || []))
      .subscribe({
        next: (items) => {
          this.rawMaterials = items;
        },
        error: (err) => {
          console.error('Error loading raw materials:', err);
        },
      });
  }

  editRawMaterial(id: string): void {
    this.router.navigate(['dashboard/admin/raw-materials/edit/', id]);
  }

  createRawMaterial(): void {
    this.router.navigate(['dashboard/admin/raw-materials/new']);
  }

  deleteRawMaterial(id: string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el insumo maestro del catálogo de la compañía',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.rawMaterialsService.deleteRawMaterial(id).subscribe({
          next: () => {
            this.rawMaterials = this.rawMaterials.filter((item) => item._id !== id);
            Swal.fire('¡Eliminado!', 'El insumo maestro ha sido eliminado.', 'success');
          },
          error: (error) => {
            console.error('Error eliminando material', error);
            Swal.fire('Error', 'Hubo un problema al eliminar el insumo.', 'error');
          },
        });
      }
    });
  }
}
