import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { User } from 'src/app/interfaces/models.interface';
import { AuthService } from 'src/app/services/auth.service';
import { UsersService } from 'src/app/services/users.service';
import Swal from 'sweetalert2';

// Importar otros servicios o módulos según sea necesario
const pattern = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
const control = new FormControl('bad@', Validators.email);

@Component({
  selector: 'app-user-edit',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.css']
})
export class UserEditComponent {

  user!: User;
  id: string = '';



  userForm: FormGroup = this.fb.group({
    name: ['', Validators.required], // Inicializa con un string vacío o datos existentes
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]]
    
  }
  );

  constructor(
    private userService: UsersService,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.activatedRoute.params.subscribe(params => {
      this.id = params['id'];
      this.getUser(this.id);
    })
  }

  getUser(id: string) {
    console.log(this.authService.usuario);
    if(this.authService.usuario.role == 'admin'){
      return this.userService.getUserByIdAdminCompany(id)
        .pipe(
          map(item => {
            console.log(item);
            return item.user
          })
        )
        .subscribe(user => {
          console.log(user);
          
          this.user = user!;
          this.userForm.setValue({
            name: this.user.name,
            username: this.user.username,
            email: this.user.email
  
          })
        })

    }
    return this.userService.getUserById(id)
      .pipe(
        map(item => {
          console.log(item);
          return item.user
        })
      )
      .subscribe(user => {
        console.log(user);
        
        this.user = user!;
        this.userForm.setValue({
          name: this.user.name,
          username: this.user.username,
          email: this.user.email

        })
      })

  }


  updateUser() {
    if (this.userForm.valid) {
      console.log('Usuario actualizada:', this.userForm.value);
      // Aquí iría el código para enviar los datos actualizados a un servicio o backend


      Swal.fire({
        title: 'estas seguro?',
        icon: 'question',
        showCancelButton: true,
        cancelButtonColor: '#F176B7'
      })
        .then(resp => {
    

          if (resp.isConfirmed) {
            this.userService.updateUser(this.user._id!, this.userForm.value)
              .subscribe(r => {
                if (this.authService.usuario.role === 'sysadmin') {
                  this.router.navigateByUrl('/dashboard/sysadmin/users');
                } else if (this.authService.usuario.role === 'admin') {
                  this.router.navigateByUrl(`/dashboard/admin/users/edit/${this.id}`);
                }
                
              })
          }
        })
        .catch(r => { return })

    }
  }

  campoNoValidoDatosUsuario(campo: string): boolean {
    if (this.userForm.get(campo)?.invalid) {
      return true;
    } else {
      return false;
    }
  }
}
