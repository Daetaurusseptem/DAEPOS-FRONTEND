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
  cashRegisters: any[] = [];
  
  // Pagination and Filtering
  currentPage = 1;
  limit = 10;
  totalPages = 1;
  totalRegisters = 0;
  filterDate: string = '';
  loading = false;
  selectedCajaId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cashRegisterService: CashRegisterService
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('userId')!;
    this.loadHistory();
  }

  loadHistory(page: number = 1): void {
    this.currentPage = page;
    this.loading = true;
    
    const filters: any = { page: this.currentPage, limit: this.limit };
    if (this.filterDate) {
      filters.date = this.filterDate;
    }

    this.cashRegisterService.getUserRegistersHistory(this.userId, filters).subscribe({
      next: (response: any) => {
        this.cashRegisters = response.cashRegisters || [];
        this.totalRegisters = response.total || 0;
        this.totalPages = response.totalPages || 1;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.loadHistory(1);
  }

  clearFilter(): void {
    this.filterDate = '';
    this.loadHistory(1);
  }

  cambiarPagina(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.loadHistory(page);
    }
  }

}
