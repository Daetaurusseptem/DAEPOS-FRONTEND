

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardGuard implements CanActivate {
  constructor(
              private router:Router,
              private authService:AuthService
              ){}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot) {
      return this.authService.validarToken()
      .pipe(
        tap(isAuth => {
          if (!isAuth){
            this.router.navigateByUrl('/login');
            
          }


        })
      );
  }
  canLoad(route: Route, segments: UrlSegment[]) {
    return this.authService.validarToken()
    .pipe(
      tap(isAuth => {
        if (!isAuth){
          this.router.navigateByUrl('/login');
          console.log('no podes');
        }
      }))
  }

}
