import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashRegisterComponent } from './cash-register.component';

describe('CashRegisterComponent', () => {
  let component: CashRegisterComponent;
  let fixture: ComponentFixture<CashRegisterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CashRegisterComponent]
    });
    fixture = TestBed.createComponent(CashRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
