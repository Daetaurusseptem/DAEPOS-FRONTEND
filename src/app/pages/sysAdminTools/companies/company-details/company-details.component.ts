import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { Company, User } from 'src/app/interfaces/models.interface';
import { CompanyService } from 'src/app/services/company.service';
import { SysadminService } from 'src/app/services/sysadmin.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-company-details',
  templateUrl: './company-details.component.html',
  styleUrls: ['./company-details.component.css']
})
export class CompanyDetailsComponent implements OnInit {
  company!: Company;
  admin!: User;
  id: string = '';
  telemetry: any = null;
  loading: boolean = true;
  invoices: any[] = [];
  loadingInvoices: boolean = true;
  availablePlans: any[] = [];

  constructor(
    private companyService: CompanyService,
    private sysadminService: SysadminService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {  
      this.id = params['id'];
      if (this.id) {
        this.loadCompanyData();
      }
    });
  }

  loadCompanyData() {
    this.loading = true;
    this.loadingInvoices = true;
    
    // 1. Obtener datos básicos de la empresa
    this.companyService.getCompany(this.id)
      .pipe(map(item => item.company))
      .subscribe({
        next: (company) => {
          this.company = company!;
          
          // 2. Cargar telemetría SaaS
          this.sysadminService.getCompanyTelemetry(this.id).subscribe({
            next: (resp) => {
              if (resp.ok) {
                this.telemetry = resp.telemetry;
              }
              this.loading = false;
            },
            error: () => this.loading = false
          });

          // 3. Cargar facturas de Stripe
          this.sysadminService.getCompanyInvoices(this.id).subscribe({
            next: (resp) => {
              if (resp.ok) {
                this.invoices = resp.invoices;
              }
              this.loadingInvoices = false;
            },
            error: () => this.loadingInvoices = false
          });

          // 4. Cargar Tiers Disponibles
          this.sysadminService.getPlans().subscribe(resp => {
            if (resp.ok) this.availablePlans = resp.plans;
          });
        },
        error: () => {
          this.loading = false;
          this.loadingInvoices = false;
        }
      });
  }

  assignPlan(planId: string) {
    if (!planId) return;

    Swal.fire({
      title: '¿Asignar Tier a la Empresa?',
      text: 'Se tomará un "Snapshot" de los límites actuales del Plan seleccionado y se inyectarán en la empresa de forma permanente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, Asignar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.showLoading();
        this.sysadminService.updateCompanySubscriptionManual(this.id, { planId }).subscribe({
          next: () => {
            Swal.fire('Asignado', 'El plan y sus límites (Snapshot) han sido inyectados.', 'success');
            this.loadCompanyData();
          },
          error: (err) => {
            Swal.fire('Error', err.error?.msg || 'No se pudo asignar el plan', 'error');
          }
        });
      }
    });
  }

  impersonateCompany() {
    Swal.fire({
      title: '¿Iniciar Soporte Remoto?',
      text: `Entrarás temporalmente a la cuenta de ${this.company.name}. Para salir, usa el botón "Salir de Soporte" en el menú superior.`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Sí, entrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#007bff'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Conectando...',
          allowOutsideClick: false,
          didOpen: () => { Swal.showLoading(); }
        });
        
        this.sysadminService.impersonateCompany(this.id).subscribe({
          next: () => {
            Swal.close();
            // Redirección manejada en el servicio
          },
          error: (err) => {
            Swal.fire('Error', err.error?.msg || 'No se pudo iniciar la sesión remota. Verifica que tengan un administrador asignado.', 'error');
          }
        });
      }
    });
  }

  suspendCompany() {
    const isCurrentlyActive = this.telemetry?.isActive;
    const actionWord = isCurrentlyActive ? 'Suspender' : 'Reactivar';
    const warningText = isCurrentlyActive 
      ? 'Esto bloqueará el acceso a todos los usuarios, gerentes y cajeros de esta empresa inmediatamente. (Soft Delete)'
      : 'Esto reactivará el acceso para todos los usuarios de la empresa.';

    Swal.fire({
      title: `¿${actionWord} Empresa?`,
      text: warningText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${actionWord}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: isCurrentlyActive ? '#dc3545' : '#198754'
    }).then((result) => {
      if (result.isConfirmed) {
        if (isCurrentlyActive) {
          // Soft Delete (Suspender)
          this.companyService.deleteCompany(this.id).subscribe({
            next: () => {
              Swal.fire('Suspendida', 'La empresa ha sido suspendida exitosamente.', 'success');
              this.loadCompanyData();
            },
            error: () => Swal.fire('Error', 'No se pudo suspender la empresa.', 'error')
          });
        } else {
          // Reactivar (necesitaría endpoint si se requiere, de momento informamos)
          Swal.fire('Aviso', 'La reactivación manual debe hacerse actualizando la base de datos o el endpoint respectivo.', 'info');
        }
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);
  }
}
