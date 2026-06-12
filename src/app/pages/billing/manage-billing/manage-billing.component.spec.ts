import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageBillingComponent } from './manage-billing.component';

describe('ManageBillingComponent', () => {
  let component: ManageBillingComponent;
  let fixture: ComponentFixture<ManageBillingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ManageBillingComponent]
    });
    fixture = TestBed.createComponent(ManageBillingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
