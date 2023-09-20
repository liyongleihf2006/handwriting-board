import type { Points } from '../type';
import { WriteModel } from '../enum';
export default class Eraser {
    width: number;
    height: number;
    voice: number;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    pointsGroup: Points[];
    basePoints: [number, number, number, number, number][];
    d: number;
    prevD: number;
    prevOriginD: number;
    prevAngle: number | undefined;
    maxD: number;
    color: string;
    writeModel: WriteModel;
    k: number;
    constructor(width: number, height: number, voice: number);
    draw(): void;
    private getBezierCurveControls;
    private getCornersCoordinate;
    calculateExtendedPoint(x1: number, y1: number, x2: number, y2: number, d: number): [number, number];
    reset(color: string): void;
    submit(writingCtx: CanvasRenderingContext2D): void;
    drawEllipse(x: number, y: number, rx: number, ry: number, angle: number): void;
    pushPoints(writeStartX: number, writeStartY: number, writeEndX: number, writeEndY: number, writeStartTime: number, writeEndTime: number): void;
}
