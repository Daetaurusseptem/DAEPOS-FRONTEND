import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.development';
import { InventoryResponse } from 'src/app/interfaces/InventoryResponse.interface';
import { map } from "rxjs/operators";

const apiURL = environment.apiUrl

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {

  constructor(
                private http:HttpClient
             ) { 

  }

  addSubscription(){
    return 'a'
  }



  getSubPlans(){
    return this.http.get<InventoryResponse>(`${apiURL}/subs`)
      .pipe(
        map(item=>{
          console.log(item);
          return item.stripeResponse
        })
      )
  }
}
