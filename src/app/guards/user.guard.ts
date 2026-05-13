import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

export const userGuard: CanActivateFn = (route, state) => {
  
  const authService = inject(AuthService);
  const router = inject(Router);


  if(authService.role=='user'){
    return true;
    }else if(authService.role=='admin'){
      
      router.navigateByUrl('/dashboard/admin')
      return false
    }else if(authService.role=='sysadmin'){
      router.navigateByUrl('/dashboard/sysadmin')
      return false
    }else {
      router.navigateByUrl('/')
      return false
    }
  


  
};
