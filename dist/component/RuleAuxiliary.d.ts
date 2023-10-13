export default class RuleAuxiliary {
    width: number;
    height: number;
    ruleStrokeStyle: string;
    ruleGap: number;
    ruleUnitLen: number;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    worldOffsetX: number;
    worldOffsetY: number;
    constructor(width: number, height: number, ruleStrokeStyle: string, ruleGap: number, ruleUnitLen: number);
    resize(width: number, height: number): void;
    draw(worldOffsetX: number, worldOffsetY: number): void;
}
