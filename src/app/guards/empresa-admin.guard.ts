import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CompanyService } from '../services/company.service';
import { UsersService } from '../services/users.service';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import Swal from 'sweetalert2';

export const empresaAdminGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const empresasService = inject(CompanyService);
  const userService = inject(UsersService);
  const logger = inject(LoggerService);

  logger.log('compañia permiso guard');

  let empresaId = route.params['idEmpresa'];
  empresaId = route.params['usuarioId'];
  logger.log(empresaId);

  let hasPermission = false;
  userService.isAdmin(empresaId, authService.usuario.id).subscribe((resp) => {
    hasPermission = resp.ok!;
  });

  if (!hasPermission) {
    Swal.fire({
      title: 'Empresa no existente o sin permisos',
      icon: 'error',
    });
    logger.log('No Permitida');
    router.navigateByUrl('/');
    return false;
  } else {
    logger.log('Permitida');
    return true;
  }
};
