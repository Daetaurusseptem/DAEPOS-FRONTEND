import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SysadminService } from 'src/app/services/sysadmin.service';
import { ManualPaymentService } from 'src/app/services/manual-payment.service';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-sysadmin-subscription-detail',
  templateUrl: './sysadmin-subscription-detail.component.html',
  styleUrls: ['./sysadmin-subscription-detail.component.css']
})
export class SysadminSubscriptionDetailComponent implements OnInit {
  companyId: string = '';
  loading: boolean = true;
  data: any = null;
  useStripe = environment.useStripe;
  manualPayments: any[] = [];
  loadingPayments = false;

  overrideData = {
    status: '',
    currentPeriodEnd: '',
    manualOverride: false
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sysadminService: SysadminService,
    private manualPaymentService: ManualPaymentService
  ) {}

  ngOnInit(): void {
    this.companyId = this.route.snapshot.paramMap.get('id') || '';
    if (this.companyId) {
      this.loadDetails();
    } else {
      this.router.navigate(['/dashboard/sysadmin/subscriptions']);
    }
  }

  loadDetails() {
    this.loading = true;
    this.sysadminService.getSubscriptionDetails(this.companyId).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.data = resp;
          this.overrideData = {
            status: this.data.company.subscriptionStatus || 'trialing',
            currentPeriodEnd: this.data.company.currentPeriodEnd ? new Date(this.data.company.currentPeriodEnd).toISOString().split('T')[0] : '',
            manualOverride: this.data.company.manualOverride || false
          };
        }
        this.loading = false;
        if (!this.useStripe) {
          this.loadManualPayments();
        }
      },
      error: (err) => {
        console.error('Error fetching details', err);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los detalles', 'error');
      }
    });
  }

  loadManualPayments() {
    this.loadingPayments = true;
    this.manualPaymentService.getAllPayments('', this.companyId).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.manualPayments = resp.payments;
        }
        this.loadingPayments = false;
      },
      error: () => {
        this.loadingPayments = false;
      }
    });
  }

  submitOverride() {
    Swal.fire({
      title: '¿Confirmar Gestión B2B?',
      text: "Si activas el control manual, las acciones automáticas de Stripe se pausarán. Al desactivarlo, el cliente regresará al estado de Stripe.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#212529',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, aplicar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.sysadminService.overrideSubscription(this.companyId, this.overrideData).subscribe({
          next: (resp: any) => {
            if (resp.ok) {
              Swal.fire('Éxito', 'Suscripción actualizada', 'success');
              this.loadDetails(); // reload data
            }
          },
          error: (err) => {
            Swal.fire('Error', err.error?.msg || 'Hubo un problema', 'error');
          }
        });
      }
    });
  }
}
