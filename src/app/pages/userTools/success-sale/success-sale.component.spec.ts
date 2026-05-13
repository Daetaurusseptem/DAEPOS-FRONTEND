import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuccessSaleComponent } from './success-sale.component';

describe('SuccessSaleComponent', () => {
  let component: SuccessSaleComponent;
  let fixture: ComponentFixture<SuccessSaleComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SuccessSaleComponent]
    });
    fixture = TestBed.createComponent(SuccessSaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
