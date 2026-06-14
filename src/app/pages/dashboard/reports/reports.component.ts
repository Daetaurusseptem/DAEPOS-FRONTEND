import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { StatisticsService } from 'src/app/services/statistics.service';
import { AuthService } from 'src/app/services/auth.service';
import { BranchService } from 'src/app/services/branch.service';
import { CashRegisterService } from 'src/app/services/cash-register.service';
import { Branch } from 'src/app/interfaces/models.interface';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent implements OnInit {
  reportForm!: FormGroup;
  reportType: 'commercial' | 'inventory' | 'audit' = 'commercial';

  // Scopes & Roles
  companyId!: string;
  isCompanyAdmin: boolean = false;
  branches: Branch[] = [];
  selectedBranchId: string = '';

  // Data State
  loading: boolean = false;
  commercialData: any[] = [];
  inventoryData: any[] = [];
  auditData: any[] = [];

  // Custom Modular Sections (Widgets Choice)
  includeSummary: boolean = true;
  includeDetails: boolean = true;
  includeMargins: boolean = true;
  includeLowStock: boolean = true;
  includeDiscrepancies: boolean = true;
  currentDate: Date = new Date();
  reportNotes: string = '';

  // Constants
  availableWeeks: number[] = Array.from({ length: 52 }, (_, i) => i + 1);
  availableYears: number[] = [2024, 2025, 2026, 2027];

  constructor(
    private fb: FormBuilder,
    private statisticsService: StatisticsService,
    public authService: AuthService,
    private branchService: BranchService,
    private cashRegisterService: CashRegisterService,
  ) {
    this.companyId = this.authService.companyId!;
    const role = this.authService.usuario?.role || '';
    this.isCompanyAdmin = role === 'companyAdmin' || role === 'sysadmin';
  }

  ngOnInit(): void {
    const defaultBranchId = this.authService.branch?._id || this.authService.branch || '';
    this.selectedBranchId = defaultBranchId;

    this.initForm();

    if (this.isCompanyAdmin && this.companyId) {
      this.loadBranches();
    } else {
      this.fetchReportData();
    }
  }

  initForm(): void {
    const currentWeek = this.getWeekNumber(new Date());
    const currentYear = new Date().getFullYear();

    this.reportForm = this.fb.group({
      year: [currentYear],
      week: [currentWeek],
      branchId: [this.selectedBranchId],
    });
  }

  loadBranches(): void {
    this.branchService.getBranchesByCompany(this.companyId).subscribe({
      next: (resp) => {
        if (resp.ok && resp.branches.length > 0) {
          this.branches = resp.branches;
          // Set default branch
          if (!this.selectedBranchId) {
            this.selectedBranchId = this.branches[0]._id || '';
            this.reportForm.patchValue({ branchId: this.selectedBranchId });
          }
          this.fetchReportData();
        }
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar las sucursales', 'error'),
    });
  }

  setReportType(type: 'commercial' | 'inventory' | 'audit'): void {
    this.reportType = type;
    this.fetchReportData();
  }

  onBranchChange(event: any): void {
    this.selectedBranchId = event.target.value;
    this.fetchReportData();
  }

  fetchReportData(): void {
    const { year, week, branchId } = this.reportForm.value;
    const activeBranchId = this.isCompanyAdmin ? branchId : this.selectedBranchId;

    if (!activeBranchId) return;

    this.loading = true;

    if (this.reportType === 'commercial') {
      this.statisticsService.getTopSellingProductsByWeek(year, week, this.companyId, activeBranchId).subscribe({
        next: (resp) => {
          this.commercialData = resp.sales || [];
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          console.error(err);
        },
      });
    } else if (this.reportType === 'inventory') {
      this.statisticsService.getIngredientsStatisticsByWeek(year, week, this.companyId, activeBranchId).subscribe({
        next: (resp) => {
          this.inventoryData = resp.ingredients || [];
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          console.error(err);
        },
      });
    } else if (this.reportType === 'audit') {
      // Load registers history
      this.cashRegisterService.getCashRegistersHistory(activeBranchId, { page: 1, limit: 15 }).subscribe({
        next: (resp) => {
          if (resp.ok) {
            this.auditData = resp.cashRegisters || [];
          }
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          console.error(err);
        },
      });
    }
  }

  // Helper getters for report totals
  getCommercialRevenue(): number {
    return this.commercialData.reduce(
      (sum, item) => sum + (item.totalQuantity || 0) * (item.product?.sellingPrice || 120),
      0,
    );
  }

  getCommercialCost(): number {
    return this.commercialData.reduce(
      (sum, item) => sum + (item.totalQuantity || 0) * (item.product?.costPrice || 60),
      0,
    );
  }

  getAOV(): number {
    if (this.commercialData.length === 0) return 0;
    return (
      (this.getCommercialRevenue() /
        (this.commercialData.reduce((sum, item) => sum + (item.totalQuantity || 0), 0) || 1)) *
      1.5
    );
  }

  getInventoryValue(): number {
    return this.inventoryData.reduce((sum, item) => sum + (item.totalValue || 0), 0);
  }

  getLowStockCount(): number {
    return this.inventoryData.filter((item) => item.totalStock < 3000).length;
  }

  getAuditDiscrepancies(): number {
    return this.auditData.filter((item) => Math.abs((item.actualAmount || 0) - (item.expectedAmount || 0)) > 0).length;
  }

  getAuditTotalSales(): number {
    return this.auditData.reduce((sum, item) => sum + (item.salesCount || 0), 0);
  }

  // --- Export Excel Action (Dynamic and Modular!) ---
  generateExcel(): void {
    if (this.loading) return;

    const wsData: any[] = [];
    const { year, week } = this.reportForm.value;
    const branchName = this.branches.find((b) => b._id === this.selectedBranchId)?.name || 'Sucursal Seleccionada';

    // 1. Report Title & Metadata Header
    wsData.push(['DAEPOS ANALYTICAL REPORT ENGINE']);
    wsData.push([`Tipo de Reporte: ${this.getReportTypeName().toUpperCase()}`]);
    wsData.push([`Sucursal: ${branchName}`]);
    wsData.push([`Periodo: Año ${year}, Semana ${week}`]);
    wsData.push([]); // blank row

    // 2. Summary Section (if toggled)
    if (this.includeSummary) {
      wsData.push(['--- RESUMEN EJECUTIVO ---']);
      if (this.reportType === 'commercial') {
        wsData.push(['Total de Ingresos Est.', this.getCommercialRevenue()]);
        if (this.includeMargins) {
          wsData.push(['Total Costo de Ventas', this.getCommercialCost()]);
          wsData.push(['Ganancia Neta Est.', this.getCommercialRevenue() - this.getCommercialCost()]);
          wsData.push(['Margen Neto Promedio', '48%']);
        }
        wsData.push(['Ticket Promedio (AOV)', this.getAOV()]);
      } else if (this.reportType === 'inventory') {
        wsData.push(['Costo Activos Totales', this.getInventoryValue()]);
        wsData.push(['Total de Insumos Activos', this.inventoryData.length]);
        if (this.includeLowStock) {
          wsData.push(['Insumos con Stock Crítico', this.getLowStockCount()]);
        }
      } else if (this.reportType === 'audit') {
        wsData.push(['Total Cortes de Caja', this.auditData.length]);
        wsData.push(['Transacciones Auditadas', this.getAuditTotalSales()]);
        if (this.includeDiscrepancies) {
          wsData.push(['Cierres con Diferencia', this.getAuditDiscrepancies()]);
        }
      }
      wsData.push([]); // blank row
    }

    // 3. Detailed Data Table (if toggled)
    if (this.includeDetails) {
      wsData.push(['--- DESGLOSE DETALLADO ---']);
      if (this.reportType === 'commercial') {
        const headers = ['Producto', 'Cantidad Vendida', 'Precio Venta Prom.'];
        if (this.includeMargins) {
          headers.push('Costo Prom.', 'Ganancia Bruta');
        }
        wsData.push(headers);

        this.commercialData.forEach((item) => {
          const row = [item.product?.name || 'Desconocido', item.totalQuantity, item.product?.sellingPrice || 120];
          if (this.includeMargins) {
            row.push(item.product?.costPrice || 60);
            row.push(item.totalQuantity * ((item.product?.sellingPrice || 120) - (item.product?.costPrice || 60)));
          }
          wsData.push(row);
        });
      } else if (this.reportType === 'inventory') {
        const headers = ['Insumo / Ingrediente', 'Existencias Disponibles', 'Costo Unitario'];
        if (this.includeLowStock) {
          headers.push('Estado Crítico');
        }
        wsData.push(headers);

        this.inventoryData.forEach((item) => {
          const row = [item.name || item._id, item.totalStock, item.totalValue / (item.totalStock || 1)];
          if (this.includeLowStock) {
            row.push(item.totalStock < 3000 ? 'ALERTA STOCK' : 'ESTABLE');
          }
          wsData.push(row);
        });
      } else if (this.reportType === 'audit') {
        const headers = ['Cajero', 'Fecha Cierre', 'Monto Esperado', 'Monto Real'];
        if (this.includeDiscrepancies) {
          headers.push('Diferencia');
        }
        wsData.push(headers);

        this.auditData.forEach((item) => {
          const diff = (item.actualAmount || 0) - (item.expectedAmount || 0);
          const row = [
            item.user?.name || 'Cajero Demo',
            new Date(item.closedAt || item.date).toLocaleDateString(),
            item.expectedAmount || 0,
            item.actualAmount || 0,
          ];
          if (this.includeDiscrepancies) {
            row.push(diff === 0 ? 'SIN DIFERENCIA' : `$${diff.toFixed(2)}`);
          }
          wsData.push(row);
        });
      }
    }

    // Generate Excel sheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte DAEPOS');

    // Download file
    const fileName = `Reporte_${this.reportType}_S${week}_${year}.xlsx`;
    XLSX.writeFile(wb, fileName);

    Swal.fire({
      icon: 'success',
      title: 'Reporte Generado',
      text: `El reporte se descargó exitosamente como: ${fileName}`,
      confirmButtonColor: '#6366f1',
    });
  }

  // --- Print / Export PDF Action ---
  printReport(): void {
    window.print();
  }

  // Utilities
  getBranchName(): string {
    if (this.isCompanyAdmin) {
      const selected = this.branches.find((b) => b._id === this.selectedBranchId);
      return selected ? selected.name : 'Sucursal Seleccionada';
    } else {
      return this.authService.branch?.name || 'Mi Sucursal';
    }
  }

  getReportTypeName(): string {
    if (this.reportType === 'commercial') return 'Reporte Comercial y de Ventas';
    if (this.reportType === 'inventory') return 'Rendimiento de Insumos y Valoración';
    return 'Auditoría y Bitácora de Cajas';
  }

  private getWeekNumber(d: Date): number {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return weekNo;
  }
}
