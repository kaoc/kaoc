import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KaocHistoryComponent } from './kaoc-history.component';

describe('KaocHistoryComponent', () => {
  let component: KaocHistoryComponent;
  let fixture: ComponentFixture<KaocHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KaocHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KaocHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
