import { WriteModel } from '../enum';
export default class Eraser {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    svgPath: SVGPathElement;
    svgPathStr: string;
    basePoints: [number, number, number][];
    d: number;
    prevD: number;
    prevOriginD: number;
    maxD: number;
    writeModel: WriteModel;
    k: number;
    scale: number;
    width: number;
    height: number;
    voice: number;
    color: string;
    constructor(width: number, height: number, voice: number);
    reset(color: string): void;
    submit(writingCtx: CanvasRenderingContext2D): void;
    draw(adjust?: boolean): void;
    pushPoints(writeStartX: number, writeStartY: number, writeEndX: number, writeEndY: number, writeStartTime: number, writeEndTime: number): void;
}
