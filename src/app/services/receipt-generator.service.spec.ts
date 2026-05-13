import { TestBed } from '@angular/core/testing';

import { ReceiptGeneratorService } from './receipt-generator.service';

describe('ReceiptGeneratorService', () => {
  let service: ReceiptGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReceiptGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
