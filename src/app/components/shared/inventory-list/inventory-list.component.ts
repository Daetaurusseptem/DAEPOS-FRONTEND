import { Component, Input, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { Product, UserRole } from 'src/app/interfaces/models.interface';
import { ProductService } from 'src/app/services/product.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'items-list',
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.css']
})
export class InventoryListComponent implements OnInit {

  @Input() items: Product[] = [];
  userRole!: UserRole;

  constructor(
    private authService: AuthService,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.getUserRole();
  }

  getUserRole(): void {
    this.userRole = this.authService.role;
  }

  eliminarProduct(productId: string | undefined) {
    if (!productId) {
      Swal.fire('Error', 'El ID del producto no es válido', 'error');
      return;
    }
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará permanentemente el producto.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.productService.deleteProduct(productId).subscribe({
          next: () => {
            Swal.fire(
              'Producto eliminado',
              'El producto ha sido eliminado.',
              'success'
            );
            this.items = this.items.filter(item => item._id !== productId);
          },
          error: (error) => {
            console.error('Error deleting product:', error);
            Swal.fire(
              'Error al eliminar',
              'Hubo un problema al eliminar el producto.',
              'error'
            );
          }
        });
      }
    });
  }
}
