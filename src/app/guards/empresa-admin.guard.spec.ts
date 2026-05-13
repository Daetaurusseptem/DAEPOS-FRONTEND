import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { empresaAdminGuard } from './empresa-admin.guard';

describe('empresaAdminGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => empresaAdminGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
