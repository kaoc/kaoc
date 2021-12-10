import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminFunctionsComponent } from './admin-functions.component';

describe('AdminFunctionsComponent', () => {
  let component: AdminFunctionsComponent;
  let fixture: ComponentFixture<AdminFunctionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminFunctionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminFunctionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
