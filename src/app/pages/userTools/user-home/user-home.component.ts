import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { CashRegisterService } from 'src/app/services/cash-register.service';

@Component({
  selector: 'app-user-home',
  templateUrl: './user-home.component.html',
  styleUrls: ['./user-home.component.css']
})
export class UserHomeComponent {
  isOpenCashRegister: boolean = false;
  userName: string = '';
  branchName: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private cashRegisterService: CashRegisterService
  ) {
    this.userName = this.authService.usuario?.name || 'Cajero';
    this.branchName = this.authService.branch?.name || 'Mi Sucursal';
  }

  ngOnInit() {
    this.checkOpenCashRegister();
  }

  checkOpenCashRegister() {
    const userId = this.authService.usuario?.id || this.authService.idUsuario;
    this.cashRegisterService.hasOpenCashRegister(userId).subscribe((hasOpen) => {
      this.isOpenCashRegister = hasOpen;
    });
  }

  openCashRegister() {
    if (!this.isOpenCashRegister) {
      this.router.navigate(['dashboard/user/open-cash-register']);
    }
  }

  performSale() {
    if (this.isOpenCashRegister) {
      this.router.navigate(['dashboard/user/new-sale']);
    }
  }

  closeCashRegister() {
    if (this.isOpenCashRegister) {
      this.router.navigate(['dashboard/user/sales-success/close-cash-register']);
    }
  }

  viewDailySales() {
    this.router.navigate(['dashboard/user/daily-sales']);
  }

  viewItems() {
    this.router.navigate(['dashboard/user/inventory-available']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'a') {
      this.openCashRegister();
    } else if (event.key === 's' && this.isOpenCashRegister) {
      this.performSale();
    } else if (event.key === 'g' && this.isOpenCashRegister) {
      this.closeCashRegister();
    } else if (event.key === 'd') {
      this.viewDailySales();
    } else if (event.key === 'i') {
      this.viewItems();
    }
  }
}
