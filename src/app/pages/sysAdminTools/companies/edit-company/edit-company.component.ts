import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { Company } from 'src/app/interfaces/models.interface';
import { CompanyService } from 'src/app/services/company.service';
import {  map} from "rxjs/operators";
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-company',
  templateUrl: './edit-company.component.html',
  styleUrls: ['./edit-company.component.css']
})
export class EditCompanyComponent {

  company!:Company;
  id:string='';


  
companyForm:FormGroup = this.fb.group({
  name:['',Validators.required], // Inicializa con un string vacío o datos existentes
  description: ['',Validators.required],
  address: ['',Validators.required],
  tel: ['',Validators.required],
  email: ['',Validators.required]
}
);

  constructor(
                private companyService:CompanyService,
                private activatedRoute:ActivatedRoute,
                private fb:FormBuilder,
                private router:Router
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

                    this.companyForm.setValue({
                      name: this.company.name,
                      description:this.company.description,
                      address:this.company.address,
                      tel:this.company.tel,
                      email:this.company.email

                    })
                  })
                  
}


  updateCompany() {
    if (this.companyForm.valid) {
      console.log('Empresa actualizada:', this.companyForm.value);
      // Aquí iría el código para enviar los datos actualizados a un servicio o backend
      
  
    Swal.fire({
      title:'estas seguro?',
      icon:'question',
      showCancelButton:true,
      cancelButtonColor:'#F176B7'
    })
    .then(resp=>{
      if(resp.isConfirmed){
        this.companyService.updateCompany(this.company._id!, this.companyForm.value)
        .subscribe(r=>{
          this.router.navigateByUrl('/dashboard/sysadmin/companies')
        })
      }
    })
    .catch(r=>{return })

    }
  }

  campoNoValidoDatosUsuario(campo:string):boolean{
    if ( this.companyForm.get(campo)?.invalid) {
      return true;
    } else {
      return false;
    }
  }
}
