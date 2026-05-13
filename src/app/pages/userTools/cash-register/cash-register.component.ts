import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { CashRegisterService } from 'src/app/services/cash-register.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cash-register',
  templateUrl: './cash-register.component.html',
  styleUrls: ['./cash-register.component.css']
})
export class CashRegisterComponent implements OnInit {
  openCashRegisterForm!: FormGroup;
  showForm: boolean = false;
  isOpenCashRegister: boolean = false;
  
  physicalRegisters: any[] = [];
  loadingRegisters: boolean = true;

  constructor(
    private fb: FormBuilder,
    private cashRegisterService: CashRegisterService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.openCashRegisterForm = this.fb.group({
      initialAmount: [0, [Validators.required, Validators.min(0)]],
      physicalRegisterId: ['', Validators.required]
    });
    this.checkOpenCashRegister();
    this.loadPhysicalRegisters();
  }

  loadPhysicalRegisters() {
    const companyId = this.authService.companyId;
    this.cashRegisterService.getPhysicalRegisters(companyId).subscribe({
      next: (resp) => {
        this.physicalRegisters = resp.registers;
        this.loadingRegisters = false;
      },
      error: () => {
        this.loadingRegisters = false;
      }
    });
  }

  checkOpenCashRegister() {
    const userId = this.authService.usuario.id;
    this.cashRegisterService.hasOpenCashRegister(userId).subscribe((hasOpen) => {
      this.isOpenCashRegister = hasOpen;
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
  }

  openCashRegister() {
    if (this.isOpenCashRegister) return;
    if (this.openCashRegisterForm.invalid) return;

    const userId = this.authService.usuario.id;
    const initialAmount = this.openCashRegisterForm.get('initialAmount')!.value;
    const physicalRegisterId = this.openCashRegisterForm.get('physicalRegisterId')!.value;

    this.cashRegisterService.openCashRegister(userId, physicalRegisterId, initialAmount).subscribe({
      next: (data) => {
        Swal.fire('Éxito', 'Turno abierto correctamente', 'success').then(() => {
          this.router.navigate(['dashboard/user']);
        });
      },
      error: (error) => {
        console.error('Error opening cash register', error);
        Swal.fire('Error', error.error?.message || 'Error al abrir turno', 'error');
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
