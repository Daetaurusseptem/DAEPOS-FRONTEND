import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsaleComponent } from './newsale.component';

describe('NewsaleComponent', () => {
  let component: NewsaleComponent;
  let fixture: ComponentFixture<NewsaleComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NewsaleComponent]
    });
    fixture = TestBed.createComponent(NewsaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
