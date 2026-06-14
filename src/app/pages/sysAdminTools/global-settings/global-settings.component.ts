import { Component, OnInit } from '@angular/core';
import { ManualPaymentService } from 'src/app/services/manual-payment.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-global-settings',
  templateUrl: './global-settings.component.html',
  styleUrls: ['./global-settings.component.css'],
})
export class GlobalSettingsComponent implements OnInit {
  settings: any = {
    bankInstructions: { bankName: '', accountName: '', accountNumber: '', clabe: '', extraNotes: '' },
    contactEmail: '',
  };
  loading: boolean = false;

  constructor(private manualPaymentService: ManualPaymentService) {}

  ngOnInit(): void {
    this.cargarAjustes();
  }

  cargarAjustes() {
    this.manualPaymentService.getGlobalSettings().subscribe((resp) => {
      if (resp.ok && resp.settings) {
        this.settings = resp.settings;
        if (!this.settings.bankInstructions) {
          this.settings.bankInstructions = {
            bankName: '',
            accountName: '',
            accountNumber: '',
            clabe: '',
            extraNotes: '',
          };
        }
      }
    });
  }

  guardar() {
    this.loading = true;
    this.manualPaymentService.updateGlobalSettings(this.settings).subscribe({
      next: (resp) => {
        this.loading = false;
        if (resp.ok) {
          Swal.fire('Guardado', 'Los ajustes se actualizaron correctamente', 'success');
        }
      },
      error: (err) => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron guardar los ajustes', 'error');
      },
    });
  }
}
