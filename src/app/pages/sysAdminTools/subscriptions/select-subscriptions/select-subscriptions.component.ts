import { Component } from '@angular/core';
import { productsStripe } from 'src/app/interfaces/stripeProduct.interface';

import { SubscriptionService } from 'src/app/services/subscription.service';
import { LoggerService } from '../../../../services/logger.service';

@Component({
  selector: 'app-select-subscriptions',
  templateUrl: './select-subscriptions.component.html',
  styleUrls: ['./select-subscriptions.component.css'],
})
export class SelectSubscriptionsComponent {
  products: productsStripe[] = [];

  constructor(
    private subscriptionService: SubscriptionService,
    private logger: LoggerService,
  ) {}

  ngOnInit(): void {
    this.subscriptionService.getSubPlans().subscribe((r) => {
      this.products = r!.data;
    });
  }

  selectProduct(product: any) {
    // Lógica para manejar la selección del producto
    this.logger.log('Producto seleccionado:', product);
  }
}
