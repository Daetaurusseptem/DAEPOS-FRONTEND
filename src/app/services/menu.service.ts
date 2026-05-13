import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  public menu: any[]=[]

  constructor(){
    this.cargarMenu()
  }

  cargarMenu(){
    this.menu = JSON.parse(localStorage.getItem('menu')!)
   console.log(this.menu);
  }
}
