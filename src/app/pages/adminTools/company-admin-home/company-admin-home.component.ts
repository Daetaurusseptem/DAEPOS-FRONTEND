import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Company, DashboardSummary, Branch } from 'src/app/interfaces/models.interface';
import { CompanyService } from 'src/app/services/company.service';
import { UsersService } from 'src/app/services/users.service';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { UsuarioModel } from 'src/app/models/usuario.model';
import { StatisticsService } from 'src/app/services/statistics.service';
import { BranchService } from 'src/app/services/branch.service';
import { SupplierService } from 'src/app/services/provider.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-company-admin-home',
  templateUrl: './company-admin-home.component.html',
  styleUrls: ['./company-admin-home.component.css'],
})
export class CompanyAdminHomeComponent implements OnInit {
  company!: Company;
  admin!: UsuarioModel;
  branches: Branch[] = [];
  upcomingRestocks: any[] = [];
  role: string = '';
  summary: DashboardSummary = {
    totalSalesToday: 0,
    transactionsToday: 0,
    lowStockCount: 0,
    activeRegisters: 0,
    recentSales: [],
  };
  isLoading: boolean = true;
  isPosSettingsModalOpen: boolean = false;
  posSettingsForm = {
    blindClosure: true,
    requirePinForRisks: true
  };

  constructor(
    private userService: UsersService,
    public authService: AuthService,
    private statisticsService: StatisticsService,
    private branchService: BranchService,
    private supplierService: SupplierService,
    private companyService: CompanyService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.admin = this.authService.usuario;
    this.role = this.authService.role || this.admin.role;

    // Control de Acceso: Esta pantalla corporativa solo debe ser accesible al dueño (companyAdmin) o sysadmin
    if (this.role !== 'companyAdmin' && this.role !== 'sysadmin') {
      this.router.navigate(['/dashboard/branch']);
      return;
    }

    // Si ya tenemos la compañía en el authService, la usamos directamente
    if (this.authService.company) {
      this.company = this.authService.company;
      this.getBranches(this.company._id!);
      this.loadUpcomingRestocks();
    } else if (this.authService.role === 'companyAdmin') {
      // Solo intentamos buscar la compañía por adminId si el rol es companyAdmin
      this.getAdminCompany(this.admin.id);
    }

    this.loadDashboardSummary();
  }

  getBranches(companyId: string) {
    this.branchService.getBranchesByCompany(companyId).subscribe({
      next: (resp) => {
        if (resp.ok) {
          if (this.role === 'admin' || this.role === 'user') {
            const userBranchId = this.authService.branch?._id || this.authService.branch;
            if (userBranchId) {
              this.branches = (resp.branches || []).filter((b: any) => b._id === userBranchId);
            } else {
              this.branches = [];
            }
          } else {
            this.branches = resp.branches || [];
          }
        }
      },
    });
  }

  getAdminCompany(id: string) {
    return this.userService
      .getCompanyAdmin(id)
      .pipe(map((item) => item.company))
      .subscribe({
        next: (company) => {
          this.company = company!;
          if (this.company?._id) {
            this.getBranches(this.company._id);
            this.loadUpcomingRestocks();
          }
        },
        error: (err) => {
          console.error('Error al cargar la empresa del administrador:', err);
        },
      });
  }

  loadDashboardSummary() {
    const companyId = this.authService.companyId || this.authService.company?._id;
    if (!companyId) return;

    let branchId: string | undefined = undefined;
    if (this.role === 'admin' || this.role === 'user') {
      branchId = this.authService.branch?._id || this.authService.branch;
    }

    this.isLoading = true;
    this.statisticsService.getDashboardSummary(companyId, branchId).subscribe({
      next: (resp) => {
        if (resp.ok) {
          this.summary = resp.summary;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  loadUpcomingRestocks() {
    const companyId = this.authService.companyId || this.authService.company?._id || this.company?._id;
    if (!companyId) return;

    this.supplierService.getCompanyRestocks(companyId).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          const allRestocks: any[] = resp.restocks || [];
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          this.upcomingRestocks = allRestocks.filter((r) => {
            if (r.status !== 'pending') return false;
            const expDate = new Date(r.expectedDate);
            const diffTime = expDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= -1 && diffDays <= 3;
          });
        }
      },
    });
  }

  isDemoUser(): boolean {
    return !!(this.authService.usuario && this.authService.usuario.isDemo);
  }

  get inactiveBranchesCount(): number {
    return this.branches ? this.branches.filter((b) => b.isActive === false).length : 0;
  }

  restoreDemoDatabase() {
    Swal.fire({
      title: '¿Restaurar Base de Datos?',
      text: 'Se restablecerán todos los catálogos, sucursales y ventas de prueba al estado inicial original en segundos.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, Restaurar',
      cancelButtonColor: '#000',
      confirmButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Restaurando...',
          html: 'Re-generando datos de prueba limpios...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        this.authService.demoReset().subscribe({
          next: () => {
            Swal.close();
            Swal.fire(
              '¡Restauración Exitosa!',
              'La base de datos del demo ha vuelto a su estado original.',
              'success',
            ).then(() => {
              window.location.reload();
            });
          },
          error: (err) => {
            Swal.close();
            Swal.fire('Error', err.error?.msg || 'No se pudo completar la restauración', 'error');
          },
        });
      }
    });
  }

  // POS Settings Logic
  openPosSettingsModal() {
    if (this.company && this.company.posSettings) {
      this.posSettingsForm = {
        blindClosure: this.company.posSettings.blindClosure ?? true,
        requirePinForRisks: this.company.posSettings.requirePinForRisks ?? true,
      };
    }
    this.isPosSettingsModalOpen = true;
  }

  closePosSettingsModal() {
    this.isPosSettingsModalOpen = false;
  }

  savePosSettings() {
    if (!this.company || !this.company._id) return;
    Swal.fire({
      title: 'Guardando configuración...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    const settingsUpdate = { posSettings: this.posSettingsForm };
    
    this.companyService.updateCompanySettings(this.company._id, settingsUpdate).subscribe({
      next: (res) => {
        Swal.close();
        Swal.fire('¡Éxito!', 'Configuración de seguridad actualizada.', 'success');
        this.company.posSettings = { ...this.posSettingsForm };
        if (this.authService.company) {
          this.authService.company.posSettings = { ...this.posSettingsForm };
        }
        this.closePosSettingsModal();
      },
      error: (err) => {
        Swal.close();
        Swal.fire('Error', 'No se pudo actualizar la configuración.', 'error');
      }
    });
  }
}
