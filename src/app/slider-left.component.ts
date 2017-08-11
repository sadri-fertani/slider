import { Component, ElementRef, Renderer2 } from '@angular/core';
import { SliderSide } from "app/slider-side";

@Component({
    moduleId: module.id,
    selector: 'ei-slider-left',
    templateUrl: './slider-side.html',
    styleUrls: ['./slider.component.css']
})

export class SliderLeftComponent extends SliderSide {
    constructor(public elementRef: ElementRef, public rendered: Renderer2) {
        super(elementRef, rendered);
    }
}