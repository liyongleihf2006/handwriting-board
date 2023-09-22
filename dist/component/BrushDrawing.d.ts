import { WriteModel } from '../enum';
import Writing from './Writing';
export default class Eraser {
    writing: Writing;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    writeModel: WriteModel;
    width: number;
    height: number;
    voice: number;
    color: string;
    x: number | null;
    y: number | null;
    d: number | null;
    prevX: number | null;
    prevY: number | null;
    prevD: number | null;
    constructor(width: number, height: number, voice: number, writing: Writing);
    reset(color: string): void;
    submit(): void;
    draw(pointerType: string, { prevX, prevY, prevD, x, y, d }: {
        prevX: number | null;
        prevY: number | null;
        prevD: number | null;
        x: number | null;
        y: number | null;
        d: number | null;
    }): void;
    pushPoints({ x, y, pressure, pointerType }: {
        x: number;
        y: number;
        pressure: number;
        pointerType: string;
    }): void;
}
