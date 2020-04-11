import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileLinkStatusComponent } from './profile-link-status.component';

describe('ProfileLinkStatusComponent', () => {
  let component: ProfileLinkStatusComponent;
  let fixture: ComponentFixture<ProfileLinkStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProfileLinkStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileLinkStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
