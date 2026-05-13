import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CashRegisterService } from '../services/cash-register.service';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CashRegisterGuard implements CanActivate {

  constructor(
    private cashRegisterService: CashRegisterService,
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> | boolean {
    const userId = this.authService.usuario.id;
    return this.cashRegisterService.hasOpenCashRegister(userId).pipe(
      map(hasOpen => {
        if (hasOpen) {
          
          this.router.navigate(['/dashboard/user/home']);

          return false;
        }
        return true;
      })
    );
  }
}
