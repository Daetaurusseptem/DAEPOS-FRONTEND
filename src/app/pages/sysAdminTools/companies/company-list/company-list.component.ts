import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { Company, Suscription } from 'src/app/interfaces/models.interface';
import { CompanyService } from 'src/app/services/company.service';
import { SysadminService } from 'src/app/services/sysadmin.service';
import { UtilitiesService } from 'src/app/services/utilities.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-company-list',
  templateUrl: './company-list.component.html',
  styleUrls: ['./company-list.component.css']
})
export class CompanyListComponent implements OnInit {
  empresas: Company[] = [];
  loadingCompanies: boolean = false;

  constructor(
    private companyService: CompanyService,
    private sysadminService: SysadminService,
    private utilitiesService: UtilitiesService
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies() {
    this.loadingCompanies = true;
    this.companyService.getCompanies()
      .pipe(
        map(item => item.companies)
      )
      .subscribe({
        next: (empresas) => {
          this.empresas = empresas!;
          this.loadingCompanies = false;
        },
        error: () => {
          this.loadingCompanies = false;
        }
      });
  }

  getLatestSubscription(empresa: Company): Suscription | undefined {
    if (empresa.SubscriptionHistory && empresa.SubscriptionHistory.length > 0) {
      return empresa.SubscriptionHistory.reduce((latest, current) => {
        return new Date(current.cutOffDate) > new Date(latest.cutOffDate) ? current : latest;
      });
    }
    return undefined;
  }

  deleteCompany(id: string) {
    Swal.fire({
      title: '¿Desactivar Empresa?',
      text: 'Este proceso hará un soft-delete. La empresa, sus sucursales y usuarios quedarán inactivos.',
      icon: 'warning',
      showCancelButton: true,
      cancelButtonColor: '#737373',
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      allowEnterKey: false
    })
    .then(resp => {
      if(resp.isConfirmed) {
        Swal.fire({
          title: 'Procesando...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        this.companyService.deleteCompany(id)
        .subscribe({
          next: (resp: any) => {
            if(resp.ok) {
              Swal.fire({
                title: 'Empresa Desactivada',
                icon: 'success',
                confirmButtonColor: '#000'
              });
              this.loadCompanies(); // Recargar lista
            }
          }, 
          error: (err) => {
            Swal.fire({
              title: 'Error al desactivar',
              icon: 'error',
              text: err.error?.error || err.error?.msg || 'Error desconocido',
              confirmButtonColor: '#000'
            });
          }
        });
      }
    });
  }

  startImpersonation(company: Company) {
    Swal.fire({
      title: '¿Activar Asistencia Remota?',
      text: `Ingresarás de forma segura al panel operativo de "${company.name}" para asistirlos en tiempo real.`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Sí, asistir cliente',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#000000',
      cancelButtonColor: '#737373'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Conectando soporte...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.sysadminService.impersonateCompany(company._id!).subscribe({
          next: () => {
            Swal.close();
            // Refrescar página para aplicar la impersonación
            window.location.href = '/dashboard/admin';
          },
          error: (err) => {
            Swal.fire({
              title: 'Error de conexión',
              text: err.error?.msg || 'No se pudo iniciar el modo de soporte.',
              icon: 'error',
              confirmButtonColor: '#000'
            });
          }
        });
      }
    });
  }

  // --- Modals y Suscripciones ---
  showSubscriptionModal: boolean = false;
  selectedCompany: any = null;
  subscriptionFormData = {
    subscriptionStatus: 'active',
    planType: 'basic',
    currentPeriodEnd: '',
    manualOverride: false
  };

  openSubscriptionModal(company: any) {
    this.selectedCompany = company;
    this.subscriptionFormData = {
      subscriptionStatus: company.subscriptionStatus || 'trialing',
      planType: company.planType || 'basic',
      currentPeriodEnd: company.currentPeriodEnd ? new Date(company.currentPeriodEnd).toISOString().split('T')[0] : '',
      manualOverride: company.manualOverride || false
    };
    this.showSubscriptionModal = true;
  }

  closeSubscriptionModal() {
    this.showSubscriptionModal = false;
    this.selectedCompany = null;
  }

  updateSubscription() {
    if (!this.selectedCompany) return;

    this.sysadminService.updateCompanySubscriptionManual(this.selectedCompany._id, this.subscriptionFormData)
      .subscribe({
        next: (res) => {
          Swal.fire('Actualizado', 'La suscripción de la empresa ha sido actualizada.', 'success');
          this.closeSubscriptionModal();
          this.loadCompanies(); // Recargar la lista
        },
        error: (err) => {
          Swal.fire('Error', 'No se pudo actualizar la suscripción.', 'error');
        }
      });
  }
}
