import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoggerService } from './logger.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReceiptGeneratorService {
  private apiUrl = environment.hardwareConnectorUrl;

  constructor(private http: HttpClient, private logger: LoggerService) {}

  printTicket(printerName: string, content: string): Observable<any> {
    const payload = {
      printer_name: printerName,
      content: content,
    };
    this.logger.log(payload);
    return this.http.post(`${this.apiUrl}/print_ticket`, payload);
  }

  generateReceiptContent(sale: any, companyInfo: any, userInfo: any): string {
    const header = `
      ${companyInfo.name}
      ${companyInfo.address}
      Email: ${companyInfo.email}
      Website: ${companyInfo.website}
    `;

    const orderDetails = `
      Order Number: ${sale._id}
      Date: ${new Date(sale.date).toLocaleDateString()}
      User: ${userInfo.name}
      Email: ${userInfo.email}
    `;

    let productLines = 'Qty   Product                                Total\n';
    productLines += '--------------------------------------------------\n';
    sale.productsSold.forEach((product: any) => {
      productLines += `${product.quantity}     ${product.productName}                             $${(product.unitPrice * product.quantity).toFixed(2)}\n`;
    });

    const footer = `
      --------------------------------------------------
      Total: $${sale.total.toFixed(2)}
      Payment Method: ${sale.paymentMethod}
      ${sale.paymentMethod === 'credit' ? `Payment Reference: ${sale.paymentReference}` : ''}
      Received Amount: $${sale.receivedAmount ? sale.receivedAmount.toFixed(2) : 'N/A'}
      Change: $${sale.change ? sale.change.toFixed(2) : 'N/A'}
    `;

    return `${header}\n${orderDetails}\n${productLines}\n${footer}`;
  }
}
