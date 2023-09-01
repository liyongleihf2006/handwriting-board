export default class Eraser {
    width: number;
    height: number;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    constructor(width: number, height: number);
    draw(cleanX: number, cleanY: number, cleanWidth: number, cleanHeight: number): void;
}
