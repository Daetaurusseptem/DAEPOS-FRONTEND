import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyUsersComponent } from './user-list.component';

describe('CompanyUsersComponent', () => {
  let component: CompanyUsersComponent;
  let fixture: ComponentFixture<CompanyUsersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CompanyUsersComponent]
    });
    fixture = TestBed.createComponent(CompanyUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
