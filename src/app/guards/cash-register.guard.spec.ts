import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { CashRegisterService } from '../services/cash-register.service';
import { cashRegisterGuard } from './cash-register.guard';

describe('cashRegisterGuard', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockCashRegisterService: jasmine.SpyObj<CashRegisterService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => cashRegisterGuard(...guardParameters));

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', [], { usuario: { id: 'user-123' } });
    mockCashRegisterService = jasmine.createSpyObj('CashRegisterService', ['hasOpenCashRegister']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: CashRegisterService, useValue: mockCashRegisterService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('should return true when no open cash register', (done) => {
    mockCashRegisterService.hasOpenCashRegister.and.returnValue(of(false));

    executeGuard().subscribe((result) => {
      expect(result).toBeTrue();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(mockCashRegisterService.hasOpenCashRegister).toHaveBeenCalledWith('user-123');
      done();
    });
  });

  it('should navigate to /dashboard/user/home and return false when cash register is open', (done) => {
    mockCashRegisterService.hasOpenCashRegister.and.returnValue(of(true));

    executeGuard().subscribe((result) => {
      expect(result).toBeFalse();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/user/home']);
      expect(mockCashRegisterService.hasOpenCashRegister).toHaveBeenCalledWith('user-123');
      done();
    });
  });

  it('should call hasOpenCashRegister with correct userId', (done) => {
    mockAuthService.usuario.id = 'different-user-456';
    mockCashRegisterService.hasOpenCashRegister.and.returnValue(of(false));

    executeGuard().subscribe(() => {
      expect(mockCashRegisterService.hasOpenCashRegister).toHaveBeenCalledWith('different-user-456');
      done();
    });
  });
});
