import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { User, Branch, UserRole } from 'src/app/interfaces/models.interface';
import { AuthService } from 'src/app/services/auth.service';
import { UsersService } from 'src/app/services/users.service';
import { BranchService } from 'src/app/services/branch.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-edit',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.css']
})
export class UserEditComponent implements OnInit {
  user!: User;
  id: string = '';
  userRole!: UserRole;
  companyId!: string;
  branches: Branch[] = [];

  availablePermissions = [
    { id: 'inventory_management', name: 'Gestión de Inventario' },
    { id: 'sales_reports', name: 'Ver Reportes de Ventas' },
    { id: 'customer_management', name: 'Gestión de Clientes' }
  ];

  userForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''], // Opcional, solo si desea cambiarla
    role: ['user', Validators.required],
    branch: ['']
  });

  constructor(
    private userService: UsersService,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private branchService: BranchService
  ) {
    this.userRole = this.authService.role;
    this.companyId = this.authService.companyId || '';
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      this.id = params['id'];
      this.getUser(this.id);
    });

    if (this.userRole === 'companyAdmin' || this.userRole === 'sysadmin') {
      this.loadBranches();
    }
  }

  loadBranches() {
    // Si es sysadmin, es posible que necesitemos la compañía del usuario a editar.
    // Para simplificar, cargamos las sucursales cuando sepamos la compañía del usuario.
    if (this.companyId) {
      this.branchService.getBranchesByCompany(this.companyId).subscribe({
        next: (resp: any) => {
          if (resp.ok) {
            this.branches = resp.branches;
          }
        }
      });
    }
  }

  loadBranchesForCompany(compId: string) {
    this.branchService.getBranchesByCompany(compId).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.branches = resp.branches;
        }
      }
    });
  }

  getUser(id: string) {
    const userOb$ = this.userRole === 'admin' 
      ? this.userService.getUserByIdAdminCompany(id) 
      : this.userService.getUserById(id);

    userOb$.pipe(
      map(item => item.user)
    ).subscribe({
      next: (user) => {
        this.user = user!;
        
        // Si no tiene permisos definidos, inicializar vacío
        if (!this.user.permissions) {
          this.user.permissions = [];
        }

        // Si es sysadmin, podemos cargar las sucursales de la compañía del usuario que estamos editando
        if (this.userRole === 'sysadmin' && this.user.companyId) {
          this.loadBranchesForCompany(this.user.companyId);
        }

        // Extraer id de sucursal si viene poblada como objeto
        const branchId = this.user.branch 
          ? (typeof this.user.branch === 'object' ? (this.user.branch as any)._id : this.user.branch) 
          : '';

        this.userForm.patchValue({
          name: this.user.name,
          username: this.user.username,
          email: this.user.email,
          role: this.user.role || 'user',
          branch: branchId
        });
      },
      error: (err) => {
        console.error('Error al cargar el usuario:', err);
        Swal.fire('Error', 'No se pudo cargar el usuario', 'error');
      }
    });
  }

  togglePermission(permId: string) {
    if (!this.user.permissions) {
      this.user.permissions = [];
    }
    const idx = this.user.permissions.indexOf(permId);
    if (idx === -1) {
      this.user.permissions.push(permId);
    } else {
      this.user.permissions.splice(idx, 1);
    }
  }

  updateUser() {
    if (this.userForm.valid) {
      const formValue = { ...this.userForm.value };
      
      // Si la contraseña está vacía, no la enviamos para no sobreescribirla
      if (!formValue.password || formValue.password.trim() === '') {
        delete formValue.password;
      }

      const payload = {
        ...formValue,
        permissions: this.user.permissions || []
      };

      Swal.fire({
        title: '¿Estás seguro?',
        text: 'Se actualizarán los datos del usuario.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, guardar',
        cancelButtonText: 'Cancelar'
      }).then(result => {
        if (result.isConfirmed) {
          this.userService.updateUser(this.user._id!, payload).subscribe({
            next: () => {
              Swal.fire('Guardado', 'El usuario ha sido actualizado correctamente.', 'success').then(() => {
                if (this.userRole === 'sysadmin') {
                  this.router.navigateByUrl('/dashboard/sysadmin/users');
                } else {
                  this.router.navigateByUrl('/dashboard/admin/users');
                }
              });
            },
            error: (err) => {
              console.error('Error al actualizar el usuario:', err);
              Swal.fire('Error', err.error?.msg || 'Hubo un problema al actualizar el usuario.', 'error');
            }
          });
        }
      });
    }
  }

  campoNoValidoDatosUsuario(campo: string): boolean {
    const control = this.userForm.get(campo);
    return control ? control.invalid && control.touched : false;
  }
}
