import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CashRegisterService } from 'src/app/services/cash-register.service';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-caja-detail',
  templateUrl: './caja-detail.component.html',
  styleUrls: ['./caja-detail.component.css']
})
export class CajaDetailComponent implements OnInit {
  @Input() cajaIdInput?: string;
  @Input() showBackButton: boolean = true;

  cajaId!: string;
  caja!: any;
  subtotalVentas: number = 0;
  totalEnCaja: number = 0;
  activeTab: 'balance' | 'sales' | 'expenses' = 'balance';
  expandedSales: { [key: string]: boolean } = {};

  constructor(
    private route: ActivatedRoute,
    private cashRegisterService: CashRegisterService
  ) {}

  ngOnInit(): void {
    if (!this.cajaIdInput) {
      this.cajaId = this.route.snapshot.paramMap.get('cajaId')!;
      if (this.cajaId) {
        this.loadCajaDetails();
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cajaIdInput'] && this.cajaIdInput) {
      this.cajaId = this.cajaIdInput;
      this.caja = null; // Reset current data
      this.activeTab = 'balance';
      this.expandedSales = {};
      this.loadCajaDetails();
    }
  }

  loadCajaDetails(): void {
    this.cashRegisterService.getCajaDetailsById(this.cajaId).subscribe((response) => {
      this.caja = response.caja;
      this.calculateTotals();
    });
  }

  calculateTotals(): void {
    if (this.caja && this.caja.sales) {
      this.subtotalVentas = this.caja.sales.reduce((sum: number, sale: any) => sum + sale.total, 0);
      this.totalEnCaja = this.subtotalVentas + this.caja.initialAmount;
    }
  }

  verifyDeposit(expenseId: string, status: 'verified' | 'rejected'): void {
    const actionText = status === 'verified' ? 'conciliar / aprobar' : 'marcar como discrepancia / rechazar';
    const confirmColor = status === 'verified' ? '#28a745' : '#dc3545';
    
    Swal.fire({
      title: '¿Confirmar Auditoría?',
      text: `¿Estás seguro de que deseas ${actionText} este depósito?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: confirmColor
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Actualizando estatus...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });
        
        this.cashRegisterService.verifyDeposit(this.cajaId, expenseId, status).subscribe({
          next: () => {
            Swal.fire('Éxito', 'El estatus de auditoría se actualizó correctamente', 'success');
            this.loadCajaDetails();
          },
          error: (err) => {
            console.error('Error al conciliar depósito:', err);
            Swal.fire('Error', 'No se pudo actualizar el estatus de conciliación', 'error');
          }
        });
      }
    });
  }

  generarPDF(): void {
    const doc = new jsPDF();
    const marginX = 10;
    let currentY = 20;

    // Título del documento
    doc.setFontSize(16);
    doc.text('Detalles de Caja', marginX, currentY);
    currentY += 10;

    // Información general de la caja
    doc.setFontSize(12);
    doc.text(`Usuario: ${this.caja.user.name}`, marginX, currentY);
    currentY += 8;
    doc.text(`Fecha de Apertura: ${new Date(this.caja.startDate).toLocaleDateString()}`, marginX, currentY);
    currentY += 8;
    if (this.caja.closed) {
      doc.text(`Fecha de Cierre: ${new Date(this.caja.endDate).toLocaleDateString()}`, marginX, currentY);
      currentY += 8;
    }
    doc.text(`Monto Inicial: ${this.caja.initialAmount.toFixed(2)} MXN`, marginX, currentY);
    currentY += 8;
    if (this.caja.closed) {
      doc.text(`Monto Final: ${(this.caja.actualAmount ?? 0).toFixed(2)} MXN`, marginX, currentY);
      currentY += 8;
    }

    // Ventas
    if (this.caja.sales && this.caja.sales.length > 0) {
      currentY += 10;
      doc.setFontSize(14);
      doc.text('Ventas', marginX, currentY);
      currentY += 10;

      this.caja.sales.forEach((sale: any, index: number) => {
        doc.setFontSize(12);
        doc.text(`Venta #${index + 1}`, marginX, currentY);
        currentY += 8;
        doc.text(`Venta ID: ${sale._id}`, marginX, currentY);
        currentY += 8;
        doc.text(`Fecha: ${new Date(sale.date).toLocaleDateString()}`, marginX, currentY);
        currentY += 8;
        doc.text(`Total: ${sale.total.toFixed(2)} MXN`, marginX, currentY);
        currentY += 8;

        if (sale.productsSold && sale.productsSold.length > 0) {
          currentY += 4;
          (doc as any).autoTable({
            startY: currentY,
            head: [['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal', 'Modificaciones']],
            body: sale.productsSold.map((product: any) => [
              product.product.name,
              product.quantity,
              `${product.unitPrice.toFixed(2)} MXN`,
              `${product.subtotal.toFixed(2)} MXN`,
              product.modifications.length > 0
                ? product.modifications.map((mod: any) => `${mod.name} (+${mod.extraPrice.toFixed(2)} MXN)`).join(', ')
                : 'Ninguna'
            ]),
            margin: { left: marginX, right: marginX },
            styles: { fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
            theme: 'grid'
          });
          currentY = (doc as any).lastAutoTable.finalY + 10;
        }
      });
    }

    // Totales
    currentY += 10;
    doc.setFontSize(14);
    doc.text(`Subtotal Ventas: ${this.subtotalVentas.toFixed(2)} MXN`, marginX, currentY);
    currentY += 8;
    doc.text(`Total en Caja: ${this.totalEnCaja.toFixed(2)} MXN`, marginX, currentY);

    // Guardar o imprimir el documento
    doc.save(`Detalles_Caja_${this.cajaId}.pdf`);
  }

  imprimirTicket(): void {
    const doc = new jsPDF();
    const marginX = 10;
    let currentY = 20;

    // Título del documento
    doc.setFontSize(16);
    doc.text('Detalles de Caja - Impresión', marginX, currentY);
    currentY += 10;

    // Información general de la caja
    doc.setFontSize(12);
    doc.text(`Usuario: ${this.caja.user.name}`, marginX, currentY);
    currentY += 8;
    doc.text(`Fecha de Apertura: ${new Date(this.caja.startDate).toLocaleDateString()}`, marginX, currentY);
    currentY += 8;
    if (this.caja.closed) {
      doc.text(`Fecha de Cierre: ${new Date(this.caja.endDate).toLocaleDateString()}`, marginX, currentY);
      currentY += 8;
    }
    doc.text(`Monto Inicial: ${this.caja.initialAmount.toFixed(2)} MXN`, marginX, currentY);
    currentY += 8;
    if (this.caja.closed) {
      doc.text(`Monto Final: ${(this.caja.actualAmount ?? 0).toFixed(2)} MXN`, marginX, currentY);
      currentY += 8;
    }

    // Ventas
    if (this.caja.sales && this.caja.sales.length > 0) {
      currentY += 10;
      doc.setFontSize(14);
      doc.text('Ventas', marginX, currentY);
      currentY += 10;

      this.caja.sales.forEach((sale: any, index: number) => {
        doc.setFontSize(12);
        doc.text(`Venta #${index + 1}`, marginX, currentY);
        currentY += 8;
        doc.text(`Venta ID: ${sale._id}`, marginX, currentY);
        currentY += 8;
        doc.text(`Fecha: ${new Date(sale.date).toLocaleDateString()}`, marginX, currentY);
        currentY += 8;
        doc.text(`Total: ${sale.total.toFixed(2)} MXN`, marginX, currentY);
        currentY += 8;

        if (sale.productsSold && sale.productsSold.length > 0) {
          currentY += 4;
          (doc as any).autoTable({
            startY: currentY,
            head: [['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal', 'Modificaciones']],
            body: sale.productsSold.map((product: any) => [
              product.product.name,
              product.quantity,
              `${product.unitPrice.toFixed(2)} MXN`,
              `${product.subtotal.toFixed(2)} MXN`,
              product.modifications.length > 0
                ? product.modifications.map((mod: any) => `${mod.name} (+${mod.extraPrice.toFixed(2)} MXN)`).join(', ')
                : 'Ninguna'
            ]),
            margin: { left: marginX, right: marginX },
            styles: { fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
            theme: 'grid'
          });
          currentY = (doc as any).lastAutoTable.finalY + 10;
        }
      });
    }

    // Totales
    currentY += 10;
    doc.setFontSize(14);
    doc.text(`Subtotal Ventas: ${this.subtotalVentas.toFixed(2)} MXN`, marginX, currentY);
    currentY += 8;
    doc.text(`Total en Caja: ${this.totalEnCaja.toFixed(2)} MXN`, marginX, currentY);

    // Imprimir el documento
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
    };
  }

  toggleSaleExpand(saleId: string): void {
    this.expandedSales[saleId] = !this.expandedSales[saleId];
  }

  getExpensesSum(expenses: any[] | undefined): number {
    if (!expenses) return 0;
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }
}
