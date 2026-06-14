import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateInventoryComponent } from './update-item.component';

describe('UpdateInventoryComponent', () => {
  let component: UpdateInventoryComponent;
  let fixture: ComponentFixture<UpdateInventoryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UpdateInventoryComponent],
    });
    fixture = TestBed.createComponent(UpdateInventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
