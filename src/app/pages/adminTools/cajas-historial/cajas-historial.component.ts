import { Component, OnInit } from '@angular/core';
import { CashRegisterService } from 'src/app/services/cash-register.service';
import { AuthService } from 'src/app/services/auth.service';
import { BranchService } from 'src/app/services/branch.service';
import { UsersService } from 'src/app/services/users.service';
import { Branch, CashRegister, User } from 'src/app/interfaces/models.interface';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cajas-historial',
  templateUrl: './cajas-historial.component.html',
  styleUrls: ['./cajas-historial.component.css']
})
export class CajasHistorialComponent implements OnInit {
  cashRegisters: CashRegister[] = [];
  branches: Branch[] = [];
  cashiers: User[] = [];
  selectedBranchId: string = '';
  isCompanyAdmin: boolean = false;
  companyId: string = '';
  loading: boolean = false;

  // Filters State
  filterCashier: string = '';
  filterStartDate: string = '';
  filterEndDate: string = '';
  filterDiscrepancy: string = 'all';

  // Pagination State
  currentPage: number = 1;
  totalPages: number = 1;
  totalRecords: number = 0;
  limit: number = 10;

  constructor(
    private cashRegisterService: CashRegisterService,
    private authService: AuthService,
    private branchService: BranchService,
    private usersService: UsersService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const role = this.authService.usuario?.role || '';
    this.isCompanyAdmin = role === 'companyAdmin' || role === 'sysadmin';
    this.companyId = this.authService.companyId || '';

    const currentBranchId = this.authService.branch?._id || this.authService.branch;

    if (this.isCompanyAdmin && this.companyId) {
      this.loadBranches();
    } else if (currentBranchId) {
      this.selectedBranchId = currentBranchId;
      this.loadCashiers();
      this.loadHistory();
    }
  }

  loadBranches(): void {
    this.branchService.getBranchesByCompany(this.companyId).subscribe({
      next: (resp) => {
        if (resp.ok && resp.branches.length > 0) {
          this.branches = resp.branches;
          const currentBranchId = this.authService.branch?._id || this.authService.branch;
          if (currentBranchId && this.branches.some(b => b._id === currentBranchId)) {
            this.selectedBranchId = currentBranchId;
          } else {
            this.selectedBranchId = this.branches[0]._id || '';
          }
          this.loadCashiers();
          this.loadHistory();
        }
      },
      error: () => {
        Swal.fire('Error', 'No se pudieron cargar las sucursales', 'error');
      }
    });
  }

  loadCashiers(): void {
    if (!this.selectedBranchId) return;
    
    // Fetch users for filtering
    const adminId = this.authService.idUsuario;
    this.usersService.getAllNonAdminUsersOfCompany(adminId, 1, 100, '', this.selectedBranchId).subscribe({
      next: (resp) => {
        this.cashiers = resp.users || [];
      },
      error: () => {
        console.error('Error loading cashiers for filters');
      }
    });
  }

  loadHistory(): void {
    if (!this.selectedBranchId) return;
    this.loading = true;

    const filters: any = {
      page: this.currentPage,
      limit: this.limit
    };

    if (this.filterCashier) filters.userId = this.filterCashier;
    if (this.filterStartDate) filters.startDate = this.filterStartDate;
    if (this.filterEndDate) filters.endDate = this.filterEndDate;
    if (this.filterDiscrepancy !== 'all') filters.discrepancy = this.filterDiscrepancy;

    this.cashRegisterService.getCashRegistersHistory(this.selectedBranchId, filters).subscribe({
      next: (resp) => {
        this.loading = false;
        if (resp.ok) {
          this.cashRegisters = resp.cashRegisters || [];
          this.currentPage = resp.currentPage || 1;
          this.totalPages = resp.totalPages || 1;
          this.totalRecords = resp.totalRecords || 0;
        }
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudo cargar el historial de cajas', 'error');
      }
    });
  }

  onBranchChange(branchId: string): void {
    this.selectedBranchId = branchId;
    this.currentPage = 1;
    this.loadCashiers();
    this.loadHistory();
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadHistory();
  }

  resetFilters(): void {
    this.filterCashier = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.filterDiscrepancy = 'all';
    this.currentPage = 1;
    this.loadHistory();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadHistory();
    }
  }

  viewCajaDetail(cajaId: string): void {
    this.router.navigate([`/dashboard/admin/cajas/${cajaId}`]);
  }

  getExpensesSum(expenses: any[] | undefined): number {
    if (!expenses) return 0;
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }
}
