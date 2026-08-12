import { Component, OnInit } from '@angular/core';
import { Recipe } from 'src/app/interfaces/models.interface';
import { RecipesService } from 'src/app/services/recipes.service';
import { AuthService } from 'src/app/services/auth.service';
import { InventoryService } from 'src/app/services/inventory.service';
import { LoggerService } from '../../../../services/logger.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-recipe-list',
  templateUrl: './recipe-list.component.html',
  styleUrls: ['./recipe-list.component.css'],
})
export class RecipeListComponent implements OnInit {
  recipes: any[] = [];
  searchText: string = '';

  // Modal detail control
  selectedRecipe: any = null;
  selectedSize: any = null;

  constructor(
    private recipeService: RecipesService,
    private authService: AuthService,
    private inventoryService: InventoryService,
    private router: Router,
    private logger: LoggerService,
  ) {}

  ngOnInit(): void {
    this.loadRecipes();
  }

  loadRecipes(): void {
    const companyId = this.authService.companyId || this.authService.company?._id;
    if (!companyId) return;

    this.inventoryService.getInventory(companyId, '', 'all').subscribe({
      next: (invResp: any) => {
        const invItems = invResp.items || [];

        this.recipeService.getCompanyRecipes(companyId).subscribe({
          next: (resp: any) => {
            const loadedRecipes = resp.recipes || [];

            // Populate cost prices dynamically for all ingredients in all sizes of each recipe
            // And also find the associated selling price from the inventory items
            loadedRecipes.forEach((recipe: any) => {
              const associatedItem = invItems.find((inv: any) => 
                inv.product && inv.product.recipe && 
                (inv.product.recipe._id === recipe._id || inv.product.recipe === recipe._id)
              );
              recipe.baseSellingPrice = associatedItem?.sellingPrice || 0;

              if (recipe.sizes && recipe.sizes.length > 0) {
                recipe.sizes.forEach((size: any) => {
                  if (size.ingredients) {
                    size.ingredients.forEach((ri: any) => {
                      if (ri.ingredient) {
                        const matched = invItems.find(
                          (inv: any) =>
                            inv.rawMaterial === ri.ingredient._id || inv.rawMaterial?._id === ri.ingredient._id,
                        );
                        if (matched) {
                          ri.ingredient.costPrice = matched.costPrice;
                        }
                      }
                    });
                  }
                });
              }
            });

            this.recipes = loadedRecipes;
          },
          error: (err) => {
            console.error('Error al obtener las recetas', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Error al obtener las recetas',
            });
          },
        });
      },
      error: (err) => {
        console.error('Error fetching inventory raw materials', err);
      },
    });
  }

  get filteredRecipes(): any[] {
    if (!this.searchText) return this.recipes;
    const search = this.searchText.toLowerCase();
    return this.recipes.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(search) ||
        (recipe.description && recipe.description.toLowerCase().includes(search)),
    );
  }

  getRecipeTotalCost(recipe: any): number {
    if (!recipe || !recipe.sizes || recipe.sizes.length === 0) return 0;
    const baseSize = recipe.sizes[0];
    if (!baseSize.ingredients) return 0;
    return baseSize.ingredients.reduce((sum: number, ri: any) => {
      const cost = ri.ingredient?.costPrice || 0;
      return sum + ri.quantity * cost;
    }, 0);
  }

  openRecipeModal(recipe: any): void {
    this.selectedRecipe = recipe;
    if (recipe.sizes && recipe.sizes.length > 0) {
      this.selectedSize = recipe.sizes[0]; // Predeterminar el primer tamaño
    } else {
      this.selectedSize = null;
    }
  }

  closeRecipeModal(): void {
    this.selectedRecipe = null;
    this.selectedSize = null;
  }

  selectSize(size: any): void {
    this.selectedSize = size;
  }

  getSelectedSizeTotalCost(): number {
    if (!this.selectedSize || !this.selectedSize.ingredients) return 0;
    return this.selectedSize.ingredients.reduce((sum: number, ri: any) => {
      const cost = ri.ingredient?.costPrice || 0;
      return sum + ri.quantity * cost;
    }, 0);
  }

  getSelectedSizeSellingPrice(): number {
    if (!this.selectedRecipe || !this.selectedSize) return 0;
    const basePrice = this.selectedRecipe.baseSellingPrice || 0;
    const modifier = this.selectedSize.priceModifier || 0;
    return basePrice + modifier;
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
      text: '¡No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, bórrala!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.recipeService.deleteRecipe(id).subscribe({
          next: (r) => {
            this.logger.log('Receta eliminada', r);
            Swal.fire('¡Eliminada!', 'La receta ha sido eliminada.', 'success');
            this.loadRecipes();
          },
          error: (error) => {
            console.error('Error al eliminar la receta', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Error al eliminar la receta',
            });
          },
        });
      }
    });
  }
}
