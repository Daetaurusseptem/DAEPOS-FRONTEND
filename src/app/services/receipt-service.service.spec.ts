import { TestBed } from '@angular/core/testing';

import { ReceiptServiceService } from './receipt-service.service';

describe('ReceiptServiceService', () => {
  let service: ReceiptServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReceiptServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
