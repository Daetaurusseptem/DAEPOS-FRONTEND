import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloseCashRegisterComponent } from './close-cash-register.component';

describe('CloseCashRegisterComponent', () => {
  let component: CloseCashRegisterComponent;
  let fixture: ComponentFixture<CloseCashRegisterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CloseCashRegisterComponent]
    });
    fixture = TestBed.createComponent(CloseCashRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
