import type {Store} from './type';

export class Stack {
  undoStack:Store[] = [];
  redoStack:Store[] = [];
  constructor(public width:number,public height:number){}
  restoreState:(store:Store)=>void = ()=>undefined;
  saveState(store:Store) {
    this.undoStack.push([...store]);
    this.redoStack.length = 0;
  }
  undo() {
    if (this.undoStack.length > 0) {
      const lastState = this.undoStack.pop() as Store;
      this.redoStack.push(lastState);
      let previousState = this.undoStack[this.undoStack.length - 1];
      if(!previousState){
        const data = new Uint8ClampedArray(this.width * 4 * this.height);
        const imageData = new ImageData(data,this.width,this.height);
        previousState = [{worldOffsetX:0,worldOffsetY:0,imageData}];
      }
      this.doRestoreState(previousState);
    }
  }
  redo() {
    if (this.redoStack.length > 0) {
      const nextState = this.redoStack.pop() as Store;
      this.undoStack.push(nextState);
      this.doRestoreState(nextState);
    }
  }
  private doRestoreState(store:Store){
    this.restoreState([...store]);
  }
}