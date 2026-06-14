import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import { adminGuard } from './admin-guard.guard';

describe('adminGuard', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockLogger: jasmine.SpyObj<LoggerService>;

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => adminGuard(...guardParameters));

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', [], { role: 'admin' });
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);
    mockLogger = jasmine.createSpyObj('LoggerService', ['log', 'warn', 'error']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: LoggerService, useValue: mockLogger },
      ],
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('should return true for admin role', () => {
    mockAuthService.role = 'admin';
    const result = executeGuard();
    expect(result).toBeTrue();
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should return true for sysadmin role', () => {
    mockAuthService.role = 'sysadmin';
    const result = executeGuard();
    expect(result).toBeTrue();
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should return true for companyAdmin role', () => {
    mockAuthService.role = 'companyAdmin';
    const result = executeGuard();
    expect(result).toBeTrue();
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should navigate to /dashboard and return false for user role', () => {
    mockAuthService.role = 'user';
    const result = executeGuard();
    expect(result).toBeFalse();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('should navigate to /login and return false for unknown role', () => {
    mockAuthService.role = 'unknown';
    const result = executeGuard();
    expect(result).toBeFalse();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('should log the role', () => {
    mockAuthService.role = 'admin';
    executeGuard();
    expect(mockLogger.log).toHaveBeenCalledWith('admin');
  });
});
