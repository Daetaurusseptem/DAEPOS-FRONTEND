import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { StockTransferService } from 'src/app/services/stock-transfer.service';

@Component({
  selector: 'app-stock-transfer-list',
  templateUrl: './stock-transfer-list.component.html',
  styleUrls: ['./stock-transfer-list.component.css']
})
export class StockTransferListComponent implements OnInit {
  transfers: any[] = [];
  companyId!: string;
  loading = true;

  constructor(
    private transferService: StockTransferService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.companyId = (this.authService.companyId || this.authService.company?._id) as string;
    if (this.companyId) {
      this.loadTransfers();
    }
  }

  loadTransfers() {
    this.loading = true;
    this.transferService.getTransfersByCompany(this.companyId).subscribe({
      next: (resp: any) => {
        this.loading = false;
        if (resp.ok) {
          this.transfers = resp.transfers;
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error cargando traspasos:', err);
      }
    });
  }
}
