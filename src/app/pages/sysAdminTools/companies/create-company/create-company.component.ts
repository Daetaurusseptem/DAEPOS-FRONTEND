import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { CompanyService } from 'src/app/services/company.service';
import { User, Company } from 'src/app/interfaces/models.interface';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { UsersService } from 'src/app/services/users.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-create-company',
  templateUrl: './create-company.component.html',
  styleUrls: ['./create-company.component.css']
})
export class CreateCompanyComponent implements OnInit {
  adminUsers: User[] = [];

  

  empresa: Company = {
    name: '',
    adminId: '',
    img: '',
    description: '',
    address: '',
    tel: '',
    email: '',
    createdAt: new Date(), 
    SuscriptionsHistory: [],
    saleType: 'retail'
  };

  constructor(
                private companyService: CompanyService,
                private router:Router,
                private userService:UsersService
                ) {}


ngOnInit(): void {

  

  this.userService.availableAdmins()
  .pipe(map(r=>r.users))
  .subscribe(availableAdmins => {
    console.log(availableAdmins);
    this.adminUsers = availableAdmins!
  });

}                

  createCompany(form: NgForm) {
    if (form.valid) {
      this.companyService.createCompany(this.empresa).subscribe({
        next: (createdCompany) => {
          Swal.fire({
            text:'Empresa creada correctament',
            icon:'success'
          })
          .then(()=>{
            this.router.navigateByUrl('/dashboard/sysadmin/companies')
          })
        },
        error: (error) => {
          Swal.fire({
            title:'Error al crear la empresa',
            icon:'error'
          })
        }
      });
    }
  }


}
