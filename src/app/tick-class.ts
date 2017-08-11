export enum PlacementEnum {
    bottom = 1,
    top,
    left,
    right
}

export class TickClass {
    public selected: boolean;
    public value: any;
    public style: any;
    public tooltip: string;
    public legend: string;
    public translate: {X: number, Y: number };
    public backgroundColor: string;
    public visible:boolean;
    constructor() { }
}
