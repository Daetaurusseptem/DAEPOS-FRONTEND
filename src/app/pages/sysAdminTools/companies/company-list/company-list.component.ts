import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { Company, Suscription } from 'src/app/interfaces/models.interface';
import { CompanyService } from 'src/app/services/company.service';
import { ModalService } from 'src/app/services/modal.service';
import { UtilitiesService } from 'src/app/services/utilities.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-company-list',
  templateUrl: './company-list.component.html',
  styleUrls: ['./company-list.component.css']
})
export class CompanyListComponent implements OnInit {
  empresas!: Company[];

  constructor(
              private companyService: CompanyService,
              private utilitiesService: UtilitiesService,
              private modalService: ModalService,
              
              ) {}

  ngOnInit(): void {
    this.companyService.getCompanies()
    .pipe(
      map(item=>{
        
        return item.companies
      })
    )
    .subscribe(empresas=>{
      this.empresas = empresas!;
    });
  }

  getLatestSubscription(empresa: Company): Suscription | undefined {
    if (empresa.SuscriptionsHistory && empresa.SuscriptionsHistory.length > 0) {
      return empresa.SuscriptionsHistory.reduce((latest, current) => {
        return (new Date(latest.cutOffDate) > new Date(current.cutOffDate)) ? latest : current;
      });
    }
    return undefined;
  }

  deleteCompany(id:string){
    Swal.fire({
      title:'Esta Seguro?',
      text:'Este proceso no se podrá deshacer',
      icon:'warning',
      showCancelButton:true,
      cancelButtonColor:'#F56A52',
      iconColor:'#F56A52',
      allowEnterKey:false

    })
    .then(resp=>{
      if(resp.isConfirmed){
        this.companyService.deleteCompany(id)
        .subscribe(resp=>{
          if(resp.ok==true){
            Swal.fire({
              title:'Registro eliminado',
              icon:'success'
            })
          }else if(resp.ok==false){
            Swal.fire({
              title:'El registro no pudo ser eliminado',
              icon:'error'
            })

          }

          this.utilitiesService.redirectTo(`/dashboard/sysadmin/companies`)
        }, err=>{
          Swal.fire({
            title:'Registro no eliminado',
            icon:'error',
            text:err.error.msg
          })
        })
      }
    })
  }
  abrirModal( company:Company  ) {
    const {_id} = company
    this.modalService.abrirModal(company.img,'empresas',_id!);
  }
}
