import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserCajasComponent } from './user-cajas.component';

describe('UserCajasComponent', () => {
  let component: UserCajasComponent;
  let fixture: ComponentFixture<UserCajasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserCajasComponent]
    });
    fixture = TestBed.createComponent(UserCajasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
