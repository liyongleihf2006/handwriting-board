import { WriteModel } from '../enum';
export default class Eraser {
    width: number;
    height: number;
    voice: number;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    svgPath: SVGPathElement;
    svgPathStr: string;
    svgFragmentLens: number[];
    basePoints: [number, number, number][];
    d: number;
    prevD: number;
    prevOriginD: number;
    maxD: number;
    color: string;
    writeModel: WriteModel;
    k: number;
    constructor(width: number, height: number, voice: number);
    reset(color: string): void;
    submit(writingCtx: CanvasRenderingContext2D): void;
    draw(x: number, y: number, start: boolean): void;
    adjust(): void;
    pushPoints(writeStartX: number, writeStartY: number, writeEndX: number, writeEndY: number, writeStartTime: number, writeEndTime: number): void;
}
