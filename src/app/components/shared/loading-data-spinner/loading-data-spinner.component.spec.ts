import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingDataSpinnerComponent } from './loading-data-spinner.component';

describe('LoadingDataSpinnerComponent', () => {
  let component: LoadingDataSpinnerComponent;
  let fixture: ComponentFixture<LoadingDataSpinnerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LoadingDataSpinnerComponent]
    });
    fixture = TestBed.createComponent(LoadingDataSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
