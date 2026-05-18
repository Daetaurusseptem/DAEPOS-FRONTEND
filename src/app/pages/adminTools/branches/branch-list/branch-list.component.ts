import { Component, OnInit } from '@angular/core';
import { Branch } from 'src/app/interfaces/models.interface';
import { BranchService } from 'src/app/services/branch.service';
import { AuthService } from 'src/app/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-branch-list',
  templateUrl: './branch-list.component.html',
  styleUrls: ['./branch-list.component.css']
})
export class BranchListComponent implements OnInit {
  branches: Branch[] = [];
  isLoading = true;
  companyId: string = '';

  constructor(
    private branchService: BranchService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.companyId = this.authService.company?._id || '';
    this.loadBranches();
  }

  loadBranches() {
    this.isLoading = true;
    this.branchService.getBranchesByCompany(this.companyId).subscribe({
      next: (resp) => {
        this.branches = resp.branches;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  toggleStatus(branch: Branch) {
    const originalStatus = branch.isActive;
    branch.isActive = !branch.isActive;

    this.branchService.updateBranch(branch._id!, branch).subscribe({
      next: () => {
        Swal.fire('Actualizado', `Sucursal ${branch.name} ${branch.isActive ? 'activada' : 'desactivada'}`, 'success');
      },
      error: () => {
        branch.isActive = originalStatus;
        Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
      }
    });
  }

  deleteBranch(branch: Branch) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Eliminarás la sucursal ${branch.name}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.branchService.deleteBranch(branch._id!).subscribe({
          next: () => {
            this.branches = this.branches.filter(b => b._id !== branch._id);
            Swal.fire('Eliminado', 'La sucursal ha sido eliminada', 'success');
          },
          error: (err) => {
            Swal.fire('Error', 'No se pudo eliminar la sucursal', 'error');
          }
        });
      }
    });
  }
}
