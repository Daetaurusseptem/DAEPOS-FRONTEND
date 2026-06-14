import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 402) {
          // 402 Payment Required -> Suscripcion expirada
          if (!this.router.url.includes('/billing/expired')) {
            this.router.navigateByUrl('/dashboard/billing/expired');
          }
        } else if (error.status === 401) {
          // Token expirado o invalido
          localStorage.removeItem('token');
          this.router.navigateByUrl('/login');
        }
        return throwError(() => error);
      }),
    );
  }
}
