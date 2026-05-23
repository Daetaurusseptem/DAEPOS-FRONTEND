import { Component, OnInit, OnDestroy } from '@angular/core';
import { CashRegisterService } from 'src/app/services/cash-register.service';
import { AuthService } from 'src/app/services/auth.service';
import { BranchService } from 'src/app/services/branch.service';
import { Branch, CashRegister } from 'src/app/interfaces/models.interface';
import Swal from 'sweetalert2';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-live-registers',
  templateUrl: './live-registers.component.html',
  styleUrls: ['./live-registers.component.css']
})
export class LiveRegistersComponent implements OnInit, OnDestroy {
  activeRegisters: CashRegister[] = [];
  branches: Branch[] = [];
  selectedBranchId: string = '';
  loading: boolean = false;
  isCompanyAdmin: boolean = false;
  companyId: string = '';

  // Auto-refresh logic
  private refreshSub?: Subscription;
  lastUpdated: Date = new Date();

  // Drawer / Action State
  showDrawer: boolean = false;
  selectedRegister: CashRegister | null = null;
  drawerTab: 'summary' | 'expense' | 'close' = 'summary';

  // Form states
  expenseAmount: number = 0;
  expenseReason: string = '';
  expenseType: 'withdrawal' | 'expense' = 'expense';

  closeActualAmount: number = 0;
  closeNotes: string = '';

  constructor(
    private cashRegisterService: CashRegisterService,
    private authService: AuthService,
    private branchService: BranchService
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
      this.loadActiveRegisters();
    }

    // Set up auto-refresh every 30 seconds
    this.refreshSub = interval(30000).subscribe(() => {
      if (this.selectedBranchId) {
        this.loadActiveRegisters();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
    }
  }

  loadBranches(): void {
    this.branchService.getBranchesByCompany(this.companyId).subscribe({
      next: (resp) => {
        if (resp.ok && resp.branches.length > 0) {
          this.branches = resp.branches;
          // Preselect first branch or current
          const currentBranchId = this.authService.branch?._id || this.authService.branch;
          if (currentBranchId && this.branches.some(b => b._id === currentBranchId)) {
            this.selectedBranchId = currentBranchId;
          } else {
            this.selectedBranchId = this.branches[0]._id || '';
          }
          this.loadActiveRegisters();
        }
      },
      error: () => {
        Swal.fire('Error', 'No se pudieron cargar las sucursales', 'error');
      }
    });
  }

  loadActiveRegisters(): void {
    if (!this.selectedBranchId) return;
    this.loading = true;
    this.cashRegisterService.getActiveRegistersByBranch(this.selectedBranchId).subscribe({
      next: (resp) => {
        this.activeRegisters = resp.activeRegisters || [];
        this.lastUpdated = new Date();
        this.loading = false;
        
        // Sync selected register in drawer if it's currently open
        if (this.selectedRegister) {
          const updated = this.activeRegisters.find(r => r._id === this.selectedRegister?._id);
          this.selectedRegister = updated || null;
        }
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar las cajas activas', 'error');
      }
    });
  }

  onBranchChange(branchId: string): void {
    this.selectedBranchId = branchId;
    this.loadActiveRegisters();
    this.closeDrawer();
  }

  // --- Summary Metrics ---
  getTotalExpectedCash(): number {
    return this.activeRegisters.reduce((sum, reg) => sum + reg.expectedAmount, 0);
  }

  getTotalExpenses(): number {
    return this.activeRegisters.reduce((sum, reg) => {
      const expensesSum = reg.expenses ? reg.expenses.reduce((s, exp) => s + exp.amount, 0) : 0;
      return sum + expensesSum;
    }, 0);
  }

  getSaturatedRegistersCount(): number {
    return this.activeRegisters.filter(reg => reg.expectedAmount >= 5000).length;
  }

  getExpensesSum(expenses: any[] | undefined): number {
    if (!expenses) return 0;
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }

  // --- Drawer Actions ---
  openRegisterDrawer(reg: CashRegister): void {
    this.selectedRegister = reg;
    this.showDrawer = true;
    this.drawerTab = 'summary';
    this.expenseAmount = 0;
    this.expenseReason = '';
    this.expenseType = 'withdrawal';
    this.closeActualAmount = reg.expectedAmount;
    this.closeNotes = '';
  }

  closeDrawer(): void {
    this.showDrawer = false;
    this.selectedRegister = null;
  }

  getShiftDuration(startDateStr: any): string {
    const start = new Date(startDateStr);
    const diffMs = new Date().getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours === 0) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    }
    return `${diffHours} hr${diffHours !== 1 ? 's' : ''} ${diffMins} min${diffMins !== 1 ? 's' : ''}`;
  }

  submitExpense(): void {
    if (!this.selectedRegister || this.expenseAmount <= 0 || !this.expenseReason.trim()) {
      Swal.fire('Cuidado', 'Por favor ingresa un monto válido y una justificación', 'warning');
      return;
    }

    this.loading = true;
    this.cashRegisterService.addExpense(
      this.selectedRegister._id,
      this.expenseAmount,
      this.expenseReason,
      this.expenseType
    ).subscribe({
      next: (resp) => {
        this.loading = false;
        if (resp.ok) {
          Swal.fire('Registrado', 'El movimiento de efectivo ha sido cargado exitosamente', 'success');
          this.loadActiveRegisters();
          this.expenseAmount = 0;
          this.expenseReason = '';
          this.drawerTab = 'summary';
        }
      },
      error: (err) => {
        this.loading = false;
        Swal.fire('Error', err.error?.message || 'No se pudo registrar el movimiento', 'error');
      }
    });
  }

  submitCloseRegister(): void {
    if (!this.selectedRegister) return;

    Swal.fire({
      title: '¿Confirmar Cierre de Caja?',
      text: `Se realizará el arqueo definitivo de la caja. Efectivo esperado: $${this.selectedRegister.expectedAmount.toFixed(2)}, Declarado: $${this.closeActualAmount.toFixed(2)}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, Cerrar Caja',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.cashRegisterService.closeCashRegister(
          this.selectedRegister!._id,
          this.closeActualAmount,
          this.closeNotes
        ).subscribe({
          next: () => {
            this.loading = false;
            Swal.fire('Cerrada', 'La caja se ha cerrado y el arqueo ha sido archivado', 'success');
            this.closeDrawer();
            this.loadActiveRegisters();
          },
          error: (err) => {
            this.loading = false;
            Swal.fire('Error', err.error?.message || 'No se pudo cerrar la caja', 'error');
          }
        });
      }
    });
  }
}
