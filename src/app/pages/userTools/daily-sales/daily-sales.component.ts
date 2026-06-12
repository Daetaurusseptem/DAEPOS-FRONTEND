import { Component, OnInit } from '@angular/core';
import { CashRegisterService } from 'src/app/services/cash-register.service';
import { AuthService } from 'src/app/services/auth.service';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

interface Sale {
  date: Date;
  total: number;
  paymentMethod: string;
}

@Component({
  selector: 'app-daily-sales',
  templateUrl: './daily-sales.component.html',
  styleUrls: ['./daily-sales.component.css']
})
export class DailySalesComponent implements OnInit {
  openCashRegisterWithSales: any;
  usuario = '';

  constructor(
    private cashRegisterService: CashRegisterService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadOpenCashRegisterWithSales();
    this.usuario = this.authService.usuario.name;
  }

  get totalExpenses(): number {
    if (!this.openCashRegisterWithSales || !this.openCashRegisterWithSales.expenses) return 0;
    return this.openCashRegisterWithSales.expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
  }

  getReceipt(id: string) {
    this.router.navigateByUrl(`/dashboard/user/sale-details/${id}`);
  }

  loadOpenCashRegisterWithSales() {
    const userId = this.authService.usuario.id;
    this.cashRegisterService.getOpenCashRegisterWithSales(userId).subscribe({
      next: (data) => {
        this.openCashRegisterWithSales = data;
      },
      error: (error) => {
        console.error('Error fetching open cash register with sales', error);
      }
    });
  }

  closeShift() {
    this.router.navigate(['/dashboard/user/close-register']);
  }

  addExpenseUI() {
    Swal.fire({
      title: 'Retiro de Efectivo / Gasto',
      html: `
        <div class="text-start">
          <label class="form-label" style="font-weight: 600; color: #1a1a1a;">Monto ($)</label>
          <input type="number" id="expAmount" class="swal2-input m-0 w-100" placeholder="0.00" min="0">
          
          <label class="form-label mt-3" style="font-weight: 600; color: #1a1a1a;">Tipo de Movimiento</label>
          <select id="expType" class="swal2-select w-100 m-0" style="padding: 10px;" onchange="window.toggleRefField()">
            <option value="withdrawal">Retiro de Seguridad para Bóveda</option>
            <option value="expense">Gasto de Operación</option>
          </select>

          <div id="refFieldContainer" class="mt-3">
            <label class="form-label" style="font-weight: 600; color: #1a1a1a;">Folio de Sobre / Referencia de Bóveda</label>
            <input type="text" id="expRef" class="swal2-input m-0 w-100" placeholder="Ej: SOBRE-4893">
          </div>

          <label class="form-label mt-3" style="font-weight: 600; color: #1a1a1a;">Motivo / Descripción</label>
          <input type="text" id="expReason" class="swal2-input m-0 w-100" placeholder="Ej: Retiro parcial por seguridad...">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Registrar Movimiento',
      confirmButtonColor: '#007bff',
      didOpen: () => {
        (window as any).toggleRefField = () => {
          const typeEl = document.getElementById('expType') as HTMLSelectElement;
          const refContainer = document.getElementById('refFieldContainer');
          if (typeEl && refContainer) {
            refContainer.style.display = typeEl.value === 'withdrawal' ? 'block' : 'none';
          }
        };
        (window as any).toggleRefField();
      },
      preConfirm: () => {
        const amount = (document.getElementById('expAmount') as HTMLInputElement).value;
        const reason = (document.getElementById('expReason') as HTMLInputElement).value;
        const type = (document.getElementById('expType') as HTMLSelectElement).value;
        const refVal = (document.getElementById('expRef') as HTMLInputElement).value;
        
        if (!amount || parseFloat(amount) <= 0 || !reason) {
          Swal.showValidationMessage('Monto y motivo son obligatorios');
          return false;
        }
        
        const parsedAmount = parseFloat(amount);
        const available = this.openCashRegisterWithSales.expectedAmount || 0;
        if (parsedAmount > available) {
          Swal.showValidationMessage(`No puedes retirar más del efectivo disponible en caja ($${available.toFixed(2)})`);
          return false;
        }

        if (type === 'withdrawal' && !refVal) {
          Swal.showValidationMessage('El folio del sobre de seguridad es obligatorio');
          return false;
        }
        return { amount: parsedAmount, reason, type, depositReference: type === 'withdrawal' ? refVal : '' };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.cashRegisterService.addExpense(
          this.openCashRegisterWithSales._id, 
          result.value.amount, 
          result.value.reason, 
          result.value.type as any,
          result.value.depositReference
        ).subscribe({
          next: () => {
            Swal.fire('Éxito', 'Movimiento registrado correctamente', 'success');
            this.loadOpenCashRegisterWithSales();
          },
          error: (err) => {
            const errorMsg = err.error?.message || 'No se pudo registrar el movimiento';
            Swal.fire('Error', errorMsg, 'error');
          }
        });
      }
    });
  }

  // executeClose removed

  generarPDF() {
    if (!this.openCashRegisterWithSales) return;

    const userId = this.authService.usuario.id;
    const expected = this.openCashRegisterWithSales.expectedAmount || 0;
    
    // Registrar huella de Corte X en base de datos antes de mandar a imprimir
    this.cashRegisterService.registerCorteX(this.openCashRegisterWithSales._id, userId, expected).subscribe({
      next: () => {
        console.log('Huella de Corte X registrada en el servidor.');
      },
      error: (err) => {
        console.error('Error al registrar huella de Corte X:', err);
      }
    });

    const doc = new jsPDF({
      format: [58.28, 350.89]
    });

    const marginX = 2;
    let currentY = 10;

    doc.setFontSize(10);
    doc.text('Corte de Caja Parcial (Corte X)', marginX, currentY);
    currentY += 4;

    doc.setFontSize(8);
    doc.text(`Usuario: ${this.usuario}`, marginX, currentY);
    currentY += 4;
    doc.text(`Caja: ${this.openCashRegisterWithSales.physicalRegister?.name || 'N/A'}`, marginX, currentY);
    currentY += 4;
    doc.text(`Inicio: ${new Date(this.openCashRegisterWithSales.startDate).toLocaleString()}`, marginX, currentY);
    currentY += 4;
    doc.text(`Fondo Inicial: $${this.openCashRegisterWithSales.initialAmount}`, marginX, currentY);
    currentY += 6;

    const subtotal = this.openCashRegisterWithSales.sales.reduce((sum: number, sale: Sale) => sum + sale.total, 0);

    (doc as any).autoTable({
      head: [['Fecha', 'Monto', 'Método']],
      body: [
        ...this.openCashRegisterWithSales.sales.map((sale: Sale) => [
          new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sale.total.toFixed(2),
          sale.paymentMethod,
        ]),
        [{ content: 'Ventas Totales', colSpan: 1, styles: { halign: 'right', fontStyle: 'bold' } }, { content: subtotal.toFixed(2), colSpan: 1, styles: { halign: 'right', fontStyle: 'bold' } }, ''],
        [{ content: 'Total Esperado en Caja', colSpan: 1, styles: { halign: 'right', fontStyle: 'bold' } }, { content: this.openCashRegisterWithSales.expectedAmount.toFixed(2), colSpan: 1, styles: { halign: 'right', fontStyle: 'bold' } }, '']
      ],
      startY: currentY,
      margin: { left: marginX, right: marginX },
      styles: { fontSize: 7, cellPadding: 1, overflow: 'linebreak' },
      columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 15 }, 2: { cellWidth: 23 } },
      theme: 'plain'
    });

    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(url)!;

    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
  }
}
