import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CashRegisterService } from 'src/app/services/cash-register.service';

@Component({
  selector: 'app-user-cajas',
  templateUrl: './user-cajas.component.html',
  styleUrls: ['./user-cajas.component.css']
})
export class UserCajasComponent implements OnInit {
  userId!: string;
  fechasConCajas: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cashRegisterService: CashRegisterService
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('userId')!;
    console.log(this.userId);
    this.loadUserCashDates();
  }

  loadUserCashDates(): void {
    this.cashRegisterService.getUserCajasByDate(this.userId).subscribe((response) => {
      console.log(response);
      this.fechasConCajas = response.fechas;
    });
  }

  navigateToCajasPorFecha(fecha: string): void {
    this.router.navigate([`/dashboard/admin/users/${this.userId}/cajas/${fecha}`]);
  }
}
