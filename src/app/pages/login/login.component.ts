import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { LoginForm } from 'src/app/interfaces/login.interface';
import { AuthService } from 'src/app/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;



  constructor(

    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {

  }
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {

    this.authService.borrarLocalStorage()
    console.log(this.loginForm.value);

    this.authService.login(this.loginForm.value)
      .subscribe(resp => {
        // Navegar al Dashboard

        this.router.navigateByUrl('dashboard')
          .then(() => {
            this.router.events.subscribe((event) => {
              if (event instanceof NavigationEnd) {
                window.location.reload();
              }
            })});

          }, (err: any) => {
            // Si sucede un error
            Swal.fire('Error', err.error.msg, 'error');
          });
        
      }

  // Método para obtener fácilmente los controles del formulario en la plantilla

}
