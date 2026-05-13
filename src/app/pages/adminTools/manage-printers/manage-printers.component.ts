import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReceiptPrinterService } from 'src/app/services/receipt-printer.service';

@Component({
  selector: 'app-manage-printers',
  templateUrl: './manage-printers.component.html',
  styleUrls: ['./manage-printers.component.css']
})
export class ManagePrintersComponent implements OnInit {
  printersForm!: FormGroup;
  printers: any[] = [];

  constructor(
    private fb: FormBuilder,
    private receiptPrinterService: ReceiptPrinterService
  ) {}

  ngOnInit(): void {
    this.printersForm = this.fb.group({
      name: ['', Validators.required],
      paperSize: ['', Validators.required],
      type: ['', Validators.required]
    });
    this.loadPrinters();
  }

  loadPrinters() {
    this.printers = this.receiptPrinterService.getPrinters();
  }

  addPrinter() {
    if (this.printersForm.valid) {
      const newPrinter = this.printersForm.value;
      this.printers.push(newPrinter);
      this.receiptPrinterService.setPrinters(this.printers);
      this.printersForm.reset();
    }
  }

  setDefaultPrinter(name: string, type: 'ticket' | 'comanda') {
    this.receiptPrinterService.setDefaultPrinter(name, type);
    this.loadPrinters();
  }

  deletePrinter(index: number) {
    this.printers.splice(index, 1);
    this.receiptPrinterService.setPrinters(this.printers);
  }
}
