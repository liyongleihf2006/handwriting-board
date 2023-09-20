import { WriteModel } from '../enum';
export default class Eraser {
    width: number;
    height: number;
    voice: number;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    basePointsGroup: [number, number, number][];
    d: number;
    prevD: number;
    prevOriginD: number;
    maxD: number;
    color: string;
    writeModel: WriteModel;
    k: number;
    constructor(width: number, height: number, voice: number);
    checkoutPoints(): [number, number, number][];
    draw(): void;
    findPerpendicularIntersection(A: [number, number, number], B: [number, number, number], C: [number, number, number], d: number): [number, number];
    private getOutlinePoints;
    private getBezierCurveControls;
    calculateExtendedPoint(x1: number, y1: number, x2: number, y2: number, d: number): [number, number];
    reset(color: string): void;
    submit(writingCtx: CanvasRenderingContext2D): void;
    pushPoints(writeStartX: number, writeStartY: number, writeEndX: number, writeEndY: number, writeStartTime: number, writeEndTime: number): void;
}
