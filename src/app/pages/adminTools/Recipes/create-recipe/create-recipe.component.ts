import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RecipesService } from 'src/app/services/recipes.service';
import { AuthService } from 'src/app/services/auth.service';
import { InventoryItem, Recipe } from 'src/app/interfaces/models.interface';
import { InventoryService } from 'src/app/services/inventory.service';
import { RawMaterialsService, RawMaterial } from 'src/app/services/raw-materials.service';
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

  constructor(
    private fb: FormBuilder,
    private recipeService: RecipesService,
    private rawMaterialsService: RawMaterialsService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.createRecipeForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      rawMaterials: this.fb.array([])
    });

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
        },
        error: (err) => {
          console.error('Error fetching raw materials', err);
        }
      });
  }

  get rawMaterialsArray(): FormArray {
    return this.createRecipeForm.get('rawMaterials') as FormArray;
  }

  addIngredient(): void {
    this.rawMaterialsArray.push(this.fb.group({
      rawMaterial: ['', Validators.required],
      quantity: [0, [Validators.required, Validators.min(0.0001)]]
    }));
  }

  removeIngredient(index: number): void {
    this.rawMaterialsArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.createRecipeForm.invalid) {
      return;
    }

    const companyId = this.authService.companyId || this.authService.company?._id;
    if (!companyId) return;

    Swal.fire({
      title: 'Crear Receta',
      text: '¿Estás seguro de crear esta receta?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        const formVal = this.createRecipeForm.value;
        const formattedIngredients = (formVal.rawMaterials || []).map((rm: any) => ({
          ingredient: rm.rawMaterial,
          quantity: rm.quantity
        }));

        const newRecipe = {
          name: formVal.name,
          description: formVal.description,
          ingredients: formattedIngredients,
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
