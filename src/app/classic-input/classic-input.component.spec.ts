import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassicInputComponent } from './classic-input.component';

describe('ClassicInputComponent', () => {
  let component: ClassicInputComponent;
  let fixture: ComponentFixture<ClassicInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClassicInputComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassicInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
