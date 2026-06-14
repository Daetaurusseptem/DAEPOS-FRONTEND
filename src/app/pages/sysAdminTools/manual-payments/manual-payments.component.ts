import { Component, OnInit } from '@angular/core';
import { ManualPaymentService } from 'src/app/services/manual-payment.service';
import { SysadminService } from 'src/app/services/sysadmin.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-manual-payments',
  templateUrl: './manual-payments.component.html',
  styleUrls: ['./manual-payments.component.css'],
})
export class ManualPaymentsComponent implements OnInit {
  pagos: any[] = [];
  planes: any[] = [];
  loading: boolean = true;
  filtroStatus: string = 'pending';

  // Modal State
  selectedPago: any = null;
  formAprobar = {
    newEndDate: '',
    assignedPlanId: '',
    adminNotes: '',
    reminderDate: '',
    customMaxBranches: undefined,
    customMaxUsers: undefined,
    customMaxRegisters: undefined,
  };

  constructor(
    private manualPaymentService: ManualPaymentService,
    private sysadminService: SysadminService,
  ) {}

  ngOnInit(): void {
    this.cargarPlanes();
    this.cargarPagos();
  }

  cargarPlanes() {
    this.sysadminService.getPlans().subscribe((resp: any) => {
      if (resp.ok) {
        this.planes = resp.planes;
      }
    });
  }

  cargarPagos() {
    this.loading = true;
    this.manualPaymentService.getAllPayments(this.filtroStatus === 'all' ? '' : this.filtroStatus).subscribe((resp) => {
      if (resp.ok) {
        this.pagos = resp.payments;
      }
      this.loading = false;
    });
  }

  abrirAprobarModal(pago: any) {
    this.selectedPago = pago;

    // Sugerir fecha a un mes
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    this.formAprobar = {
      newEndDate: nextMonth.toISOString().split('T')[0],
      assignedPlanId: pago.planRequested?._id || '',
      adminNotes: '',
      reminderDate: '',
      customMaxBranches: undefined,
      customMaxUsers: undefined,
      customMaxRegisters: undefined,
    };
  }

  onPlanSelectChange() {
    const selected = this.planes.find((p) => p._id === this.formAprobar.assignedPlanId);
    if (selected) {
      this.formAprobar.customMaxBranches = selected.maxBranches;
      this.formAprobar.customMaxUsers = selected.maxUsers;
      this.formAprobar.customMaxRegisters = selected.maxActiveRegisters;
    }
  }

  confirmarAprobacion() {
    if (!this.formAprobar.assignedPlanId) {
      Swal.fire('Atención', 'Debes asignar un plan obligatoriamente', 'warning');
      return;
    }

    this.manualPaymentService.approvePayment(this.selectedPago._id, this.formAprobar).subscribe({
      next: (resp) => {
        if (resp.ok) {
          Swal.fire('Aprobado', 'El pago fue aprobado y la empresa fue activada.', 'success');
          this.selectedPago = null;
          this.cargarPagos();
        }
      },
      error: (err) => {
        Swal.fire('Error', 'No se pudo aprobar el pago', 'error');
      },
    });
  }

  rechazarPago(pago: any) {
    Swal.fire({
      title: 'Rechazar Pago',
      input: 'textarea',
      inputLabel: 'Motivo del rechazo',
      inputPlaceholder: 'Ej. El comprobante está borroso o el monto no coincide...',
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.manualPaymentService.rejectPayment(pago._id, result.value).subscribe({
          next: () => {
            Swal.fire('Rechazado', 'El pago ha sido rechazado.', 'success');
            this.cargarPagos();
          },
          error: () => Swal.fire('Error', 'No se pudo rechazar', 'error'),
        });
      }
    });
  }
}
