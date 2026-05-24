import { Component, OnInit } from '@angular/core';
import { StatisticsService } from 'src/app/services/statistics.service';
import { Chart, ChartData, ChartOptions, ChartType, registerables } from 'chart.js';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit {
  topSellingProducts: any[] = [];
  ingredientsStatistics: any[] = [];
  year: number = new Date().getFullYear();
  week: number = this.getWeekNumber(new Date());
  searchForm!: FormGroup;
  companyId!: string;
  isProductView: boolean = true;
  kpiSlots: string[] = ['quantity', 'star', 'valuation', 'profit'];
  availableMetrics = [
    { value: 'quantity', label: 'Volumen Total' },
    { value: 'star', label: 'Elemento Líder' },
    { value: 'valuation', label: 'Valoración / Variedad' },
    { value: 'profit', label: 'Ganancia Estimada' },
    { value: 'aov', label: 'Ticket Promedio (AOV)' },
    { value: 'alerts', label: 'Alertas de Stock' }
  ];

  // Premium Monospace Grid Chart configuration
  barChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#a0aec0',
          font: { family: 'monospace', size: 11, weight: 'bold' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#ffffff',
        titleFont: { family: 'monospace', size: 12, weight: 'bold' },
        bodyColor: '#a0aec0',
        bodyFont: { family: 'monospace', size: 11 },
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: {
          color: '#718096',
          font: { family: 'monospace', size: 9 }
        }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: {
          color: '#718096',
          font: { family: 'monospace', size: 9 }
        }
      }
    }
  };
  barChartLabels: string[] = [];
  barChartType: ChartType = 'bar';
  barChartLegend = true;
  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { 
        data: [], 
        label: 'Cantidad Vendida', 
        backgroundColor: 'rgba(99, 102, 241, 0.65)',
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  constructor(
    private statisticsService: StatisticsService,
    private fb: FormBuilder,
    public authService: AuthService
  ) {
    this.companyId = this.authService.companyId!;
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.loadPreferences();
    this.initForm();
    this.loadData();
  }

  loadPreferences(): void {
    const savedSlots = localStorage.getItem('kpi_slots_pref');
    if (savedSlots) {
      this.kpiSlots = JSON.parse(savedSlots);
    }
    
    const savedChartType = localStorage.getItem('chart_type_pref');
    if (savedChartType) {
      this.barChartType = savedChartType as ChartType;
    }
  }

  savePreferences(): void {
    localStorage.setItem('kpi_slots_pref', JSON.stringify(this.kpiSlots));
    localStorage.setItem('chart_type_pref', this.barChartType);
  }

  changeChartType(newType: ChartType): void {
    this.barChartType = newType;
    this.savePreferences();
    
    // Configure options dynamically for Pie/Doughnut charts vs Cartesian (Bar/Line) charts
    if (newType === 'pie' || newType === 'doughnut') {
      this.barChartOptions = {
        ...this.barChartOptions,
        scales: {
          x: { display: false },
          y: { display: false }
        }
      };
    } else {
      this.barChartOptions = {
        ...this.barChartOptions,
        scales: {
          x: { 
            display: true,
            grid: { color: 'rgba(255, 255, 255, 0.03)' },
            ticks: {
              color: '#718096',
              font: { family: 'monospace', size: 9 }
            }
          },
          y: { 
            display: true,
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.03)' },
            ticks: {
              color: '#718096',
              font: { family: 'monospace', size: 9 }
            }
          }
        }
      };
    }
    
    this.loadData();
  }

  getSlotData(slotId: string): any {
    switch (slotId) {
      case 'quantity':
        return {
          label: this.isProductView ? 'Unidades Vendidas' : 'Existencias Insumos',
          value: this.getTotalQuantity(),
          context: 'En la semana seleccionada',
          icon: this.isProductView ? 'bi-cart-check' : 'bi-box-seam',
          isCurrency: false,
          isString: false,
          suffix: ''
        };
      case 'star':
        return {
          label: this.isProductView ? 'Producto Estrella' : 'Insumo Líder (Stock)',
          value: this.getTopItemName(),
          context: `${this.getTopItemQuantity().toLocaleString()} unidades`,
          icon: this.isProductView ? 'bi-award' : 'bi-lightning',
          isCurrency: false,
          isString: true,
          suffix: ''
        };
      case 'valuation':
        return {
          label: this.isProductView ? 'Variedad en Ventas' : 'Valoración Inventario',
          value: this.getValuation(),
          context: this.isProductView ? 'Artículos distintos vendidos' : 'Costo total acumulado',
          icon: this.isProductView ? 'bi-grid-3x3-gap' : 'bi-cash-coin',
          isCurrency: !this.isProductView,
          isString: this.isProductView,
          suffix: this.isProductView ? ' Prod.' : ''
        };
      case 'profit':
        return {
          label: 'Ganancia Bruta Est.',
          value: this.isProductView ? (this.getTotalQuantity() * 15.50) : (this.getValuation() * 0.42),
          context: 'Margen de retorno (42%)',
          icon: 'bi-graph-up-arrow',
          isCurrency: true,
          isString: false,
          suffix: ''
        };
      case 'aov':
        return {
          label: 'Ticket Promedio (AOV)',
          value: this.isProductView ? 142.50 : 38.20,
          context: 'Monto de orden promedio',
          icon: 'bi-receipt',
          isCurrency: true,
          isString: false,
          suffix: ''
        };
      case 'alerts':
        return {
          label: 'Alertas Bajo Stock',
          value: this.isProductView ? this.getLowStockCountProducts() : this.getLowStockCountIngredients(),
          context: 'Artículos requieren reorden',
          icon: 'bi-exclamation-triangle',
          isCurrency: false,
          isString: false,
          suffix: ''
        };
      default:
        return {
          label: 'Vacío',
          value: 0,
          context: '',
          icon: 'bi-dash-circle',
          isCurrency: false,
          isString: false,
          suffix: ''
        };
    }
  }

  getLowStockCountProducts(): number {
    return this.topSellingProducts.filter(item => item.totalQuantity < 10).length;
  }

  getLowStockCountIngredients(): number {
    return this.ingredientsStatistics.filter(item => item.totalStock < 3000).length;
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      year: [this.year],
      week: [this.week]
    });
  }

  private loadData(): void {
    this.isProductView ? this.loadTopSellingProducts() : this.loadIngredientsStatistics();
  }

  private loadTopSellingProducts(): void {
    const { year, week } = this.searchForm.value;
    const branchId = this.authService.role === 'admin' ? this.authService.branch?._id : undefined;
    this.statisticsService.getTopSellingProductsByWeek(year, week, this.companyId, branchId).subscribe({
      next: (data) => {
        this.topSellingProducts = data.sales || [];
        this.updateChartData();
      },
      error: (error) => console.error('Error loading top selling products:', error)
    });
  }

  private loadIngredientsStatistics(): void {
    const { year, week } = this.searchForm.value;
    const branchId = this.authService.role === 'admin' ? this.authService.branch?._id : undefined;
    this.statisticsService.getIngredientsStatisticsByWeek(year, week, this.companyId, branchId).subscribe({
      next: (data) => {
        this.ingredientsStatistics = data.ingredients || [];
        this.updateChartData();
      },
      error: (error) => console.error('Error loading ingredients statistics:', error)
    });
  }

  private updateChartData(): void {
    const data = this.isProductView ? this.topSellingProducts : this.ingredientsStatistics;
    this.barChartLabels = data.map(item => this.isProductView ? (item.product?.name || 'Desconocido') : (item.name || item._id));
    this.barChartData.labels = this.barChartLabels;
    this.barChartData.datasets[0].data = data.map(item => this.isProductView ? item.totalQuantity : item.totalStock);
    this.barChartData.datasets[0].label = this.isProductView ? 'Cantidad Vendida' : 'Stock Total (Insumos)';
    
    // Dynamic premium colors for neon chart appearance
    this.barChartData.datasets[0].backgroundColor = this.isProductView ? 'rgba(99, 102, 241, 0.5)' : 'rgba(16, 185, 129, 0.5)';
    this.barChartData.datasets[0].borderColor = this.isProductView ? '#6366f1' : '#10b981';
    this.barChartData.datasets[0].hoverBackgroundColor = this.isProductView ? 'rgba(99, 102, 241, 0.85)' : 'rgba(16, 185, 129, 0.85)';
    this.barChartData.datasets[0].hoverBorderColor = this.isProductView ? '#818cf8' : '#34d399';
  }

  // Calculated Metric Getters for Premium KPI Display Cards
  getTotalQuantity(): number {
    if (this.isProductView) {
      return this.topSellingProducts.reduce((sum, item) => sum + (item.totalQuantity || 0), 0);
    } else {
      return this.ingredientsStatistics.reduce((sum, item) => sum + (item.totalStock || 0), 0);
    }
  }

  getTopItemName(): string {
    const data = this.isProductView ? this.topSellingProducts : this.ingredientsStatistics;
    if (!data || data.length === 0) return 'N/A';
    
    if (this.isProductView) {
      const top = data.reduce((max, item) => (item.totalQuantity > max.totalQuantity) ? item : max, data[0]);
      return top.product?.name || 'Desconocido';
    } else {
      const top = data.reduce((max, item) => (item.totalStock > max.totalStock) ? item : max, data[0]);
      return top.name || top._id || 'Desconocido';
    }
  }

  getTopItemQuantity(): number {
    const data = this.isProductView ? this.topSellingProducts : this.ingredientsStatistics;
    if (!data || data.length === 0) return 0;
    
    if (this.isProductView) {
      const top = data.reduce((max, item) => (item.totalQuantity > max.totalQuantity) ? item : max, data[0]);
      return top.totalQuantity || 0;
    } else {
      const top = data.reduce((max, item) => (item.totalStock > max.totalStock) ? item : max, data[0]);
      return top.totalStock || 0;
    }
  }

  getValuation(): number {
    if (this.isProductView) {
      return this.topSellingProducts.length;
    } else {
      return this.ingredientsStatistics.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    }
  }

  toggleView(): void {
    this.isProductView = !this.isProductView;
    this.loadData();
  }

  private getWeekNumber(date: Date): number {
    const startDate = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((date.getDay() + 1 + days) / 7);
  }

  onSearch(): void {
    this.loadData();
  }

  prevWeek(): void {
    if (this.week > 1) {
      this.week--;
    } else {
      this.week = 52;
      this.year--;
    }
    this.updateFormAndSearch();
  }

  nextWeek(): void {
    if (this.week < 52) {
      this.week++;
    } else {
      this.week = 1;
      this.year++;
    }
    this.updateFormAndSearch();
  }

  private updateFormAndSearch(): void {
    this.searchForm.patchValue({ year: this.year, week: this.week });
    this.onSearch();
  }

  downloadExcel() {
    const data = this.isProductView ? this.topSellingProducts : this.ingredientsStatistics;
    const sheetName = this.isProductView ? 'Top Productos' : 'Estadísticas de Ingredientes';
    
    // Datos principales
    const mainHeader = this.isProductView ? 
      ['#', 'Producto', 'Cantidad Vendida/Semana'] : 
      ['#', 'Ingrediente', 'Stock Actual', 'Valor Total'];
    const mainData = data.map((item, index) => this.isProductView ?
      [index + 1, item.product?.name || 'Desconocido', item.totalQuantity] :
      [index + 1, item._id, item.totalStock, item.totalValue]
    );
    mainData.unshift(mainHeader);

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([
      [this.isProductView ? `Productos más vendidos - Semana ${this.week}, ${this.year}` : 'Estadísticas de Ingredientes'],
      [],
      ['Tabla de Datos:'],
      ...mainData
    ]);

    ws['!cols'] = this.isProductView ? 
      [{ wch: 10 }, { wch: 40 }, { wch: 20 }] : 
      [{ wch: 10 }, { wch: 40 }, { wch: 20 }, { wch: 20 }];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    XLSX.writeFile(wb, `${sheetName}_${this.week}_${this.year}.xlsx`);
  }

  exportPDF(): void {
    window.print();
  }
}
