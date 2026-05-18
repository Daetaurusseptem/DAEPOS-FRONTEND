import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Branch } from 'src/app/interfaces/models.interface';
import { BranchService } from 'src/app/services/branch.service';
import { AuthService } from 'src/app/services/auth.service';
import { UsersService } from 'src/app/services/users.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-branch-form',
  templateUrl: './branch-form.component.html',
  styleUrls: ['./branch-form.component.css']
})
export class BranchFormComponent implements OnInit {
  branchForm!: FormGroup;
  isEdit = false;
  branchId: string = '';
  admins: any[] = [];
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private branchService: BranchService,
    private authService: AuthService,
    private userService: UsersService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadAdmins();

    this.branchId = this.route.snapshot.params['id'];
    if (this.branchId) {
      this.isEdit = true;
      this.loadBranch();
    }
  }

  initForm() {
    this.branchForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', Validators.required],
      tel: [''],
      email: ['', [Validators.email]],
      manager: [''],
      saleType: ['retail', Validators.required],
      isActive: [true]
    });
  }

  loadAdmins() {
    const companyId = this.authService.company?._id || '';
    this.userService.getAllUsersOfCompany(companyId).subscribe({
      next: (resp) => {
        // Filter only admins
        if (resp && resp.users) {
          this.admins = resp.users.filter((u: any) => u.role === 'admin');
        }
      }
    });
  }

  loadBranch() {
    this.isLoading = true;
    this.branchService.getBranchById(this.branchId).subscribe({
      next: (resp) => {
        const branch = resp.branch;
        this.branchForm.patchValue({
          name: branch.name,
          address: branch.address,
          tel: branch.tel,
          email: branch.email,
          manager: branch.manager ? (typeof branch.manager === 'object' ? (branch.manager as any)._id : branch.manager) : '',
          saleType: branch.saleType,
          isActive: branch.isActive
        });
        this.isLoading = false;
      },
      error: () => {
        Swal.fire('Error', 'No se pudo cargar la sucursal', 'error');
        this.router.navigate(['/dashboard/admin/branches']);
      }
    });
  }

  onSubmit() {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }

    const branchData: Branch = {
      ...this.branchForm.value,
      company: this.authService.company?._id || ''
    };

    if (this.isEdit) {
      this.branchService.updateBranch(this.branchId, branchData).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Sucursal actualizada correctamente', 'success');
          this.router.navigate(['/dashboard/admin/branches']);
        },
        error: (err) => {
          Swal.fire('Error', 'No se pudo actualizar la sucursal', 'error');
        }
      });
    } else {
      this.branchService.createBranch(branchData).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Sucursal creada correctamente', 'success');
          this.router.navigate(['/dashboard/admin/branches']);
        },
        error: (err) => {
          Swal.fire('Error', 'No se pudo crear la sucursal', 'error');
        }
      });
    }
  }
}
