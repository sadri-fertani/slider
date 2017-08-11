import { Component, AfterViewInit, ElementRef, Renderer2, ViewChild, HostListener } from '@angular/core';

export abstract class SliderSide {
    public width: number;
    public height: number;

    @ViewChild('content')
    public content: ElementRef;

    @HostListener('mousedown', ['$event'])
    onMousedown(event) {
        // Arreter la propagation de l'évenemnt, pour éviter le déplacement du pointeur
        event.stopPropagation();
    }

    constructor(public elementRef: ElementRef, public rendered: Renderer2) {
        // R.A.S
    }

    ngAfterViewInit(): void {
        let dimension = this.content.nativeElement.getBoundingClientRect();
        this.width = dimension.width;
        this.height = dimension.height;
        // console.log('---------');
        // console.log(this.constructor.name);
        // console.log(dimension);
        // console.log('---------');
    }

    setPosition(verticalDirection: boolean, offset: number) {
        this.rendered.setStyle(this.content.nativeElement, verticalDirection ? 'top' : 'left', String(offset) + 'px');
    }

    setTranslatePosition(verticalDirection: boolean, offset: number): void {
        if(!verticalDirection) {
            this.rendered.setStyle(this.content.nativeElement, verticalDirection ? 'left' : 'top', '-' + Number(this.height + 10) + 'px');
        }        
        this.rendered.setStyle(this.content.nativeElement, 'transform', verticalDirection ? 'translateY(' : 'translateX(' + String(offset) + 'px)');
    }
}