import { Component } from '@angular/core';
import {  pipe } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from 'src/app/interfaces/models.interface';
import { AuthService } from 'src/app/services/auth.service';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-company-users',
  templateUrl: './company-users.component.html',
  styleUrls: ['./company-users.component.css']
})
export class CompanyUsersComponent {
  adminId!:string
  users: User[] = [];

  constructor(
                private userService: UsersService,
                private authService: AuthService
                ) {}

  ngOnInit(): void {
    this.adminId = this.authService.idUsuario
    this.userService.getAllNonAdminUsersOfCompany(this.adminId)
    .pipe(
      map(item=>{
        return item.users
      })
    )
    .subscribe(users=>{
      this.users = users!;
    })
  }
}
