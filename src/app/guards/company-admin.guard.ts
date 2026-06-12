import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CompanyAdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ){}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.authService.role === 'companyAdmin' || this.authService.role === 'sysadmin') {
      return true;
    } else if (this.authService.role === 'admin' || this.authService.role === 'user') {
      this.router.navigateByUrl('/dashboard');
      return false;
    } else {
      this.router.navigateByUrl('/login');
      return false;
    }
  }
}
