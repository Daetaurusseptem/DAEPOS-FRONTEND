import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditRawMaterialComponent } from './edit-ingredient.component';

describe('EditRawMaterialComponent', () => {
  let component: EditRawMaterialComponent;
  let fixture: ComponentFixture<EditRawMaterialComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditRawMaterialComponent],
    });
    fixture = TestBed.createComponent(EditRawMaterialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
