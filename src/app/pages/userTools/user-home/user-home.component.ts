import { Component, HostListener, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { CashRegisterService } from 'src/app/services/cash-register.service';
import Swal from 'sweetalert2';
import { SupplierService } from 'src/app/services/provider.service';
import { ProductService } from 'src/app/services/product.service';
import { RawMaterialsService } from 'src/app/services/raw-materials.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-user-home',
  templateUrl: './user-home.component.html',
  styleUrls: ['./user-home.component.css'],
})
export class UserHomeComponent implements OnDestroy {
  isOpenCashRegister: boolean = false;
  shiftExpired: boolean = false;
  shiftWarning: boolean = false;
  hoursLeft: number = 0;
  userName: string = '';
  branchName: string = '';
  companyId: string = '';
  branchId: string = '';
  private shiftTimer: any = null;
  private shiftStartDate: Date | null = null;
  private shiftMaxHours: number = 12;

  // Datos para Entregas
  pendingDeliveries: any[] = [];
  suppliers: any[] = [];
  allCompanyProducts: any[] = [];

  // Variables para Recepción Imprevista
  showUnplannedRestockModal: boolean = false;
  unplannedRestock: { supplier: string; notes: string; payFromRegister: boolean } = {
    supplier: '',
    notes: '',
    payFromRegister: true,
  };
  unplannedItems: any[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private cashRegisterService: CashRegisterService,
    private supplierService: SupplierService,
    private productsService: ProductService,
    private rawMaterialsService: RawMaterialsService,
  ) {
    this.userName = this.authService.usuario?.name || 'Cajero';
    this.branchName = this.authService.branch?.name || 'Mi Sucursal';
    this.companyId =
      this.authService.companyId || (this.authService.usuario?.company as any)?._id || (this.authService.usuario?.company as any) || '';
    this.branchId = this.authService.branch?._id || '';
  }

  ngOnInit() {
    this.checkOpenCashRegister();
    if (this.companyId) {
      this.loadPendingDeliveries();
      this.loadInitialData();
    }
  }

  loadPendingDeliveries() {
    this.supplierService.getCompanyRestocks(this.companyId).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          const today = new Date().toISOString().split('T')[0];
          this.pendingDeliveries = resp.restocks.filter((r: any) => {
            const expDate = new Date(r.expectedDate).toISOString().split('T')[0];
            return r.status === 'pending' && r.branch?._id === this.branchId && expDate <= today;
          });
        }
      },
    });
  }

  loadInitialData() {
    forkJoin({
      suppliers: this.supplierService.getCompanySuppliers(this.companyId),
      products: this.productsService.getCompanyProducts(this.companyId),
      materials: this.rawMaterialsService.getCompanyRawMaterials(this.companyId),
    }).subscribe({
      next: (res: any) => {
        this.suppliers = res.suppliers?.suppliers || [];
        const prods = (res.products?.products || [])
          .filter((p: any) => !p.isComposite)
          .map((p: any) => ({ ...p, itemType: 'Product' }));
        const mats = (res.materials?.rawMaterials || []).map((m: any) => ({ ...m, itemType: 'RawMaterial' }));
        this.allCompanyProducts = [...prods, ...mats];
      },
    });
  }

  checkOpenCashRegister() {
    const userId = this.authService.usuario?.id || this.authService.idUsuario;
    this.cashRegisterService.getOpenCashRegister(userId).subscribe({
      next: (resp) => {
        if (resp && resp._id) {
          this.isOpenCashRegister = true;

          // Calcular tiempo restante del turno
          this.shiftStartDate = new Date(resp.startDate);
          this.shiftMaxHours = this.authService.branch?.shiftSettings?.maxShiftDurationHours || 12;

          this.recalculateShiftTimer();

          // Refrescar cada 60 segundos
          if (this.shiftTimer) clearInterval(this.shiftTimer);
          this.shiftTimer = setInterval(() => this.recalculateShiftTimer(), 60000);
        } else {
          this.isOpenCashRegister = false;
        }
      },
      error: () => (this.isOpenCashRegister = false),
    });
  }

  recalculateShiftTimer() {
    if (!this.shiftStartDate) return;
    const msPassed = Date.now() - this.shiftStartDate.getTime();
    const hoursPassed = msPassed / (1000 * 60 * 60);
    this.hoursLeft = this.shiftMaxHours - hoursPassed;

    if (this.hoursLeft <= 0) {
      this.shiftExpired = true;
      this.shiftWarning = false;
    } else if (this.hoursLeft <= 2) {
      this.shiftWarning = true;
      this.shiftExpired = false;
    } else {
      this.shiftWarning = false;
      this.shiftExpired = false;
    }
  }

  ngOnDestroy() {
    if (this.shiftTimer) {
      clearInterval(this.shiftTimer);
    }
  }

  openCashRegister() {
    if (!this.isOpenCashRegister) {
      this.router.navigate(['dashboard/user/open-cash-register']);
    }
  }

  performSale() {
    if (this.isOpenCashRegister) {
      if (this.shiftExpired) {
        Swal.fire({
          icon: 'warning',
          title: 'Turno Expirado',
          text: 'El tiempo máximo de la caja ha vencido. Ya no puedes realizar nuevas ventas, pero puedes cobrar comandas pendientes o realizar tu corte de caja.',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#000',
        });
        return;
      }
      this.router.navigate(['dashboard/user/new-sale']);
    }
  }

  closeCashRegister() {
    if (this.isOpenCashRegister) {
      this.router.navigate(['dashboard/user/close-register']);
    }
  }

  viewDailySales() {
    this.router.navigate(['dashboard/user/daily-sales']);
  }

  viewItems() {
    this.router.navigate(['dashboard/user/inventory-available']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // ---- MÉTODOS DE RECEPCIÓN (COPIADOS DE NEWSALE / DELIVERIES-HUB) ----

  inspectScheduledDelivery() {
    if (this.pendingDeliveries.length === 0) {
      Swal.fire('Sin Entregas', 'No hay entregas programadas pendientes para el día de hoy.', 'info');
      return;
    }

    // Si hay más de una, seleccionar la primera para la demo o abrir una lista.
    // Simplificaremos abriendo la primera entrega pendiente.
    const restock = this.pendingDeliveries[0];
    this.openSweetAlertInspect(restock);
  }

  openSweetAlertInspect(restock: any) {
    const itemsToInspect = restock.items || [];
    const sName = typeof restock.supplier === 'object' ? restock.supplier?.name : 'Proveedor';

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

  // Recepción Rápida (Modal Custom)
  openUnplannedRestock() {
    this.unplannedRestock = { supplier: '', notes: 'Recepción no programada en caja', payFromRegister: true };
    this.unplannedItems = [
      {
        productId: '',
        productName: '',
        quantity: 1,
        itemType: 'Product',
        searchText: '',
        showDropdown: false,
        measurementUnit: '',
        packs: undefined,
        unitsPerPack: undefined,
        costPrice: 0,
        originalCostPrice: 0,
      },
    ];
    this.showUnplannedRestockModal = true;
  }

  addUnplannedItem() {
    this.unplannedItems.push({
      productId: '',
      productName: '',
      quantity: 1,
      itemType: 'Product',
      searchText: '',
      showDropdown: false,
      measurementUnit: '',
      packs: undefined,
      unitsPerPack: undefined,
      costPrice: 0,
      originalCostPrice: 0,
    });
  }

  removeUnplannedItem(idx: number) {
    this.unplannedItems.splice(idx, 1);
  }

  getFilteredProductsForDropdown(idx: number): any[] {
    const text = this.unplannedItems[idx].searchText;
    if (!text) return this.allCompanyProducts.slice(0, 50);
    const lowerText = text.toLowerCase();
    return this.allCompanyProducts
      .filter(
        (p) =>
          (p.name || '').toLowerCase().includes(lowerText) || (p.brand && p.brand.toLowerCase().includes(lowerText)),
      )
      .slice(0, 50);
  }

  selectProductForUnplannedRow(idx: number, prod: any) {
    this.unplannedItems[idx].productId = prod._id || '';
    this.unplannedItems[idx].productName = prod.name || '';
    this.unplannedItems[idx].itemType = prod.itemType || 'Product';
    this.unplannedItems[idx].searchText = prod.name;
    this.unplannedItems[idx].showDropdown = false;
    this.unplannedItems[idx].measurementUnit = prod.measurementUnit || (prod.itemType === 'RawMaterial' ? 'U' : 'Pza');
    this.unplannedItems[idx].packs = undefined;
    this.unplannedItems[idx].unitsPerPack = undefined;
    this.unplannedItems[idx].costPrice = prod.costPrice || 0; // Guardamos el costo para no distorsionar promedio
    this.unplannedItems[idx].originalCostPrice = prod.costPrice || 0;
  }

  updateItemQuantityFromMultiplier(idx: number) {
    const item = this.unplannedItems[idx];
    if (item.packs && item.unitsPerPack) {
      item.quantity = item.packs * item.unitsPerPack;
    }
  }

  saveUnplannedRestock() {
    if (!this.unplannedRestock.supplier) {
      Swal.fire('Error', 'Selecciona un proveedor.', 'warning');
      return;
    }
    const validItems = this.unplannedItems.filter((it) => it.productId && it.quantity > 0);
    if (validItems.length === 0) {
      Swal.fire('Error', 'Agrega al menos un producto válido a recibir.', 'warning');
      return;
    }

    const payload = {
      company: this.companyId,
      branch: this.branchId,
      supplier: this.unplannedRestock.supplier,
      expectedDate: new Date(),
      status: 'pending', // Primero lo creamos pendiente
      isRecurring: false,
      recurrence: 'none',
      notes: this.unplannedRestock.notes,
      items: validItems.map((it) => ({
        type: it.itemType,
        itemRef: it.productId,
        quantity: it.quantity,
        costPrice: it.costPrice, // Importante mandar el costo
      })),
    };

    Swal.fire({ title: 'Registrando entrada...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    // Paso 1: Crear el schedule
    this.supplierService.createRestockSchedule(payload).subscribe({
      next: (resp: any) => {
        if (resp.ok && resp.restock) {
          // Paso 2: Marcar como completado para actualizar stock
          const updatePayload = {
            status: 'completed',
            payFromRegister: this.unplannedRestock.payFromRegister,
            items: payload.items,
          };
          this.supplierService.updateRestockStatus(resp.restock._id, updatePayload).subscribe({
            next: (updateResp: any) => {
              if (updateResp.ok) {
                Swal.fire(
                  '¡Éxito!',
                  'La entrada no programada fue registrada y el inventario se ha actualizado.',
                  'success',
                );
                this.showUnplannedRestockModal = false;
              }
            },
            error: (err) =>
              Swal.fire('Error', 'Se creó el registro pero falló la actualización de inventario.', 'error'),
          });
        }
      },
      error: (err) => Swal.fire('Error', err.error?.message || 'No se pudo crear el registro.', 'error'),
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const activeEl = document.activeElement as HTMLElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
      return;
    }
    if (this.showUnplannedRestockModal) {
      return;
    }
    if (event.key === 'a') {
      this.openCashRegister();
    } else if (event.key === 's' && this.isOpenCashRegister) {
      this.performSale();
    } else if (event.key === 'g' && this.isOpenCashRegister) {
      this.closeCashRegister();
    } else if (event.key === 'd') {
      this.viewDailySales();
    } else if (event.key === 'i') {
      this.viewItems();
    }
  }
}
