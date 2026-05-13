import { CanActivateFn } from '@angular/router';

export const sysadminGuard: CanActivateFn = (route, state) => {
  return true;
};
