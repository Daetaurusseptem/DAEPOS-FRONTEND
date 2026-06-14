import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { sysAdminGuard } from './sys-admin.guard';

describe('sysAdminGuard', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => sysAdminGuard(...guardParameters));

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', [], { role: 'sysadmin' });
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('should return true for sysadmin role', () => {
    mockAuthService.role = 'sysadmin';
    const result = executeGuard();
    expect(result).toBeTrue();
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should navigate to /dashboard and return false for non-sysadmin role', () => {
    mockAuthService.role = 'admin';
    const result = executeGuard();
    expect(result).toBeFalse();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('should navigate to /dashboard and return false for user role', () => {
    mockAuthService.role = 'user';
    const result = executeGuard();
    expect(result).toBeFalse();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('should navigate to /dashboard and return false for companyAdmin role', () => {
    mockAuthService.role = 'companyAdmin';
    const result = executeGuard();
    expect(result).toBeFalse();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('should navigate to /dashboard and return false for kitchen role', () => {
    mockAuthService.role = 'kitchen';
    const result = executeGuard();
    expect(result).toBeFalse();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });
});
