import { UsuarioModel } from 'src/app/models/usuario.model';
import { Company } from 'src/app/interfaces/models.interface';
import { UsersService } from 'src/app/services/users.service';
import { Injectable } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, TitleStrategy, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { CompanyService } from '../services/company.service';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class EmpresaPermisoGuard implements CanActivate {
  empresas: Company[] = [];
  empresasConPermiso: any[] = [];
  usuarioModel!: UsuarioModel;
  empresaId!: string;
  empresa!: Company;
  

  constructor(
    private router: Router,
    private Route: ActivatedRoute,
    private authService: AuthService,
    private empresasService: CompanyService,
    private userService: UsersService

  ) {

  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean {
    console.log('compañia permiso guard');

    this.empresaId= route.params['idEmpresa']
    this.empresaId= route.params['usuarioId']
    console.log( this.empresaId);
     if (!this.comprobarEmpresaPermiso(this.empresaId)) {
       Swal.fire({
         title: 'Empresa no existente o sin permisos',
         icon:'error'
        });
       console.log('No Permitida');
       this.router.navigateByUrl('/')
       return false;
     } else {

       console.log('Permitida');
       return true;
     }
  }


  comprobarEmpresaPermiso(empresaId:string):boolean{
      let a!:boolean;
      this.userService.isAdmin(empresaId,this.authService.usuario.id )
      .subscribe(resp=>{
          a = resp.ok!
      })
      return a;
    
        }


}
