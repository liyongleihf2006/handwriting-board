import type { Store } from '../type';
export default class Writing {
    store: Store;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    scale: number;
    width: number;
    height: number;
    constructor(width: number, height: number);
    refresh(worldOffsetX: number, worldOffsetY: number): void;
    singlePointsWriting(points: {
        x: number;
        y: number;
        fillStyle: string;
    }[]): void;
    clear(): void;
    doClean(x: number, y: number, width: number, height: number, determineIfThereHasContent?: boolean): boolean;
    pushImageData(worldOffsetX: number, worldOffsetY: number): void;
    putImageData(worldOffsetX: number, worldOffsetY: number): void;
    getWholeCanvas(): HTMLCanvasElement;
    getPaperCanvas(): HTMLCanvasElement;
}
