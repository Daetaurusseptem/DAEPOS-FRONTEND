import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

export const kitchenGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (
    authService.role === 'kitchen' ||
    authService.role === 'admin' ||
    authService.role === 'companyAdmin' ||
    authService.role === 'sysadmin'
  ) {
    return true;
  } else if (authService.role === 'user') {
    router.navigateByUrl('/dashboard/user');
    return false;
  } else {
    router.navigateByUrl('/');
    return false;
  }
};
