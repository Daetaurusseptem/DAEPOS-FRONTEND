import { Component, OnInit } from '@angular/core';
import { Company, DashboardSummary, Branch } from 'src/app/interfaces/models.interface';
import { AuthService } from 'src/app/services/auth.service';
import { UsuarioModel } from 'src/app/models/usuario.model';
import { StatisticsService } from 'src/app/services/statistics.service';
import { ActivatedRoute } from '@angular/router';
import { BranchService } from 'src/app/services/branch.service';

@Component({
  selector: 'app-branch-admin-home',
  templateUrl: './branch-admin-home.component.html',
  styleUrls: ['./branch-admin-home.component.css'],
})
export class BranchAdminHomeComponent implements OnInit {
  company!: Company;
  branch?: Branch;
  admin!: UsuarioModel;
  summary: DashboardSummary = {
    totalSalesToday: 0,
    transactionsToday: 0,
    lowStockCount: 0,
    activeRegisters: 0,
    recentSales: [],
  };
  isLoading: boolean = true;
  today: Date = new Date();

  constructor(
    private authService: AuthService,
    private statisticsService: StatisticsService,
    private activatedRoute: ActivatedRoute,
    private branchService: BranchService,
  ) {}

  ngOnInit(): void {
    this.admin = this.authService.usuario;
    this.company = this.authService.company;

    this.activatedRoute.params.subscribe((params) => {
      const branchIdFromUrl = params['id'];
      if (branchIdFromUrl) {
        this.getBranchDetails(branchIdFromUrl);
      } else {
        this.branch = this.authService.branch;
        this.loadDashboardSummary();
      }
    });
  }

  getBranchDetails(id: string) {
    this.isLoading = true;
    this.branchService.getBranchById(id).subscribe({
      next: (resp) => {
        if (resp.ok) {
          this.branch = resp.branch;
          this.loadDashboardSummary(id);
        }
      },
      error: () => (this.isLoading = false),
    });
  }

  loadDashboardSummary(branchId?: string) {
    const companyId = this.authService.companyId || this.authService.company?._id;
    const bid = branchId || this.branch?._id;

    if (!companyId || !bid) return;

    this.isLoading = true;
    this.statisticsService.getDashboardSummary(companyId, bid).subscribe({
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
}
