import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { CashRegisterService } from 'src/app/services/cash-register.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-close-cash-register',
  templateUrl: './close-cash-register.component.html',
  styleUrls: ['./close-cash-register.component.css'],
})
export class CloseCashRegisterComponent implements OnInit {
  closeCashRegisterForm!: FormGroup;
  cashRegister: any = null;
  totalSales: number = 0;
  cashSales: number = 0;
  creditSales: number = 0;
  debitSales: number = 0;
  cashId!: string;
  private managerAuthAttempts: number = 0;
  private readonly MAX_MANAGER_AUTH_ATTEMPTS = 3;

  constructor(
    private fb: FormBuilder,
    private cashRegisterService: CashRegisterService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.closeCashRegisterForm = this.fb.group({
      finalAmount: [0, [Validators.required, Validators.min(0)]],
      remanenteFloatAmount: [1000, [Validators.required, Validators.min(0)]],
      depositWithdrawalAmount: [0],
      notes: [''],
    });

    // Auto-calculate deposit safe drop based on count and change float
    this.closeCashRegisterForm.valueChanges.subscribe((vals) => {
      const finalAmount = vals.finalAmount || 0;
      const remanente = vals.remanenteFloatAmount || 0;
      const deposit = Math.max(0, finalAmount - remanente);

      this.closeCashRegisterForm.get('depositWithdrawalAmount')?.setValue(deposit, { emitEvent: false });
    });

    const userId = this.authService.usuario.id;

    // Obtener caja abierta
    this.cashRegisterService.getOpenCashRegisterWithSales(userId).subscribe({
      next: (data) => {
        this.cashRegister = data;
        this.cashId = data._id;
        this.totalSales =
          this.cashRegister.payments.cash + this.cashRegister.payments.credit + this.cashRegister.payments.debit;
        this.cashSales = this.cashRegister.payments.cash;
        this.creditSales = this.cashRegister.payments.credit;
        this.debitSales = this.cashRegister.payments.debit;
      },
      error: (error) => {
        if (error.status === 404) {
          Swal.fire({
            icon: 'warning',
            title: 'Turno no encontrado',
            text: 'No tienes un turno abierto actualmente.',
            confirmButtonText: 'Ir al Dashboard',
            confirmButtonColor: '#6c757d',
          }).then(() => {
            this.router.navigate(['dashboard/user']);
          });
        } else {
          Swal.fire('Error', 'No se pudo cargar la información del turno.', 'error');
        }
      },
    });
  }

  get totalExpenses(): number {
    if (!this.cashRegister || !this.cashRegister.expenses) return 0;
    return this.cashRegister.expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
  }

  get isBlindClosure(): boolean {
    const branchSetting = this.authService.branch?.posSettings?.blindClosure;
    if (branchSetting !== undefined) return branchSetting;
    return this.authService.company?.posSettings?.blindClosure ?? true;
  }

  get requirePinForRisks(): boolean {
    const branchSetting = this.authService.branch?.posSettings?.requirePinForRisks;
    if (branchSetting !== undefined) return branchSetting;
    return this.authService.company?.posSettings?.requirePinForRisks ?? true;
  }

  closeCashRegister(): void {
    if (this.closeCashRegisterForm.invalid) {
      return;
    }

    const finalAmount = this.closeCashRegisterForm.get('finalAmount')?.value;
    const notes = this.closeCashRegisterForm.get('notes')?.value;
    const remanente = this.closeCashRegisterForm.get('remanenteFloatAmount')?.value;
    const deposit = this.closeCashRegisterForm.get('depositWithdrawalAmount')?.value;

    const expectedAmount = this.cashRegister.expectedAmount || 0;
    const diff = finalAmount - expectedAmount;

    // Si hay FALTANTE (diff < 0) y se requiere autorización gerencial
    if (diff < 0 && this.requirePinForRisks) {
      this.promptForManagerAuth(finalAmount, notes, remanente, deposit, diff);
    } else {
      this.executeClosure(finalAmount, notes, remanente, deposit, diff);
    }
  }

  promptForManagerAuth(finalAmount: number, notes: string, remanente: number, deposit: number, diff: number) {
    if (this.managerAuthAttempts >= this.MAX_MANAGER_AUTH_ATTEMPTS) {
      Swal.fire('Bloqueado', 'Se excedió el número máximo de intentos de autorización gerencial.', 'error');
      return;
    }
    this.managerAuthAttempts++;
    Swal.fire({
      title: 'Autorización Gerencial',
      html: `
        <div class="mb-3 text-start">
          <p class="text-danger small fw-bold"><i class="bi bi-exclamation-triangle-fill"></i> Se detectó un descuadre en caja y se requiere autorización gerencial.</p>
        </div>
        <input id="swal-username" class="swal2-input" placeholder="Usuario o Email Gerencial">
        <input id="swal-password" class="swal2-input" type="password" placeholder="Contraseña">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Autorizar y Cerrar Caja',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0f172a',
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
          companyId: this.authService.companyId || this.authService.company?._id
        }).subscribe({
          next: (res: any) => {
            if (res.ok) {
              this.managerAuthAttempts = 0;
              this.executeClosure(finalAmount, notes, remanente, deposit, diff, credentials.username);
            }
          },
          error: (err) => {
            Swal.fire('Denegado', err.error?.msg || 'Credenciales inválidas', 'error').then(() => {
              this.promptForManagerAuth(finalAmount, notes, remanente, deposit, diff); // Retry
            });
          }
        });
      }
    });
  }

  executeClosure(finalAmount: number, notes: string, remanente: number, deposit: number, diff: number, authorizedBy?: string) {
    Swal.fire({
      title: 'Procesando cierre...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    let finalNotes = notes;
    if (authorizedBy) {
      finalNotes = `[AUTORIZADO POR: ${authorizedBy}] ${notes}`;
    }

    this.cashRegisterService.closeCashRegister(this.cashId, finalAmount, finalNotes, remanente, deposit).subscribe({
      next: (resp) => {
        const diffReal = resp.difference;
        let diffText = '';
        if (diffReal === 0) diffText = 'Arqueo perfecto.';
        else if (diffReal > 0) diffText = `Sobran $${diffReal.toFixed(2)}.`;
        else diffText = `Faltan $${Math.abs(diffReal).toFixed(2)}.`;

        Swal.fire({
          icon: 'success',
          title: 'Turno cerrado',
          text: `El turno se cerró con éxito. ${diffText}`,
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#28a745',
        }).then(() => {
          this.router.navigate(['dashboard/user']);
        });
      },
      error: (error) => {
        console.error('Error closing cash register', error);
        Swal.fire('Error', 'No se pudo completar el cierre.', 'error');
      },
    });
  }
}
