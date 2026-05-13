import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagePrintersComponent } from './manage-printers.component';

describe('ManagePrintersComponent', () => {
  let component: ManagePrintersComponent;
  let fixture: ComponentFixture<ManagePrintersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ManagePrintersComponent]
    });
    fixture = TestBed.createComponent(ManagePrintersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
