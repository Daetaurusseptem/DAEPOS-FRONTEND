import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { Category, InventoryItem } from 'src/app/interfaces/models.interface';
import { AuthService } from 'src/app/services/auth.service';
import { CategoryService } from 'src/app/services/category.service';
import { InventoryService } from 'src/app/services/inventory.service';
import { SalesService } from 'src/app/services/sales.service';

@Component({
  selector: 'app-newsale',
  templateUrl: './newsale.component.html',
  styleUrls: ['./newsale.component.css']
})
export class NewsaleComponent {

  searchForm!: FormGroup;
  items: any[] = [];
  categories: any[] = [];
  selectedCategory: string = '';
  cart: any[] = [];
  total: number = 0;
  currentPage: number = 1;
  totalPages: number = 1;
  search: string = '';
  companyId?: string;
  availableExclusiveModifications: any[] = [];
  selectedExclusiveModification: any | null = null;
  availableNonExclusiveModifications: any[] = [];
  selectedNonExclusiveModifications: any[] = [];
  selectedQuantity: number = 1;
  selectedItem: any | null = null;
  posMode: 'retail' | 'hospitality' = 'retail'; // Nuevo: Modo de interfaz

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private categoryService: CategoryService,
    private saleService: SalesService,
    private authService: AuthService,
    private router: Router,
  ) {
    if (this.authService.role == 'user') {
      this.companyId = authService.companyId!;
    } else {
      this.companyId = authService.company?._id!;
    }
  }

  ngOnInit(): void {
    // Initialize POS mode from company settings
    if (this.authService.company && this.authService.company.saleType) {
      this.posMode = this.authService.company.saleType;
    }

    this.searchForm = this.fb.group({
      search: ['']
    });
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCompanyCategories(this.companyId!)
      .pipe(map(r => r.categories!))
      .subscribe((data: Category[]) => {
        this.categories = data;
        if (this.categories.length > 0) {
          this.selectedCategory = this.categories[0]._id!;
          this.loadItems();
        }
      });
  }

  loadItems(): void {
    if (!this.selectedCategory && !this.search) {
      this.items = [];
      this.totalPages = 1;
      return;
    }
  
    this.inventoryService.getInventoryByCategory(this.selectedCategory, this.search, this.currentPage)
      .pipe(map(r => { console.log('ItemResp: ', r); return r; }))
      .subscribe({
        next: (data) => {
          this.items = (data.items || []).filter((item: any) => item.stock > 0);
          this.totalPages = data.totalPages || 1;
        },
        error: (error) => {
          console.error('Error fetching items:', error);
          this.items = [];
          this.totalPages = 1;
        }
      });
  } 

  searchItems(): void {
    this.currentPage = 1;
    this.search = this.searchForm.get('search')?.value;
    this.selectedCategory = '';
    this.loadItems();
  }

  handleSearchEnter(event: Event): void {
    if (this.posMode === 'retail' && this.items.length === 1) {
      event.preventDefault();
      this.addToCart(this.items[0]);
      this.searchForm.reset();
      this.search = '';
      this.loadItems();
    }
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.currentPage = 1;
    this.searchForm.reset();
    this.search = '';
    this.loadItems();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadItems();
  }

  addToCart(item: any): void {
    if (this.selectedQuantity <= 0) {
      return;
    }

    const quantity = item.quantity || 1;
    if (quantity <= 0) {
      return;
    }

    const existingItem = this.cart.find(p =>
      p.item.product?._id === item.product?._id &&
      this.areVariationsEqual(p, this.selectedExclusiveModification, this.selectedNonExclusiveModifications)
    );

    const itemPrice = item.sellingPrice || item.costPrice || 0;
    const modificationsPrice = this.calculateModificationsPrice(this.selectedExclusiveModification, this.selectedNonExclusiveModifications);

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.total += (itemPrice + modificationsPrice) * quantity;
    } else {
      this.cart.push({
        item,
        quantity,
        total: (itemPrice + modificationsPrice) * quantity,
        exclusiveModification: this.selectedExclusiveModification,
        nonExclusiveModifications: [...this.selectedNonExclusiveModifications],
        product: (item.product as any)?._id
      });
    }
    this.calculateTotal();
    this.clearModifications();
  }

  addToCartWithModifications(): void {
    if (this.selectedQuantity <= 0 || !this.selectedItem) {
      return;
    }

    const existingItem = this.cart.find(p =>
      p.item._id === this.selectedItem._id &&
      this.areVariationsEqual(p, this.selectedExclusiveModification, this.selectedNonExclusiveModifications)
    );

    const itemPrice = this.selectedItem.sellingPrice || this.selectedItem.costPrice || 0;
    const itemPriceWithModifications = itemPrice + this.calculateModificationsPrice(this.selectedExclusiveModification, this.selectedNonExclusiveModifications);

    if (existingItem) {
      existingItem.quantity += this.selectedQuantity;
      existingItem.total += itemPriceWithModifications * this.selectedQuantity;
    } else {
      this.cart.push({
        item: this.selectedItem,
        quantity: this.selectedQuantity,
        total: itemPriceWithModifications * this.selectedQuantity,
        exclusiveModification: this.selectedExclusiveModification,
        nonExclusiveModifications: [...this.selectedNonExclusiveModifications],
        product: this.selectedItem._id
      });
    }

    this.calculateTotal();
    this.selectedItem = null;
    this.clearModifications();
    this.selectedQuantity = 1;
  }

  calculateModificationsPrice(exclusive: any | null, nonExclusive: any[]): number {
    let price = 0;
    if (exclusive) {
      price += exclusive.extraPrice;
    }
    nonExclusive.forEach(mod => {
      price += mod.extraPrice;
    });
    return price;
  }

  areVariationsEqual(cartItem: any, exclusive: any | null, nonExclusive: any[]): boolean {
    const sameExclusive = cartItem.exclusiveModification?._id === exclusive?._id;
    const sameNonExclusive = JSON.stringify((cartItem.nonExclusiveModifications || []).map((mod: any) => mod._id).sort()) === JSON.stringify(nonExclusive.map(mod => mod._id).sort());
    return sameExclusive && sameNonExclusive;
  }

  calculateTotal(): void {
    this.total = this.cart.reduce((sum, item) => sum + item.total, 0);
  }

  removeFromCart(item: any): void {
    const index = this.cart.indexOf(item);
    if (index !== -1) {
      this.cart.splice(index, 1);
      this.calculateTotal();
    }
  }

  loadModifications(item: any): void {
    this.selectedItem = item;
    this.availableExclusiveModifications = (item.modifications || []).filter((mod: any) => mod.isExclusive);
    this.availableNonExclusiveModifications = (item.modifications || []).filter((mod: any) => !mod.isExclusive);
    this.selectedExclusiveModification = null;
    this.selectedNonExclusiveModifications = [];
  }

  addExclusiveModification(modification: any): void {
    if (this.selectedExclusiveModification) {
      this.availableExclusiveModifications.push(this.selectedExclusiveModification);
    }
    this.selectedExclusiveModification = modification;
    this.availableExclusiveModifications = this.availableExclusiveModifications.filter((mod: any) => mod._id !== modification._id);
  }

  addNonExclusiveModification(modification: any): void {
    const index = this.availableNonExclusiveModifications.findIndex(mod => mod._id === modification._id);
    if (index !== -1) {
      this.availableNonExclusiveModifications.splice(index, 1);
      this.selectedNonExclusiveModifications.push(modification);
    }
  }

  removeNonExclusiveModification(modification: any): void {
    const index = this.selectedNonExclusiveModifications.findIndex(mod => mod._id === modification._id);
    if (index !== -1) {
      this.selectedNonExclusiveModifications.splice(index, 1);
      this.availableNonExclusiveModifications.push(modification);
    }
  }

  clearModifications(): void {
    this.availableExclusiveModifications = [];
    this.selectedExclusiveModification = null;
    this.availableNonExclusiveModifications = [];
    this.selectedNonExclusiveModifications = [];
  }

  removeExclusiveModification(): void {
    if (this.selectedExclusiveModification) {
      this.availableExclusiveModifications.push(this.selectedExclusiveModification);
      this.selectedExclusiveModification = null;
    }
  }

  checkout(): void {
    if (this.cart.length <= 0) {
      return;
    }

    const saleData = {
      user: this.authService.usuario.id,
      total: this.total,
      discount: 0,
      productsSold: this.cart.map(entry => ({
        product: entry.item.product?._id || entry.item._id,
        name: entry.item.name,
        quantity: entry.quantity,
        unitPrice: entry.item.sellingPrice || entry.item.costPrice || 0,
        subtotal: entry.total,
        categories: entry.item.product?.categories || [],
        modifications: [
          ...(entry.exclusiveModification ? [entry.exclusiveModification] : []),
          ...(entry.nonExclusiveModifications || [])
        ]
      }))
    };

    this.router.navigate(['dashboard/user/new-sale/confirm-sale'], { state: { sale: saleData } });
  }

  incrementQuantity(item: any): void {
    if (!item.quantity) {
      item.quantity = 1;
    }
    item.quantity++;
  }

  decrementQuantity(item: any): void {
    if (item.quantity && item.quantity > 1) {
      item.quantity--;
    }
  }

  incrementQuantityModSelected(): void {
    this.selectedQuantity++;
  }

  decrementQuantityModSelected(): void {
    if (this.selectedQuantity > 1) {
      this.selectedQuantity--;
    }
  }

  navigateBackHome(): void {
    this.router.navigate(['/dashboard/user']);
  }

  setPosMode(mode: 'retail' | 'hospitality'): void {
    this.posMode = mode;
    // En modo retail, podríamos querer resetear filtros para ver todo más compacto
    if (mode === 'retail') {
      this.selectedItem = null;
    }
  }

}
