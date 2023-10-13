import type { PreStore, GatherAreasObj } from '../type';
export default class Writing {
    store: PreStore;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    scale: number;
    width: number;
    height: number;
    constructor(width: number, height: number, store: PreStore);
    resize(width: number, height: number): void;
    refresh(worldOffsetX: number, worldOffsetY: number): void;
    singlePointsWriting(gatherAreasObj: GatherAreasObj): void;
    colorOverlay(colorT: number, alphaT: number, colorB: number, alphaB: number, alphaF: number): number;
    clear(): void;
    doClean(x1: number, y1: number, x2: number, y2: number, r: number, determineIfThereHasContent?: boolean): boolean;
    pushImageData(worldOffsetX: number, worldOffsetY: number): void;
    putImageData(worldOffsetX: number, worldOffsetY: number): void;
    getWholeCanvas(): HTMLCanvasElement;
    getPaperCanvas(): HTMLCanvasElement;
}
