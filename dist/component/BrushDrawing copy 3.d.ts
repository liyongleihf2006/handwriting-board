import { WriteModel } from '../enum';
export default class Eraser {
    width: number;
    height: number;
    voice: number;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    svgPath: SVGPathElement;
    svgPathStr: string;
    svgFragmentLen: number;
    svgPointsGroup: {
        x: number;
        y: number;
        angle: number;
        d: number;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    }[][];
    basePointsGroup: [number, number, number][];
    d: number;
    prevD: number;
    prevOriginD: number;
    maxD: number;
    color: string;
    writeModel: WriteModel;
    k: number;
    constructor(width: number, height: number, voice: number);
    draw(): void;
    private getBezierCurveControls;
    reset(color: string): void;
    submit(writingCtx: CanvasRenderingContext2D): void;
    pushPoints(writeStartX: number, writeStartY: number, writeEndX: number, writeEndY: number, writeStartTime: number, writeEndTime: number): void;
    getJusticeD(d: number): number;
    updateSVGPoint(point: {
        x: number;
        y: number;
        angle: number;
        d: number;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    }, attrs: {
        d: number;
        angle: number;
    }): void;
    pushSVGPoint(x: number, y: number, angle: number, d: number): void;
}
