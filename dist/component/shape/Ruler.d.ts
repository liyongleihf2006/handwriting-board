export default class Ruler {
    ctx: CanvasRenderingContext2D;
    cm: number;
    mm: number;
    path: Path2D;
    width: number;
    height: number;
    marginH: number;
    degreeNumber: number;
    toolShapeCenterX: number;
    toolShapeCenterY: number;
    angle: number;
    constructor(ctx: CanvasRenderingContext2D, cm: number, mm: number);
    getOutlineCtx(_x: number, _y: number, _angle: number, outlineVoice: number, strokeStyle: string): OffscreenCanvasRenderingContext2D;
    generatorOuterBorder(_cx: number, _cy: number, _angle: number, voice?: number): Path2D;
    draw(): void;
    isPointInPath(x: number, y: number, fillRule: CanvasFillRule): boolean;
}
