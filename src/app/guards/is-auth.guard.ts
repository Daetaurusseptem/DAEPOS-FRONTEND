import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';

export const isAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.validarToken().pipe(
    tap((isAuth) => {
      if (!isAuth) {
        router.navigateByUrl('/login');
      }
    }),
  );
};
