import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { Category } from 'src/app/interfaces/models.interface';
import { CategoryService } from 'src/app/services/category.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-category',
  templateUrl: './edit-category.component.html',
  styleUrls: ['./edit-category.component.css']
})
export class EditCategoryComponent {

  category!: Category;

  constructor(
    private categoryService: CategoryService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) { }

  categoryForm: FormGroup = this.fb.group({
    name: ['', Validators.required], // Inicializa con un string vacío o datos existentes
    description: ['', Validators.required],
  });

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      this.loadCategory(params['id']);
    });
  }

  loadCategory(idCategory: string) {
    this.categoryService.getCategoryById(idCategory)
      .pipe(map(resp => resp.category))
      .subscribe(category => {
        console.log(category!.name);
        this.category = category!;
        console.log("Categoría obtenida: ", this.category);
        this.categoryForm.setValue({
          name: category!.name,
          description: category!.description,
        });
        console.log(this.categoryForm.value);
      });
  }

  campoNoValidoDatosUsuario(campo: string): boolean {
    return this.categoryForm.get(campo)?.invalid || false;
  }

  actualizarCategory() {
    if (this.categoryForm.valid) {
      console.log('Formulario válido, datos de la categoría:', this.categoryForm.value);
      console.log('ID de la categoría:', this.category._id);

      Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas actualizar la categoría?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, actualizar',
        cancelButtonText: 'Cancelar'
      }).then(resp => {
        if (resp.isConfirmed) {
          console.log('Confirmación recibida, actualizando categoría...');
          this.categoryService.updateCategory(this.category._id!, this.categoryForm.value)
            .subscribe(
              r => {
                console.log('Respuesta del servicio:', r);
                Swal.fire({
                  text: 'Categoría actualizada correctamente',
                  icon: 'success'
                }).then(() => {
                  this.router.navigateByUrl('/dashboard/admin/categories');
                });
              },
              error => {
                console.error('Error al actualizar la categoría:', error);
                Swal.fire({
                  title: 'Error',
                  text: 'No se pudo actualizar la categoría',
                  icon: 'error'
                });
              }
            );
        } else {
          console.log('Actualización cancelada por el usuario');
        }
      }).catch(error => {
        console.error('Error en el diálogo de confirmación:', error);
      });
    } else {
      console.log('Formulario no válido');
      Swal.fire({
        title: 'Formulario no válido',
        text: 'Por favor, completa todos los campos requeridos.',
        icon: 'warning'
      });
    }
  }
}
