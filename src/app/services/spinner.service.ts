import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {
  private _loading = new BehaviorSubject<boolean>(false);

  get loading$() {
    return this._loading.asObservable();
  }

  show() {
    this._loading.next(true);
  }

  hide() {
    this._loading.next(false);
  }
}
