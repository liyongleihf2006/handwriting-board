import type {StackType} from './type';

export class Stack {
  undoStack:StackType[] = [];
  redoStack:StackType[] = [];
  restoreState:(state:StackType)=>void = ()=>undefined;
  saveState(state:StackType) {
    this.undoStack.push(deepCopy(state));
    this.redoStack.length = 0;
  }
  undo() {
    if (this.undoStack.length > 0) {
      const lastState = this.undoStack.pop() as StackType;
      this.redoStack.push(lastState);
      const previousState = this.undoStack[this.undoStack.length - 1]||{worldOffsetX:0,worldOffsetY:0,pointGroup:[]};
      this.doRestoreState(previousState);
    }
  }
  redo() {
    if (this.redoStack.length > 0) {
      const nextState = this.redoStack.pop() as StackType;
      this.undoStack.push(nextState);
      this.doRestoreState(nextState);
    }
  }
  private doRestoreState(state:StackType){
    this.restoreState(deepCopy(state));
  }
}
function deepCopy(obj:any, hash = new WeakMap()) {
  if (Object(obj) !== obj) {  // primitive types
    return obj;
  }

  if (hash.has(obj)) {  // handle circular reference
    return hash.get(obj);
  }

  const result:Record<string,any> = Array.isArray(obj) ? [] : {};
  hash.set(obj, result);  // add to the hash
  Object.keys(obj).forEach(key => {
    if (obj[key] && typeof obj[key] === 'object') {
      result[key] = deepCopy(obj[key], hash);  // recursively copy nested objects
    } else {
      result[key] = obj[key];
    }
  });

  return result;
}