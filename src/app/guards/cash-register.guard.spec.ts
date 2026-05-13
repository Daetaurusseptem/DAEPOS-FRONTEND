import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { cashRegisterGuard } from './cash-register.guard';

describe('cashRegisterGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => cashRegisterGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
