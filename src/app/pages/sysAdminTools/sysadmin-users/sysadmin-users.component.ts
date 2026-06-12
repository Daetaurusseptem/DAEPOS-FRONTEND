import { Component, OnInit } from '@angular/core';
import { UsersService } from 'src/app/services/users.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sysadmin-users',
  templateUrl: './sysadmin-users.component.html',
  styleUrls: ['./sysadmin-users.component.css']
})
export class SysadminUsersComponent implements OnInit {
  loading: boolean = true;
  users: any[] = [];
  activeTab: 'owners' | 'sysadmins' = 'owners';

  constructor(private usersService: UsersService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    // Asumiendo que podemos traer ambos o usar getAllAdmins para owners.
    // Vamos a crear/usar endpoints para tener claridad.
    // getAllAdmins ya retorna admins.
    if (this.activeTab === 'owners') {
      this.usersService.getAllAdmins().subscribe({
        next: (res: any) => {
          this.users = res.users;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
    } else {
      // Endpoint para sysadmins no existe aún, agregaremos una lógica similar.
      this.usersService.getAllSysadmins().subscribe({
        next: (res: any) => {
          this.users = res.users;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
    }
  }

  switchTab(tab: 'owners' | 'sysadmins') {
    this.activeTab = tab;
    this.loadUsers();
  }

  softBlockUser(user: any) {
    const isActivating = user.active === false;
    const actionText = isActivating ? 'Reactivar' : 'Bloquear';
    
    Swal.fire({
      title: `¿${actionText} Usuario?`,
      text: isActivating ? 'El usuario volverá a tener acceso al sistema.' : 'El usuario perderá acceso a la plataforma (Soft Block).',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${actionText}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Asumimos un endpoint para toggle block
        this.usersService.toggleUserBlock(user._id, !isActivating).subscribe({
          next: () => {
            Swal.fire('Éxito', `Usuario ${isActivating ? 'reactivado' : 'bloqueado'}`, 'success');
            this.loadUsers();
          },
          error: () => Swal.fire('Error', 'No se pudo completar la acción', 'error')
        });
      }
    });
  }
}
