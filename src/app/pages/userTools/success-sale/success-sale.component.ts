import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-success-sale',
  templateUrl: './success-sale.component.html',
  styleUrls: ['./success-sale.component.css']
})
export class SuccessSaleComponent {
  constructor(private router: Router) {}

  goToNewSale(): void {
    this.router.navigate(['dashboard/user/new-sale']);
  }
  goToHome(): void {
    this.router.navigate(['dashboard/user']);
  }
  printTicket(): void {
    //this.router.navigate(['dashboard/user']);
  }
}
