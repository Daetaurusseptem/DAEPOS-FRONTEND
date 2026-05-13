import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from 'src/app/interfaces/models.interface';
import { UsersService } from 'src/app/services/users.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css']
})
export class CreateUserComponent {
  user: User = {
    name: '',
    email:'',
    username: '',
    password: '',
    role: 'user'
  };

  constructor(
              private userService: UsersService,
              private router: Router,

              
              ) {}

  createUser(form: NgForm) {
    if (form.valid) {
      this.userService.createUser(this.user).subscribe({
        next: (createdCompany) => {
          Swal.fire({
            text:'Usuario creado correctamente',
            icon:'success'
          })
          .then(()=>{
            this.router.navigateByUrl('/dashboard/sysadmin/users')
          })
        },
        error: (error) => {
          Swal.fire({
            text:'Usuario no pudo ser creado',
            icon:'error'
          })
          
        }
      });
    }
  }
}
