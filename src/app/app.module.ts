import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { SliderLeftComponent } from './slider-left.component'
import { SliderRightComponent } from './slider-right.component'
import { SliderComponent } from './slider.component'

import { Utils } from './utils-class';

@NgModule({
  declarations: [
    AppComponent,
    SliderRightComponent,
    SliderLeftComponent,
    SliderComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    HttpModule
  ],
  providers: [Utils],
  bootstrap: [AppComponent]
})
export class AppModule { }
