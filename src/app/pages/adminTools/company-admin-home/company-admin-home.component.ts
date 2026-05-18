import { Component, OnInit } from '@angular/core';
import { Company, DashboardSummary, Branch } from 'src/app/interfaces/models.interface';
import { CompanyService } from 'src/app/services/company.service';
import { UsersService } from 'src/app/services/users.service';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { UsuarioModel } from 'src/app/models/usuario.model';
import { StatisticsService } from 'src/app/services/statistics.service';
import { BranchService } from 'src/app/services/branch.service';
import { SupplierService } from 'src/app/services/provider.service';

@Component({
  selector: 'app-company-admin-home',
  templateUrl: './company-admin-home.component.html',
  styleUrls: ['./company-admin-home.component.css']
})
export class CompanyAdminHomeComponent implements OnInit {
  company!: Company;
  admin!: UsuarioModel;
  branches: Branch[] = [];
  upcomingRestocks: any[] = [];
  summary: DashboardSummary = {
    totalSalesToday: 0,
    transactionsToday: 0,
    lowStockCount: 0,
    activeRegisters: 0,
    recentSales: []
  };
  isLoading: boolean = true;

  constructor(
    private userService: UsersService,
    private authService: AuthService,
    private statisticsService: StatisticsService,
    private branchService: BranchService,
    private supplierService: SupplierService
  ) { }

  ngOnInit(): void {
    this.admin = this.authService.usuario;
    
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
          this.branches = resp.branches;
        }
      }
    });
  }

  getAdminCompany(id: string) {
    return this.userService.getCompanyAdmin(id)
      .pipe(map(item => item.company))
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
        }
      });
  }

  loadDashboardSummary() {
    const companyId = this.authService.companyId || this.authService.company?._id;
    if (!companyId) return;

    this.isLoading = true;
    this.statisticsService.getDashboardSummary(companyId).subscribe({
      next: (resp) => {
        if (resp.ok) {
          this.summary = resp.summary;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
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

          this.upcomingRestocks = allRestocks.filter(r => {
            if (r.status !== 'pending') return false;
            const expDate = new Date(r.expectedDate);
            const diffTime = expDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= -1 && diffDays <= 3;
          });
        }
      }
    });
  }
}
