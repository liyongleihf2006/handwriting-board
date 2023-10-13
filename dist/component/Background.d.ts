import { BGPattern } from "../enum";
export default class Background {
    width: number;
    height: number;
    gridGap: number;
    gridFillStyle: string;
    gridPaperGap: number;
    gridPaperStrokeStyle: string;
    quadrillePaperVerticalMargin: number;
    quadrillePaperGap: number;
    quadrillePaperStrokeStyles: string[];
    private gridPattern;
    private gridPaperPattern;
    private quadrillePaperPattern;
    bgPattern: BGPattern;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    coordX: number;
    coordY: number;
    constructor(width: number, height: number, gridGap: number, gridFillStyle: string, gridPaperGap: number, gridPaperStrokeStyle: string, quadrillePaperVerticalMargin: number, quadrillePaperGap: number, quadrillePaperStrokeStyles: string[]);
    resize(width: number, height: number): void;
    draw(coordX: number, coordY: number, bgPattern: BGPattern): void;
    private generateGridPattern;
    private generateGridPaperPattern;
    private generateQuadrillePaperPattern;
}
