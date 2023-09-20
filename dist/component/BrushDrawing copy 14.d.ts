import { WriteModel } from '../enum';
import Writing from './Writing';
type PointType = {
    x: number;
    y: number;
    d: number;
    distance: number;
};
export default class Eraser {
    writing: Writing;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    svgPath: SVGPathElement;
    svgPathStr: string;
    basePoints: [number, number, number][];
    scaleBasePoints: [number, number, number][];
    d: number;
    maxD: number;
    writeModel: WriteModel;
    k: number;
    width: number;
    height: number;
    voice: number;
    color: string;
    constructor(width: number, height: number, voice: number, writing: Writing);
    reset(color: string): void;
    submit(): void;
    getPathContent(basePoints: [number, number, number][], isScale?: boolean): {
        svgPoints: PointType[];
        pathStrs: {
            start: number;
            end: number;
            pathStr: string;
        }[];
        pathStr: string;
    };
    getBezierCurveControls(p1: {
        x: number;
        y: number;
    }, p2: {
        x: number;
        y: number;
    }, pm: {
        x: number;
        y: number;
    }): {
        x: number;
        y: number;
    }[];
    draw(): void;
    pushPoints({ x, y, pressure }: {
        x: number;
        y: number;
        pressure: number;
    }): void;
}
export {};
