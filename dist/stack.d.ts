import type { PreStore } from './type';
export declare class Stack {
    width: number;
    height: number;
    hash: number | string;
    stackObj: Record<number | string, {
        undoStack: PreStore[];
        redoStack: PreStore[];
    }>;
    get preStackObj(): {
        undoStack: PreStore[];
        redoStack: PreStore[];
    };
    get undoStack(): PreStore[];
    get redoStack(): PreStore[];
    constructor(width: number, height: number, hash?: number | string);
    updateHash(hash: number | string): void;
    restoreState: (preStore: PreStore) => void;
    saveState(preStore: PreStore): void;
    undo(): void;
    redo(): void;
    private doRestoreState;
}
