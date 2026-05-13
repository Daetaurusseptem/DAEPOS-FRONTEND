import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { InventoryResponse } from 'src/app/interfaces/InventoryResponse.interface';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Category } from '../interfaces/models.interface';
const urlCategories = `${environment.apiUrl}/categories`
@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(
                private http:HttpClient,
                private authService:AuthService,
                ) { }
  getCategories() {
    return this.http.get<InventoryResponse>(`${urlCategories}`,
    this.authService.headers 
    );
  };
  getCategoryById(id:string) {
    return this.http.get<InventoryResponse>(`${urlCategories}/${id}`,
    this.authService.headers 
    );
  };
  getNumberOfCompanyCategories() {
    return this.http.get<InventoryResponse>(`${urlCategories}/number`,
    this.authService.headers 
    );
  };
  getCompanyCategories(id:string) {
    
    return this.http.get<InventoryResponse>(`${urlCategories}/company/${id}`, this.authService.headers);
  }

  getCompanyCategoriesPaginated(id:string, page:number) {
    return this.http.get<InventoryResponse>(`${urlCategories}/company/${id}?page=${page}`, this.authService.headers);
  };
  deleteCategory(id:string){
    return this.http.delete<InventoryResponse>(`${urlCategories}/${id}`, this.authService.headers);
  }
  
  updateCategory(id:string, formData:FormData) {
    console.log(`las;kdj;aklsjdlkasjdl;kajsdlkasjd;lkasj`);
    return this.http.put<InventoryResponse>(`${urlCategories}/${id}`, formData, this.authService.headers );
  };

  createCategory(category:Category, empresaId:string){
    
    return this.http.post<InventoryResponse>(`${urlCategories}/${empresaId}`, category, this.authService.headers);
  };
}
