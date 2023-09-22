export default class Compass {
    ctx: CanvasRenderingContext2D;
    cm: number;
    mm: number;
    path: Path2D;
    r: number;
    middleR: number;
    smallR: number;
    middleGap: number;
    startAngle: number;
    endAngle: number;
    innerStartAngle: number;
    innerEndAngle: number;
    toolShapeCenterX: number;
    toolShapeCenterY: number;
    angle: number;
    constructor(ctx: CanvasRenderingContext2D, cm: number, mm: number);
    getOutlineCtx(_x: number, _y: number, _angle: number, outlineVoice: number, strokeStyle: string): OffscreenCanvasRenderingContext2D;
    generatorOuterBorder(_cx: number, _cy: number, _angle: number, voice?: number): Path2D;
    drawDegree(cx: number, cy: number, r: number, smallUnitL: number, unitL: number, bigUnitL: number, ruleFontSize: number, fontGap: number, showText: boolean, showSmall: boolean, showMiddle: boolean, textOnInner: boolean, _angle: number, reverse?: boolean): void;
    drawContent(_cx: number, _cy: number, _angle: number): void;
    drawPosition(cx: number, cy: number, angle: number): void;
    draw(): void;
    isPointInPath(x: number, y: number, fillRule: CanvasFillRule): boolean;
}
