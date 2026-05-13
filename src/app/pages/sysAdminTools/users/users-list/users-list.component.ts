import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, delay } from 'rxjs';
import { User } from 'src/app/interfaces/models.interface';
import { ModalService } from 'src/app/services/modal.service';
import { UsersService } from 'src/app/services/users.service';
import { UtilitiesService } from 'src/app/services/utilities.service';
import Swal from 'sweetalert2';



@Component({
  selector: 'app-user-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css']
})
export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = [];
  public imgSubs!: Subscription;

  constructor(
              private userService: UsersService,
              private utilitiesService:UtilitiesService,
              private modalService:ModalService
              
              ) {}

  ngOnDestroy(): void {
  this.imgSubs.unsubscribe();
  }              
  ngOnInit(): void {
   this.loadUsers()
    this.imgSubs = this.modalService.nuevaImagen
      .pipe(delay(100))
      .subscribe( img =>this.loadUsers());
  }

  eliminarUsuario(id:string){
    Swal.fire({
      title:'Esta Seguro?',
      text:'Este proceso no se podrá deshacer',
      icon:'warning',
      showCancelButton:true,
      cancelButtonColor:'#F56A52',
      iconColor:'#F56A52',
      allowEnterKey:false

    })
    .then(resp=>{
      if(resp.isConfirmed){
        this.userService.deleteuser(id)
        .subscribe(resp=>{
          if(resp.ok==true){
            Swal.fire({
              title:'Registro eliminado',
              icon:'success'
            })
          }else if(resp.ok==false){
            Swal.fire({
              title:'El registro no pudo ser eliminado',
              icon:'error'
            })

          }

          this.utilitiesService.redirectTo(`/dashboard/sysadmin/users`)
        }, err=>{
          Swal.fire({
            title:'Registro no eliminado',
            icon:'error',
            text:err.error.msg
          })
        })
      }
    })
  }

  abrirModal( user: User ) {
    console.log(user);
    const {_id} = user
    this.modalService.abrirModal(user.img,'usuarios',_id!);
  }
  loadUsers(){
    this.userService.getUsers().subscribe(users=>{
      this.users = users;
    })
  }
}
