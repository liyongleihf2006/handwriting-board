export default class Eraser {
    width: number;
    height: number;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    constructor(width: number, height: number);
    resize(width: number, height: number): void;
    draw(cleanX: number, cleanY: number, r: number): void;
}
