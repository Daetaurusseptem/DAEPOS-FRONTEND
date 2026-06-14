import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.development';
import { InventoryResponse } from 'src/app/interfaces/InventoryResponse.interface';
import { map } from 'rxjs/operators';
import { LoggerService } from './logger.service';

const apiURL = environment.apiUrl;

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  constructor(private http: HttpClient, private logger: LoggerService) {}

  addSubscription() {
    return 'a';
  }

  getSubPlans() {
    return this.http.get<InventoryResponse>(`${apiURL}/subs`).pipe(
      map((item) => {
        this.logger.log(item);
        return item.stripeResponse;
      }),
    );
  }
}
