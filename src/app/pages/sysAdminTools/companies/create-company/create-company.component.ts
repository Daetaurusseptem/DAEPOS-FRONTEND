import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SysadminService } from 'src/app/services/sysadmin.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-company',
  templateUrl: './create-company.component.html',
  styleUrls: ['./create-company.component.css']
})
export class CreateCompanyComponent implements OnInit {
  
  onboardingData = {
    companyName: '',
    companyAddress: '',
    companyTel: '',
    companyEmail: '',
    saleType: 'retail',
    branchName: 'Sucursal Principal',
    branchAddress: '',
    branchTel: '',
    username: '',
    email: '',
    password: '',
    name: '',
    planId: ''
  };
  
  plans: any[] = [];
  submittingOnboarding: boolean = false;

  constructor(
    private sysadminService: SysadminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sysadminService.getPlans().subscribe(resp => {
      if (resp.ok) {
        this.plans = resp.plans;
      }
    });
  }

  submitExpressOnboarding(form: any) {
    if (form.invalid) return;

    this.submittingOnboarding = true;
    Swal.fire({
      title: 'Creando comercio...',
      text: 'Configurando empresa, sucursal principal y cuenta de administrador.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Copiar la dirección de la empresa a la sucursal si está vacía
    if (!this.onboardingData.branchAddress) {
      this.onboardingData.branchAddress = this.onboardingData.companyAddress;
    }
    if (!this.onboardingData.branchTel) {
      this.onboardingData.branchTel = this.onboardingData.companyTel;
    }

    this.sysadminService.onboardCompanyExpress(this.onboardingData).subscribe({
      next: (resp: any) => {
        Swal.fire({
          title: '¡Onboarding Completado!',
          text: `La empresa "${resp.company.name}" ha sido creada exitosamente.`,
          icon: 'success',
          confirmButtonColor: '#000'
        }).then(() => {
          this.router.navigate(['/dashboard/sysadmin/companies']);
        });
        this.submittingOnboarding = false;
      },
      error: (err) => {
        Swal.fire({
          title: 'Error en onboarding',
          text: err.error?.msg || 'Ocurrió un error inesperado durante el onboarding.',
          icon: 'error',
          confirmButtonColor: '#000'
        });
        this.submittingOnboarding = false;
      }
    });
  }
}
