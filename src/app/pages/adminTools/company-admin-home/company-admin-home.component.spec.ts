import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyAdminHomeComponent } from './company-admin-home.component';

describe('CompanyAdminHomeComponent', () => {
  let component: CompanyAdminHomeComponent;
  let fixture: ComponentFixture<CompanyAdminHomeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CompanyAdminHomeComponent]
    });
    fixture = TestBed.createComponent(CompanyAdminHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
