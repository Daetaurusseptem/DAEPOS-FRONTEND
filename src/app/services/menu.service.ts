import { Injectable } from '@angular/core';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  public menu: any[] = [];

  constructor(private logger: LoggerService) {
    this.cargarMenu();
  }

  cargarMenu() {
    const raw = localStorage.getItem('menu');
    this.menu = raw ? JSON.parse(raw) : [];
  }
}
