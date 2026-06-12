import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { CashRegisterService } from 'src/app/services/cash-register.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-close-cash-register',
  templateUrl: './close-cash-register.component.html',
  styleUrls: ['./close-cash-register.component.css']
})
export class CloseCashRegisterComponent implements OnInit {
  closeCashRegisterForm!: FormGroup;
  cashRegister: any = null;
  totalSales: number = 0;
  cashSales: number = 0;
  creditSales: number = 0;
  debitSales: number = 0;
  cashId!: string;

  constructor(
    private fb: FormBuilder,
    private cashRegisterService: CashRegisterService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.closeCashRegisterForm = this.fb.group({
      finalAmount: [0, [Validators.required, Validators.min(0)]],
      remanenteFloatAmount: [1000, [Validators.required, Validators.min(0)]],
      depositWithdrawalAmount: [0],
      notes: ['']
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
        this.totalSales = this.cashRegister.payments.cash + this.cashRegister.payments.credit + this.cashRegister.payments.debit;
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
            confirmButtonColor: '#6c757d'
          }).then(() => {
            this.router.navigate(['dashboard/user']);
          });
        } else {
          Swal.fire('Error', 'No se pudo cargar la información del turno.', 'error');
        }
      }
    });
  }

  get totalExpenses(): number {
    if (!this.cashRegister || !this.cashRegister.expenses) return 0;
    return this.cashRegister.expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
  }

  closeCashRegister(): void {
    if (this.closeCashRegisterForm.invalid) {
      return;
    }

    const finalAmount = this.closeCashRegisterForm.get('finalAmount')?.value;
    const notes = this.closeCashRegisterForm.get('notes')?.value;
    const remanente = this.closeCashRegisterForm.get('remanenteFloatAmount')?.value;
    const deposit = this.closeCashRegisterForm.get('depositWithdrawalAmount')?.value;

    Swal.fire({
      title: 'Procesando cierre...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    this.cashRegisterService.closeCashRegister(this.cashId, finalAmount, notes, remanente, deposit).subscribe({
      next: (resp) => {
        const diff = resp.difference;
        let diffText = '';
        if (diff === 0) diffText = 'Arqueo perfecto.';
        else if (diff > 0) diffText = `Sobran $${diff.toFixed(2)}.`;
        else diffText = `Faltan $${Math.abs(diff).toFixed(2)}.`;

        Swal.fire({
          icon: 'success',
          title: 'Turno cerrado',
          text: `El turno se cerró con éxito. ${diffText}`,
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#28a745'
        }).then(() => {
          this.router.navigate(['dashboard/user']);
        });
      },
      error: (error) => {
        console.error('Error closing cash register', error);
        Swal.fire('Error', 'No se pudo completar el cierre.', 'error');
      }
    });
  }
}
