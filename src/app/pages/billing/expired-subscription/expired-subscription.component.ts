
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-expired-subscription',
  templateUrl: './expired-subscription.component.html',
  styleUrls: ['./expired-subscription.component.css']
})
export class ExpiredSubscriptionComponent implements OnInit {

  constructor(private router: Router, public authService: AuthService) { }

  ngOnInit(): void {
  }

  get isCompanyAdmin(): boolean {
    const role = this.authService.usuario?.role;
    return role === 'companyAdmin' || role === 'sysadmin';
  }

  pagarSuscripcion() {
    // Redirigir a la pantalla de billing real (donde implementaremos Stripe checkout)
    this.router.navigateByUrl('/dashboard/admin/billing');
  }

  cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('menu');
    this.router.navigateByUrl('/login');
  }
}

