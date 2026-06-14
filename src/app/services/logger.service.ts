import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private get isDev(): boolean {
    return !environment.production;
  }

  log(...args: unknown[]): void {
    if (this.isDev) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.isDev) {
      console.warn(...args);
    }
  }

  error(...args: unknown[]): void {
    console.error(...args);
  }

  debug(...args: unknown[]): void {
    if (this.isDev) {
      // eslint-disable-next-line no-console
      console.debug(...args);
    }
  }
}
