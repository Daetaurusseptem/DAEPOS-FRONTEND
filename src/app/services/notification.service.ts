import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

const urlBase = `${environment.apiUrl}/notifications`;

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  getMyNotifications(): Observable<any> {
    return this.http.get<any>(`${urlBase}`, this.authService.headers);
  }

  markAsRead(id: string): Observable<any> {
    return this.http.put<any>(`${urlBase}/${id}/read`, {}, this.authService.headers);
  }

  markAllAsRead(): Observable<any> {
    return this.http.put<any>(`${urlBase}/read-all`, {}, this.authService.headers);
  }
}
