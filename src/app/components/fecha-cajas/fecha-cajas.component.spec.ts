import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FechaCajasComponent } from './fecha-cajas.component';

describe('FechaCajasComponent', () => {
  let component: FechaCajasComponent;
  let fixture: ComponentFixture<FechaCajasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FechaCajasComponent]
    });
    fixture = TestBed.createComponent(FechaCajasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
