import { Component, ElementRef, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { Category, InventoryItem } from 'src/app/interfaces/models.interface';
import { AuthService } from 'src/app/services/auth.service';
import { CategoryService } from 'src/app/services/category.service';
import { InventoryService } from 'src/app/services/inventory.service';
import { SalesService } from 'src/app/services/sales.service';
import Swal from 'sweetalert2';
import { CashRegisterService } from 'src/app/services/cash-register.service';
import { CustomerService } from 'src/app/services/customer.service';
import { PromotionService } from 'src/app/services/promotion.service';
import { BranchService } from 'src/app/services/branch.service';
import { ReceiptPrinterService } from 'src/app/services/receipt-printer.service';
import { PendingOrderService } from 'src/app/services/pending-order.service';
import { SocketService } from 'src/app/services/socket.service';
import { SupplierService } from 'src/app/services/provider.service';
import { Subscription } from 'rxjs';
import { HardwareConnectorService } from 'src/app/services/hardware-connector.service';
import { LoggerService } from '../../../services/logger.service';

@Component({
  selector: 'app-newsale',
  templateUrl: './newsale.component.html',
  styleUrls: ['./newsale.component.css'],
})
export class NewsaleComponent implements OnInit, OnDestroy {
  @ViewChild('keyboardDialog') keyboardDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  @HostListener('document:keydown', ['$event'])
  handleGlobalKeydown(event: KeyboardEvent) {
    if (this.posMode === 'retail' && !this.checkoutMode && !this.showPendingOrderModal) {
      const activeEl = document.activeElement as HTMLElement;
      if (activeEl && activeEl.tagName !== 'INPUT' && activeEl.tagName !== 'TEXTAREA') {
        if (this.searchInput) {
          this.searchInput.nativeElement.focus();
        }
      }
    }
  }

  searchForm!: FormGroup;
  items: any[] = [];
  categories: any[] = [];
  selectedCategory: string = '';
  cart: any[] = [];
  total: number = 0;
  currentPage: number = 1;
  totalPages: number = 1;
  search: string = '';
  companyId?: string;
  availableExclusiveModifications: any[] = [];
  selectedExclusiveModification: any | null = null;
  availableNonExclusiveModifications: any[] = [];
  selectedNonExclusiveModifications: any[] = [];
  selectedQuantity: number = 1;
  selectedItem: any | null = null;
  availableSizes: any[] = [];
  selectedSize: any = null;
  posMode: 'retail' | 'hospitality' = 'retail'; // Nuevo: Modo de interfaz
  activeTab: 'catalog' | 'pending' = 'catalog'; // Nuevo: Tab activo en modo nativo

  // --- PROPIEDADES DE UNIFICACIÓN DE COBRO ---
  checkoutMode: boolean = false;
  confirmSaleForm!: FormGroup;
  registerForm!: FormGroup;
  change: number = 0;
  currentInputField: string = '';
  currentInputValue: string = '';
  isNumeric: boolean = false;
  usuario = this.authService.usuario?.name || 'Usuario Desconocido';
  empresa: string = 'CAFETERÍA CAFÉLOT';

  branchSettings: any = { enabled: false, enableVirtualKeyboard: false };
  searchCustomerTerm: string = '';
  searchResultsCustomers: any[] = [];
  selectedCustomer: any = null;
  redeemPointsChecked: boolean = false;
  pointsDiscount: number = 0;

  couponCode: string = '';
  appliedPromotion: any = null;
  couponDiscount: number = 0;

  showQuickRegister: boolean = false;

  // --- PROPIEDADES DE ÓRDENES PENDIENTES (FASE 2) ---
  pendingOrders: any[] = [];
  activePendingOrderId: string | null = null;
  tableNumber: string = '';
  clientName: string = '';
  serviceType: 'dine_in' | 'take_away' | 'delivery' | 'drive_thru' = 'dine_in';
  guestsCount: number = 1;
  carDescription: string = '';
  licensePlate: string = '';
  laneNumber: number = 1;
  deliveryPlatform: 'uber_eats' | 'rappi' | 'didi_food' | 'phone_order' | 'custom_delivery' = 'uber_eats';
  deliveryOrderId: string = '';
  deliveryCourierName: string = '';
  deliveryNotes: string = '';
  showPendingOrderModal: boolean = false;

  suppliersList: any[] = [];
  systemSupplierId?: string;
  defaultSupplierId?: string;

  pendingDeliveries: any[] = [];

  private socketSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private categoryService: CategoryService,
    private saleService: SalesService,
    private authService: AuthService,
    private router: Router,
    private cashRegisterService: CashRegisterService,
    private customerService: CustomerService,
    private promotionService: PromotionService,
    private branchService: BranchService,
    private receiptPrinterService: ReceiptPrinterService,
    private pendingOrderService: PendingOrderService,
    private socketService: SocketService,
    private supplierService: SupplierService,
    private hardwareConnector: HardwareConnectorService,
    private logger: LoggerService,
  ) {
    if (this.authService.role == 'user') {
      this.companyId = authService.companyId!;
    } else {
      this.companyId = authService.company?._id!;
    }
  }

  ngOnInit(): void {
    // Validar seguridad de caja abierta antes de cargar la pantalla de venta
    const userId = this.authService.idUsuario;
    this.cashRegisterService.hasOpenCashRegister(userId).subscribe((hasOpen) => {
      if (!hasOpen) {
        Swal.fire({
          title: 'Caja Cerrada',
          text: 'Debes abrir una caja de cobro para poder realizar ventas.',
          icon: 'warning',
          confirmButtonText: 'Ir a Inicio',
          confirmButtonColor: '#0f172a',
          allowOutsideClick: false,
        }).then(() => {
          this.router.navigate(['/dashboard/user']);
        });
      }
    });

    // Initialize POS mode from company/branch settings
    let preferredMode: 'retail' | 'hospitality' = 'retail';
    if (this.authService.company && this.authService.company.saleType) {
      preferredMode = this.authService.company.saleType;
    }
    const cachedBranch = this.authService.branch;
    if (cachedBranch && cachedBranch.saleType) {
      preferredMode = cachedBranch.saleType;
    }
    this.posMode = preferredMode;

    // Cargar configuraciones de la sucursal (CRM Lealtad + Teclado Virtual + Modo POS de Sucursal)
    const branchId = this.authService.branch?._id || this.authService.branch || '';
    if (branchId) {
      this.socketService.connect(undefined, branchId);
      this.socketSubscription = this.socketService.onEvent('kds-update').subscribe(() => {
        if (this.posMode === 'hospitality') {
          this.loadPendingOrders();
        }
      });

      this.branchService.getBranchById(branchId).subscribe((res: any) => {
        if (res && res.branch) {
          if (res.branch.loyaltySettings) {
            this.branchSettings = res.branch.loyaltySettings;
          }
          if (res.branch.saleType) {
            this.posMode = res.branch.saleType;
          }
        }
      });
    }

    // Inicializar Formulario de Cobro
    this.confirmSaleForm = this.fb.group(
      {
        paymentMethod: ['cash', Validators.required],
        receivedAmount: [0, [Validators.required, Validators.min(0.01), Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
        paymentReference: [''],
        change: [{ value: '$0.00', disabled: true }],
      },
      { validators: this.amountValidator.bind(this) },
    );

    // Inicializar Formulario de Registro Rápido CRM
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
    });

    // Reactividad para cobros y cambio
    this.confirmSaleForm.get('receivedAmount')?.valueChanges.subscribe((val) => {
      if (val !== null && val < 0) {
        this.confirmSaleForm.get('receivedAmount')?.setValue(0, { emitEvent: false });
      }
      this.calculateChange();
    });

    this.confirmSaleForm.get('paymentMethod')?.valueChanges.subscribe((method) => {
      const receivedControl = this.confirmSaleForm.get('receivedAmount');
      const referenceControl = this.confirmSaleForm.get('paymentReference');

      if (method === 'cash') {
        receivedControl?.setValidators([
          Validators.required,
          Validators.min(0.01),
          Validators.pattern(/^\d+(\.\d{1,2})?$/),
        ]);
        referenceControl?.clearValidators();
      } else {
        receivedControl?.clearValidators();
        referenceControl?.setValidators([Validators.required]);
      }

      receivedControl?.updateValueAndValidity();
      referenceControl?.updateValueAndValidity();
      this.calculateChange();
    });

    this.searchForm = this.fb.group({
      search: [''],
    });
    this.loadCategories();
    this.loadPendingOrders();
    this.loadCompanySuppliers();
    this.loadPendingDeliveries();
  }

  loadCompanySuppliers() {
    this.supplierService.getCompanySuppliers(this.companyId!).subscribe({
      next: (res: any) => {
        if (res.ok && res.suppliers) {
          this.suppliersList = res.suppliers;
          const sysSupp = this.suppliersList.find(
            (s) => s.name.toLowerCase().includes('ajuste') || s.name.toLowerCase().includes('sistema'),
          );
          if (sysSupp) {
            this.systemSupplierId = sysSupp._id;
          }
          if (this.suppliersList.length > 0) {
            this.defaultSupplierId = this.suppliersList[0]._id;
          }
        }
      },
    });
  }

  ngOnDestroy(): void {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
  }

  loadCategories(): void {
    this.categoryService
      .getCompanyCategories(this.companyId!)
      .pipe(map((r) => r.categories!))
      .subscribe((data: Category[]) => {
        this.categories = data;
        if (this.categories.length > 0) {
          this.selectedCategory = this.categories[0]._id!;
          this.loadItems();
        }
      });
  }

  loadItems(): void {
    if (!this.selectedCategory && !this.search) {
      this.inventoryService
        .getInventoryByCategory('', '', this.currentPage)
        .subscribe({
          next: (data) => {
            this.items = (data.items || []).filter(
              (item: any) => item.stock > 0 || (item.product && item.product.isComposite),
            );
            this.totalPages = data.totalPages || 1;
          },
          error: (error) => {
            console.error('Error fetching items:', error);
            this.items = [];
            this.totalPages = 1;
          },
        });
      return;
    }

    this.inventoryService
      .getInventoryByCategory(this.selectedCategory, this.search, this.currentPage)
      .pipe(
        map((r) => {
          this.logger.log('ItemResp: ', r);
          return r;
        }),
      )
      .subscribe({
        next: (data) => {
          this.items = (data.items || []).filter(
            (item: any) => item.stock > 0 || (item.product && item.product.isComposite),
          );
          this.totalPages = data.totalPages || 1;
        },
        error: (error) => {
          console.error('Error fetching items:', error);
          this.items = [];
          this.totalPages = 1;
        },
      });
  }

  searchItems(): void {
    this.currentPage = 1;
    this.search = this.searchForm.get('search')?.value;
    this.selectedCategory = '';
    this.loadItems();
  }

  handleSearchEnter(event: Event): void {
    if (this.posMode === 'retail' && this.items.length === 1) {
      event.preventDefault();
      this.addToCart(this.items[0]);
      this.searchForm.reset();
      this.search = '';
      this.loadItems();
    }
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.currentPage = 1;
    this.searchForm.reset();
    this.search = '';
    this.loadItems();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadItems();
  }

  handleProductClick(item: any): void {
    // Si es compuesto o tiene modificadores, abrimos modal, de lo contrario directo al carrito
    if (item.product?.isComposite || (item.modifications && item.modifications.length > 0)) {
      this.loadModifications(item);
    } else {
      this.addToCart(item);
    }
  }

  incrementCartItem(entry: any): void {
    entry.quantity += 1;
    const basePrice = entry.item.sellingPrice || entry.item.costPrice || 0;
    const sizeModifier = entry.sizeModifier || 0;
    const modificationsPrice = this.calculateModificationsPrice(
      entry.exclusiveModification,
      entry.nonExclusiveModifications,
    );
    entry.total = (basePrice + sizeModifier + modificationsPrice) * entry.quantity;
    this.calculateTotal();
  }

  decrementCartItem(entry: any): void {
    if (entry.quantity > 1) {
      entry.quantity -= 1;
      const basePrice = entry.item.sellingPrice || entry.item.costPrice || 0;
      const sizeModifier = entry.sizeModifier || 0;
      const modificationsPrice = this.calculateModificationsPrice(
        entry.exclusiveModification,
        entry.nonExclusiveModifications,
      );
      entry.total = (basePrice + sizeModifier + modificationsPrice) * entry.quantity;
      this.calculateTotal();
    } else {
      this.removeFromCart(entry);
    }
  }

  addToCart(item: any): void {
    if (this.selectedQuantity <= 0) {
      return;
    }

    const quantity = item.quantity || 1;
    if (quantity <= 0) {
      return;
    }

    // Si el producto tiene tamaños definidos en su receta, forzar a pasar por el selector lateral
    if (item.product?.isComposite && item.product?.recipe?.sizes && item.product.recipe.sizes.length > 0) {
      this.loadModifications(item);
      Swal.fire({
        title: 'Seleccionar Tamaño',
        text: `Por favor, elige el tamaño para "${item.product.name}" en el panel de personalización.`,
        icon: 'info',
        toast: true,
        position: 'top-end',
        timer: 4000,
        showConfirmButton: false,
      });
      return;
    }

    const existingItem = this.cart.find(
      (p) =>
        p.item.product?._id === item.product?._id &&
        this.areVariationsEqual(p, this.selectedExclusiveModification, this.selectedNonExclusiveModifications),
    );

    const itemPrice = item.sellingPrice || item.costPrice || 0;
    const modificationsPrice = this.calculateModificationsPrice(
      this.selectedExclusiveModification,
      this.selectedNonExclusiveModifications,
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.total += (itemPrice + modificationsPrice) * quantity;
    } else {
      this.cart.push({
        item,
        quantity,
        total: (itemPrice + modificationsPrice) * quantity,
        exclusiveModification: this.selectedExclusiveModification,
        nonExclusiveModifications: [...this.selectedNonExclusiveModifications],
        product: (item.product as any)?._id,
      });
    }
    this.calculateTotal();
    this.clearModifications();
  }

  addToCartWithModifications(): void {
    if (this.selectedQuantity <= 0 || !this.selectedItem) {
      return;
    }

    if (this.availableSizes.length > 0 && !this.selectedSize) {
      Swal.fire('Atención', 'Por favor selecciona un tamaño para este producto.', 'warning');
      return;
    }

    const existingItem = this.cart.find(
      (p) =>
        p.item._id === this.selectedItem._id &&
        p.sizeName === (this.selectedSize?.name || null) &&
        this.areVariationsEqual(
          p,
          this.selectedExclusiveModification,
          this.selectedNonExclusiveModifications,
          this.selectedItemNotes,
        ),
    );

    const basePrice = this.selectedItem.sellingPrice || this.selectedItem.costPrice || 0;
    const sizeModifier = this.selectedSize?.priceModifier || 0;
    const itemPriceWithModifications =
      basePrice +
      sizeModifier +
      this.calculateModificationsPrice(this.selectedExclusiveModification, this.selectedNonExclusiveModifications);

    if (existingItem) {
      existingItem.quantity += this.selectedQuantity;
      existingItem.total += itemPriceWithModifications * this.selectedQuantity;
    } else {
      this.cart.push({
        item: this.selectedItem,
        quantity: this.selectedQuantity,
        total: itemPriceWithModifications * this.selectedQuantity,
        exclusiveModification: this.selectedExclusiveModification,
        nonExclusiveModifications: [...this.selectedNonExclusiveModifications],
        kitchenNotes: this.selectedItemNotes,
        product: this.selectedItem._id,
        sizeName: this.selectedSize?.name || null,
        sizeModifier: sizeModifier,
      });
    }

    this.calculateTotal();
    this.selectedItem = null;
    this.clearModifications();
    this.selectedQuantity = 1;
  }

  calculateModificationsPrice(exclusive: any | null, nonExclusive: any[]): number {
    let price = 0;
    if (exclusive) {
      price += exclusive.extraPrice;
    }
    nonExclusive.forEach((mod) => {
      price += mod.extraPrice;
    });
    return price;
  }

  selectedItemNotes: string = '';

  areVariationsEqual(cartItem: any, exclusive: any | null, nonExclusive: any[], notes: string = ''): boolean {
    const sameExclusive = cartItem.exclusiveModification?._id === exclusive?._id;
    const sameNonExclusive =
      JSON.stringify((cartItem.nonExclusiveModifications || []).map((mod: any) => mod._id).sort()) ===
      JSON.stringify(nonExclusive.map((mod) => mod._id).sort());
    const sameNotes = (cartItem.kitchenNotes || '') === notes;
    return sameExclusive && sameNonExclusive && sameNotes;
  }

  calculateTotal(): void {
    this.total = this.cart.reduce((sum, item) => sum + item.total, 0);
  }

  removeFromCart(item: any): void {
    const index = this.cart.indexOf(item);
    if (index !== -1) {
      this.cart.splice(index, 1);
      this.calculateTotal();
    }
  }

  loadModifications(item: any): void {
    this.selectedItem = item;
    this.selectedItemNotes = '';

    // Cargar tamaños si es compuesto y tiene receta con tamaños
    this.availableSizes = [];
    this.selectedSize = null;
    if (item.product?.isComposite && item.product?.recipe?.sizes && item.product.recipe.sizes.length > 0) {
      this.availableSizes = item.product.recipe.sizes;
      if (this.availableSizes.length === 1) {
        this.selectedSize = this.availableSizes[0]; // Auto select si solo hay uno
      }
    }

    this.availableExclusiveModifications = (item.modifications || []).filter((mod: any) => mod.isExclusive);
    this.availableNonExclusiveModifications = (item.modifications || []).filter((mod: any) => !mod.isExclusive);
    this.selectedExclusiveModification = null;
    this.selectedNonExclusiveModifications = [];
  }

  selectSize(size: any): void {
    this.selectedSize = size;
  }

  addExclusiveModification(modification: any): void {
    if (this.selectedExclusiveModification) {
      this.availableExclusiveModifications.push(this.selectedExclusiveModification);
    }
    this.selectedExclusiveModification = modification;
    this.availableExclusiveModifications = this.availableExclusiveModifications.filter(
      (mod: any) => mod._id !== modification._id,
    );
  }

  addNonExclusiveModification(modification: any): void {
    const index = this.availableNonExclusiveModifications.findIndex((mod) => mod._id === modification._id);
    if (index !== -1) {
      this.availableNonExclusiveModifications.splice(index, 1);
      this.selectedNonExclusiveModifications.push(modification);
    }
  }

  removeNonExclusiveModification(modification: any): void {
    const index = this.selectedNonExclusiveModifications.findIndex((mod) => mod._id === modification._id);
    if (index !== -1) {
      this.selectedNonExclusiveModifications.splice(index, 1);
      this.availableNonExclusiveModifications.push(modification);
    }
  }

  clearModifications(): void {
    this.availableExclusiveModifications = [];
    this.selectedExclusiveModification = null;
    this.availableNonExclusiveModifications = [];
    this.selectedNonExclusiveModifications = [];
  }

  removeExclusiveModification(): void {
    if (this.selectedExclusiveModification) {
      this.availableExclusiveModifications.push(this.selectedExclusiveModification);
      this.selectedExclusiveModification = null;
    }
  }

  discount: number = 0;
  totalAmount: number = 0;
  totalPaid: number = 0;
  activeOrderPayments: any[] = [];

  checkout(): void {
    if (this.cart.length <= 0) {
      return;
    }
    // Toggles the right-hand panel view into checkout form
    this.checkoutMode = true;
    this.recalculateTotals();
  }

  cancelCheckout(): void {
    this.checkoutMode = false;
  }

  amountValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.confirmSaleForm) return null;
    const receivedAmount = control.get('receivedAmount')?.value || 0;
    const method = control.get('paymentMethod')?.value;
    if (method === 'cash' && receivedAmount < this.totalAmount) {
      return { insufficientAmount: true };
    }
    return null;
  }

  calculateChange(): void {
    const receivedVal = this.confirmSaleForm.get('receivedAmount')?.value || 0;
    this.change = Math.max(0, receivedVal - this.totalAmount);
    this.confirmSaleForm.patchValue({ change: `$${this.change.toFixed(2)}` }, { emitEvent: false });
  }

  resetPOSState(): void {
    this.cart = [];
    this.total = 0;
    this.discount = 0;
    this.totalAmount = 0;
    this.selectedCustomer = null;
    this.appliedPromotion = null;
    this.couponDiscount = 0;
    this.pointsDiscount = 0;
    this.redeemPointsChecked = false;
    this.checkoutMode = false;
    this.activePendingOrderId = null;
    this.activeOrderPayments = [];
    this.totalPaid = 0;
    this.tableNumber = '';
    this.clientName = '';
    this.guestsCount = 1;
    this.carDescription = '';
    this.licensePlate = '';
    this.laneNumber = 1;
    this.deliveryPlatform = 'uber_eats';
    this.deliveryOrderId = '';
    this.deliveryCourierName = '';
    this.deliveryNotes = '';

    // Resetear formulario
    this.confirmSaleForm.reset({
      paymentMethod: 'cash',
      receivedAmount: 0,
      paymentReference: '',
      change: '$0.00',
    });
  }

  confirmSale(): void {
    if (this.confirmSaleForm.invalid) {
      this.confirmSaleForm.markAllAsTouched();
      return;
    }

    const saleData = {
      user: this.authService.usuario.id || this.authService.idUsuario,
      total: this.total,
      discount: this.discount,
      paymentMethod: this.confirmSaleForm.value.paymentMethod,
      paymentReference: this.confirmSaleForm.value.paymentReference,
      receivedAmount:
        this.confirmSaleForm.value.paymentMethod === 'cash' ? this.confirmSaleForm.value.receivedAmount : 0,
      change: this.change,
      customerId: this.selectedCustomer ? this.selectedCustomer._id : undefined,
      promotionId: this.appliedPromotion ? this.appliedPromotion._id : undefined,
      pointsRedeemed:
        this.selectedCustomer && this.redeemPointsChecked
          ? Math.floor(this.pointsDiscount / (this.branchSettings.pointsRedeemRate || 0.1))
          : 0,
      productsSold: this.cart.map((entry) => ({
        product: entry.item.product?._id || entry.item._id,
        productName: entry.item.product?.name || entry.item.name,
        quantity: entry.quantity,
        unitPrice: (entry.item.sellingPrice || entry.item.costPrice || 0) + (entry.sizeModifier || 0),
        subtotal: entry.total,
        categories: entry.item.product?.categories || [],
        sizeName: entry.sizeName,
        modifications: [
          ...(entry.exclusiveModification ? [entry.exclusiveModification] : []),
          ...(entry.nonExclusiveModifications || []),
          ...(entry.kitchenNotes ? [{ name: entry.kitchenNotes, extraPrice: 0, price: 0 }] : []),
        ],
      })),
    };

    const proceedWithSaleCreation = () => {
      if (this.activePendingOrderId) {
        const paymentData = {
          paymentMethod: this.confirmSaleForm.value.paymentMethod,
          paymentReference: saleData.paymentReference,
          receivedAmount:
            this.confirmSaleForm.value.paymentMethod === 'cash' ? this.confirmSaleForm.value.receivedAmount : 0,
          change: this.change,
        };

        this.pendingOrderService.payAndClosePendingOrder(this.activePendingOrderId, paymentData).subscribe({
          next: (response: any) => {
            if (response.partial) {
              this.activeOrderPayments = response.pendingOrder.payments || [];
              this.recalculateTotals();
              this.confirmSaleForm.patchValue({ receivedAmount: 0, change: '$0.00' });
              Swal.fire({
                icon: 'info',
                title: 'Abono Registrado',
                text: 'Pago parcial registrado correctamente.',
                timer: 2000,
                showConfirmButton: false,
              });
              this.loadPendingOrders();
              return;
            }

            this.logger.log('Orden pendiente liquidada con éxito', response);
            const saleObj = response.sale || response;
            this.generarTicket({ ...saleData, _id: saleObj._id, date: saleObj.date });
            this.generarComanda(saleObj._id);

            if (paymentData.paymentMethod === 'cash') {
              this.hardwareConnector.openCashDrawer().subscribe();
            }

            Swal.fire({
              icon: 'success',
              title: 'Venta Completada',
              text: 'El ticket pendiente ha sido cobrado con éxito.',
              timer: 2000,
              showConfirmButton: false,
            });

            this.resetPOSState();
            this.loadPendingOrders();
          },
          error: (error) => {
            console.error('Error al cobrar la orden pendiente', error);
            Swal.fire({
              icon: 'error',
              title: 'Error de Cobro',
              text: error.error?.error || error.error?.message || 'Ocurrió un error al liquidar el ticket.',
              confirmButtonColor: '#d33',
            });
          },
        });
        return;
      }

      this.saleService.createSale(saleData).subscribe({
        next: (response: any) => {
          this.logger.log('Venta creada con éxito', response);
          this.generarTicket({ ...saleData, _id: response._id, date: response.date });
          this.generarComanda(response._id);

          if (saleData.paymentMethod === 'cash') {
            this.hardwareConnector.openCashDrawer().subscribe();
          }

          Swal.fire({
            icon: 'success',
            title: 'Venta Completada',
            text: 'La venta ha sido registrada con éxito.',
            timer: 2000,
            showConfirmButton: false,
          });

          this.resetPOSState();

          if (response.cashLimitExceeded) {
            Swal.fire({
              icon: 'warning',
              title: 'Límite de Efectivo Excedido',
              text: 'Has superado el límite de seguridad en caja. Por favor, realiza un retiro parcial a la brevedad.',
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#f8bb86',
            });
          }
        },
        error: (error) => {
          console.error('Error al crear la venta', error);
          Swal.fire({
            icon: 'error',
            title: 'Error de Cobro',
            text: error.error?.error || error.error?.message || 'Ocurrió un error al procesar el cobro.',
            confirmButtonColor: '#d33',
          });
        },
      });
    };

    if (this.confirmSaleForm.value.paymentMethod === 'credit') {
      let paymentSub: Subscription;

      const chargeAmount = Math.max(0, this.total - this.discount);

      import('sweetalert2').then((Swal) => {
        Swal.default
          .fire({
            title: 'Cobrando en Terminal...',
            text: `Por favor inserte la tarjeta y cobre $${chargeAmount.toFixed(2)}`,
            showCancelButton: true,
            cancelButtonText: 'Cancelar Operación',
            allowOutsideClick: false,
            didOpen: () => Swal.default.showLoading(),
          })
          .then((result) => {
            if (result.isDismissed) {
              if (paymentSub) {
                paymentSub.unsubscribe();
              }
              Swal.default.fire('Cancelado', 'Operación cancelada por el cajero', 'info');
            }
          });

        paymentSub = this.hardwareConnector.chargePayment(chargeAmount).subscribe((res) => {
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

  loadPendingOrders(): void {
    const branchId = this.authService.branch?._id || this.authService.branch || '';
    const companyId = this.companyId || '';
    if (branchId && companyId) {
      this.pendingOrderService.getActivePendingOrders(branchId, companyId).subscribe({
        next: (res: any) => {
          if (res && res.pendingOrders) {
            this.pendingOrders = res.pendingOrders;
          }
        },
        error: (err) => console.error('Error al cargar órdenes pendientes', err),
      });
    }
  }

  openSavePendingOrderModal(): void {
    if (this.cart.length <= 0) return;
    this.showPendingOrderModal = true;
  }

  closePendingOrderModal(): void {
    this.showPendingOrderModal = false;
  }

  saveAsPendingOrder(): void {
    const branchId = this.authService.branch?._id || this.authService.branch || '';
    const companyId = this.companyId || '';

    // Obtener caja abierta
    this.cashRegisterService.hasOpenCashRegister(this.authService.idUsuario).subscribe((hasOpen) => {
      if (!hasOpen) {
        Swal.fire({
          icon: 'error',
          title: 'Caja Cerrada',
          text: 'Debes abrir una caja de cobro para registrar tickets.',
        });
        return;
      }

      this.cashRegisterService.getOpenCashRegister(this.authService.idUsuario).subscribe((registerRes: any) => {
        const cashRegisterId = registerRes?.cashRegister?._id || registerRes?._id;
        if (!cashRegisterId) {
          Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo identificar la caja registradora activa.' });
          return;
        }

        const orderData = {
          table: this.tableNumber,
          clientName: this.clientName,
          type: this.serviceType,
          status: 'pending',
          inRestaurantDetails:
            this.serviceType === 'dine_in'
              ? {
                  guestsCount: this.guestsCount,
                  tableId: this.tableNumber,
                }
              : undefined,
          driveThruDetails:
            this.serviceType === 'drive_thru'
              ? {
                  carDescription: this.carDescription,
                  licensePlate: this.licensePlate,
                  lane: this.laneNumber,
                }
              : undefined,
          deliveryDetails:
            this.serviceType === 'delivery'
              ? {
                  platform: this.deliveryPlatform,
                  orderId: this.deliveryOrderId,
                  courierName: this.deliveryCourierName,
                  notes: this.deliveryNotes,
                }
              : undefined,
          productsSold: this.cart.map((entry) => ({
            product: entry.item.product?._id || entry.item._id,
            productName: entry.item.product?.name || entry.item.name,
            quantity: entry.quantity,
            unitPrice: entry.item.sellingPrice || entry.item.costPrice || 0,
            subtotal: entry.total,
            categories: entry.item.product?.categories || [],
            sizeName: entry.sizeName,
            modifications: [
              ...(entry.exclusiveModification ? [entry.exclusiveModification] : []),
              ...(entry.nonExclusiveModifications || []),
              ...(entry.kitchenNotes ? [{ name: entry.kitchenNotes, extraPrice: 0, price: 0 }] : []),
            ],
          })),
          total: this.total,
          discount: this.discount,
          company: companyId,
          branch: branchId,
          cashRegister: cashRegisterId,
          customerId: this.selectedCustomer ? this.selectedCustomer._id : undefined,
          promotionId: this.appliedPromotion ? this.appliedPromotion._id : undefined,
          waiter: this.authService.usuario.id || this.authService.idUsuario,
        };

        if (this.activePendingOrderId) {
          // Filtrar ítems nuevos
          const newItems = this.cart.filter((entry) => !entry.isExisting);
          if (newItems.length === 0) {
            Swal.fire({ icon: 'info', title: 'Sin cambios', text: 'No se agregaron productos nuevos.' });
            return;
          }

          const newProductsSold = newItems.map((entry) => ({
            product: entry.item.product?._id || entry.item._id,
            productName: entry.item.product?.name || entry.item.name,
            quantity: entry.quantity,
            unitPrice: entry.item.sellingPrice || entry.item.costPrice || 0,
            subtotal: entry.total,
            categories: entry.item.product?.categories || [],
            sizeName: entry.sizeName,
            modifications: [
              ...(entry.exclusiveModification ? [entry.exclusiveModification] : []),
              ...(entry.nonExclusiveModifications || []),
            ],
          }));

          const additionalTotal = newItems.reduce((acc, entry) => acc + entry.total, 0);

          this.pendingOrderService
            .addItemsToPendingOrder(this.activePendingOrderId, { newProductsSold, additionalTotal })
            .subscribe({
              next: () => {
                Swal.fire({
                  icon: 'success',
                  title: 'Ítems Agregados',
                  text: 'Nuevos productos enviados a cocina.',
                  timer: 1500,
                  showConfirmButton: false,
                });
                this.resetPOSState();
                this.loadPendingOrders();
                this.closePendingOrderModal();
              },
              error: (err) => {
                console.error(err);
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: err.error?.message || 'No se pudieron agregar los ítems.',
                });
              },
            });
        } else {
          // Crear nueva orden
          this.pendingOrderService.createPendingOrder(orderData).subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: 'Orden Guardada',
                text: 'Comanda abierta con éxito.',
                timer: 1500,
                showConfirmButton: false,
              });
              this.resetPOSState();
              this.loadPendingOrders();
              this.closePendingOrderModal();
            },
            error: (err) => {
              console.error(err);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.error?.message || 'No se pudo guardar la comanda.',
              });
            },
          });
        }
      });
    });
  }

  loadPendingOrderToCart(order: any): void {
    if (this.cart.length > 0) {
      Swal.fire({
        title: '¿Reemplazar Carrito?',
        text: 'Tienes productos en el carrito actual. Se perderán al cargar esta comanda.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cargar comanda',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#000000',
        cancelButtonColor: '#d33',
      }).then((result) => {
        if (result.isConfirmed) {
          this.performLoadPendingOrder(order);
        }
      });
    } else {
      this.performLoadPendingOrder(order);
    }
  }

  private performLoadPendingOrder(order: any): void {
    this.resetPOSState();
    this.activePendingOrderId = order._id;
    this.tableNumber = order.table || '';
    this.clientName = order.clientName || '';
    this.serviceType = order.type || 'dine_in';
    this.activeTab = 'catalog'; // Auto switch back to catalog to see products

    if (order.inRestaurantDetails) {
      this.guestsCount = order.inRestaurantDetails.guestsCount || 1;
    }
    if (order.driveThruDetails) {
      this.carDescription = order.driveThruDetails.carDescription || '';
      this.licensePlate = order.driveThruDetails.licensePlate || '';
      this.laneNumber = order.driveThruDetails.lane || 1;
    }
    if (order.deliveryDetails) {
      this.deliveryPlatform = order.deliveryDetails.platform || 'uber_eats';
      this.deliveryOrderId = order.deliveryDetails.orderId || '';
      this.deliveryCourierName = order.deliveryDetails.courierName || '';
      this.deliveryNotes = order.deliveryDetails.notes || '';
    }

    this.selectedCustomer = order.customer || null;
    this.appliedPromotion = order.appliedPromotion || null;
    this.activeOrderPayments = order.payments || [];

    // Cargar productos al carrito garantizando el mapeo correcto del producto y precio
    this.cart = order.productsSold.map((prod: any) => {
      const productObj = prod.product || {};
      return {
        item: {
          _id: productObj._id || prod.product || '',
          product: {
            _id: productObj._id || prod.product || '',
            name: productObj.name || prod.productName || '',
          },
          sellingPrice: prod.unitPrice,
          costPrice: prod.unitPrice,
          name: productObj.name || prod.productName || '',
        },
        quantity: prod.quantity,
        total: prod.subtotal,
        exclusiveModification: prod.modifications?.find((m: any) => m.isExclusive),
        nonExclusiveModifications: prod.modifications?.filter((m: any) => !m.isExclusive) || [],
        product: productObj._id || prod.product || '',
        isExisting: true,
      };
    });

    this.calculateTotal();
    this.recalculateTotals();
    this.checkoutMode = false;

    Swal.fire({
      icon: 'info',
      title: 'Comanda Cargada',
      text: `Mesa/Cliente: ${this.clientName || this.tableNumber || 'Sin Nombre'}. Ya puedes editarla o cobrarla.`,
      timer: 1500,
      showConfirmButton: false,
    });
  }

  cancelActivePendingOrder(): void {
    if (!this.activePendingOrderId) return;
    
    const branchSetting = this.authService.branch?.posSettings?.requirePinForRisks;
    const requirePinForRisks = branchSetting !== undefined ? branchSetting : (this.authService.company?.posSettings?.requirePinForRisks ?? true);

    Swal.fire({
      title: '¿Cancelar Comanda?',
      text: '¿Estás seguro de que deseas eliminar o cancelar este ticket abierto?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar comanda',
      cancelButtonText: 'Mantener comanda',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#000000',
    }).then((result) => {
      if (result.isConfirmed) {
        if (requirePinForRisks) {
          this.promptForManagerAuthToCancel();
        } else {
          this.executeCancelOrder();
        }
      }
    });
  }

  promptForManagerAuthToCancel() {
    Swal.fire({
      title: 'Autorización Gerencial',
      html: `
        <div class="mb-3 text-start">
          <p class="text-danger small fw-bold"><i class="bi bi-exclamation-triangle-fill"></i> La cancelación de comandas enviadas a cocina requiere autorización gerencial.</p>
        </div>
        <input id="swal-username" class="swal2-input" placeholder="Usuario o Email Gerencial">
        <input id="swal-password" class="swal2-input" type="password" placeholder="Contraseña">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Autorizar Cancelación',
      cancelButtonText: 'Abortar',
      confirmButtonColor: '#d33',
      preConfirm: () => {
        const username = (document.getElementById('swal-username') as HTMLInputElement).value;
        const password = (document.getElementById('swal-password') as HTMLInputElement).value;
        if (!username || !password) {
          Swal.showValidationMessage('Ingresa usuario y contraseña');
        }
        return { username, password };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const credentials = result.value;
        Swal.fire({ title: 'Validando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        this.authService.validateAdmin({
          username: credentials.username,
          password: credentials.password,
          companyId: this.companyId || ''
        }).subscribe({
          next: (res: any) => {
            if (res.ok) {
              this.executeCancelOrder(credentials.username);
            }
          },
          error: (err) => {
            Swal.fire('Denegado', err.error?.msg || 'Credenciales inválidas', 'error').then(() => {
              this.promptForManagerAuthToCancel();
            });
          }
        });
      }
    });
  }

  executeCancelOrder(authorizedBy?: string) {
    // If authorizedBy is passed, we could theoretically log it, but for now we just proceed with the cancellation API call.
    this.pendingOrderService.cancelPendingOrder(this.activePendingOrderId!).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Comanda Cancelada',
          text: authorizedBy ? 'Cancelación autorizada por ' + authorizedBy + '.' : 'El ticket abierto fue cancelado.',
          timer: 2000,
          showConfirmButton: false,
        });
        this.resetPOSState();
        this.loadPendingOrders();
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudo cancelar la orden.', 'error');
      }
    });
  }

  preventNegative(event: KeyboardEvent): void {
    if (event.key === '-' || event.key === 'e' || event.key === 'E') {
      event.preventDefault();
    }
  }

  // --- CRM / CLIENTES ---
  searchCustomer(term: string): void {
    this.searchCustomerTerm = term;
    if (!term || term.trim().length < 2) {
      this.searchResultsCustomers = [];
      return;
    }

    this.customerService.searchCustomers(this.companyId || '', term.trim()).subscribe((resp) => {
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
    this.recalculateTotals();
  }

  removeSelectedCustomer(): void {
    this.selectedCustomer = null;
    this.redeemPointsChecked = false;
    this.pointsDiscount = 0;
    this.recalculateTotals();
  }

  toggleRedeemPoints(event: any): void {
    this.redeemPointsChecked = event.target.checked;
    this.recalculateTotals();
  }

  // --- CUPONES ---
  applyCoupon(): void {
    if (!this.couponCode || this.couponCode.trim() === '') {
      return;
    }

    const branchId = this.authService.branch?._id || this.authService.branch || '';

    this.promotionService
      .validateDiscountCode(this.companyId || '', this.couponCode.trim(), this.total, branchId)
      .subscribe({
        next: (resp) => {
          if (resp.ok && resp.promotion) {
            this.appliedPromotion = resp.promotion;
            this.couponCode = '';
            this.recalculateTotals();
            Swal.fire({
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
          Swal.fire({
            icon: 'error',
            title: 'Cupón Inválido',
            text: err.error?.message || 'El cupón ingresado no es válido.',
            confirmButtonColor: '#d33',
          });
        },
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

      let eligibleSubtotal = 0;
      if (this.cart && this.cart.length > 0) {
        this.cart.forEach((entry: any) => {
          const itemCategories = entry.item.product?.categories || [];
          if (matchesCategory({ categories: itemCategories })) {
            eligibleSubtotal += entry.total || 0;
          }
        });
      } else {
        eligibleSubtotal = this.total;
      }

      if (this.appliedPromotion.type === 'percentage') {
        couponDisc = eligibleSubtotal * (this.appliedPromotion.value / 100);
      } else {
        couponDisc = Math.min(this.appliedPromotion.value, eligibleSubtotal);
      }
    }
    this.couponDiscount = couponDisc;

    // 2. Calcular Descuento por Puntos
    const netForLoyalty = Math.max(0, this.total - this.couponDiscount);
    if (this.selectedCustomer && this.redeemPointsChecked) {
      const maxAllowedDiscount = netForLoyalty * ((this.branchSettings.maxRedemptionPercentage || 100) / 100);
      const potentialDiscount = this.selectedCustomer.loyaltyPoints * (this.branchSettings.pointsRedeemRate || 0.1);
      this.pointsDiscount = Math.min(potentialDiscount, maxAllowedDiscount);
    } else {
      this.pointsDiscount = 0;
    }

    // 3. Aplicar descuento total
    this.discount = this.couponDiscount + this.pointsDiscount;
    this.totalPaid = this.activeOrderPayments.reduce((acc, p) => acc + p.amount, 0);
    this.totalAmount = Math.max(0, this.total - this.discount - this.totalPaid);

    // 4. Actualizar formularios y cambio
    if (this.confirmSaleForm) {
      const receivedCtrl = this.confirmSaleForm.get('receivedAmount');
      if (receivedCtrl) {
        receivedCtrl.updateValueAndValidity();
      }
      this.calculateChange();
    }
  }

  // --- CRM REGISTRO RÁPIDO ---
  openQuickRegister(): void {
    this.registerForm.reset({
      name: '',
      phone: '',
      email: '',
    });
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

    this.customerService.createCustomer(this.registerForm.value, this.companyId || '').subscribe({
      next: (resp) => {
        if (resp.ok && resp.customer) {
          this.selectedCustomer = resp.customer;
          this.showQuickRegister = false;
          this.recalculateTotals();
          Swal.fire({
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
        Swal.fire({
          icon: 'error',
          title: 'Error al Registrar',
          text: err.error?.message || 'No se pudo crear el cliente.',
          confirmButtonColor: '#d33',
        });
      },
    });
  }

  // --- TECLADO VIRTUAL ---
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

  // --- TICKETS IMPRESIÓN ---
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
${String(product.quantity).padEnd(5)} ${this.shortenText(product.productName, 15).padEnd(15)} $${product.subtotal.toFixed(2).padStart(8)}
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
      this.receiptPrinterService.printTicket(printer.name, content, printer.paperSize).subscribe({
        next: (response) => this.logger.log('Ticket enviado a la impresora', response),
        error: (error) => console.error('Error de ticketera', error),
      });
    } else {
      this.logger.log('Impresión Simulada (Ticket):\n', content);
    }
  }

  generarComanda(orderId: string) {
    const content = `
========================================
          ${this.empresa.toUpperCase()}
========================================
Número de Orden: ${orderId || 'N/A'}
Fecha: ${new Date().toLocaleDateString()} 
Hora: ${new Date().toLocaleTimeString()}
----------------------------------------
CANT   PRODUCTO
----------------------------------------
${this.cart
  .map(
    (entry: any) => `
${String(entry.quantity).padEnd(5)} ${this.shortenText(entry.item.product?.name || entry.item.name, 25)}
${entry.exclusiveModification ? `     * Mod: ${this.shortenText(entry.exclusiveModification.name, 15)}` : ''}
${entry.nonExclusiveModifications && entry.nonExclusiveModifications.length > 0 ? `     * Extras: ${entry.nonExclusiveModifications.map((mod: any) => `${this.shortenText(mod.name, 15)}`).join(', ')}` : ''}
`,
  )
  .join('')}
----------------------------------------
========================================
    `;

    const printer = this.receiptPrinterService.getDefaultPrinter('comanda');
    if (printer) {
      this.receiptPrinterService.printTicket(printer.name, content, printer.paperSize).subscribe({
        next: (response) => this.logger.log('Comanda enviada a la impresora', response),
        error: (error) => console.error('Error de comandera', error),
      });
    } else {
      this.logger.log('Impresión Simulada (Comanda):\n', content);
    }
  }

  shortenText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }

  incrementQuantity(item: any): void {
    if (!item.quantity) {
      item.quantity = 1;
    }
    item.quantity++;
  }

  decrementQuantity(item: any): void {
    if (item.quantity && item.quantity > 1) {
      item.quantity--;
    }
  }

  incrementQuantityModSelected(): void {
    this.selectedQuantity++;
  }

  decrementQuantityModSelected(): void {
    if (this.selectedQuantity > 1) {
      this.selectedQuantity--;
    }
  }

  navigateBackHome(): void {
    this.router.navigate(['/dashboard/user']);
  }

  getPlatformBorderColor(platform: string): string {
    switch (platform) {
      case 'uber_eats':
        return '#10b981';
      case 'rappi':
        return '#ff6b35';
      case 'didi_food':
        return '#fc3d21';
      default:
        return '#6366f1';
    }
  }

  getPlatformIconColor(platform: string): string {
    switch (platform) {
      case 'uber_eats':
        return '#10b981';
      case 'rappi':
        return '#ff6b35';
      case 'didi_food':
        return '#fc3d21';
      default:
        return '#6366f1';
    }
  }

  getPlatformName(platform: string): string {
    switch (platform) {
      case 'uber_eats':
        return 'Uber Eats';
      case 'rappi':
        return 'Rappi';
      case 'didi_food':
        return 'DiDi Food';
      case 'phone_order':
        return 'Teléfono';
      default:
        return 'Reparto';
    }
  }

  deliverPendingOrder(orderId: string): void {
    this.pendingOrderService.deliverPendingOrder(orderId).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Entrega Confirmada',
          text: 'Se ha registrado la entrega del pedido.',
          timer: 1500,
          showConfirmButton: false,
        });
        this.loadPendingOrders();
      },
      error: (err) => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo registrar la entrega del pedido.',
        });
      },
    });
  }

  setPosMode(mode: 'retail' | 'hospitality'): void {
    this.posMode = mode;
    if (mode === 'retail') {
      this.selectedItem = null;
    }
  }

  quickRestockComposite(item: any) {
    const productId = item.product?._id || item.product;
    const branchId = this.authService.branch?._id || this.authService.branch;

    if (!productId || !branchId) return;

    Swal.fire({
      title: 'Consultando Insumos...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    this.inventoryService.getRecipeStockDetails(productId, branchId).subscribe({
      next: (resp: any) => {
        if (resp.ok && resp.ingredients) {
          Swal.close();
          const missingIngredients = resp.ingredients.filter((i: any) => i.currentStock <= 0);

          if (missingIngredients.length === 0) {
            Swal.fire('Todo en orden', 'Este producto tiene insumos suficientes.', 'info');
            return;
          }

          let formHtml = `<div class="text-start mb-3">
              <label class="form-label fw-bold text-secondary small mb-1">Producto a Recargar</label>
              <div class="p-2 bg-light rounded border text-dark fw-bold">${item.product?.name || item.name}</div>
            </div>
            <div class="alert alert-warning bg-warning-soft text-warning border-0 p-2 mb-3 small">
              <i class="bi bi-info-circle-fill me-1"></i> Este ajuste sumará stock inmediato, pero quedará sujeto a revisión del gerente (Auditoría).
            </div>
            <div class="mb-3 text-start">
              <label class="form-label fw-bold text-secondary small mb-1">Justificación del Ajuste *</label>
              <textarea id="swal-restock-reason" class="form-control form-control-sm shadow-sm" rows="2" placeholder="Ej. Comprado en OXXO por emergencia, sobrante de caja, etc." required></textarea>
            </div>
            <div class="table-responsive text-start">
              <table class="table table-sm align-middle mb-0">
                <thead>
                  <tr class="fs-8 text-muted uppercase">
                    <th>Insumo</th>
                    <th width="80" class="text-center">Stock</th>
                    <th width="140" class="text-center">Añadir</th>
                  </tr>
                </thead>
                <tbody>`;

          missingIngredients.forEach((ing: any, i: number) => {
            formHtml += `<tr>
                <td class="fw-bold fs-7 lh-sm">${ing.name} <br><small class="text-muted fw-normal">(${ing.measurementUnit})</small></td>
                <td class="text-danger fw-bold font-monospace text-center">${ing.currentStock}</td>
                <td>
                  <div class="d-flex align-items-center justify-content-center gap-0 bg-light px-1 py-1 rounded-pill border border-light-subtle mb-1">
                    <input type="number" class="form-control form-control-sm text-center border-0 bg-transparent px-0" style="width: 45px; font-size: 0.75rem; font-weight: 600;" placeholder="Cjs" oninput="let p=this.value; let u=this.nextElementSibling.nextElementSibling.value; if(p&&u) document.getElementById('quick-restock-qty-${i}').value=p*u;">
                    <span class="text-muted fw-bold mx-1" style="font-size: 0.7rem;">✕</span>
                    <input type="number" class="form-control form-control-sm text-center border-0 bg-transparent px-0" style="width: 55px; font-size: 0.75rem; font-weight: 600;" placeholder="Cant" oninput="let u=this.value; let p=this.previousElementSibling.previousElementSibling.value; if(p&&u) document.getElementById('quick-restock-qty-${i}').value=p*u;">
                  </div>
                  <input type="number" id="quick-restock-qty-${i}" class="form-control form-control-sm text-center fw-bold text-primary shadow-sm w-100" min="0" value="0">
                </td>
              </tr>`;
          });

          formHtml += `</tbody></table></div>`;

          Swal.fire({
            title: 'Ajuste Operativo de Insumos',
            html: formHtml,
            showCancelButton: true,
            confirmButtonText: 'Confirmar Ajuste',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#0f172a',
            preConfirm: () => {
              const reasonInput = document.getElementById('swal-restock-reason') as HTMLTextAreaElement;
              const reason = reasonInput.value.trim();
              if (!reason) {
                Swal.showValidationMessage('Debes ingresar una justificación para el ajuste.');
                return false;
              }

              const itemsToRestock: any[] = [];
              missingIngredients.forEach((ing: any, i: number) => {
                const qtyInput = document.getElementById(`quick-restock-qty-${i}`) as HTMLInputElement;
                const qty = parseFloat(qtyInput.value);
                if (qty > 0) {
                  itemsToRestock.push({
                    type: 'RawMaterial',
                    itemRef: ing.rawMaterialId,
                    quantity: qty,
                    costPrice: 0,
                  });
                }
              });

              if (itemsToRestock.length === 0) {
                Swal.showValidationMessage('No ingresaste cantidades para recargar.');
                return false;
              }
              return { items: itemsToRestock, reason };
            },
          }).then((result) => {
            if (result.isConfirmed && result.value) {
              const itemsToRestock = result.value.items;
              const reason = result.value.reason;
              this.processMultipleRestock(itemsToRestock, item.product?.name || item.name, this.companyId!, branchId, reason);
            }
          });
        }
      },
      error: () => Swal.fire('Error', 'No se pudieron consultar los insumos.', 'error'),
    });
  }

  processMultipleRestock(itemsToRestock: any[], productName: string, companyId: string, branchId: string, reason: string = '') {
    const userName = this.authService.usuario?.name || this.authService.usuario?.username || 'Cajero';
    const targetSupplierId =
      this.systemSupplierId ||
      this.defaultSupplierId ||
      (this.suppliersList.length > 0 ? this.suppliersList[0]._id : undefined);

    if (!targetSupplierId) {
      Swal.fire('Error', 'No hay un proveedor de sistema configurado en la sucursal.', 'error');
      return;
    }

    Swal.fire({
      title: 'Procesando recarga...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const restockData = {
      company: companyId,
      supplier: targetSupplierId,
      branch: branchId,
      expectedDate: new Date(),
      itemsSummary: `Ajuste Rápido POS de ${itemsToRestock.length} insumo(s) para ${productName}`,
      status: 'pending',
      notes: reason ? `Ajuste reportado por el cajero ${userName}. Motivo: "${reason}"` : `Reabastecimiento directo exprés registrado por el cajero ${userName} (Recarga en Corto).`,
      isRecurring: false,
      recurrence: 'none',
      requiresAudit: true,
      items: itemsToRestock,
    };

    this.supplierService.createRestockSchedule(restockData).subscribe({
      next: (createResp: any) => {
        if (createResp.ok && createResp.restock?._id) {
          this.supplierService.updateRestockStatus(createResp.restock._id, { status: 'pending_audit' }).subscribe({
            next: (updateResp) => {
              if (updateResp.ok) {
                Swal.fire('¡Éxito!', 'Los insumos se han ajustado correctamente. El ajuste pasará a auditoría operativa.', 'success');
                this.loadItems();
              } else {
                Swal.fire('Error', 'No se pudo completar el ajuste de stock.', 'error');
              }
            },
            error: () => Swal.fire('Error', 'Error completando el stock', 'error'),
          });
        }
      },
      error: () => Swal.fire('Error', 'No se pudo generar el reabastecimiento en el servidor.', 'error'),
    });
  }

  loadPendingDeliveries() {
    this.supplierService.getCompanyRestocks(this.companyId!).subscribe({
      next: (resp: any) => {
        if (resp.ok && resp.restocks) {
          const todayStr = new Date().toISOString().substring(0, 10);
          const branchId = this.authService.branch?._id || this.authService.branch || '';
          this.pendingDeliveries = resp.restocks.filter((r: any) => {
            const bId = typeof r.branch === 'object' ? r.branch?._id : r.branch;
            if (bId !== branchId) return false;
            if (r.status !== 'pending') return false;
            // Only deliveries expected today or overdue
            const expStr = new Date(r.expectedDate).toISOString().substring(0, 10);
            return expStr <= todayStr;
          });
        }
      },
    });
  }

  openDeliveriesHub() {
    if (this.pendingDeliveries.length === 0) {
      Swal.fire('Sin Entregas', 'No hay entregas agendadas pendientes para hoy.', 'info');
      return;
    }

    let html = '<div class="list-group text-start">';
    this.pendingDeliveries.forEach((r, idx) => {
      const sName = typeof r.supplier === 'object' ? r.supplier.name : 'Proveedor';
      const expected = new Date(r.expectedDate).toLocaleDateString();
      html += `
        <button type="button" id="delivery-btn-${idx}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-1 fw-bold text-dark">${sName}</h6>
            <small class="text-muted">Esperado: ${expected}</small>
          </div>
          <span class="badge bg-primary rounded-pill">Recibir</span>
        </button>
      `;
    });
    html += '</div>';

    Swal.fire({
      title: 'Entregas Programadas',
      html: html,
      showCloseButton: true,
      showConfirmButton: false,
      didOpen: () => {
        this.pendingDeliveries.forEach((r, idx) => {
          document.getElementById(`delivery-btn-${idx}`)?.addEventListener('click', () => {
            Swal.close();
            this.inspectDelivery(r);
          });
        });
      },
    });
  }

  inspectDelivery(restock: any) {
    const sName = typeof restock.supplier === 'object' ? restock.supplier.name : 'Proveedor';

    let itemsToInspect: any[] = [];
    if (restock.items && restock.items.length > 0) {
      itemsToInspect = restock.items;
    } else {
      Swal.fire('Error', 'El pedido no contiene insumos estructurados.', 'error');
      return;
    }

    let formHtml = `<div class="text-start mb-3">
        <label class="form-label fw-bold text-secondary small mb-1">Recibiendo de</label>
        <div class="p-2 bg-light rounded border text-dark fw-bold">${sName}</div>
      </div>
      <p class="small text-muted text-start mb-3">Por favor, audita las cantidades físicas recibidas de cada insumo antes de completar la entrada.</p>
      <div class="table-responsive text-start" style="max-height: 250px; overflow-y: auto;">
        <table class="table table-sm align-middle">
          <thead style="position: sticky; top: 0; background: white; z-index: 1;">
            <tr class="fs-8 text-muted uppercase">
              <th>Insumo</th>
              <th width="100">Esperado</th>
              <th width="160" class="text-end">Recibido</th>
            </tr>
          </thead>
          <tbody>`;

    itemsToInspect.forEach((it: any, i: number) => {
      const pName = typeof it.itemRef === 'object' ? it.itemRef?.name : 'Insumo';
      const expectedQty = it.quantity || 0;
      formHtml += `<tr>
          <td class="fw-bold fs-7" style="vertical-align: middle;">${pName}</td>
          <td class="text-muted fw-bold font-monospace" style="vertical-align: middle;">${expectedQty}</td>
          <td>
            <div class="d-flex flex-column gap-1 align-items-end">
              <div class="d-flex align-items-center gap-0 bg-light px-1 py-0.5 rounded-pill border border-light-subtle">
                <input type="number" class="form-control form-control-sm text-center border-0 bg-transparent px-0" style="width: 45px; font-size: 0.75rem; font-weight: 600;" placeholder="Cjs" oninput="let p=this.value; let u=this.nextElementSibling.nextElementSibling.value; if(p&&u) document.getElementById('inspect-qty-${i}').value=p*u;">
                <span class="text-muted fw-bold mx-1" style="font-size: 0.7rem;">✕</span>
                <input type="number" class="form-control form-control-sm text-center border-0 bg-transparent px-0" style="width: 55px; font-size: 0.75rem; font-weight: 600;" placeholder="Cant" oninput="let u=this.value; let p=this.previousElementSibling.previousElementSibling.value; if(p&&u) document.getElementById('inspect-qty-${i}').value=p*u;">
              </div>
              <input type="number" id="inspect-qty-${i}" class="form-control form-control-sm text-center fw-bold text-primary w-100 shadow-sm" min="0" value="${expectedQty}">
            </div>
          </td>
        </tr>`;
    });

    formHtml += `</tbody></table></div>
      <div class="form-check text-start mt-3 p-3 bg-light border rounded shadow-sm">
        <input class="form-check-input mt-1" type="checkbox" id="pay-from-register" checked style="transform: scale(1.2);">
        <label class="form-check-label fw-bold text-dark ms-2" for="pay-from-register">
          Descontar costo del dinero de Caja Físicamente
          <small class="text-muted d-block mt-1 fw-normal" style="font-size: 0.8rem;">
            ¿El proveedor ya fue pagado por transferencia o es a crédito? <strong>Desmarca</strong> esta opción.
          </small>
        </label>
      </div>`;

    Swal.fire({
      title: 'Auditoría de Entrega',
      html: formHtml,
      showCancelButton: true,
      confirmButtonText: 'Confirmar Recepción',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
      preConfirm: () => {
        const auditedItems = [];
        for (let i = 0; i < itemsToInspect.length; i++) {
          const qtyInput = document.getElementById(`inspect-qty-${i}`) as HTMLInputElement;
          const qty = parseFloat(qtyInput.value);
          if (qty < 0) {
            Swal.showValidationMessage('Las cantidades no pueden ser negativas.');
            return false;
          }
          auditedItems.push({
            type: itemsToInspect[i].type || 'Product',
            itemRef:
              typeof itemsToInspect[i].itemRef === 'object' ? itemsToInspect[i].itemRef._id : itemsToInspect[i].itemRef,
            quantity: qty,
            costPrice: itemsToInspect[i].costPrice || 0,
          });
        }
        const payFromRegInput = document.getElementById('pay-from-register') as HTMLInputElement;
        return { items: auditedItems, payFromRegister: payFromRegInput.checked };
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const payload = {
          status: 'completed',
          payFromRegister: result.value.payFromRegister,
          items: result.value.items,
        };
        this.supplierService.updateRestockStatus(restock._id, payload).subscribe({
          next: (resp: any) => {
            if (resp.ok) {
              Swal.fire('¡Éxito!', 'Mercancía recibida e ingresada al inventario correctamente.', 'success');
              this.loadPendingDeliveries();
            }
          },
          error: (err) => {
            Swal.fire('Error', err.error?.message || 'No se pudo completar la recepción', 'error');
          },
        });
      }
    });
  }
}
