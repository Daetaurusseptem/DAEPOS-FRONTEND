import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const logger = inject(LoggerService);

  logger.log(authService.role);

  if (
    authService.role === 'admin' ||
    authService.role === 'sysadmin' ||
    authService.role === 'companyAdmin'
  ) {
    return true;
  } else if (authService.role === 'user') {
    router.navigateByUrl('/dashboard');
    return false;
  } else {
    router.navigateByUrl('/login');
    return false;
  }
};
