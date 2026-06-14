import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BulkImportComponent } from './bulk-import.component';

describe('BulkImportComponent', () => {
  let component: BulkImportComponent;
  let fixture: ComponentFixture<BulkImportComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BulkImportComponent],
    });
    fixture = TestBed.createComponent(BulkImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
