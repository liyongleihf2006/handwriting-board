import type { Store } from './type';
export declare class Stack {
    width: number;
    height: number;
    undoStack: Store[];
    redoStack: Store[];
    constructor(width: number, height: number);
    restoreState: (store: Store) => void;
    saveState(store: Store): void;
    undo(): void;
    redo(): void;
    private doRestoreState;
}
