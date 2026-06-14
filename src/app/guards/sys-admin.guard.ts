import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const sysAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.role == 'sysadmin') {
    return true;
  } else {
    router.navigateByUrl('/dashboard');
    return false;
  }
};
