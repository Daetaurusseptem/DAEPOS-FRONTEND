import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { InventoryResponse } from 'src/app/interfaces/InventoryResponse.interface';
import { AuthService } from './auth.service';
import { Recipe } from '../interfaces/models.interface';

@Injectable({
  providedIn: 'root',
})
export class RecipesService {
  private urlRecipes = `${environment.apiUrl}/recipes`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  createRecipe(recipeData: any, companyId: string): Observable<any> {
    return this.http.post<any>(`${this.urlRecipes}/${companyId}`, recipeData);
  }

  getRecipes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlRecipes}`);
  }

  consumeIngredients(recipeId: string, quantity: number): Observable<any> {
    return this.http.post<any>(`${this.urlRecipes}/consume`, { recipeId, quantity });
  }
  getRecipe(id: string) {
    return this.http.get<InventoryResponse>(`${this.urlRecipes}/recipe/${id}`, this.authService.headers);
  }

  getAllRecipes() {
    return this.http.get<InventoryResponse>(`${this.urlRecipes}`, this.authService.headers);
  }

  getCompanyRecipes(companyId: string) {
    return this.http.get<InventoryResponse>(`${this.urlRecipes}/${companyId}`, this.authService.headers);
  }

  deleteRecipe(id: string) {
    return this.http.delete<InventoryResponse>(`${this.urlRecipes}/${id}`, this.authService.headers);
  }

  updateRecipe(id: string, recipe: Recipe) {
    return this.http.put<InventoryResponse>(`${this.urlRecipes}/update/${id}`, recipe, this.authService.headers);
  }
}
