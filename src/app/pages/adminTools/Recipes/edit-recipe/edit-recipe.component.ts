import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipesService } from 'src/app/services/recipes.service';
import { Recipe } from 'src/app/interfaces/models.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-recipe',
  templateUrl: './edit-recipe.component.html',
  styleUrls: ['./edit-recipe.component.css']
})
export class EditRecipeComponent implements OnInit {
  recipeForm: FormGroup;
  recipeId: string = '';

  constructor(
    private fb: FormBuilder,
    private recipeService: RecipesService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.recipeForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.recipeId = params['id'];
      if (this.recipeId) {
        this.loadRecipe();
      }
    });
  }

  loadRecipe(): void {
    this.recipeService.getRecipe(this.recipeId).subscribe({
      next: (response) => {
        if (response && response.recipe) {
          this.recipeForm.patchValue(response.recipe);
        }
      },
      error: (err) => {
        console.error('Error al cargar la receta:', err);
      }
    });
  }

  onSubmit(): void {
    if (this.recipeForm.valid) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas actualizar la receta?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Actualizar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          const updatedRecipe: Partial<Recipe> = {
            ...this.recipeForm.value,
          };

          this.recipeService.updateRecipe(this.recipeId, updatedRecipe as Recipe).subscribe({
            next: () => {
              Swal.fire('Receta actualizada', 'La receta se ha actualizado correctamente.', 'success');
              this.router.navigate(['/dashboard/admin/recipes']);
            },
            error: (error) => {
              console.error('Error al actualizar la receta:', error);
              Swal.fire('Error', 'No se pudo actualizar la receta.', 'error');
            }
          });
        }
      });
    }
  }
}
