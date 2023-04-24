import type { StackType } from './type';
export declare class Stack {
    undoStack: StackType[];
    redoStack: StackType[];
    restoreState: (state: StackType) => void;
    saveState(state: StackType): void;
    undo(): void;
    redo(): void;
    private doRestoreState;
}
