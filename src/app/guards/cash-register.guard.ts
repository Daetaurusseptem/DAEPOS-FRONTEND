import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { CashRegisterService } from '../services/cash-register.service';
import { AuthService } from '../services/auth.service';

export const cashRegisterGuard: CanActivateFn = () => {
  const cashRegisterService = inject(CashRegisterService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const userId = authService.usuario.id;
  return cashRegisterService.hasOpenCashRegister(userId).pipe(
    map((hasOpen) => {
      if (hasOpen) {
        router.navigate(['/dashboard/user/home']);
        return false;
      }
      return true;
    }),
  );
};
