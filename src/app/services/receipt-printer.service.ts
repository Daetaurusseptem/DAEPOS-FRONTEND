import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReceiptPrinterService {
  private apiUrl = 'http://localhost:5000'; // Ajusta esta URL según tu configuración
  private printersKey = 'printers';

  constructor(private http: HttpClient) { }

  printTicket(printerName: string, content: string, paperSize: string): Observable<any> {
    const payload = {
      printer_name: printerName,
      content: content,
      paper_size: paperSize
    };

    return this.http.post(`${this.apiUrl}/print_ticket`, payload);
  }

  setPrinters(printers: any[]) {
    localStorage.setItem(this.printersKey, JSON.stringify(printers));
  }

  getPrinters(): any[] {
    const printers = localStorage.getItem(this.printersKey);
    return printers ? JSON.parse(printers) : [];
  }

  getDefaultPrinter(type: 'ticket' | 'comanda'): any | null {
    const printers = this.getPrinters();
    return printers.find(printer => printer.default && printer.type === type) || null;
  }

  setDefaultPrinter(name: string, type: 'ticket' | 'comanda') {
    const printers = this.getPrinters();
    printers.forEach(printer => {
      if (printer.name === name && printer.type === type) {
        printer.default = true;
      } else if (printer.type === type) {
        printer.default = false;
      }
    });
    this.setPrinters(printers);
  }
}
