import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateSuppliersComponent } from './update-suppliers.component';

describe('UpdateSuppliersComponent', () => {
  let component: UpdateSuppliersComponent;
  let fixture: ComponentFixture<UpdateSuppliersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UpdateSuppliersComponent]
    });
    fixture = TestBed.createComponent(UpdateSuppliersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
