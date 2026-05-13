import { Component, OnInit, inject, Inject, forwardRef } from '@angular/core';
import { map } from 'rxjs/operators';
import { CompanyService } from '../../../services/company.service';
import { UsersService } from '../../../services/users.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.css']
})
export class DashboardPageComponent implements OnInit {
  
  numberOfUsers: any;
  numberOfCompanies: any;
  role: string = '';

  constructor(
    private companyService: CompanyService,
    private userServices: UsersService,
    @Inject(forwardRef(() => AuthService)) private authService: AuthService
  ) { }

  ngOnInit(): void {
    if (this.authService.usuario) {
      this.role = this.authService.usuario.role;
    }
    this.getNumberUsers();
    this.getNumberCompanies();
  }

  get currentUser() {
    return this.authService.usuario;
  }
getNumberUsers(){
  this.userServices.getNumberUsers()
  .pipe(
    map(item=>item.numberOfUsers)

  )
  .subscribe(numberOfUsers=>{
    console.log(numberOfUsers);
    this.numberOfUsers= numberOfUsers
  })
}
getNumberCompanies(){
  this.companyService.getNumberOfCompanies()
  .pipe(
    map(item=>item.numberOfCompanies)

  )
  .subscribe(numberOfCompanies=>{
    console.log(numberOfCompanies);
    this.numberOfCompanies= numberOfCompanies
  })
}
verReportes() {
throw new Error('Method not implemented.');
}
gestionarUsuarios() {
throw new Error('Method not implemented.');
}

}
