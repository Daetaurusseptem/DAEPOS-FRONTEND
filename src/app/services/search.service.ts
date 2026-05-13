import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Busqueda } from '../interfaces/search.interface';
import { map } from 'rxjs';
import { environment } from 'src/environments/environment.development';
const urlSearch = `${environment.apiUrl}/search`

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  constructor(
    private http:HttpClient
  ) { }




  search(

    tipo: 'users' | 'companies' | 'items'|'products'|'suppliers',
    termino: string

    ): any {

      if (termino === ''){
        return;
      }

      return this.http.get<Busqueda>(`${urlSearch}busqueda/coleccion/${tipo}/${termino}`,
      // this.headers
      )
        .pipe(
         map((resp:Busqueda)=>{
          console.log(resp);
           switch (tipo) {
             case 'users':
                return resp.users;
             case 'companies':
                return resp.companies
              case 'items':
                return resp.items
              case 'products':
                return resp.products
              case 'items':
                return resp.items
             default:
               return[]
           }
         })
        );

    }

}
