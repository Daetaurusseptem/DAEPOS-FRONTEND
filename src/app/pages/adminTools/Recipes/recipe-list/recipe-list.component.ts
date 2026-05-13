import { Component, OnInit } from '@angular/core';
import { Recipe } from 'src/app/interfaces/models.interface';
import { RecipesService } from 'src/app/services/recipes.service';
import { AuthService } from 'src/app/services/auth.service';
import { map } from 'rxjs';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-recipe-list',
  templateUrl: './recipe-list.component.html',
  styleUrls: ['./recipe-list.component.css']
})
export class RecipeListComponent implements OnInit {
  recipes: Recipe[] = [];

  constructor(private recipeService: RecipesService, private router: Router) {}

  ngOnInit(): void {
    this.loadRecipes();
  }

  loadRecipes(): void {
    this.recipeService.getRecipes().subscribe(
      (data: Recipe[]) => {
        this.recipes = data;
      },
      error => {
        console.error('Error al obtener las recetas', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al obtener las recetas'
        });
      }
    );
  }

  createRecipe(): void {
    this.router.navigate(['dashboard/admin/recipes/new']);
  }

  editRecipe(id: string): void {
    this.router.navigate(['/dashboard/admin/recipes/edit', id]);
  }

  deleteRecipe(id: string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esto!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, bórrala!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.recipeService.deleteRecipe(id).subscribe(
          r => {
            console.log('Receta eliminada', r);
            Swal.fire(
              '¡Eliminada!',
              'La receta ha sido eliminada.',
              'success'
            );
            this.loadRecipes();
          },
          error => {
            console.error('Error al eliminar la receta', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Error al eliminar la receta'
            });
          }
        );
      }
    });
  }
}
