import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlphanumericKeyboardComponent } from './alphanumeric-keyboard.component';

describe('AlphanumericKeyboardComponent', () => {
  let component: AlphanumericKeyboardComponent;
  let fixture: ComponentFixture<AlphanumericKeyboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AlphanumericKeyboardComponent]
    });
    fixture = TestBed.createComponent(AlphanumericKeyboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
