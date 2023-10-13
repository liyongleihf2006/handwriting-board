export default class Border {
    width: number;
    height: number;
    borderStyle: string;
    borderWidth: number;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    constructor(width: number, height: number, borderStyle: string, borderWidth: number);
    resize(width: number, height: number): void;
    private draw;
}
