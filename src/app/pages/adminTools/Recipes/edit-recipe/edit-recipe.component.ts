import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipesService } from 'src/app/services/recipes.service';
import { AuthService } from 'src/app/services/auth.service';
import { RawMaterialsService, RawMaterial } from 'src/app/services/raw-materials.service';
import { InventoryService } from 'src/app/services/inventory.service';
import { Recipe } from 'src/app/interfaces/models.interface';
import { map } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-recipe',
  templateUrl: './edit-recipe.component.html',
  styleUrls: ['./edit-recipe.component.css']
})
export class EditRecipeComponent implements OnInit {
  recipeForm: FormGroup;
  recipeId: string = '';
  rawMaterials: RawMaterial[] = [];

  constructor(
    private fb: FormBuilder,
    private recipeService: RecipesService,
    private rawMaterialsService: RawMaterialsService,
    private inventoryService: InventoryService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.recipeForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      rawMaterials: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadRawMaterials();
    this.route.params.subscribe(params => {
      this.recipeId = params['id'];
      if (this.recipeId) {
        this.loadRecipe();
      }
    });
  }

  loadRawMaterials(): void {
    const companyId = this.authService.companyId || this.authService.company?._id;
    if (!companyId) return;

    this.rawMaterialsService.getCompanyRawMaterials(companyId)
      .pipe(map(resp => resp.rawMaterials || []))
      .subscribe({
        next: (items) => {
          this.rawMaterials = items;
          
          // Map cost prices from branch inventory
          this.inventoryService.getInventory(companyId, '', 'raw_material').subscribe({
            next: (invResp: any) => {
              const invItems = invResp.items || [];
              this.rawMaterials.forEach(rm => {
                const matched = invItems.find((inv: any) => inv.rawMaterial === rm._id || inv.rawMaterial?._id === rm._id);
                if (matched) {
                  rm.costPrice = matched.costPrice;
                }
              });
            }
          });
        },
        error: (err) => {
          console.error('Error fetching raw materials', err);
        }
      });
  }

  get rawMaterialsArray(): FormArray {
    return this.recipeForm.get('rawMaterials') as FormArray;
  }

  loadRecipe(): void {
    this.recipeService.getRecipe(this.recipeId).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          const recipe = response.data;
          this.recipeForm.patchValue({
            name: recipe.name,
            description: recipe.description
          });

          this.rawMaterialsArray.clear();
          if (recipe.ingredients) {
            recipe.ingredients.forEach((ing: any) => {
              this.rawMaterialsArray.push(this.fb.group({
                rawMaterial: [ing.ingredient?._id || ing.ingredient || '', Validators.required],
                quantity: [ing.quantity, [Validators.required, Validators.min(0.0001)]]
              }));
            });
          }
        }
      },
      error: (err) => {
        console.error('Error al cargar la receta:', err);
        Swal.fire('Error', 'No se pudo cargar la receta.', 'error');
      }
    });
  }

  addIngredient(): void {
    this.rawMaterialsArray.push(this.fb.group({
      rawMaterial: ['', Validators.required],
      quantity: [null, [Validators.required, Validators.min(0.0001)]]
    }));
  }

  removeIngredient(index: number): void {
    this.rawMaterialsArray.removeAt(index);
  }

  isIngredientSelected(rawMaterialId: string | undefined, currentIndex: number): boolean {
    if (!rawMaterialId) return false;
    return this.rawMaterialsArray.controls.some((ctrl, i) => {
      if (i === currentIndex) return false;
      return ctrl.get('rawMaterial')?.value === rawMaterialId;
    });
  }

  getIngredientUnit(rawMaterialId: string): string {
    if (!rawMaterialId) return 'u';
    const material = this.rawMaterials.find(m => m._id === rawMaterialId);
    return material ? (material.measurementUnit || 'u') : 'u';
  }

  get recipeTotalCost(): number {
    let total = 0;
    this.rawMaterialsArray.controls.forEach(ctrl => {
      const selectedId = ctrl.get('rawMaterial')?.value;
      const quantity = ctrl.get('quantity')?.value || 0;
      if (selectedId) {
        const material = this.rawMaterials.find(m => m._id === selectedId);
        if (material) {
          total += quantity * (material.costPrice || 0);
        }
      }
    });
    return total;
  }

  onSubmit(): void {
    if (this.recipeForm.invalid) {
      return;
    }

    if (this.rawMaterialsArray.length === 0) {
      Swal.fire('Error', 'La receta debe tener al menos un ingrediente/materia prima.', 'warning');
      return;
    }

    const selectedIds = this.rawMaterialsArray.value.map((rm: any) => rm.rawMaterial);
    const uniqueIds = new Set(selectedIds);
    if (selectedIds.length !== uniqueIds.size) {
      Swal.fire('Error', 'No puedes agregar el mismo ingrediente más de una vez.', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas actualizar la receta con los nuevos ingredientes?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const formVal = this.recipeForm.value;
        const formattedIngredients = (formVal.rawMaterials || []).map((rm: any) => ({
          ingredient: rm.rawMaterial,
          quantity: rm.quantity
        }));

        const updatedRecipe: Partial<Recipe> = {
          name: formVal.name,
          description: formVal.description,
          ingredients: formattedIngredients as any
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
