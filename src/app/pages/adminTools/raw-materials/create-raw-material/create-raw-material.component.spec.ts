import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateRawMaterialComponent } from './create-ingredient.component';

describe('CreateRawMaterialComponent', () => {
  let component: CreateRawMaterialComponent;
  let fixture: ComponentFixture<CreateRawMaterialComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateRawMaterialComponent],
    });
    fixture = TestBed.createComponent(CreateRawMaterialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
