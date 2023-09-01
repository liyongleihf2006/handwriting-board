import type { Store, Points } from '../type';
export default class Writing {
    width: number;
    height: number;
    store: Store;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    constructor(width: number, height: number);
    refresh(worldOffsetX: number, worldOffsetY: number): void;
    singlePointsWriting(points: {
        x: number;
        y: number;
        fillStyle: string;
    }[]): void;
    writing(points: Points, color: string): void;
    clear(): void;
    doClean(x: number, y: number, width: number, height: number, determineIfThereHasContent?: boolean): boolean;
    pushImageData(worldOffsetX: number, worldOffsetY: number): void;
    putImageData(worldOffsetX: number, worldOffsetY: number): void;
    getWholeCanvas(): HTMLCanvasElement;
    getPaperCanvas(): HTMLCanvasElement;
}
