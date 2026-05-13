import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { sysadminGuard } from './sysadmin.guard';

describe('sysadminGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => sysadminGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
