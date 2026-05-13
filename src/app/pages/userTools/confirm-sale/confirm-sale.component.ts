import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { SalesService } from 'src/app/services/sales.service';
import { AuthService } from 'src/app/services/auth.service';
import { ReceiptPrinterService } from 'src/app/services/receipt-printer.service';

@Component({
  selector: 'app-confirm-sale',
  templateUrl: './confirm-sale.component.html',
  styleUrls: ['./confirm-sale.component.css']
})
export class ConfirmSaleComponent implements OnInit {
  @ViewChild('keyboardDialog') keyboardDialog!: ElementRef<HTMLDialogElement>;

  confirmSaleForm!: FormGroup;
  sale: any;
  totalAmount: number = 0;
  change: number = 0;
  usuario = this.authService.usuario?.name || 'Usuario Desconocido';
  currentInputField: string = '';
  currentInputValue: string = '';
  isNumeric: boolean = false;

  empresa: string = 'CAFETERÍA CAFÉLOT'; // Nombre de la empresa

  constructor(
    private fb: FormBuilder,
    private saleService: SalesService,
    private router: Router,
    private authService: AuthService,
    private receiptPrinterService: ReceiptPrinterService
  ) {
    // Intentar obtener la venta desde la navegación o desde el localStorage
    const navigation = this.router.getCurrentNavigation();
    this.sale = navigation?.extras.state?.['sale'] || this.getSaleFromLocalStorage();

    if (this.sale) {
      this.totalAmount = this.sale.total - this.sale.discount;
      this.sale.productsSold = this.sale.productsSold.map((product: any) => ({
        ...product,
        productName: product.name || 'Producto Desconocido'
      }));
    } else {
      console.error('No se recibieron los datos de la venta');
    }
  }

  ngOnInit(): void {
    // Almacenar la venta en localStorage si existe
    if (this.sale) {
      this.saveSaleToLocalStorage(this.sale);
    }

    this.confirmSaleForm = this.fb.group({
      paymentMethod: ['', Validators.required],
      paymentReference: [''],
      receivedAmount: [null, [Validators.required, Validators.min(0), Validators.pattern(/^\d+(\.\d{1,2})?$/), this.amountValidator.bind(this)]],
      change: [{ value: 0, disabled: true }]
    });

    this.confirmSaleForm.get('paymentMethod')!.valueChanges.subscribe((value) => {
      if (value === 'credit') {
        this.confirmSaleForm.get('paymentReference')!.setValidators([Validators.required]);
        this.confirmSaleForm.get('receivedAmount')!.clearValidators();
      } else {
        this.confirmSaleForm.get('paymentReference')!.clearValidators();
        this.confirmSaleForm.get('receivedAmount')!.setValidators([Validators.required, Validators.min(0), Validators.pattern(/^\d+(\.\d{1,2})?$/), this.amountValidator.bind(this)]);
      }
      this.confirmSaleForm.get('paymentReference')!.updateValueAndValidity();
      this.confirmSaleForm.get('receivedAmount')!.updateValueAndValidity();
    });

    this.confirmSaleForm.get('receivedAmount')!.valueChanges.subscribe((value) => {
      this.change = value - this.totalAmount;
      this.confirmSaleForm.patchValue({ change: this.change });
    });
  }

  amountValidator(control: AbstractControl): ValidationErrors | null {
    const receivedAmount = control.value;
    if (this.confirmSaleForm && this.confirmSaleForm.get('paymentMethod')!.value === 'cash' && receivedAmount < this.totalAmount) {
      return { insufficientAmount: true };
    }
    return null;
  }

  confirmSale(): void {
    if (this.confirmSaleForm.invalid) {
      this.confirmSaleForm.markAllAsTouched();
      return;
    }

    const saleData = {
      ...this.sale,
      paymentMethod: this.confirmSaleForm.value.paymentMethod,
      paymentReference: this.confirmSaleForm.value.paymentReference,
      receivedAmount: this.confirmSaleForm.value.receivedAmount,
      change: this.change,
      productsSold: this.sale.productsSold.map((product: any) => ({
        ...product,
        product: product.product // Incluir el ID del producto antes de enviar al backend
      }))
    };

    this.saleService.createSale(saleData).subscribe((response: any) => {
      console.log('Venta creada con éxito', response);
      this.generarTicket(saleData);
      this.generarComanda(); // Generar comanda para cocina

      // Limpiar localStorage después de confirmar la venta
      this.clearSaleFromLocalStorage();

      // Alerta de seguridad si se excede el límite de efectivo
      if (response.cashLimitExceeded) {
        import('sweetalert2').then((Swal) => {
          Swal.default.fire({
            icon: 'warning',
            title: 'Límite de Efectivo Excedido',
            text: 'Has superado el límite de seguridad en caja. Por favor, realiza un retiro parcial a la brevedad.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#f8bb86'
          }).then(() => {
            this.router.navigate(['dashboard/user/sales-success']);
          });
        });
      } else {
        this.router.navigate(['dashboard/user/sales-success']);
      }
    }, error => {
      console.error('Error al crear la venta', error);
    });
  }

  generarTicket(saleData: any) {
    const content = `
========================================
          ${this.empresa.toUpperCase()}
========================================
Dirección: 123 Store St, Ciudad, País
Teléfono: (123) 456-7890
Correo: contacto@cafeteria.com
----------------------------------------
Número de Orden: ${saleData._id || 'N/A'}
Fecha: ${new Date(saleData.date || new Date()).toLocaleDateString()} 
Hora: ${new Date(saleData.date || new Date()).toLocaleTimeString()}
----------------------------------------
CANT   PRODUCTO               PRECIO
----------------------------------------
${saleData.productsSold.map((product: any) => `
${String(product.quantity).padEnd(5)} ${this.shortenText(product.productName, 15).padEnd(15)} $${((product.unitPrice + this.getModificationsTotalPrice(product.modifications)) * product.quantity).toFixed(2).padStart(8)}
${product.modifications && product.modifications.length > 0 ? `     * ${this.shortenText(product.modifications.map((mod: any) => `${mod.name}`).join(', '), 30)}` : ''}
`).join('')}
----------------------------------------
TOTAL:                      $${saleData.total.toFixed(2).padStart(8)}
DESCUENTO:                  $${saleData.discount.toFixed(2).padStart(8)}
----------------------------------------
${saleData.paymentMethod === 'cash' ? `MONTO RECIBIDO:         $${Number(saleData.receivedAmount).toFixed(2).padStart(8)}
CAMBIO:                   $${saleData.change.toFixed(2).padStart(8)}` : `REFERENCIA PAGO:       ${saleData.paymentReference || 'N/A'}`}
========================================
       ¡Gracias por su preferencia!
========================================
    `;

    const printer = this.receiptPrinterService.getDefaultPrinter('ticket');
    if (printer) {
      this.receiptPrinterService.printTicket(printer.name, content, printer.paperSize).subscribe(response => {
        console.log('Ticket enviado a la impresora con éxito', response);
      }, error => {
        console.error('Error al enviar el ticket a la impresora', error);
      });
    } else {
      console.error('No hay impresora de tickets predeterminada configurada');
    }
  }

  generarComanda() {
    const content = `
========================================
          ${this.empresa.toUpperCase()}
========================================
Número de Orden: ${this.sale._id || 'N/A'}
Fecha: ${new Date(this.sale.date || new Date()).toLocaleDateString()} 
Hora: ${new Date(this.sale.date || new Date()).toLocaleTimeString()}
----------------------------------------
CANT   PRODUCTO
----------------------------------------
${this.sale.productsSold.map((product: any) => `
${String(product.quantity).padEnd(5)} ${this.shortenText(product.productName, 25)}
${product.modifications && product.modifications.length > 0 ? `     * Mod: ${product.modifications.map((mod: any) => `${this.shortenText(mod.name, 15)}`).join(', ')}` : ''}
`).join('')}
----------------------------------------
========================================
    `;

    const printer = this.receiptPrinterService.getDefaultPrinter('comanda');
    if (printer) {
      this.receiptPrinterService.printTicket(printer.name, content, printer.paperSize).subscribe(response => {
        console.log('Comanda enviada a la impresora con éxito', response);
      }, error => {
        console.error('Error al enviar la comanda a la impresora', error);
      });
    } else {
      console.error('No hay impresora de comandas predeterminada configurada');
    }
  }

  // Métodos para manejar localStorage
  saveSaleToLocalStorage(sale: any) {
    localStorage.setItem('pendingSale', JSON.stringify(sale));
  }

  getSaleFromLocalStorage() {
    const saleData = localStorage.getItem('pendingSale');
    return saleData ? JSON.parse(saleData) : null;
  }

  clearSaleFromLocalStorage() {
    localStorage.removeItem('pendingSale');
  }

  // Método para recortar texto si es muy largo
  shortenText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }

  get paymentMethod() {
    return this.confirmSaleForm.get('paymentMethod');
  }

  get paymentReference() {
    return this.confirmSaleForm.get('paymentReference');
  }

  get receivedAmount() {
    return this.confirmSaleForm.get('receivedAmount');
  }

  get changeControl() {
    return this.confirmSaleForm.get('change');
  }

  openKeyboard(fieldName: string, numericOnly: boolean): void {
    this.currentInputField = fieldName;
    this.currentInputValue = this.confirmSaleForm.get(fieldName)?.value || '';
    this.isNumeric = numericOnly;
    this.keyboardDialog.nativeElement.showModal();
  }

  onKeyboardInput(value: string): void {
    this.currentInputValue = value;
  }

  closeKeyboard(): void {
    this.confirmSaleForm.patchValue({ [this.currentInputField]: this.currentInputValue });
    this.keyboardDialog.nativeElement.close();
  }

  onBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.tagName === 'DIALOG') {
      this.closeKeyboard();
    }
  }

  getModificationsTotalPrice(modifications: any[]): number {
    if (!modifications || modifications.length === 0) {
      return 0;
    }
    return modifications.reduce((sum, mod) => sum + (mod.extraPrice || 0), 0);
  }
}
