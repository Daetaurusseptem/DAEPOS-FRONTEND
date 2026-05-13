import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CashRegisterService } from 'src/app/services/cash-register.service';

@Component({
  selector: 'app-fecha-cajas',
  templateUrl: './fecha-cajas.component.html',
  styleUrls: ['./fecha-cajas.component.css']
})
export class FechaCajasComponent implements OnInit {
  userId!: string;
  fecha!: string;
  cajas: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cashRegisterService: CashRegisterService
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('userId')!;
    this.fecha = this.route.snapshot.paramMap.get('fecha')!;
    this.loadCajas();
  }

  loadCajas(): void {
    console.log(this.fecha);
    this.cashRegisterService.getUserCashRegistersByDate(this.userId, this.fecha).subscribe((response) => {
      console.log(response.cajas);
      this.cajas = response.cajas;
    });
  }

  navigateToCajaDetalle(cajaId: string): void {
    this.router.navigate([`/dashboard/admin/cajas/${cajaId}`]);
  }
}
