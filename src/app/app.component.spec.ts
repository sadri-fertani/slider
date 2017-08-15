import { TestBed, async, fakeAsync, tick, ComponentFixture } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormControl, Validators } from '@angular/forms';

import { SliderComponent } from './slider.component'
import { SliderLeftComponent } from './slider-left.component'
import { SliderRightComponent } from './slider-right.component'

import { Utils } from './utils-class';
import { TickClass, PlacementEnum } from './tick-class';

import { AppComponent } from './app.component';
import { SimpleChanges } from "@angular/core/src/metadata/lifecycle_hooks";

describe('AppComponent', () => {

  let fixture: ComponentFixture<AppComponent>
  //browser.waitForAngular();
  beforeEach(async(() => {

    TestBed.configureTestingModule({
      declarations: [AppComponent, SliderComponent, SliderLeftComponent, SliderRightComponent],
      imports: [ReactiveFormsModule, FormsModule],
      providers: [Utils]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  }));

  xit('should create the app', async(() => {
    fixture.detectChanges();
    expect(fixture.debugElement.componentInstance).toBeDefined();
  }));

  xit(`should have a formBuilder`, async(() => {
    fixture.detectChanges();
    expect(fixture.debugElement.componentInstance.fb instanceof FormBuilder).toBe(true);
  }));

  xit('should render title in a h1 tag', async(() => {
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain('Angular Slider');
  }));

  xit('form invalid when empty', async(() => {
    fixture.detectChanges();
    expect(fixture.debugElement.componentInstance.complexForm.valid).toBeTruthy();
  }));

  xit('firstName field validity', () => {
    fixture.detectChanges();
    let firstName = fixture.debugElement.componentInstance.complexForm.controls['firstName'];
    expect(firstName.valid).toBeTruthy();
  });

  xit('us note field validity', () => {
    fixture.detectChanges();
    let noteUS = fixture.debugElement.componentInstance.complexForm.controls['currentVal'];
    expect(noteUS.valid).toBeTruthy();
  });

  xit('intervalle field validity', () => {
    fixture.detectChanges();
    let intervalle = fixture.debugElement.componentInstance.complexForm.controls['currentVal2'];
    expect(intervalle.valid).toBeTruthy();
  });

  it('should click on button', async(() => {
    fixture.detectChanges();

    spyOn(fixture.debugElement.componentInstance, 'submitForm');

    let button = fixture.debugElement.nativeElement.querySelector('button');
    button.click();

    fixture.whenStable().then(() => {
      expect(fixture.debugElement.componentInstance.submitForm).toHaveBeenCalled();
    });
  }));

  it('should test two-way binding by setting value directly on the native element.But that just tests the out-binding', (done) => {
    fixture.detectChanges();

    const app = fixture.debugElement.componentInstance;
    const compiled = fixture.debugElement.nativeElement;

    fixture.debugElement.componentInstance.complexForm.controls['firstName'].setValue('pizza...');

    // let ch: any = { 'firstName': { 'previousValue': 'Sadri', 'currentValue': 'pizza...', 'firstChange': true } };

    // fixture.componentInstance.ngOnChanges(ch);

    fixture.detectChanges();
    
    

    fixture.whenStable().then(() => {
      console.log('FirstName 1 : ', app.firstName);
      console.log('FirstName 2 : ', compiled.querySelector('input').value);
      expect(compiled.querySelector('input').value).toEqual(app.firstName);
    });

    //tick(100);
    //fixture.debugElement.componentInstance.ngOnChanges();

    // compiled.querySelector('input').value = 'Sadri FERTANI...';

    // compiled.querySelector('input').value = 'Sadri FERTANI...';
    // compiled.dispatchEvent(new Event('input'));
    // tick();
    // fixture.detectChanges();
    // fixture.whenStable().then(() => {
    //   console.log('----', app.firstName)

    //   expect(compiled.querySelector('input').value).toEqual(app.firstName);
    // });

    //compiled.querySelector('input').value = 'Sadri FERTANI...';

    //dispatchEvent(compiled.querySelector('input'), 'input');

    //compiled.querySelector('input').dispatchEvent(new Event('input'));
    //tick(50);
    //fixture.detectChanges();

    //console.log('*-*-', app.firstName)
    //fixture.whenStable().then(() => {
    //expect(compiled.querySelector('input').value).toEqual(app.firstName);
    //});


    //compiled.querySelector('currentVal').value = 'D';


  })
});