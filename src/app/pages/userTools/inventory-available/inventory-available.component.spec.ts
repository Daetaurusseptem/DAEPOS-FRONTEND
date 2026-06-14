import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryAvailableComponent } from './inventory-available.component';

describe('InventoryAvailableComponent', () => {
  let component: InventoryAvailableComponent;
  let fixture: ComponentFixture<InventoryAvailableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InventoryAvailableComponent],
    });
    fixture = TestBed.createComponent(InventoryAvailableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
