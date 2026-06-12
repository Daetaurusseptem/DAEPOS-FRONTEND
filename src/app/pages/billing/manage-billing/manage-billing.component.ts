import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { BillingService } from 'src/app/services/billing.service';
import Swal from 'sweetalert2';
import { Company } from 'src/app/interfaces/models.interface';
import { environment } from 'src/environments/environment';
import { ManualPaymentService } from 'src/app/services/manual-payment.service';
import { ImgService } from 'src/app/services/img.service';

@Component({
  selector: 'app-manage-billing',
  templateUrl: './manage-billing.component.html',
  styleUrls: ['./manage-billing.component.css']
})
export class ManageBillingComponent implements OnInit {

  company!: Company;
  loading: boolean = false;
  planes: any[] = [];
  loadingPlanes: boolean = true;
  useStripe: boolean = environment.useStripe;
  
  // Para Modo Manual
  globalSettings: any = null;
  myPayments: any[] = [];
  selectedPlanManual: string = '';
  amountManual: number = 0;
  imagenSubir!: File;
  imgTemp: any = null;

  constructor(
    public authService: AuthService,
    private billingService: BillingService,
    private manualPaymentService: ManualPaymentService,
    private imgService: ImgService
  ) { }

  ngOnInit(): void {
    this.company = this.authService.getCompany;
    // Forzar el uso de Stripe o Manual dependiendo del billingType
    if (this.company.billingType === 'manual') {
      this.useStripe = false;
    } else {
      this.useStripe = true;
    }

    if (this.useStripe) {
      this.cargarPlanes();
    } else {
      this.cargarPlanesModoManual();
      this.cargarAjustesYPagos();
    }
  }

  get planName(): string {
    if (this.company?.planId && typeof this.company.planId === 'object') {
      return (this.company.planId as any).name || 'Plan Básico';
    }
    return 'Plan ' + (this.company?.planType || 'Básico');
  }

  get isCanceled(): boolean {
    return this.company?.subscriptionStatus === 'canceled';
  }

  cargarPlanes() {
    this.billingService.getProducts().subscribe({
      next: (resp) => {
        if (resp.ok) {
          // Filtrar por si hay algún producto sin default_price asignado
          let productos = resp.productos.filter((p: any) => p.default_price);
          // Ordenar por precio ascendente
          this.planes = productos.sort((a: any, b: any) => {
            const priceA = a.default_price?.unit_amount || 0;
            const priceB = b.default_price?.unit_amount || 0;
            return priceA - priceB;
          });
        }
        this.loadingPlanes = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loadingPlanes = false;
      }
    });
  }

  cargarPlanesModoManual() {
    this.billingService.getDbPlans().subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.planes = resp.planes.filter((p: any) => p.isActive);
        }
        this.loadingPlanes = false;
      },
      error: (err: any) => {
        this.loadingPlanes = false;
      }
    });
  }

  cargarAjustesYPagos() {
    this.manualPaymentService.getGlobalSettings().subscribe(resp => {
      if (resp.ok) this.globalSettings = resp.settings;
    });
    this.manualPaymentService.getMyPayments().subscribe(resp => {
      if (resp.ok) this.myPayments = resp.payments;
    });
  }

  iniciarPago(priceId: string) {
    this.loading = true;
    this.billingService.createCheckoutSession(priceId).subscribe({
      next: (resp) => {
        if (resp.url) {
          window.location.href = resp.url; // Redirigir a Stripe Hosted Checkout
        }
      },
      error: (err) => {
        this.loading = false;
        Swal.fire('Error', 'No se pudo iniciar el pago con Stripe', 'error');
        console.error(err);
      }
    });
  }

  abrirPortal() {
    this.loading = true;
    this.billingService.createPortalSession().subscribe({
      next: (resp) => {
        if (resp.url) {
          window.location.href = resp.url; // Redirigir al Stripe Customer Portal
        }
      },
      error: (err) => {
        this.loading = false;
        Swal.fire('Error', 'No se pudo abrir el portal de cliente. Verifica que tengas una suscripción activa.', 'error');
      }
    });
  }

  // --- LOGICA MODO MANUAL ---
  cambiarImagen(event: any) {
    const file = event.target.files[0];
    if (!file) {
      this.imgTemp = null;
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      this.imgTemp = reader.result;
      this.imagenSubir = file;
    };
  }

  reportarPago() {
    if (!this.amountManual || this.amountManual <= 0) {
      Swal.fire('Error', 'Debes ingresar el monto que pagaste', 'warning');
      return;
    }
    if (!this.imagenSubir) {
      Swal.fire('Error', 'Debes adjuntar el comprobante (foto o captura)', 'warning');
      return;
    }

    this.loading = true;
    this.manualPaymentService.createPayment(this.amountManual, this.selectedPlanManual).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          // Subir la imagen
          this.imgService.actualizarFoto(this.imagenSubir, 'empresas', resp.payment._id).subscribe({
            next: (imgResp: any) => {
              Swal.fire('Éxito', 'Pago reportado correctamente. En breve será validado por nuestro equipo.', 'success');
              this.amountManual = 0;
              this.selectedPlanManual = '';
              this.imgTemp = null;
              this.imagenSubir = undefined as any;
              this.cargarAjustesYPagos();
              this.loading = false;
            },
            error: (err: any) => {
              Swal.fire('Error', 'Se creó el reporte pero no se pudo subir la imagen', 'error');
              this.loading = false;
            }
          });
        }
      },
      error: (err: any) => {
        this.loading = false;
        Swal.fire('Error', 'No se pudo reportar el pago', 'error');
      }
    });
  }
}
