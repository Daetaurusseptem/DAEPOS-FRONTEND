import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCompanyCategoryComponent } from './create-company-category.component';

describe('CreateCompanyCatregoryComponent', () => {
  let component: CreateCompanyCategoryComponent;
  let fixture: ComponentFixture<CreateCompanyCategoryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateCompanyCategoryComponent]
    });
    fixture = TestBed.createComponent(CreateCompanyCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
