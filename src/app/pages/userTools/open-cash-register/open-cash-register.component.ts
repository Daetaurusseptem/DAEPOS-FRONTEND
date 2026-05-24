import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { CashRegisterService } from 'src/app/services/cash-register.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-open-cash-register',
  templateUrl: './open-cash-register.component.html',
  styleUrls: ['./open-cash-register.component.css']
})
export class OpenCashRegisterComponent implements OnInit {
  initialAmount: number = 0;
  showForm: boolean = true;
  userId: string;
  companyId: string;
  userName: string = '';
  branchName: string = '';
  
  physicalRegisters: any[] = [];
  selectedPhysicalRegisterId: string = '';
  loadingRegisters: boolean = true;

  constructor(
    private cashRegisterService: CashRegisterService,
    private authService: AuthService,
    private router: Router
  ) {
    this.userId = this.authService.usuario.id;
    this.companyId = this.authService.companyId;
    this.userName = this.authService.usuario?.name || 'Cajero';
    this.branchName = this.authService.branch?.name || 'Mi Sucursal';
  }

  ngOnInit(): void {
    this.loadPhysicalRegisters();
  }

  loadPhysicalRegisters() {
    this.loadingRegisters = true;
    const branchId = this.authService.branch?._id || this.authService.branch || '';
    this.cashRegisterService.getPhysicalRegisters(this.companyId, branchId).subscribe({
      next: (resp) => {
        this.physicalRegisters = resp.registers;
        this.loadingRegisters = false;
      },
      error: (err) => {
        console.error('Error loading physical registers', err);
        this.loadingRegisters = false;
        Swal.fire('Error', 'No se pudieron cargar las cajas físicas configuradas.', 'error');
      }
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
  }

  openCashRegister() {
    if (!this.selectedPhysicalRegisterId) {
      Swal.fire('Atención', 'Debes seleccionar una caja física para operar.', 'warning');
      return;
    }

    if (this.initialAmount < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Monto no válido',
        text: 'El monto inicial no puede ser negativo.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    this.cashRegisterService.openCashRegister(
      this.userId, 
      this.selectedPhysicalRegisterId, 
      this.initialAmount
    ).subscribe({
      next: (data) => {
        Swal.fire({
          icon: 'success',
          title: 'Caja Abierta',
          text: 'La caja ha sido abierta exitosamente.',
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#28a745'
        }).then(() => {
          this.router.navigate(['dashboard/user']);
        });
      },
      error: (error) => {
        console.error('Error opening cash register', error);
        const errorMsg = error.error?.message || 'Hubo un problema al abrir la caja.';
        Swal.fire({
          icon: 'error',
          title: 'Error al abrir caja',
          text: errorMsg,
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#dc3545'
        });
      }
    });
  }

  logout() {
    Swal.fire({
      title: '¿Seguro que quieres salir?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
      }
    });
  }
}
