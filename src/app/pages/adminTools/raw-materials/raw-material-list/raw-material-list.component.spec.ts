import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RawMaterialListComponent } from './ingredient-list.component';

describe('RawMaterialListComponent', () => {
  let component: InventoryListComponent;
  let fixture: ComponentFixture<RawMaterialListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RawMaterialListComponent]
    });
    fixture = TestBed.createComponent(RawMaterialListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
