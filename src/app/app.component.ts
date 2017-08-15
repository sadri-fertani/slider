import { Component, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None
})

export class AppComponent {

  complexForm: FormGroup;
  stepsArray: Array<string>;
  fnColor: Function;
  firstName: string;
  alphaVal: string;
  minVal: number;
  maxVal: number;

  constructor(public fb: FormBuilder) {
    this.stepsArray = 'SADRI'.split('');

    this.fnColor = function (value1) {
      if (['A', 'E', 'I', 'O', 'U', 'Y'].includes(value1))
        return 'purple';
      else
        return 'yellow';
    };

    this.firstName = 'Sadri';
    this.alphaVal = 'D';
    this.minVal = 2;
    this.maxVal = 8;

    this.createForm();
  }

  createForm() {
    this.complexForm = this.fb.group({
      firstName: [this.firstName, Validators.required],
      currentVal: [{ Vmin: this.alphaVal }, Validators.required],
      currentVal2: [{ Vmin: this.minVal, Vmax: this.maxVal }, Validators.required]
    });
  }

  submitForm(value: any) {
    console.log(value);
    this.complexForm.reset();
  }

  //stepsArray2: string[] = 'INATREF IRDAS'.split('');

  // Data for sample #01
  Vmin1 = 'B';
  visible1 = true;
  stepsArray1: Array<string> = 'ABCDEF'.split('');
  fnColor1 = function (value1) {
    if (['A', 'E', 'I', 'O', 'U', 'Y'].includes(value1))
      return 'red';
    else
      return 'yellow';
  };

  // Data for sample #02
  minVal2 = 3;

  // Data for sample #03
  minVal3 = 2;
  maxVal3 = 7;

  // Data for sample #04
  minVal4 = 'S';
  stepsArray4 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  fnColor4 = function (value1) {
    if (['S', 'A', 'D', 'R', 'I', 'F', 'E', 'T', 'N'].includes(value1))
      return 'red';
    else
      return 'yellow';
  };

  // Data for sample #05
  minVal5 = 20;
  CustomScale5 = function (val, minVal, maxVal) {
    val = Math.sqrt(val);
    minVal = Math.sqrt(minVal);
    maxVal = Math.sqrt(maxVal);

    return (val - minVal) / (maxVal - minVal);
  }

  // Data for sample #06
  minVal60 = 6;
  minVal61 = 8;

  // Data for sample #07
  minVal7 = 0.3;

  // Data for sample #08
  minVal8 = 4;
  maxVal8 = 7;
  minRange8 = 2;

  // Data for sample #09
  minVal9 = 1;
  maxVal9 = 5;
  maxRange9 = 5;

  // Data for sample #10
  minVal10 = 6;
  maxVal10 = 9;
  minRange10 = 2;
  maxRange10 = 5;

  // Data for sample #11
  minVal11 = 6;

  // Data for sample #12
  minVal12 = 3;
  legendStepsArray12 = [
    {
      value: -4,
      legend: 'Very poor'
    },

    {
      value: -2,
      legend: 'Fair'
    },

    {
      value: 0,
      legend: 'Average'
    },

    {
      value: 2,
      legend: 'Good'
    },

    {
      value: 4,
      legend: 'Excellent'
    }
  ];

  // Data for sample #13
  minVal13 = 6;
  step131 = 2;
  step132 = 3;
  step133 = 4;

  // Data for sample #14
  minVal14 = 7;
  fnColor14 = function (value1, value2) {
    if (value2 != undefined) {
      value1 = Math.abs(value1 - value2);
    }
    if (value1 <= 3)
      return 'red';
    if (value1 <= 6)
      return 'orange';
    if (value1 <= 9)
      return 'yellow';

    return '#2AE02A';
  };

  // Data for sample #15
  minVal15 = 6;
  fnColor15 = function (value1, value2) {
    if (value2 != undefined) {
      value1 = Math.abs(value1 - value2);
    }
    if (value1 <= 3)
      return 'red';
    if (value1 <= 6)
      return 'orange';
    if (value1 <= 9)
      return 'yellow';

    return '#2AE02A';
  };

  // Data for sample #16
  minVal16 = 3;
  maxVal16 = 7;
  fnColor16 = function (value1, value2) {
    if (value2 != undefined) {
      value1 = Math.abs(value1 - value2);
    }
    if (value1 <= 3)
      return 'red';
    if (value1 <= 6)
      return 'orange';
    if (value1 <= 9)
      return 'yellow';

    return '#2AE02A';
  };

  // Data for sample #17
  minVal17 = 8;
  barGradiant17 = {
    from: 'white',
    to: 'purple'
  };

  // Data for sample #18
  minVal18 = 8;
  disabled18 = true;
  readOnly18 = false;

  // Data for sample #19
  minVal19 = 3;
  maxVal19 = 7;
  disabled19 = true;
  readOnly19 = false;
}