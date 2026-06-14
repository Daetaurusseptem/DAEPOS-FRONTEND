import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { PendingOrderService } from '../../../services/pending-order.service';
import { AuthService } from '../../../services/auth.service';
import { SocketService } from '../../../services/socket.service';
import { InventoryService } from '../../../services/inventory.service';
import { LoggerService } from '../../../services/logger.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-kitchen-kds',
  templateUrl: './kitchen-kds.component.html',
  styleUrls: ['./kitchen-kds.component.css'],
})
export class KitchenKdsComponent implements OnInit, OnDestroy {
  activeOrders: any[] = [];
  completedRecentOrders: any[] = [];
  depletedCompositeProducts: any[] = [];
  loading = true;
  isFullscreen = false;

  // Theme Configuration
  themes: string[] = ['light', 'dark', 'high-contrast', 'blue-dark', 'terminal'];
  currentTheme: string = 'light';

  // Layout & Zoom Configuration
  layouts: string[] = ['grid', 'dense', 'list'];
  currentLayout: string = 'grid';

  zoomLevels: number[] = [75, 85, 100, 115, 125, 150];
  currentZoomValue: number = 100;

  private socketSubscription!: Subscription;

  constructor(
    private pendingOrderService: PendingOrderService,
    public authService: AuthService,
    private socketService: SocketService,
    private inventoryService: InventoryService,
    private el: ElementRef,
    private logger: LoggerService,
  ) {}

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('kdsTheme');
    if (savedTheme && this.themes.includes(savedTheme)) {
      this.currentTheme = savedTheme;
    }

    const savedLayout = localStorage.getItem('kdsLayout');
    if (savedLayout && this.layouts.includes(savedLayout)) {
      this.currentLayout = savedLayout;
    }

    const savedZoom = localStorage.getItem('kdsZoomVal');
    if (savedZoom) {
      const parsedZoom = parseInt(savedZoom, 10);
      if (this.zoomLevels.includes(parsedZoom)) {
        this.currentZoomValue = parsedZoom;
      }
    }

    const branchId = this.authService.branch?._id || '';
    if (branchId) {
      this.socketService.connect(undefined, branchId);
      this.socketSubscription = this.socketService.onEvent('kds-update').subscribe(() => {
        this.loadOrders();
      });
    }
    // Carga inicial
    this.loadOrders();
  }

  ngOnDestroy(): void {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
    this.socketService.disconnect();
  }

  loadOrders(): void {
    const branchId = this.authService.branch?._id || '';
    const companyId = this.authService.companyId || '';

    this.logger.log('--- DEBUG KDS LOAD ORDERS ---');
    this.logger.log('AuthService Branch:', this.authService.branch);
    this.logger.log('Branch ID extracted:', branchId);
    this.logger.log('AuthService CompanyId:', this.authService.companyId);
    this.logger.log('Company ID extracted:', companyId);

    if (!branchId || !companyId) {
      console.warn('Returning early because branchId or companyId is missing!');
      this.loading = false;
      return;
    }

    this.pendingOrderService.getActivePendingOrders(branchId, companyId).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          const allOrders = resp.pendingOrders || [];

          // Filtrar órdenes activas en cocina
          this.activeOrders = allOrders.filter((o: any) => o.kitchenStatus === 'in_kitchen');

          // Filtrar órdenes despachadas recientemente (para permitir recall/deshacer)
          this.completedRecentOrders = allOrders.filter(
            (o: any) => o.kitchenStatus === 'ready' || o.kitchenStatus === 'delivered',
          );
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar comandas de cocina:', err);
        this.loading = false;
      },
    });

    // Cargar también las alertas de stock
    this.inventoryService.getInventory(companyId, '', 'product', branchId).subscribe({
      next: (res: any) => {
        if (res.ok && res.items) {
          this.depletedCompositeProducts = res.items.filter(
            (item: any) =>
              item.product?.isComposite && item.theoreticalStock !== undefined && item.theoreticalStock <= 0,
          );
        }
      },
      error: (err) => console.error('Error al cargar inventario para KDS:', err),
    });
  }

  markAsReady(orderId: string): void {
    this.pendingOrderService.updatePendingOrderStatus(orderId, 'ready').subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          // Remover localmente para respuesta inmediata de interfaz antes del siguiente poll
          this.activeOrders = this.activeOrders.filter((o) => o._id !== orderId);
          this.loadOrders();

          Swal.fire({
            icon: 'success',
            title: 'Orden Despachada',
            text: 'La comanda se marcó como Lista para servir.',
            timer: 1000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
          });
        }
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo despachar la comanda: ' + (err.error?.message || err.message),
        });
      },
    });
  }

  recallOrder(orderId: string): void {
    this.pendingOrderService.updatePendingOrderStatus(orderId, 'in_kitchen').subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.loadOrders();
          Swal.fire({
            icon: 'info',
            title: 'Orden Recuperada',
            text: 'La comanda ha regresado a la pantalla de cocina.',
            timer: 1200,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
          });
        }
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo recuperar la comanda.',
        });
      },
    });
  }

  getOrderAge(dateStr: string | Date): number {
    const created = new Date(dateStr).getTime();
    const now = new Date().getTime();
    return Math.floor((now - created) / 60000); // Retorna en minutos
  }

  getOrderAgeAlertClass(dateStr: string | Date): string {
    const age = this.getOrderAge(dateStr);
    if (age >= 20) return 'age-critical';
    if (age >= 10) return 'age-warning';
    return 'age-normal';
  }

  getPlatformClass(order: any): string {
    if (order.type !== 'delivery' || !order.deliveryDetails) return 'plat-internal';
    const plat = order.deliveryDetails.platform;
    if (plat === 'uber_eats') return 'plat-uber';
    if (plat === 'rappi') return 'plat-rappi';
    if (plat === 'didi_food') return 'plat-didi';
    return 'plat-delivery';
  }

  getPlatformLabel(order: any): string {
    if (order.type !== 'delivery' || !order.deliveryDetails) return 'PARA LLEVAR';
    const details = order.deliveryDetails;
    const orderCode = details.orderId ? ` #${details.orderId}` : '';

    switch (details.platform) {
      case 'uber_eats':
        return `UBER EATS${orderCode}`;
      case 'rappi':
        return `RAPPI${orderCode}`;
      case 'didi_food':
        return `DIDI FOOD${orderCode}`;
      case 'phone_order':
        return `TELÉFONO${orderCode}`;
      default:
        return `DELIVERY${orderCode}`;
    }
  }

  getServiceTypeLabel(order: any): string {
    if (order.type === 'dine_in') return `MESA: ${order.table || 'N/A'}`;
    if (order.type === 'drive_thru') return `DRIVE-THRU (Carril ${order.driveThruDetails?.lane || 1})`;
    if (order.type === 'take_away') return `PARA LLEVAR - ${order.clientName || 'Cliente'}`;
    return this.getPlatformLabel(order);
  }

  logout(): void {
    this.authService.logout();
  }

  toggleTheme(): void {
    const currentIndex = this.themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % this.themes.length;
    this.currentTheme = this.themes[nextIndex];
    localStorage.setItem('kdsTheme', this.currentTheme);
  }

  getThemeIcon(): string {
    switch (this.currentTheme) {
      case 'light':
        return 'fa-sun';
      case 'dark':
        return 'fa-moon';
      case 'high-contrast':
        return 'fa-adjust';
      case 'blue-dark':
        return 'fa-tint';
      case 'terminal':
        return 'fa-terminal';
      default:
        return 'fa-sun';
    }
  }

  getThemeName(): string {
    switch (this.currentTheme) {
      case 'light':
        return 'Claro';
      case 'dark':
        return 'Oscuro';
      case 'high-contrast':
        return 'Contraste';
      case 'blue-dark':
        return 'Azul';
      case 'terminal':
        return 'Terminal';
      default:
        return 'Claro';
    }
  }

  toggleLayout(): void {
    const currentIndex = this.layouts.indexOf(this.currentLayout);
    const nextIndex = (currentIndex + 1) % this.layouts.length;
    this.currentLayout = this.layouts[nextIndex];
    localStorage.setItem('kdsLayout', this.currentLayout);
  }

  getLayoutIcon(): string {
    switch (this.currentLayout) {
      case 'grid':
        return 'fa-th-large';
      case 'dense':
        return 'fa-th';
      case 'list':
        return 'fa-list';
      default:
        return 'fa-th-large';
    }
  }

  zoomIn(): void {
    const idx = this.zoomLevels.indexOf(this.currentZoomValue);
    if (idx < this.zoomLevels.length - 1) {
      this.currentZoomValue = this.zoomLevels[idx + 1];
      localStorage.setItem('kdsZoomVal', this.currentZoomValue.toString());
    }
  }

  zoomOut(): void {
    const idx = this.zoomLevels.indexOf(this.currentZoomValue);
    if (idx > 0) {
      this.currentZoomValue = this.zoomLevels[idx - 1];
      localStorage.setItem('kdsZoomVal', this.currentZoomValue.toString());
    }
  }

  toggleFullscreen(): void {
    const kdsContainer = this.el.nativeElement.querySelector('.kds-container');

    if (!document.fullscreenElement) {
      if (kdsContainer && kdsContainer.requestFullscreen) {
        kdsContainer.requestFullscreen().catch((err: any) => {
          console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  @HostListener('document:fullscreenchange', ['$event'])
  @HostListener('document:webkitfullscreenchange', ['$event'])
  @HostListener('document:mozfullscreenchange', ['$event'])
  @HostListener('document:MSFullscreenChange', ['$event'])
  onFullscreenChange(): void {
    this.isFullscreen = !!document.fullscreenElement;
  }
}
