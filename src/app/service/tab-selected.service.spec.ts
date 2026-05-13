import { TestBed } from '@angular/core/testing';

import { TabSelectedService } from './tab-selected.service';

describe('TabSelectedService', () => {
  let service: TabSelectedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TabSelectedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
