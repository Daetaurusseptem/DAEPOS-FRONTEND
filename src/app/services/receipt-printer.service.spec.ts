import { TestBed } from '@angular/core/testing';

import { ReceiptPrinterService } from './receipt-printer.service';

describe('ReceiptPrinterService', () => {
  let service: ReceiptPrinterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReceiptPrinterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
