import { Component, OnInit, OnDestroy } from '@angular/core';
import { SysadminService } from 'src/app/services/sysadmin.service';
import { CompanyService } from 'src/app/services/company.service';
import { Company } from 'src/app/interfaces/models.interface';
import Swal from 'sweetalert2';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-sysadmin-dashboard',
  templateUrl: './sysadmin-dashboard.component.html',
  styleUrls: ['./sysadmin-dashboard.component.css']
})
export class SysadminDashboardComponent implements OnInit, OnDestroy {
  activeTab: string = 'control-tower';

  // Metrics & Live Feed
  metrics: any = {
    gmv: 0,
    activeCompanies: 0,
    totalErrors: 0,
    openRegisters: 0
  };
  liveFeed: any[] = [];
  autoRefreshSub?: Subscription;

  // Companies List
  companies: Company[] = [];
  loadingCompanies: boolean = false;

  // Error Logs
  errors: any[] = [];
  errorsTotal: number = 0;
  errorsPage: number = 1;
  errorsPages: number = 1;
  loadingErrors: boolean = false;
  expandedErrorId?: string;

  // Express Onboarding Form
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
    name: ''
  };
  submittingOnboarding: boolean = false;

  constructor(
    private sysadminService: SysadminService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.loadControlTowerData();
    this.loadCompanies();
    this.loadSystemErrors();

    // Auto-refresh control tower metrics every 20 seconds
    this.autoRefreshSub = interval(20000).subscribe(() => {
      if (this.activeTab === 'control-tower') {
        this.loadControlTowerData();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.autoRefreshSub) {
      this.autoRefreshSub.unsubscribe();
    }
  }

  // Cargar métricas en tiempo real y flujo de actividades
  loadControlTowerData() {
    this.sysadminService.getGlobalMetrics().subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.metrics = resp.metrics;
          this.liveFeed = resp.liveFeed || [];
        }
      }
    });
  }

  // Cargar empresas registradas
  loadCompanies() {
    this.loadingCompanies = true;
    this.companyService.getCompanies().subscribe({
      next: (resp: any) => {
        this.companies = resp.companies || [];
        this.loadingCompanies = false;
      },
      error: () => {
        this.loadingCompanies = false;
      }
    });
  }

  // Cargar log de errores del sistema
  loadSystemErrors() {
    this.loadingErrors = true;
    this.sysadminService.getSystemErrors(this.errorsPage, 10).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.errors = resp.errors || [];
          this.errorsTotal = resp.total;
          this.errorsPages = resp.pages;
        }
        this.loadingErrors = false;
      },
      error: () => {
        this.loadingErrors = false;
      }
    });
  }

  changeErrorsPage(page: number) {
    if (page >= 1 && page <= this.errorsPages) {
      this.errorsPage = page;
      this.loadSystemErrors();
    }
  }

  toggleExpandError(id: string) {
    this.expandedErrorId = this.expandedErrorId === id ? undefined : id;
  }

  // Iniciar modo de Asistencia Remota (Impersonación)
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

  // Ejecutar Onboarding Express del cliente
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
          form.resetForm();
          this.activeTab = 'companies';
          this.loadCompanies();
          this.loadControlTowerData();
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
