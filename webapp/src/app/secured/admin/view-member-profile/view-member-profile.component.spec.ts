import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewMemberProfileComponent } from './view-member-profile.component';

describe('ViewMemberProfileComponent', () => {
  let component: ViewMemberProfileComponent;
  let fixture: ComponentFixture<ViewMemberProfileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewMemberProfileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewMemberProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
