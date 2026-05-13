import { Component } from '@angular/core';
import { productsStripe } from 'src/app/interfaces/stripeProduct.interface';

import { SubscriptionService } from 'src/app/services/subscription.service';

@Component({
  selector: 'app-select-subscriptions',
  templateUrl: './select-subscriptions.component.html',
  styleUrls: ['./select-subscriptions.component.css']
})
export class SelectSubscriptionsComponent {
  products: productsStripe[] = [];

  constructor(private subscriptionService: SubscriptionService) { }

  ngOnInit(): void {
    this.subscriptionService.getSubPlans()
    .subscribe(r=>{
      this.products = r!.data
    })
  }

  selectProduct(product: any) {
    // Lógica para manejar la selección del producto
    console.log('Producto seleccionado:', product);
  }
}
