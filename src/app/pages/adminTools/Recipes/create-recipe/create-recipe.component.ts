import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RecipesService } from 'src/app/services/recipes.service';
import { AuthService } from 'src/app/services/auth.service';
import { RawMaterialsService, RawMaterial } from 'src/app/services/raw-materials.service';
import { InventoryService } from 'src/app/services/inventory.service';
import { map } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-recipe',
  templateUrl: './create-recipe.component.html',
  styleUrls: ['./create-recipe.component.css']
})
export class CreateRecipeComponent implements OnInit {
  createRecipeForm!: FormGroup;
  rawMaterials: RawMaterial[] = [];
  collapsedSizes: boolean[] = [];

  constructor(
    private fb: FormBuilder,
    private recipeService: RecipesService,
    private rawMaterialsService: RawMaterialsService,
    private inventoryService: InventoryService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.createRecipeForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      sizes: this.fb.array([])
    });

    // Add a default size
    this.addSize('Único', 0);

    this.loadRawMaterials();
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

  get sizesArray(): FormArray {
    return this.createRecipeForm.get('sizes') as FormArray;
  }

  addSize(name: string = '', priceModifier: number = 0): void {
    const ingredientsArray = new FormArray<any>([]);
    
    // Si ya existe al menos un tamaño, clonar sus ingredientes para arrancar desde ahí
    if (this.sizesArray && this.sizesArray.length > 0) {
      const firstSizeIngredients = this.getIngredientsArray(0);
      firstSizeIngredients.controls.forEach(ctrl => {
        ingredientsArray.push(this.fb.group({
          rawMaterial: [ctrl.get('rawMaterial')?.value || '', Validators.required],
          quantity: [ctrl.get('quantity')?.value || null, [Validators.required, Validators.min(0.0001)]]
        }));
      });
    }

    this.sizesArray.push(this.fb.group({
      name: [name, Validators.required],
      priceModifier: [priceModifier, [Validators.required, Validators.min(0)]],
      ingredients: ingredientsArray
    }));
    this.collapsedSizes.push(false);
  }

  removeSize(index: number): void {
    if (this.sizesArray.length > 1) {
      this.sizesArray.removeAt(index);
      this.collapsedSizes.splice(index, 1);
    } else {
      Swal.fire('Atención', 'La receta debe tener al menos un tamaño.', 'warning');
    }
  }

  toggleCollapse(index: number): void {
    this.collapsedSizes[index] = !this.collapsedSizes[index];
  }

  getIngredientsArray(sizeIndex: number): FormArray {
    return this.sizesArray.at(sizeIndex).get('ingredients') as FormArray;
  }

  addIngredient(sizeIndex: number): void {
    this.getIngredientsArray(sizeIndex).push(this.fb.group({
      rawMaterial: ['', Validators.required],
      quantity: [null, [Validators.required, Validators.min(0.0001)]]
    }));
  }

  removeIngredient(sizeIndex: number, ingredientIndex: number): void {
    this.getIngredientsArray(sizeIndex).removeAt(ingredientIndex);
  }

  isIngredientSelected(sizeIndex: number, rawMaterialId: string | undefined, currentIndex: number): boolean {
    if (!rawMaterialId) return false;
    return this.getIngredientsArray(sizeIndex).controls.some((ctrl, i) => {
      if (i === currentIndex) return false;
      return ctrl.get('rawMaterial')?.value === rawMaterialId;
    });
  }

  getRecipeTotalCost(sizeIndex: number): number {
    let total = 0;
    this.getIngredientsArray(sizeIndex).controls.forEach(ctrl => {
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

  getIngredientUnit(rawMaterialId: string): string {
    if (!rawMaterialId) return 'u';
    const material = this.rawMaterials.find(m => m._id === rawMaterialId);
    return material ? (material.measurementUnit || 'u') : 'u';
  }

  onSubmit(): void {
    if (this.createRecipeForm.invalid) {
      Swal.fire('Error', 'Por favor completa todos los campos requeridos.', 'warning');
      return;
    }

    if (this.sizesArray.length === 0) {
      Swal.fire('Error', 'La receta debe tener al menos un tamaño.', 'warning');
      return;
    }

    let hasEmptyIngredients = false;
    this.sizesArray.controls.forEach(sizeCtrl => {
      const ingredients = sizeCtrl.get('ingredients') as FormArray;
      if (ingredients.length === 0) {
        hasEmptyIngredients = true;
      }
    });

    if (hasEmptyIngredients) {
      Swal.fire('Error', 'Cada tamaño debe tener al menos un ingrediente.', 'warning');
      return;
    }

    const companyId = this.authService.companyId || this.authService.company?._id;
    if (!companyId) return;

    Swal.fire({
      title: 'Crear Receta',
      text: '¿Estás seguro de crear esta receta con sus tamaños configurados?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        const formVal = this.createRecipeForm.value;
        
        const formattedSizes = formVal.sizes.map((size: any, idx: number) => ({
          name: size.name,
          priceModifier: idx === 0 ? 0 : size.priceModifier,
          ingredients: size.ingredients.map((rm: any) => ({
            ingredient: rm.rawMaterial,
            quantity: rm.quantity
          }))
        }));

        const newRecipe = {
          name: formVal.name,
          description: formVal.description,
          sizes: formattedSizes,
          company: companyId
        };
        
        this.recipeService.createRecipe(newRecipe, companyId).subscribe({
          next: (resp) => {
            Swal.fire('Receta creada', 'La receta ha sido creada correctamente.', 'success');
            this.router.navigateByUrl('/dashboard/admin/recipes');
          },
          error: (error) => {
            console.error('Error al crear la receta', error);
            Swal.fire('Error', 'Hubo un error al crear la receta.', 'error');
          }
        });
      }
    });
  }
}
