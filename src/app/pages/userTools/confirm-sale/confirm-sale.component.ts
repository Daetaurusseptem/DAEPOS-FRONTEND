import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { SalesService } from 'src/app/services/sales.service';
import { AuthService } from 'src/app/services/auth.service';
import { ReceiptPrinterService } from 'src/app/services/receipt-printer.service';
import { CustomerService } from 'src/app/services/customer.service';
import { PromotionService } from 'src/app/services/promotion.service';
import { BranchService } from 'src/app/services/branch.service';
import { HardwareConnectorService } from 'src/app/services/hardware-connector.service';
import { LoggerService } from '../../../services/logger.service';

@Component({
  selector: 'app-confirm-sale',
  templateUrl: './confirm-sale.component.html',
  styleUrls: ['./confirm-sale.component.css'],
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

  // CRM, Lealtad y Promociones
  branchSettings: any = { enabled: false };
  searchCustomerTerm: string = '';
  searchResultsCustomers: any[] = [];
  selectedCustomer: any = null;
  redeemPointsChecked: boolean = false;
  pointsDiscount: number = 0;

  couponCode: string = '';
  appliedPromotion: any = null;
  couponDiscount: number = 0;

  showQuickRegister: boolean = false;
  registerForm!: FormGroup;
  companyId: string = '';

  constructor(
    private fb: FormBuilder,
    private saleService: SalesService,
    private router: Router,
    private authService: AuthService,
    private receiptPrinterService: ReceiptPrinterService,
    private customerService: CustomerService,
    private promotionService: PromotionService,
    private branchService: BranchService,
    private hardwareConnector: HardwareConnectorService,
    private logger: LoggerService,
  ) {
    this.companyId = this.authService.companyId || (this.authService.company as any)?._id || '';

    // Intentar obtener la venta desde la navegación o desde el localStorage
    const navigation = this.router.getCurrentNavigation();
    this.sale = navigation?.extras.state?.['sale'] || this.getSaleFromLocalStorage();

    if (this.sale) {
      this.totalAmount = this.sale.total - this.sale.discount;
      this.sale.productsSold = this.sale.productsSold.map((product: any) => ({
        ...product,
        productName: product.name || 'Producto Desconocido',
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

    // Inicializar el formulario de registro rápido de cliente
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      cardNumber: [''],
      rfc: [''],
    });

    // Cargar la configuración de lealtad de la sucursal actual
    const branchId = this.authService.branch?._id || this.authService.branch;
    if (branchId) {
      this.branchService.getBranchById(branchId).subscribe((resp) => {
        if (resp.ok && resp.branch) {
          this.branchSettings = {
            ...(resp.branch.loyaltySettings || {
              enabled: true,
              identifierType: 'phone',
              pointsEarnRate: 10,
              pointsRedeemRate: 0.1,
              maxRedemptionPercentage: 100,
            }),
            enableVirtualKeyboard: resp.branch.enableVirtualKeyboard ?? false,
          };

          // Adaptar dinámicamente los validadores del registro in-situ según la sucursal
          const phoneCtrl = this.registerForm.get('phone');
          const cardCtrl = this.registerForm.get('cardNumber');
          if (this.branchSettings.identifierType === 'physical_card') {
            phoneCtrl?.clearValidators();
            phoneCtrl?.updateValueAndValidity();
            cardCtrl?.setValidators([Validators.required]);
            cardCtrl?.updateValueAndValidity();
          }
        }
      });
    }

    this.confirmSaleForm = this.fb.group({
      paymentMethod: ['', Validators.required],
      paymentReference: [''],
      receivedAmount: [
        null,
        [
          Validators.required,
          Validators.min(0),
          Validators.pattern(/^\d+(\.\d{1,2})?$/),
          this.amountValidator.bind(this),
        ],
      ],
      change: [{ value: 0, disabled: true }],
    });

    this.confirmSaleForm.get('paymentMethod')!.valueChanges.subscribe((value) => {
      if (value === 'credit') {
        this.confirmSaleForm.get('paymentReference')!.setValidators([Validators.required]);
        this.confirmSaleForm.get('receivedAmount')!.clearValidators();
      } else {
        this.confirmSaleForm.get('paymentReference')!.clearValidators();
        this.confirmSaleForm
          .get('receivedAmount')!
          .setValidators([
            Validators.required,
            Validators.min(0),
            Validators.pattern(/^\d+(\.\d{1,2})?$/),
            this.amountValidator.bind(this),
          ]);
      }
      this.confirmSaleForm.get('paymentReference')!.updateValueAndValidity();
      this.confirmSaleForm.get('receivedAmount')!.updateValueAndValidity();
    });

    this.confirmSaleForm.get('receivedAmount')!.valueChanges.subscribe((value) => {
      this.change = Math.max(0, value - this.totalAmount);
      this.confirmSaleForm.patchValue({ change: this.change }, { emitEvent: false });
    });
  }

  amountValidator(control: AbstractControl): ValidationErrors | null {
    const receivedAmount = control.value;
    if (
      this.confirmSaleForm &&
      this.confirmSaleForm.get('paymentMethod')!.value === 'cash' &&
      receivedAmount < this.totalAmount
    ) {
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
      discount: this.sale.discount, // Enviar descuento computado
      total: this.sale.total, // Enviar total original, el backend calcula el total neto cobrado
      customerId: this.selectedCustomer ? this.selectedCustomer._id : undefined,
      promotionId: this.appliedPromotion ? this.appliedPromotion._id : undefined,
      pointsRedeemed:
        this.selectedCustomer && this.redeemPointsChecked
          ? Math.floor(this.pointsDiscount / (this.branchSettings.pointsRedeemRate || 0.1))
          : 0,
      productsSold: this.sale.productsSold.map((product: any) => ({
        ...product,
        product: product.product, // Incluir el ID del producto antes de enviar al backend
      })),
    };

    const proceedWithSaleCreation = () => {
      this.saleService.createSale(saleData).subscribe(
        (response: any) => {
          this.logger.log('Venta creada con éxito', response);
          this.generarTicket({ ...saleData, _id: response._id, date: response.date });
          this.generarComanda(); // Generar comanda para cocina

          if (saleData.paymentMethod === 'cash') {
            this.hardwareConnector.openCashDrawer().subscribe();
          }

          // Limpiar localStorage después de confirmar la venta
          this.clearSaleFromLocalStorage();

          // Alerta de seguridad si se excede el límite de efectivo
          if (response.cashLimitExceeded) {
            import('sweetalert2').then((Swal) => {
              Swal.default
                .fire({
                  icon: 'warning',
                  title: 'Límite de Efectivo Excedido',
                  text: 'Has superado el límite de seguridad en caja. Por favor, realiza un retiro parcial a la brevedad.',
                  confirmButtonText: 'Entendido',
                  confirmButtonColor: '#f8bb86',
                })
                .then(() => {
                  this.router.navigate(['dashboard/user/sales-success']);
                });
            });
          } else {
            this.router.navigate(['dashboard/user/sales-success']);
          }
        },
        (error) => {
          console.error('Error al crear la venta', error);
          import('sweetalert2').then((Swal) => {
            Swal.default.fire({
              icon: 'error',
              title: 'Error de Cobro',
              text: error.error?.message || 'Ocurrió un error al procesar el cobro.',
              confirmButtonColor: '#d33',
            });
          });
        },
      );
    };

    if (this.confirmSaleForm.value.paymentMethod === 'credit') {
      let paymentSub: Subscription;

      import('sweetalert2').then((Swal) => {
        Swal.default
          .fire({
            title: 'Cobrando en Terminal...',
            text: `Por favor inserte la tarjeta y cobre $${this.totalAmount.toFixed(2)}`,
            showCancelButton: true,
            cancelButtonText: 'Cancelar Operación',
            allowOutsideClick: false,
            didOpen: () => Swal.default.showLoading(),
          })
          .then((result) => {
            if (result.isDismissed) {
              // El usuario canceló la espera
              if (paymentSub) {
                paymentSub.unsubscribe();
              }
              Swal.default.fire('Cancelado', 'Operación cancelada por el cajero', 'info');
            }
          });

        paymentSub = this.hardwareConnector.chargePayment(this.totalAmount).subscribe((res) => {
          if (res.status === 'approved') {
            saleData.paymentReference = res.reference;
            Swal.default.close();
            proceedWithSaleCreation();
          } else {
            Swal.default.fire('Error en Terminal', res.message || 'Pago rechazado o cancelado', 'error');
          }
        });
      });
    } else {
      proceedWithSaleCreation();
    }
  }

  // --- MÉTODOS DE CRM, CLIENTE FRECUENTE Y CUPONES ---

  searchCustomer(term: string): void {
    this.searchCustomerTerm = term;
    if (!term || term.trim().length < 2) {
      this.searchResultsCustomers = [];
      return;
    }

    this.customerService.searchCustomers(this.companyId, term.trim()).subscribe((resp) => {
      if (resp.ok) {
        this.searchResultsCustomers = resp.customers;
      }
    });
  }

  selectCustomer(customer: any): void {
    this.selectedCustomer = customer;
    this.searchResultsCustomers = [];
    this.searchCustomerTerm = '';
    this.redeemPointsChecked = false;
    this.updateLoyaltyCalculations();
  }

  removeSelectedCustomer(): void {
    this.selectedCustomer = null;
    this.redeemPointsChecked = false;
    this.pointsDiscount = 0;
    this.recalculateTotals();
  }

  toggleRedeemPoints(event: any): void {
    this.redeemPointsChecked = event.target.checked;
    this.updateLoyaltyCalculations();
  }

  updateLoyaltyCalculations(): void {
    this.recalculateTotals();
  }

  applyCoupon(): void {
    if (!this.couponCode || this.couponCode.trim() === '') {
      return;
    }

    const branchId = this.authService.branch?._id || this.authService.branch || '';

    import('sweetalert2').then((Swal) => {
      this.promotionService
        .validateDiscountCode(this.companyId, this.couponCode.trim(), this.sale.total, branchId)
        .subscribe({
          next: (resp) => {
            if (resp.ok && resp.promotion) {
              this.appliedPromotion = resp.promotion;
              this.couponCode = '';
              this.recalculateTotals();
              Swal.default.fire({
                icon: 'success',
                title: 'Cupón Aplicado',
                text: `Código ${resp.promotion.code} aplicado con éxito.`,
                timer: 1500,
                showConfirmButton: false,
              });
            }
          },
          error: (err) => {
            console.error(err);
            Swal.default.fire({
              icon: 'error',
              title: 'Cupón Inválido',
              text: err.error?.message || 'El cupón ingresado no es válido.',
              confirmButtonColor: '#d33',
            });
          },
        });
    });
  }

  removeCoupon(): void {
    this.appliedPromotion = null;
    this.couponDiscount = 0;
    this.recalculateTotals();
  }

  recalculateTotals(): void {
    // 1. Calcular Descuento por Cupón
    let couponDisc = 0;
    if (this.appliedPromotion) {
      const targetCats = this.appliedPromotion.targetCategories || [];

      // Determinar si el producto coincide con las categorías del cupón
      const matchesCategory = (prodSold: any) => {
        if (!targetCats || targetCats.length === 0) {
          return true;
        }
        const prodCategories = prodSold.categories || [];
        return prodCategories.some((cat: any) => {
          const catId = typeof cat === 'object' ? cat._id : cat;
          return targetCats.some((tCatId: any) => {
            const tId = typeof tCatId === 'object' ? tCatId._id : tCatId;
            return tId.toString() === catId.toString();
          });
        });
      };

      // Calcular el subtotal elegible
      let eligibleSubtotal = 0;
      if (this.sale.productsSold && this.sale.productsSold.length > 0) {
        this.sale.productsSold.forEach((prod: any) => {
          if (matchesCategory(prod)) {
            eligibleSubtotal += prod.subtotal || 0;
          }
        });
      } else {
        eligibleSubtotal = this.sale.total;
      }

      if (this.appliedPromotion.type === 'percentage') {
        couponDisc = eligibleSubtotal * (this.appliedPromotion.value / 100);
      } else {
        couponDisc = Math.min(this.appliedPromotion.value, eligibleSubtotal);
      }
    }
    this.couponDiscount = couponDisc;

    // 2. Calcular Descuento por Puntos sobre el Neto Remanente
    const netForLoyalty = Math.max(0, this.sale.total - this.couponDiscount);
    if (this.selectedCustomer && this.redeemPointsChecked) {
      const maxAllowedDiscount = netForLoyalty * ((this.branchSettings.maxRedemptionPercentage || 100) / 100);
      const potentialDiscount = this.selectedCustomer.loyaltyPoints * (this.branchSettings.pointsRedeemRate || 0.1);
      this.pointsDiscount = Math.min(potentialDiscount, maxAllowedDiscount);
    } else {
      this.pointsDiscount = 0;
    }

    // 3. Aplicar descuento total
    this.sale.discount = this.couponDiscount + this.pointsDiscount;
    this.totalAmount = Math.max(0, this.sale.total - this.sale.discount);

    // 4. Actualizar formularios y cambio
    if (this.confirmSaleForm) {
      const receivedCtrl = this.confirmSaleForm.get('receivedAmount');
      if (receivedCtrl) {
        receivedCtrl.updateValueAndValidity();
      }

      const receivedVal = receivedCtrl?.value || 0;
      this.change = Math.max(0, receivedVal - this.totalAmount);
      this.confirmSaleForm.patchValue({ change: this.change }, { emitEvent: false });
    }
  }

  openQuickRegister(): void {
    this.registerForm.reset({
      name: '',
      phone: '',
      cardNumber: '',
      rfc: '',
    });
    // Adaptar dinámicamente los validadores al abrir en caso de cambio de sucursal
    const phoneCtrl = this.registerForm.get('phone');
    const cardCtrl = this.registerForm.get('cardNumber');
    if (this.branchSettings.identifierType === 'physical_card') {
      phoneCtrl?.clearValidators();
      cardCtrl?.setValidators([Validators.required]);
    } else {
      phoneCtrl?.setValidators([Validators.required, Validators.pattern(/^\d{10}$/)]);
      cardCtrl?.clearValidators();
    }
    phoneCtrl?.updateValueAndValidity();
    cardCtrl?.updateValueAndValidity();
    this.showQuickRegister = true;
  }

  closeQuickRegister(): void {
    this.showQuickRegister = false;
  }

  submitQuickRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    import('sweetalert2').then((Swal) => {
      this.customerService.createCustomer(this.registerForm.value, this.companyId).subscribe({
        next: (resp) => {
          if (resp.ok && resp.customer) {
            this.selectedCustomer = resp.customer;
            this.showQuickRegister = false;
            this.recalculateTotals();
            Swal.default.fire({
              icon: 'success',
              title: 'Cliente Registrado',
              text: `${resp.customer.name} ha sido seleccionado para la compra.`,
              timer: 1500,
              showConfirmButton: false,
            });
          }
        },
        error: (err) => {
          console.error(err);
          Swal.default.fire({
            icon: 'error',
            title: 'Error al Registrar',
            text: err.error?.message || 'No se pudo crear el cliente.',
            confirmButtonColor: '#d33',
          });
        },
      });
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
${saleData.productsSold
  .map(
    (product: any) => `
${String(product.quantity).padEnd(5)} ${this.shortenText(product.productName, 15).padEnd(15)} $${((product.unitPrice + this.getModificationsTotalPrice(product.modifications)) * product.quantity).toFixed(2).padStart(8)}
${product.modifications && product.modifications.length > 0 ? `     * ${this.shortenText(product.modifications.map((mod: any) => `${mod.name}`).join(', '), 30)}` : ''}
`,
  )
  .join('')}
----------------------------------------
TOTAL:                      $${saleData.total.toFixed(2).padStart(8)}
DESCUENTO:                  $${saleData.discount.toFixed(2).padStart(8)}
----------------------------------------
${
  saleData.paymentMethod === 'cash'
    ? `MONTO RECIBIDO:         $${Number(saleData.receivedAmount).toFixed(2).padStart(8)}
CAMBIO:                   $${saleData.change.toFixed(2).padStart(8)}`
    : `REFERENCIA PAGO:       ${saleData.paymentReference || 'N/A'}`
}
========================================
       ¡Gracias por su preferencia!
========================================
    `;

    const printer = this.receiptPrinterService.getDefaultPrinter('ticket');
    if (printer) {
      this.receiptPrinterService.printTicket(printer.name, content, printer.paperSize).subscribe(
        (response) => {
          this.logger.log('Ticket enviado a la impresora con éxito', response);
        },
        (error) => {
          console.error('Error al enviar el ticket a la impresora', error);
        },
      );
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
${this.sale.productsSold
  .map(
    (product: any) => `
${String(product.quantity).padEnd(5)} ${this.shortenText(product.productName, 25)}
${product.modifications && product.modifications.length > 0 ? `     * Mod: ${product.modifications.map((mod: any) => `${this.shortenText(mod.name, 15)}`).join(', ')}` : ''}
`,
  )
  .join('')}
----------------------------------------
========================================
    `;

    const printer = this.receiptPrinterService.getDefaultPrinter('comanda');
    if (printer) {
      this.receiptPrinterService.printTicket(printer.name, content, printer.paperSize).subscribe(
        (response) => {
          this.logger.log('Comanda enviada a la impresora con éxito', response);
        },
        (error) => {
          console.error('Error al enviar la comanda a la impresora', error);
        },
      );
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

  onInputClick(fieldName: string, numericOnly: boolean): void {
    if (this.branchSettings.enableVirtualKeyboard) {
      this.openKeyboard(fieldName, numericOnly);
    }
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
