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
    Swal.fire({
      title: 'Cierre de Turno (Corte Z)',
      html: `
        <div class="text-start">
          <p class="mb-2">Por favor, ingresa el monto total de <b>efectivo</b> contado en caja:</p>
          <input type="number" id="actualAmount" class="swal2-input" placeholder="Monto contado ($)" min="0">
          <p class="mt-3 mb-1"><small>Notas adicionales:</small></p>
          <textarea id="notes" class="swal2-textarea" placeholder="Observaciones del cierre..."></textarea>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Finalizar Turno',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      preConfirm: () => {
        const actualAmount = (document.getElementById('actualAmount') as HTMLInputElement).value;
        const notes = (document.getElementById('notes') as HTMLTextAreaElement).value;
        if (!actualAmount || parseFloat(actualAmount) < 0) {
          Swal.showValidationMessage('Debes ingresar un monto válido');
          return false;
        }
        return { actualAmount: parseFloat(actualAmount), notes };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeClose(result.value.actualAmount, result.value.notes);
      }
    });
  }

  addExpenseUI() {
    Swal.fire({
      title: 'Retiro de Efectivo / Gasto',
      html: `
        <div class="text-start">
          <label class="form-label">Monto ($)</label>
          <input type="number" id="expAmount" class="swal2-input" placeholder="0.00" min="0">
          
          <label class="form-label mt-2">Tipo de Movimiento</label>
          <select id="expType" class="swal2-select w-100 m-0">
            <option value="withdrawal">Retiro de Seguridad</option>
            <option value="expense">Gasto de Operación</option>
          </select>

          <label class="form-label mt-2">Motivo / Descripción</label>
          <input type="text" id="expReason" class="swal2-input" placeholder="Ej: Pago de luz, Retiro parcial...">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Registrar Movimiento',
      confirmButtonColor: '#007bff',
      preConfirm: () => {
        const amount = (document.getElementById('expAmount') as HTMLInputElement).value;
        const reason = (document.getElementById('expReason') as HTMLInputElement).value;
        const type = (document.getElementById('expType') as HTMLSelectElement).value;
        if (!amount || parseFloat(amount) <= 0 || !reason) {
          Swal.showValidationMessage('Monto y motivo son obligatorios');
          return false;
        }
        return { amount: parseFloat(amount), reason, type };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.cashRegisterService.addExpense(
          this.openCashRegisterWithSales._id, 
          result.value.amount, 
          result.value.reason, 
          result.value.type as any
        ).subscribe({
          next: () => {
            Swal.fire('Éxito', 'Movimiento registrado correctamente', 'success');
            this.loadOpenCashRegisterWithSales();
          },
          error: () => Swal.fire('Error', 'No se pudo registrar el movimiento', 'error')
        });
      }
    });
  }

  executeClose(actualAmount: number, notes: string) {
    Swal.fire({
      title: 'Procesando cierre...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    this.cashRegisterService.closeCashRegister(
      this.openCashRegisterWithSales._id, 
      actualAmount, 
      notes
    ).subscribe({
      next: (resp) => {
        const diff = resp.difference;
        let diffText = '';
        let diffIcon: 'success' | 'warning' | 'error' = 'success';

        if (diff === 0) {
          diffText = '¡Caja perfecta! No hubo descuadres.';
        } else if (diff > 0) {
          diffText = `Sobran $${diff.toFixed(2)} en caja.`;
          diffIcon = 'warning';
        } else {
          diffText = `Faltan $${Math.abs(diff).toFixed(2)} en caja.`;
          diffIcon = 'error';
        }

        Swal.fire({
          title: 'Turno Cerrado',
          text: diffText,
          icon: diffIcon,
          confirmButtonText: 'Ir al Inicio'
        }).then(() => {
          this.router.navigate(['/dashboard/user']);
        });
      },
      error: (err) => {
        console.error('Error closing shift', err);
        Swal.fire('Error', 'No se pudo cerrar el turno. Intenta de nuevo.', 'error');
      }
    });
  }

  generarPDF() {
    if (!this.openCashRegisterWithSales) return;

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
