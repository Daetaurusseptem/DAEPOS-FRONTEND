import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Customer } from 'src/app/interfaces/models.interface';
import { CustomerService } from 'src/app/services/customer.service';
import { AuthService } from 'src/app/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-customers-list',
  templateUrl: './customers-list.component.html',
  styleUrls: ['./customers-list.component.css']
})
export class CustomersListComponent implements OnInit {
  customers: Customer[] = [];
  companyId: string = '';
  searchTerm: string = '';
  page: number = 1;
  limit: number = 10;
  totalCustomers: number = 0;
  isLoading: boolean = false;

  // Selected customer details
  selectedCustomer: any = null;
  customerSalesHistory: any[] = [];
  isLoadingDetails: boolean = false;

  // Create / Edit modal
  showModal: boolean = false;
  isEditMode: boolean = false;
  customerForm!: FormGroup;
  editingCustomerId: string = '';

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private authService: AuthService
  ) {
    this.companyId = this.authService.companyId || (this.authService.company as any)?._id || '';
  }

  ngOnInit(): void {
    this.initForm();
    this.loadCustomers();
  }

  initForm() {
    this.customerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.pattern(/^\d{10}$/)]],
      cardNumber: [''],
      email: ['', [Validators.email]],
      rfc: [''],
      loyaltyPoints: [0, [Validators.min(0)]]
    });
  }

  loadCustomers() {
    this.isLoading = true;
    this.customerService.getCustomers(this.companyId, this.searchTerm, this.page, this.limit).subscribe({
      next: (resp) => {
        if (resp.ok) {
          this.customers = resp.customers;
          this.totalCustomers = resp.total;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        Swal.fire('Error', 'No se pudieron obtener los clientes.', 'error');
      }
    });
  }

  onSearch(term: string) {
    this.searchTerm = term;
    this.page = 1;
    this.loadCustomers();
  }

  onPageChange(page: number) {
    this.page = page;
    this.loadCustomers();
  }

  openCreateModal() {
    this.isEditMode = false;
    this.editingCustomerId = '';
    this.customerForm.reset({
      name: '',
      phone: '',
      cardNumber: '',
      email: '',
      rfc: '',
      loyaltyPoints: 0
    });
    this.showModal = true;
  }

  openEditModal(customer: Customer) {
    this.isEditMode = true;
    this.editingCustomerId = customer._id || '';
    this.customerForm.patchValue({
      name: customer.name,
      phone: customer.phone || '',
      cardNumber: customer.cardNumber || '',
      email: customer.email || '',
      rfc: (customer as any).rfc || '',
      loyaltyPoints: customer.loyaltyPoints || 0
    });
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  onSubmitCustomer() {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    const customerData = this.customerForm.value;
    if (this.isEditMode) {
      this.customerService.updateCustomer(this.editingCustomerId, customerData).subscribe({
        next: (resp) => {
          if (resp.ok) {
            Swal.fire('Éxito', 'Cliente actualizado correctamente.', 'success');
            this.closeModal();
            this.loadCustomers();
            if (this.selectedCustomer && this.selectedCustomer._id === this.editingCustomerId) {
              this.viewCustomerDetails(this.selectedCustomer);
            }
          }
        },
        error: (err) => {
          Swal.fire('Error', err.error?.message || 'No se pudo actualizar el cliente.', 'error');
        }
      });
    } else {
      this.customerService.createCustomer(customerData, this.companyId).subscribe({
        next: (resp) => {
          if (resp.ok) {
            Swal.fire('Éxito', 'Cliente creado correctamente.', 'success');
            this.closeModal();
            this.loadCustomers();
          }
        },
        error: (err) => {
          Swal.fire('Error', err.error?.message || 'No se pudo crear el cliente.', 'error');
        }
      });
    }
  }

  viewCustomerDetails(customer: Customer) {
    this.isLoadingDetails = true;
    this.selectedCustomer = customer;
    this.customerSalesHistory = [];
    
    this.customerService.getCustomerDetails(customer._id!).subscribe({
      next: (resp) => {
        if (resp.ok) {
          this.selectedCustomer = resp.customer;
          this.customerSalesHistory = resp.salesHistory || [];
        }
        this.isLoadingDetails = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoadingDetails = false;
        Swal.fire('Error', 'No se pudieron cargar los detalles del cliente.', 'error');
      }
    });
  }

  closeDetails() {
    this.selectedCustomer = null;
    this.customerSalesHistory = [];
  }

  toggleCustomerStatus(customer: Customer) {
    const nextStatus = !customer.isActive;
    Swal.fire({
      title: `¿Estás seguro?`,
      text: `Vas a ${nextStatus ? 'activar' : 'desactivar'} al cliente ${customer.name}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Sí, ${nextStatus ? 'activar' : 'desactivar'}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.customerService.updateCustomer(customer._id!, { isActive: nextStatus }).subscribe({
          next: () => {
            Swal.fire('Éxito', `Cliente ${nextStatus ? 'activado' : 'desactivado'} con éxito.`, 'success');
            this.loadCustomers();
          },
          error: (err) => {
            Swal.fire('Error', 'No se pudo cambiar el estado del cliente.', 'error');
          }
        });
      }
    });
  }
}
