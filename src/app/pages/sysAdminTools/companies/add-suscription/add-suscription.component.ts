import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Company, Suscription } from 'src/app/interfaces/models.interface';
import { CompanyService } from 'src/app/services/company.service';
import { SubscriptionService } from 'src/app/services/subscription.service';

import { map } from "rxjs/operators";


@Component({
  selector: './app-add-subscription',
  templateUrl: './add-suscription.component.html',
  styleUrls: ['./add-suscription.component.css']
})
export class AddSubscriptionComponent {

onSubmit() {
throw new Error('Method not implemented.');
}
  company!:Company;
  id:string='';

  subscription: Suscription = {
    month: '',
    cutOffDate: new Date(),
    state: 'Activo',
    amountPaid: 0,
    Paymethod: '',
    payReference: ''
  };


  constructor(
                private companyService:CompanyService,
                private activatedRoute:ActivatedRoute,
                private router:Router,
                private subscriptionService:SubscriptionService
              ){
                this.activatedRoute.params.subscribe(params=>{
                  this.id= params['id'];  
                  this.getCompany(this.id);
                })
              }
              
               getCompany(id:string){
                return this.companyService.getCompany(id)
                .pipe(
                  map(item=>{
                    return item.company
                  })
                  )
                  .subscribe(company=>{
                    
                    this.company =company!;

                  })
                  
}

}
