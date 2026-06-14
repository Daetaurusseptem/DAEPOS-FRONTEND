import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, timeout } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface PrintRequest {
  content: string;
  printer_type?: string;
}

export interface PaymentRequest {
  amount: number;
  currency?: string;
}

export interface PaymentResponse {
  status: string;
  reference?: string;
  amount?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class HardwareConnectorService {
  private localUrl = environment.hardwareConnectorUrl;

  constructor(private http: HttpClient) {}

  /**
   * Envía un comando de impresión al Local Connector (Python).
   * @param content El contenido del ticket.
   */
  printReceipt(content: string): Observable<any> {
    const payload: PrintRequest = { content, printer_type: 'receipt' };
    return this.http.post(`${this.localUrl}/print`, payload).pipe(
      timeout(10000), // 10 segundos de timeout para impresión
      catchError((error) => {
        console.error('Error al conectar con la impresora local:', error);
        return of({ status: 'error', message: 'No se pudo conectar al Hardware Connector' });
      }),
    );
  }

  /**
   * Inicia un cobro en la Terminal de Pago (TPV) física.
   * @param amount Monto a cobrar.
   */
  chargePayment(amount: number): Observable<PaymentResponse> {
    const payload: PaymentRequest = { amount, currency: 'MXN' };
    return this.http.post<PaymentResponse>(`${this.localUrl}/payment/charge`, payload).pipe(
      timeout(60000), // 60 segundos de espera para que el cliente pase la tarjeta
      catchError((error) => {
        console.error('Error al conectar con la TPV local:', error);
        return of({ status: 'error', message: 'Tiempo de espera agotado o error de conexión' });
      }),
    );
  }

  /**
   * Envía la orden de abrir el cajón de dinero conectado a la impresora.
   */
  openCashDrawer(): Observable<any> {
    return this.http.post(`${this.localUrl}/open-drawer`, {}).pipe(
      timeout(5000), // 5 segundos de timeout
      catchError((error) => {
        console.error('Error al intentar abrir el cajón de dinero:', error);
        return of({ status: 'error', message: 'No se pudo conectar al Hardware Connector' });
      }),
    );
  }
}
