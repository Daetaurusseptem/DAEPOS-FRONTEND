import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, delay } from 'rxjs';
import { User } from 'src/app/interfaces/models.interface';
import { ModalService } from 'src/app/services/modal.service';
import { UsersService } from 'src/app/services/users.service';
import { UtilitiesService } from 'src/app/services/utilities.service';
import { LoggerService } from '../../../../services/logger.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css'],
})
export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = [];
  public imgSubs!: Subscription;

  constructor(
    private userService: UsersService,
    private utilitiesService: UtilitiesService,
    private modalService: ModalService,
    private logger: LoggerService,
  ) {}

  ngOnDestroy(): void {
    this.imgSubs.unsubscribe();
  }
  ngOnInit(): void {
    this.loadUsers();
    this.imgSubs = this.modalService.nuevaImagen.pipe(delay(100)).subscribe((img) => this.loadUsers());
  }

  eliminarUsuario(id: string) {
    Swal.fire({
      title: '¿Desactivar Usuario?',
      text: 'Por favor, escribe el motivo de la desactivación de esta cuenta:',
      input: 'text',
      inputPlaceholder: 'Ej: Inasistencia, renuncia, fin de contrato...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Desactivar',
      confirmButtonColor: '#0f172a',
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#d33',
      preConfirm: (reason) => {
        if (!reason || reason.trim() === '') {
          Swal.showValidationMessage('Debes ingresar un motivo para la desactivación');
          return false;
        }
        return reason;
      },
    }).then((resp) => {
      if (resp.isConfirmed && resp.value) {
        const reason = resp.value;
        this.userService.deleteuser(id, reason).subscribe(
          (resp) => {
            if (resp.ok == true) {
              Swal.fire({
                title: 'Usuario desactivado',
                text: 'La cuenta ha sido deshabilitada con éxito.',
                icon: 'success',
              });
            } else if (resp.ok == false) {
              Swal.fire({
                title: 'Error',
                text: 'El usuario no pudo ser desactivado.',
                icon: 'error',
              });
            }
            this.utilitiesService.redirectTo(`/dashboard/sysadmin/users`);
          },
          (err) => {
            Swal.fire({
              title: 'Error',
              icon: 'error',
              text: err.error.msg || 'No se pudo desactivar el usuario.',
            });
          },
        );
      }
    });
  }

  abrirModal(user: User) {
    this.logger.log(user);
    const { _id } = user;
    this.modalService.abrirModal(user.img, 'usuarios', _id!);
  }
  loadUsers() {
    this.userService.getUsers().subscribe((users) => {
      this.users = users;
    });
  }
}
