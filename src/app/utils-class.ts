import { Injectable } from '@angular/core';

@Injectable()
export class Utils {
    public toBoolean(value: any): boolean {
        return (value == 'true' || value === true);
    }

    public toPoint(pointer: any) {
        return {
            x: pointer.left + pointer.width / 2,
            y: pointer.top + pointer.height / 2,
        };
    }

    public round(value: number): number {
        return Math.round(value * 100) / 100; // /* Merci la virgule flottante, but i'm your father ;-) */
    }
}