import { Injectable } from '@angular/core';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class TabSelectedService {
  constructor(private logger: LoggerService) {}

  updateTabSelected(
    tab: 'usuarios' | 'productos' | 'items' | 'suscripciones' | 'proveedores' | 'categorias' | 'inventario',
  ) {
    localStorage.removeItem('tabSelected');
    this.logger.log(tab);
    localStorage.setItem('tabSelected', tab);
  }
}
