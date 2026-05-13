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
  companyId: string;
  isProductView: boolean = true;

  // Chart configuration
  barChartOptions: ChartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };
  barChartLabels: string[] = [];
  barChartType: ChartType = 'bar';
  barChartLegend = true;
  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Cantidad Vendida', backgroundColor: 'rgba(75, 192, 192, 0.6)' }
    ]
  };

  constructor(
    private statisticsService: StatisticsService,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.companyId = this.authService.companyId!;
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.initForm();
    this.loadData();
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
    this.statisticsService.getTopSellingProductsByWeek(year, week, this.companyId).subscribe({
      next: (data) => {
        this.topSellingProducts = data.sales || [];
        this.updateChartData();
      },
      error: (error) => console.error('Error loading top selling products:', error)
    });
  }

  private loadIngredientsStatistics(): void {
    const { year, week } = this.searchForm.value;
    this.statisticsService.getIngredientsStatisticsByWeek(year, week, this.companyId).subscribe({
      next: (data) => {
        this.ingredientsStatistics = data.ingredients || [];
        this.updateChartData();
      },
      error: (error) => console.error('Error loading ingredients statistics:', error)
    });
  }

  private updateChartData(): void {
    const data = this.isProductView ? this.topSellingProducts : this.ingredientsStatistics;
    this.barChartLabels = data.map(item => this.isProductView ? (item.product?.name || 'Desconocido') : item._id);
    this.barChartData.labels = this.barChartLabels;
    this.barChartData.datasets[0].data = data.map(item => this.isProductView ? item.totalQuantity : item.totalStock);
    this.barChartData.datasets[0].label = this.isProductView ? 'Cantidad Vendida' : 'Stock Total';
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
}
