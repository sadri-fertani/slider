import { Component, NgZone, ElementRef, forwardRef, ChangeDetectorRef, EventEmitter, ChangeDetectionStrategy, AfterViewInit, OnInit, OnDestroy, ViewChild, Input, Output, Renderer2, HostBinding, HostListener, ContentChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NG_VALIDATORS, Validator, AbstractControl } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import "rxjs/add/observable/fromEvent";
import 'rxjs/add/operator/takeUntil';
import "rxjs/add/operator/takeWhile";
import 'rxjs/add/operator/throttle';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/toPromise';

import { TickClass, PlacementEnum } from './tick-class';

import { Utils } from './utils-class';
import { SliderLeftComponent } from "./slider-left.component";
import { SliderRightComponent } from "./slider-right.component";

@Component({
    moduleId: module.id,
    selector: 'ei-slider',
    templateUrl: './slider.component.html',
    styleUrls: ['./slider.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SliderComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => SliderComponent),
            multi: true,
        }
    ]
})

export class SliderComponent implements AfterViewInit, OnInit, OnDestroy, ControlValueAccessor, Validator {
    private isError: boolean;
    private data: any;
    private propagateChange = (_: any) => { };

    private alive: boolean = true;
    private selectedCursor: string;
    private lastEvent: MouseEvent;

    private moveMouseSlider$: Observable<MouseEvent>;
    private mouseDown: boolean = false;

    private leftPointeurSelected: boolean = false;
    private rightPointeurSelected: boolean = false;

    private memoryBeginDrag: number;

    private isRTL: boolean;
    private isRange: boolean;
    private MinRange: number;
    private MaxRange: number;
    private isDragable: boolean;
    private isDisabled: boolean;
    private isReadOnly: boolean;
    private isVisible: boolean;
    private isVertical: boolean;
    private ticksVisible: boolean;
    private stepIntermediateTick: number;
    private ticksValuesVisible: boolean;
    private selectionBarVisible: boolean;
    private currentValueVisible: boolean;
    private VminValue: number;
    private VmaxValue: number;
    private stepCalculated: number;
    private step: number;
    private logScale: boolean;
    private ticks: Array<any> = [];
    private positionInitiale: number;
    private transcludeLeft: boolean;
    private transcludeRight: boolean;

    validate(c: AbstractControl): { [key: string]: any; } {
        return (!this.isError) ? null : {
            jsonParseError: {
                valid: false,
            },
        };
    }

    writeValue(obj: any): void {
        if (obj) {
            this.Vmin = obj.Vmin;
            this.Vmax = obj.Vmax;

            this.data = {
                Vmin: this.Vmin,
                Vmax: this.Vmax
            };
        }
    }

    registerOnChange(fn: any): void {
        this.propagateChange = fn;
    }

    registerOnTouched(fn: any): void {
        //throw new Error('Method not implemented.');
    }

    setDisabledState(isDisabled: boolean): void {
        //throw new Error('Method not implemented.');
    }

    get SelectedCursor() {
        return this.selectedCursor;
    }

    set SelectedCursor(val) {
        if (this.selectedCursor == val) return;
        this.selectedCursor = val;
    }

    @Output()
    VminChange = new EventEmitter();

    @Output()
    VmaxChange = new EventEmitter();

    @Input()
    get Vmin() {
        return this.VminValue;
    }

    set Vmin(val) {
        if (this.VminValue == val) return;
        if (!this.disabled && !this.readOnly) {
            // switch
            if ((this.Vmax != undefined) && (val > this.Vmax)) {
                // range
                setTimeout(() => { this.Vmax = val; }, 0);
            }

            if (val < this.Min) {
                setTimeout(() => {
                    this.Vmin = this.Min;
                    this.VminChange.emit(this.VminValue);
                }, 0);
                return;
            }

            if (val > this.Max) {
                setTimeout(() => {
                    this.Vmin = this.Max;
                    this.VminChange.emit(this.VminValue);
                }, 0);
                return;
            }

            if (this.isRange) {
                // max range
                if (this.Vmax - val > this.maxRange) return;
                // min range
                if (this.Vmax - val < this.minRange) return;
            }

            this.VminValue = val;

            if ((this.ticks.length > 0) && (this.ticks.findIndex(x => x.value == val) != -1)) {
                this.setPointerPosition(this.pointerMin);
                this.updateSelectedTick();
                if (this.selectionBarVisible) {
                    this.animateBarSelection();
                }

                // transclude zone
                if (this.transcludeLeft || this.transcludeRight) {
                    this.updateTranscludePosition();
                }

                this.data = {
                    Vmin: this.Vmin,
                    Vmax: this.Vmax
                };

                this.isError = false;
                this.VminChange.emit(this.VminValue);

                // Supprimer l'erreur visuelle
                this.removeIHMError(this.pointerMin);
            } else {
                // Ajout de l'erreur
                this.isError = this.isError || !this.checkValidity();
                // Ajout de l'erreur visuelle
                this.addIHMError(this.pointerMin);
            }

            // update the form
            this.propagateChange(this.data);
        }
    }

    @Input()
    get Vmax() {
        return this.VmaxValue;
    }

    set Vmax(val) {
        if (this.VmaxValue == val) return;

        if (!this.disabled && !this.readOnly) {
            // switch
            if (val < this.Vmin) {
                setTimeout(() => { this.Vmin = val; }, 0);
            }

            // limit left
            if (val < this.Min) {
                setTimeout(() => {
                    this.Vmax = this.Min;
                    this.VmaxChange.emit(this.VmaxValue);
                }, 0);
                return;
            }

            // limit right
            if (val > this.Max) {
                setTimeout(() => {
                    this.Vmax = this.Max;
                    this.VmaxChange.emit(this.VmaxValue);
                }, 0);
                return;
            }

            // max range
            if (val - this.Vmin > this.maxRange) return;
            // min range
            if (val - this.Vmin < this.minRange) return;

            this.VmaxValue = val;

            if (this.ticks.length > 0 && this.ticks.findIndex(x => x.value == val) != -1) {
                this.setPointerPosition(this.pointerMax);
                this.updateSelectedTick();
                if (this.selectionBarVisible) {
                    this.animateBarSelection();
                }
                if (this.transcludeLeft || this.transcludeRight) {
                    this.updateTranscludePosition();
                }

                this.data = {
                    Vmin: this.Vmin,
                    Vmax: this.Vmax
                };

                this.isError = false;

                this.VmaxChange.emit(this.VmaxValue);

                // Supprimer l'erreur visuelle
                this.removeIHMError(this.pointerMax);
            } else {
                // Ajout de l'erreur
                this.isError = this.isError || !this.checkValidity();

                // Ajout de l'erreur visuelle
                this.addIHMError(this.pointerMax);
            }
            // update the form
            this.propagateChange(this.data);
        }
    }

    @Input()
    private selectionBarGradient: any;

    @Input()
    private selectionBarColor: Function;

    @Input()
    private tickColor: Function;

    @Input()
    private Min: number;

    @Input()
    private Max: number;

    @Input()
    private CustomScalePercent: Function;

    @Input()
    private legendStepsArray: Array<any>;

    @Input()
    private stepsArray: Array<any>;

    @Input()
    get minRange() {
        return this.MinRange;
    }

    set minRange(val) {
        if (this.MinRange == val) return;
        this.MinRange = Number(val);
    }

    @Input()
    get maxRange() {
        return this.MaxRange;
    }

    set maxRange(val) {
        if (this.MaxRange == val) return;
        this.MaxRange = Number(val);
    }

    @Input()
    get Step() {
        if (this.step == undefined) return 1;
        return this.step;
    }

    set Step(val) {
        if (this.step == val) return;
        this.step = Number(val);
    }

    @Input()
    get disabled() {
        return this.isDisabled;
    }

    set disabled(val) {
        if (this.isDisabled == val) return;

        this.isDisabled = this.Util.toBoolean(val);
        this.updateDisabledState();
    }

    @Input()
    get visible() {
        if (this.isVisible == undefined) return true;

        return this.isVisible;
    }

    set visible(val) {
        if (this.isVisible == val) return;

        this.isVisible = this.Util.toBoolean(val);
    }

    @Input()
    get LogScale() {
        return this.logScale;
    }

    set LogScale(val) {
        if (this.logScale == val) return;

        this.logScale = this.Util.toBoolean(val);
    }

    @Input()
    get readOnly() {
        return this.isReadOnly;
    }

    set readOnly(val) {
        if (this.isReadOnly == val) return;

        this.isReadOnly = this.Util.toBoolean(val);
    }

    @Input()
    get vertical() {
        return this.isVertical;
    }

    set vertical(val) {
        if (this.isVertical == val) return;
        this.isVertical = this.Util.toBoolean(val);
    }

    @Input()
    get showTicks() {
        return this.ticksVisible;
    }

    set showTicks(val) {
        if (this.ticksVisible == val) return;

        this.ticksVisible = this.Util.toBoolean(val);
    }

    @Input()
    get intermediateTicks() {
        return this.stepIntermediateTick;
    }

    set intermediateTicks(val) {
        if (this.stepIntermediateTick == val) return;

        this.stepIntermediateTick = Number(val);
    }

    @Input()
    get showTicksValues() {
        return this.ticksValuesVisible;
    }

    set showTicksValues(val) {
        if (this.ticksValuesVisible == val) return;
        this.ticksValuesVisible = this.Util.toBoolean(val);
    }

    @Input()
    get showCurrentValue() {
        return this.currentValueVisible;
    }

    set showCurrentValue(val) {
        if (this.currentValueVisible == val) return;
        this.currentValueVisible = this.Util.toBoolean(val);
    }

    @Input()
    get showSelectionBar() {
        return this.selectionBarVisible;
    }

    set showSelectionBar(val) {
        if (this.selectionBarVisible == val) return;
        this.selectionBarVisible = this.Util.toBoolean(val);
    }

    @Input()
    get rtl() {
        return this.isRTL;
    }

    set rtl(val) {
        if (this.isRTL == val) return;
        this.isRTL = this.Util.toBoolean(val);
    }

    @Input()
    get Range() {
        return this.isRange;
    }

    set Range(val) {
        if (this.isRange == val) return;
        this.isRange = this.Util.toBoolean(val);
    }

    @ViewChild('slider')
    private slider: ElementRef;

    @ViewChild('pointerMin')
    private pointerMin: ElementRef;

    @ViewChild('pointerMax')
    private pointerMax: ElementRef;

    @ViewChild('sliderBarWrapper1')
    private sliderBarWrapper1: ElementRef;

    @ViewChild('bar1')
    private bar1: ElementRef;

    @ViewChild('sliderBarWrapper2')
    private sliderBarWrapper2: ElementRef;

    @ViewChild('bar2')
    private bar2: ElementRef;

    @ViewChild('floor')    // min
    private floor: ElementRef;

    @ViewChild('ceil')    // max
    private ceil: ElementRef;

    @ViewChild('currentBubbleMin')    // bubble min : afficher la valeur en-dessus du pointeur de sélection
    private currentBubbleMin: ElementRef;

    @ViewChild('currentBubbleMax')    // bubble min : afficher la valeur en-dessus du pointeur de sélection
    private currentBubbleMax: ElementRef;

    @ContentChild(SliderLeftComponent)
    private leftContent: SliderLeftComponent;

    @ContentChild(SliderRightComponent)
    private rightContent: SliderRightComponent;

    @HostListener('mouseup', ['$event'])
    onMouseup(event: MouseEvent) {
        this.mouseDown = false;
        if (this.lastEvent != undefined && this.lastEvent.type == 'mousedown') {
            this.pointerMove(event);
        }

        this.lastEvent = event;
    }

    @HostListener('mousemove', ['$event'])
    onMousemove(event: MouseEvent) {

        if (this.mouseDown == true && (event.movementX != 0 || event.movementY != 0)) {
            if (this.lastEvent.type == 'mousemove') {
                if (this.isDragable) {
                    const deplacement: number = Math.round(((this.vertical ? event.y : event.x) - this.memoryBeginDrag) / this.stepCalculated);

                    if (deplacement != 0) {
                        if ((this.Vmax + (this.rtl ? -1 * deplacement : deplacement) <= Number(this.Max)) && (this.Vmin + (this.rtl ? -1 * deplacement : deplacement) >= Number(this.Min))) {
                            this.Vmin += this.rtl ? -1 * deplacement : deplacement;
                            this.Vmax += this.rtl ? -1 * deplacement : deplacement;

                            this.memoryBeginDrag = this.vertical ? event.y : event.x;
                        }
                    }
                } else {
                    this.pointerMove(event);
                }
            }

            this.lastEvent = event;
        }
    }

    @HostListener('mousedown', ['$event'])
    onMousedown(event) {
        this.mouseDown = true;
        this.lastEvent = event;

        if (this.isDragable) {
            this.memoryBeginDrag = this.vertical ? event.y : event.x;
        }

        if (event.target.className.indexOf('rz-pointer-min') != -1) { this.leftPointeurSelected = true; this.rightPointeurSelected = false; }
        if (event.target.className.indexOf('rz-pointer-max') != -1) { this.rightPointeurSelected = true; this.leftPointeurSelected = false; }
    }

    @HostListener('window:keydown', ['$event'])
    keyboardInput(event: KeyboardEvent) {
        if (this.leftPointeurSelected || this.rightPointeurSelected) {
            let coefSens: number = (((this.rtl) && (!this.vertical)) || ((!this.rtl) && (this.vertical))) ? -1 : 1;

            let indexLeftPointeur: number = this.ticks.findIndex(x => x.value == this.Vmin);
            let indexRightPointeur: number = this.ticks.findIndex(x => x.value == this.Vmax);

            switch (event.key) {
                case "ArrowUp":
                case "ArrowRight":
                    if (this.leftPointeurSelected) {
                        if ((indexLeftPointeur + coefSens < this.ticks.length) && (indexLeftPointeur + coefSens >= 0)) {
                            this.Vmin = this.ticks[indexLeftPointeur + coefSens].value;
                        }
                    } else {
                        if ((indexRightPointeur + coefSens < this.ticks.length) && (indexRightPointeur + coefSens >= 0)) {
                            this.Vmax = this.ticks[indexRightPointeur + coefSens].value;
                        }
                    }

                    event.stopImmediatePropagation();
                    event.preventDefault();
                    break;
                case "ArrowDown":
                case "ArrowLeft":
                    if (this.leftPointeurSelected) {
                        if ((indexLeftPointeur - coefSens < this.ticks.length) && (indexLeftPointeur - coefSens >= 0)) {
                            this.Vmin = this.ticks[indexLeftPointeur - coefSens].value;
                        }
                    } else {
                        if ((indexRightPointeur - coefSens < this.ticks.length) && (indexRightPointeur - coefSens >= 0)) {
                            this.Vmax = this.ticks[indexRightPointeur - coefSens].value;
                        }
                    }

                    event.stopImmediatePropagation();
                    event.preventDefault();
                    break;
            }
        }
    }

    checkValidity(): boolean {
        if (this.stepsArray != undefined) {
            if (this.stepsArray.findIndex(x => x == this.Vmin) == -1) return false;
        }

        return true;
    }

    constructor(private elementRef: ElementRef, private ngZone: NgZone, private rendered: Renderer2, private Util: Utils, private ref: ChangeDetectorRef) {
        const $resizeEvent = Observable.fromEvent(window, 'resize')
            .map(() => {
                return document.documentElement.clientWidth;
            }).throttle(ev => Observable.interval(30)).distinctUntilChanged()

        $resizeEvent.subscribe(data => {
            console.log('--resize--');
            this.ticks = [];

            this.updateIHM();

            this.ref.markForCheck();
        });

    }

    ngOnDestroy(): void {
        this.alive = false;
        this.moveMouseSlider$.subscribe().unsubscribe();
    }

    ngOnInit(): void {
        this.isDragable = this.isRange;
        console.log("Range : ", this.isRange);
        console.log('maxRange : ', this.maxRange);
        console.log("Vertical : ", this.vertical);
        console.log("Ticks visible : ", this.showTicks);
        console.log("Intermediate ticks : ", this.intermediateTicks);
        console.log("Disabled : ", this.disabled);
        console.log('LogScale : ', this.LogScale);
        console.log('CustomScalePercent : ', this.CustomScalePercent);
        console.log('StepArray : ', this.stepsArray);
        console.log('LegendStepArray : ', this.legendStepsArray);
        console.log('Step : ', this.Step);

        this.transcludeLeft = this.leftContent != undefined;
        this.transcludeRight = this.rightContent != undefined;
    }

    addIHMError(el: ElementRef): void {
        this.rendered.removeClass(el.nativeElement, "rz-pointer");
        this.rendered.addClass(el.nativeElement, "rz-pointer-error");
    }

    removeIHMError(el: ElementRef): void {
        this.rendered.removeClass(el.nativeElement, "rz-pointer-error");
        this.rendered.addClass(el.nativeElement, "rz-pointer");
    }

    updateIHM(): void {
        // Calcul des ticks
        this.calculateTicks();

        let leftCurrentTick = this.ticks.find(t => t.value == this.Vmin);
        let rightCurrentTick = this.ticks.find(t => t.value == this.Vmax);

        // positionner le pointeur min
        if (leftCurrentTick != undefined) {
            this.setPointerPosition(this.pointerMin);
            // Supprimer l'erreur visuelle
            this.removeIHMError(this.pointerMin);
        } else {
            this.addIHMError(this.pointerMin);
        }

        // positionner le pointeur max, si nécessaire
        if (this.isRange && rightCurrentTick != undefined) {
            this.setPointerPosition(this.pointerMax);
            // Supprimer l'erreur visuelle
            this.removeIHMError(this.pointerMax);
        } else {
            this.addIHMError(this.pointerMax);
        }

        // positionner ceil & floor (Min & Max)
        this.setLimitPosition(this.floor, this.ticks[0]);
        this.setLimitPosition(this.ceil, this.ticks[this.ticks.length - 1]);

        if ((leftCurrentTick != undefined) && ((this.isRange && rightCurrentTick != undefined) || !this.isRange)) {
            // animer/colorer la bar, si nécessaire
            if (this.showSelectionBar) this.animateBarSelection();
            // transclude zone
            if (this.transcludeLeft) this.updateTranscludePosition();
        }
    }

    ngAfterViewInit(): void {
        this.moveMouseSlider$ = Observable.fromEvent(this.elementRef.nativeElement, 'mouseleave');
        this.moveMouseSlider$ = this.moveMouseSlider$.throttle(ev => Observable.interval(3)).distinctUntilChanged().takeWhile(() => this.alive);
        this.moveMouseSlider$.subscribe(() => {
            this.mouseDown = false;
            this.leftPointeurSelected = false;
            this.rightPointeurSelected = false;
            this.SelectedCursor = undefined;
        }
        );

        if (this.vertical) {
            this.positionInitiale = this.pointerMin.nativeElement.getBoundingClientRect().top + this.pointerMin.nativeElement.getBoundingClientRect().height / 2 + window.scrollY;
        } else {
            this.positionInitiale = this.pointerMin.nativeElement.getBoundingClientRect().left + this.pointerMin.nativeElement.getBoundingClientRect().width / 2 + window.scrollX;
        }

        console.log("positionInitiale : ", this.positionInitiale);

        this.updateIHM();
    }

    getLogarithmicScalePercent(value: number, min: number, max: number): number {
        if (this.rtl) {
            return (Math.log(max / value)) / (Math.log(max / min));
        } else {
            return (Math.log(value / min)) / (Math.log(max / min));
        }
    }

    getScalePosition(value: number): number {
        let percentPosition: number;

        if (this.LogScale) {
            percentPosition = this.getLogarithmicScalePercent(value, this.Min, this.Max);
        } else {
            percentPosition = this.CustomScalePercent(value, this.Min, this.Max);
        }

        return (this.vertical ?
            this.sliderBarWrapper1.nativeElement.getBoundingClientRect().height * percentPosition :
            this.sliderBarWrapper1.nativeElement.getBoundingClientRect().width * percentPosition);
    }

    createScaleTick(value: number): TickClass {
        const tick: TickClass = new TickClass();

        tick.value = value;

        tick.translate = {
            X: this.vertical ? 0 : this.getScalePosition(value),
            Y: this.vertical ? this.getScalePosition(value) : 0
        };

        if (this.vertical) {
            tick.style = 'translateY' + '(' + Number(tick.translate.Y) + 'px)';
        } else {
            tick.style = 'translateX' + '(' + Number(tick.translate.X) + 'px)';
        }

        tick.visible = true;

        return tick;
    }

    calculateTicks(): void {
        if ((this.LogScale) || (this.CustomScalePercent != undefined)) {
            if (this.rtl) {
                for (var value = Number(this.Max); value >= Number(this.Min); value -= this.Step) {
                    this.ticks.push(this.createScaleTick(value));
                }
            } else {
                for (var value = Number(this.Min); value <= Number(this.Max); value += this.Step) {
                    this.ticks.push(this.createScaleTick(value));
                }
            }
        } else {
            const nbreTicks: number = this.stepsArray != undefined ? this.stepsArray.length : (this.Max - this.Min) / this.Step + 1;//Math.ceil((this.Max - this.Min) / this.Step) + 1;

            if (this.vertical) {
                this.stepCalculated = Math.round(this.sliderBarWrapper1.nativeElement.getBoundingClientRect().height / (nbreTicks - 1));
            } else {
                this.stepCalculated = Math.round(this.sliderBarWrapper1.nativeElement.getBoundingClientRect().width / (nbreTicks - 1));
            }

            console.log('stepCalculated : ', this.stepCalculated);
            console.log('nbreTicks : ', Math.ceil(nbreTicks));

            if (this.stepsArray != undefined) {
                let stepsArray = this.stepsArray.slice();   // Je ne veux pas écraser le tableau originale à cause du resize
                if (this.rtl) {
                    stepsArray.reverse();
                }

                for (let position in stepsArray) {
                    this.ticks.push(this.createTick(Number(position), this.stepCalculated, nbreTicks));
                }

            } else {
                for (let position = 0; position < nbreTicks; position++) {
                    this.ticks.push(this.createTick(position, this.stepCalculated, nbreTicks));
                }
            }
        }
    }

    getRealPosition(position: number, nbreTicks: number, step: number): number {
        let decalage: number;

        if (position == Math.ceil(nbreTicks) - 1) {
            const dimSlider = this.sliderBarWrapper1.nativeElement.getBoundingClientRect();
            decalage = Math.max(dimSlider.width, dimSlider.height);
        } else {
            decalage = position * step;
        }

        return decalage;
    }

    getRealValue(position: number, nbreTicks: number): number {
        return Number((position == Math.ceil(nbreTicks) - 1) ? this.rtl ? this.Min : this.Max : this.rtl ? Math.ceil(nbreTicks) - 1 - position : Number(this.Min) + position * this.Step);
    }

    createTick(position: number, step: number, nbreTicks: number): TickClass {
        const tick: TickClass = new TickClass();

        let stepsArray = this.stepsArray != undefined ? this.stepsArray.slice() : undefined;
        if (this.rtl && stepsArray != undefined) {
            stepsArray.reverse();
        }

        tick.value = stepsArray != undefined ? stepsArray[position] : this.Util.round(this.getRealValue(position, nbreTicks));

        tick.translate = {
            X: this.vertical ? 0 : this.getRealPosition(position, nbreTicks, step),
            Y: this.vertical ? this.getRealPosition(position, nbreTicks, step) : 0
        };

        if (this.vertical) {
            tick.style = 'translateY' + '(' + Number(tick.translate.Y) + 'px)';
        } else {
            tick.style = 'translateX' + '(' + Number(tick.translate.X) + 'px)';
        }

        // backgroundColor
        if (this.tickColor != undefined && !tick.selected) {
            tick.backgroundColor = this.tickColor(tick.value);
        }

        // legend
        if (this.legendStepsArray != undefined) {
            let Item = this.legendStepsArray.find(x => x.value == tick.value);

            if (Item != undefined) {
                tick.legend = this.legendStepsArray.find(x => x.value == tick.value).legend;
            }
        }

        // visible <-> intermediate position
        if (this.intermediateTicks == undefined) {
            tick.visible = true;
        } else if (!isNaN(this.intermediateTicks)) {
            tick.visible = (position % this.intermediateTicks) == 0;
        }

        return tick;
    }

    updateTranscludePosition(): void {
        let startTick: TickClass = this.ticks.find(x => x.value == (this.rtl ? Number(this.Max) : Number(this.Min)));
        let endTick: TickClass = this.ticks.find(x => x.value == (this.rtl ? Number(this.Min) : Number(this.Max)));
        let currentTick: TickClass = this.ticks.find(x => x.value == this.Vmin);

        if (this.transcludeLeft && this.transcludeRight) {
            // 0 - le pointeur max !!!
            let currentSecondTick: TickClass = this.ticks.find(x => x.value == this.Vmax);

            // 1 - On part du principe : centrer sur le pointeur

            // 1.1 - Left Side
            let leftSpace: number = this.vertical ? Math.abs(currentTick.translate.Y - startTick.translate.Y) : Math.abs(currentTick.translate.X - startTick.translate.X);
            let rightSpace: number = this.vertical ? Math.abs(currentTick.translate.Y - endTick.translate.Y) : Math.abs(currentTick.translate.X - endTick.translate.X);

            let leftOffset: number;

            if ((leftSpace >= (this.vertical ? this.leftContent.height : this.leftContent.width) / 2) && (rightSpace >= (this.vertical ? this.leftContent.height : this.leftContent.width) / 2)) {
                leftOffset = (this.vertical ? this.leftContent.height : this.leftContent.width) / 2;
            } else if (leftSpace < (this.vertical ? this.leftContent.height : this.leftContent.width) / 2) {
                leftOffset = leftSpace;
            } else {
                leftOffset = Number((this.vertical ? this.leftContent.height : this.leftContent.width) - rightSpace);
            }

            // 1.2 - Right Side
            let leftSecondSpace: number = this.vertical ? Math.abs(currentSecondTick.translate.Y - startTick.translate.Y) : Math.abs(currentSecondTick.translate.X - startTick.translate.X);
            let rightSecondSpace: number = this.vertical ? Math.abs(currentSecondTick.translate.Y - endTick.translate.Y) : Math.abs(currentSecondTick.translate.X - endTick.translate.X);

            let rightOffset: number;

            if ((leftSecondSpace >= (this.vertical ? this.rightContent.height : this.rightContent.width) / 2) && (rightSecondSpace >= (this.vertical ? this.rightContent.height : this.rightContent.width) / 2)) {
                rightOffset = (this.vertical ? this.rightContent.height : this.rightContent.width) / 2;
            } else if (leftSecondSpace < (this.vertical ? this.rightContent.height : this.rightContent.width) / 2) {
                rightOffset = leftSecondSpace;
            } else {
                rightOffset = Number((this.vertical ? this.rightContent.height : this.rightContent.width) - rightSecondSpace);
            }

            // 2 - Détecter un chevauchement
            let leftContentDimension = this.leftContent.elementRef.nativeElement.getBoundingClientRect();
            let rightContentDimension = this.rightContent.elementRef.nativeElement.getBoundingClientRect();

            let distanceBetweenTick: number = this.vertical ? Math.abs(currentTick.translate.Y - currentSecondTick.translate.Y) : Math.abs(currentTick.translate.X - currentSecondTick.translate.X);
            let chevauchement: number = this.vertical ? ((leftContentDimension.top + this.leftContent.height) - (rightContentDimension.top)) : ((leftContentDimension.left + this.leftContent.width - leftOffset) - (rightContentDimension.left - rightOffset));

            if (chevauchement > 0) {
                console.log('chevauchement : ', chevauchement);
                if (leftOffset == 0) {
                    console.log('Chevauchement à gauche');
                    if (this.vertical) {
                        this.leftContent.setPosition(this.vertical, -1 * Math.abs(leftOffset));
                        this.rightContent.setPosition(this.vertical, chevauchement);
                    } else {
                        this.leftContent.setTranslatePosition(this.vertical, -1 * Math.abs(leftOffset));
                        this.rightContent.setTranslatePosition(this.vertical, -1 * rightOffset + chevauchement);
                    }
                } else if (rightOffset == Number((this.vertical ? this.rightContent.height : this.rightContent.width) - rightSecondSpace)) {
                    console.log('Chevauchement à droite');
                    if (this.vertical) {
                        this.leftContent.setPosition(this.vertical, -1 * chevauchement - this.rightContent.height);
                        this.rightContent.setPosition(this.vertical, -1 * Math.abs(rightOffset));
                    } else {
                        this.leftContent.setTranslatePosition(this.vertical, -1 * leftOffset - chevauchement);
                        this.rightContent.setTranslatePosition(this.vertical, -1 * Math.abs(rightOffset));
                    }
                } else {
                    // in the middle
                    console.log('Chevauchement au milieu');
                    if (this.vertical) {
                        this.leftContent.setPosition(this.vertical, -1 * chevauchement / 2);
                        this.rightContent.setPosition(this.vertical, chevauchement / 2);
                    } else {
                        this.leftContent.setTranslatePosition(this.vertical, -1 * leftOffset - chevauchement / 2);
                        this.rightContent.setTranslatePosition(this.vertical, -1 * rightOffset + chevauchement / 2);
                    }
                }
            } else {
                // Il n'y a pas de chevauchement
                if (this.vertical) {
                    this.leftContent.setPosition(this.vertical, -1 * Math.abs(leftOffset));
                    this.rightContent.setPosition(this.vertical, -1 * Math.abs(rightOffset));
                } else {
                    this.leftContent.setTranslatePosition(this.vertical, -1 * Math.abs(leftOffset));
                    this.rightContent.setTranslatePosition(this.vertical, -1 * Math.abs(rightOffset));
                }
            }
        } else {
            // It must be left pointeur <-> ei-left-slider
            if (!this.vertical) {
                let leftSpace: number = Math.abs(currentTick.translate.X - startTick.translate.X);
                let rightSpace: number = Math.abs(currentTick.translate.X - endTick.translate.X);

                let leftOffset: number;

                if ((leftSpace >= this.leftContent.width / 2) && (rightSpace >= this.leftContent.width / 2)) {
                    leftOffset = this.leftContent.width / 2;
                } else if (leftSpace < this.leftContent.width / 2) {
                    leftOffset = leftSpace;
                } else {
                    leftOffset = this.leftContent.width - rightSpace;
                }

                this.leftContent.setTranslatePosition(this.vertical, -1 * Math.abs(leftOffset));
            }
        }
    }

    setLimitPosition(elRef: ElementRef, tick: TickClass): void {
        if (this.vertical) {
            this.rendered.setStyle(elRef.nativeElement, 'top', String(tick.translate.Y) + 'px');
        } else {
            this.rendered.setStyle(elRef.nativeElement, 'left', String(tick.translate.X) + 'px');
        }
    }

    animateBarSelection(): void {
        let startTick: TickClass;
        let endTick: TickClass;

        if (this.isRange) {
            startTick = this.ticks.find(x => this.rtl ? x.value == this.Vmax : x.value == this.Vmin);
            endTick = this.ticks.find(x => this.rtl ? x.value == this.Vmin : x.value == this.Vmax);

            if (startTick != undefined && endTick != undefined) {
                if (this.vertical) {
                    this.rendered.setStyle(this.sliderBarWrapper2.nativeElement, 'top', String(startTick.translate.Y) + 'px');
                    this.rendered.setStyle(this.sliderBarWrapper2.nativeElement, 'height', String(Math.abs(startTick.translate.Y - endTick.translate.Y)) + 'px');
                } else {
                    this.rendered.setStyle(this.sliderBarWrapper2.nativeElement, 'left', String(startTick.translate.X) + 'px');
                    this.rendered.setStyle(this.sliderBarWrapper2.nativeElement, 'width', String(Math.abs(startTick.translate.X - endTick.translate.X)) + 'px');
                }
            }
        } else {
            startTick = this.ticks.find(x => x.value == Number(this.Min));
            endTick = this.ticks.find(x => x.value == this.Vmin);

            if (this.vertical) {
                if (this.rtl) {
                    this.rendered.setStyle(this.sliderBarWrapper2.nativeElement, 'top', String(endTick.translate.Y) + 'px');
                }

                this.rendered.setStyle(this.sliderBarWrapper2.nativeElement, 'height', String(Math.abs(startTick.translate.Y - endTick.translate.Y)) + 'px');
            } else {
                if (this.rtl) {
                    this.rendered.setStyle(this.sliderBarWrapper2.nativeElement, 'left', String(endTick.translate.X) + 'px');
                }

                this.rendered.setStyle(this.sliderBarWrapper2.nativeElement, 'width', String(Math.abs(startTick.translate.X - endTick.translate.X)) + 'px');
            }
        }

        if (this.selectionBarColor != undefined) {
            // selectionBarColor
            this.rendered.setStyle(this.bar2.nativeElement, 'backgroundColor', this.isRange ? this.selectionBarColor(this.Vmin, this.Vmax) : this.selectionBarColor(this.Vmin));
        } else if (this.selectionBarGradient != undefined) {
            // selectionBarGradient
            let direction: string = this.vertical ? (this.rtl ? 'top' : 'bottom') : (this.rtl ? 'left' : 'right');
            this.rendered.setStyle(this.bar2.nativeElement, 'backgroundImage', 'linear-gradient(to ' + direction + ', ' + this.selectionBarGradient.from + ' 0%,' + this.selectionBarGradient.to + ' 100%)');
        }
    }

    wichPointeur(event: MouseEvent): ElementRef {        
        if (this.isRange) {
            if(this.SelectedCursor == undefined) {
                const minPoint = this.Util.toPoint(this.pointerMin.nativeElement.getBoundingClientRect());
                const maxPoint = this.Util.toPoint(this.pointerMax.nativeElement.getBoundingClientRect());

                return (Math.pow(event.x - minPoint.x, 2) + Math.pow(event.y - minPoint.y, 2) <= Math.pow(event.x - maxPoint.x, 2) + Math.pow(event.y - maxPoint.y, 2)) ? this.pointerMin : this.pointerMax;
            } else {
                return this.SelectedCursor == "CUR1" ? this.pointerMin : this.pointerMax;
            }
        } else {
            return this.pointerMin;
        }
    }

    searchNeerestTick(event: MouseEvent): TickClass {
        let ticksCalcul: number[] = this.ticks.map(
            (element) => {
                if (this.vertical) {
                    return (Math.abs(element.translate.Y - event.y - window.scrollY + this.positionInitiale));
                } else {
                    return (Math.abs(element.translate.X - event.x - window.scrollX + this.positionInitiale));
                }
            }
        );
        let indexTick = ticksCalcul.findIndex(x => x == Math.min.apply(Math, ticksCalcul));

        return this.ticks[indexTick];
    }

    pointerMove(event: MouseEvent): void {
        const elRef: ElementRef = this.wichPointeur(event);
        let currentTick: TickClass = this.searchNeerestTick(event);

        if (currentTick !== undefined) {
            switch (elRef) {
                case this.pointerMin:
                    this.Vmin = currentTick.value;
                    break;
                case this.pointerMax:
                    this.Vmax = currentTick.value;
                    break;
            }
        }

        // It's my event, no one need to know
        event.stopPropagation();
        event.preventDefault();
    }

    setPointerPosition(elRef: ElementRef): void {
        // recherche de l'index coorespondant à la valeur
        let indexInTicks: number;

        try {
            switch (elRef) {
                case this.pointerMin:
                    indexInTicks = this.ticks.findIndex(x => x.value == this.Vmin);
                    break;
                case this.pointerMax:
                    indexInTicks = this.ticks.findIndex(x => x.value == this.Vmax);
                    break;
            }

            // Déplacer le pointeur
            if (this.vertical) {
                this.rendered.setStyle(elRef.nativeElement, 'transform', 'translateY(' + this.ticks[indexInTicks].translate.Y + 'px)');
            } else {
                this.rendered.setStyle(elRef.nativeElement, 'transform', 'translateX(' + this.ticks[indexInTicks].translate.X + 'px)');
            }

            // Déplacer le bubble
            if (this.showCurrentValue) {
                if (this.pointerMin == elRef) {
                    if (this.vertical) {
                        this.rendered.setStyle(this.currentBubbleMin.nativeElement, 'transform', 'translateY(' + this.ticks[indexInTicks].translate.Y + 'px)');
                    } else {
                        this.rendered.setStyle(this.currentBubbleMin.nativeElement, 'transform', 'translateX(' + this.ticks[indexInTicks].translate.X + 'px)');
                    }
                } else {
                    if (this.vertical) {
                        this.rendered.setStyle(this.currentBubbleMax.nativeElement, 'transform', 'translateY(' + this.ticks[indexInTicks].translate.Y + 'px)');
                    } else {
                        this.rendered.setStyle(this.currentBubbleMax.nativeElement, 'transform', 'translateX(' + this.ticks[indexInTicks].translate.X + 'px)');
                    }
                }
            }
        } catch (e) {
            console.warn(e);
        }
    }

    updateDisabledState(): void {
        if (this.disabled) {
            this.rendered.setAttribute(this.slider.nativeElement, 'disabled', 'disabled');
        } else {
            this.rendered.removeAttribute(this.slider.nativeElement, 'disabled');
        }
    }

    updateSelectedTick(): void {
        // RAZ & Le nouveau sera selected
        this.ticks.forEach(x => x.selected = x.value == this.Vmin || x.value == this.Vmax);
    }

    initIndex(): string {
        return ((this.readOnly || this.disabled) ? '' : '0');
    }

    focusMinPointer(): void {
        this.leftPointeurSelected = true;
        this.rightPointeurSelected = false;
    }

    focusMaxPointer(): void {
        this.leftPointeurSelected = false;
        this.rightPointeurSelected = true;
    }

    focusoutMinPointer(): void {
        this.leftPointeurSelected = false;
    }

    focusoutMaxPointer(): void {
        this.rightPointeurSelected = false;
    }

    clickCursor(event: MouseEvent, origine: string) {
        this.SelectedCursor = origine;
        // It's my event, no one need to know
        event.stopPropagation();
        event.preventDefault();
    }
}