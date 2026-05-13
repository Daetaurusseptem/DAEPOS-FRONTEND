import { Component, OnInit } from '@angular/core';
import { ImgService } from 'src/app/services/img.service';
import { ModalService } from 'src/app/services/modal.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'modal-img',
  templateUrl: './img-modal.component.html',
  styleUrls: ['./img-modal.component.css']
})
export class ModalImgComponent implements OnInit {

  public imagenSubir!: File;
  public imgTemp: any = null;

  constructor(public modalService: ModalService, public imgService: ImgService) {}

  ngOnInit(): void {}

  cerrarModal() {
    this.imgTemp = null;
    this.modalService.cerrarModal();
  }

  cambiarImagen(file: File) {
    this.imagenSubir = file;
    if (!file) {
      return this.imgTemp = null;
    } else {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onloadend = () => {
        this.imgTemp = reader.result;
      };
      return this.imgTemp;
    }
  }

  subirImagen() {
    const tipo = this.modalService.tipo;
    const id = this.modalService.id;

    this.imgService.actualizarFoto(this.imagenSubir, tipo, id)
      .subscribe((img: any) => {
        Swal.fire('Guardado', 'Imagen de usuario actualizada', 'success');
        this.modalService.nuevaImagen.emit(img);
        this.cerrarModal();
      },
      err => {
        console.log(err);
        Swal.fire('Error', 'No se pudo subir la imagen', 'error');
      });
  }
}
