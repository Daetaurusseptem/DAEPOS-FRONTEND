import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const userRole = this.authService.role; // Obtiene el rol del usuario desde el servicio

    if (userRole === 'companyAdmin') {
      // Redirecciona al dashboard de administrador si el rol es CompanyAdmin
      this.router.navigate(['/dashboard/admin']);
      return false; 
    } else if (userRole === 'admin') {
      // Redirecciona al dashboard de sucursal si el rol es Admin (Gerente)
      this.router.navigate(['/dashboard/branch']);
      return false;
    } else if (userRole === 'user') {
      // Redirecciona al dashboard del usuario si el rol es User
      this.router.navigate(['/dashboard/user']);
      return false;
    } else if(userRole === 'sysadmin'){
      // Redirecciona al login o a una página de error si el usuario no tiene un rol válido
      this.router.navigate(['/dashboard/sysadmin/users']);
      return false;
    }
    else{
      this.router.navigate(['/login']);
      return false;

    }
  }
}
