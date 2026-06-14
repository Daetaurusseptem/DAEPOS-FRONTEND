import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingVerificationsComponent } from './pending-verifications.component';

describe('PendingVerificationsComponent', () => {
  let component: PendingVerificationsComponent;
  let fixture: ComponentFixture<PendingVerificationsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PendingVerificationsComponent]
    });
    fixture = TestBed.createComponent(PendingVerificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
