import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CajaDetailComponent } from './caja-detail.component';

describe('CajaDetailComponent', () => {
  let component: CajaDetailComponent;
  let fixture: ComponentFixture<CajaDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CajaDetailComponent]
    });
    fixture = TestBed.createComponent(CajaDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
