import { Injectable, EventEmitter } from '@angular/core';
import { environment } from 'src/environments/environment.development';
import { LoggerService } from './logger.service';

const base_url = environment.apiUrl;

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private _ocultarModal: boolean = true;
  public id!: string;
  public tipo!: 'empresas' | 'usuarios' | 'productos';
  public img?: string;

  public nuevaImagen: EventEmitter<string> = new EventEmitter<string>();

  get ocultarModal() {
    return this._ocultarModal;
  }

  abrirModal(img: string = 'no-img', tipo: 'empresas' | 'usuarios' | 'productos', id: string) {
    this._ocultarModal = false;
    this.img = img;
    this.tipo = tipo;
    this.id = id;
    this.logger.log(this.img);
    if (img == '' || null) {
      this.img = `${base_url}/no-img.png`;
    }
  }

  cerrarModal() {
    this._ocultarModal = true;
  }

  constructor(private logger: LoggerService) {}
}
