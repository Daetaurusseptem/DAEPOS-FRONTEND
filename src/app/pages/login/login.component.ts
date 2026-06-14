import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginForm } from 'src/app/interfaces/login.interface';
import { AuthService } from 'src/app/services/auth.service';
import { LoggerService } from 'src/app/services/logger.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  showDemoEnv: boolean = false;

  toggleDemoEnv() {
    this.showDemoEnv = !this.showDemoEnv;
  }
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private logger: LoggerService,
  ) {}
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  autofill(username: string) {
    this.loginForm.setValue({
      username: username,
      password: 'admin123',
    });
  }

  onSubmit() {
    this.authService.borrarLocalStorage();
    this.logger.log(this.loginForm.value);

    this.authService.login(this.loginForm.value).subscribe(
      (resp) => {
        this.router.navigateByUrl('dashboard');
      },
      (err: any) => {
        Swal.fire('Error', err.error.msg, 'error');
      },
    );
  }

  // Método para obtener fácilmente los controles del formulario en la plantilla
}
