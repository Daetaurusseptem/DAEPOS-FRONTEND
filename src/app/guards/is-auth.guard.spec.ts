import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import { isAuthGuard } from './is-auth.guard';

describe('isAuthGuard', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockLogger: jasmine.SpyObj<LoggerService>;

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => isAuthGuard(...guardParameters));

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['validarToken']);
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

  it('should return true when token is valid', (done) => {
    mockAuthService.validarToken.and.returnValue(of(true));

    executeGuard().subscribe((result) => {
      expect(result).toBeTrue();
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
      done();
    });
  });

  it('should navigate to login and return false when token is invalid', (done) => {
    mockAuthService.validarToken.and.returnValue(of(false));

    executeGuard().subscribe((result) => {
      expect(result).toBeFalse();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/login');
      done();
    });
  });

  it('should call validarToken on authService', (done) => {
    mockAuthService.validarToken.and.returnValue(of(true));

    executeGuard().subscribe(() => {
      expect(mockAuthService.validarToken).toHaveBeenCalledTimes(1);
      done();
    });
  });
});
