import type {PreStore} from './type';

export class Stack {
  stackObj:Record<number|string,{
    undoStack:PreStore[],
    redoStack:PreStore[]
  }> = {};
  get preStackObj(){
    if(!this.stackObj[this.hash]){
      this.stackObj[this.hash] = {
        undoStack:[],
        redoStack:[]
      }
    }
    return this.stackObj[this.hash];
  }
  get undoStack(){
    return this.preStackObj.undoStack;
  }
  get redoStack(){
    return this.preStackObj.redoStack;
  }
  constructor(public width:number,public height:number,public hash:number|string = ''){}
  updateHash(hash:number|string){
    this.hash = hash;
  }
  restoreState:(preStore:PreStore)=>void = ()=>undefined;
  saveState(preStore:PreStore) {
    this.undoStack.push([...preStore]);
    this.redoStack.length = 0;
  }
  undo() {
    if (this.undoStack.length > 0) {
      const lastState = this.undoStack.pop() as PreStore;
      this.redoStack.push(lastState);
      let previousState = this.undoStack[this.undoStack.length - 1];
      if(!previousState){
        const data = new Uint8ClampedArray(this.width * 4 * this.height);
        const imageData = new ImageData(data,this.width,this.height);
        previousState = [{worldOffsetX:0,worldOffsetY:0,imageData,fragments:[],colLen:0}];
      }
      this.doRestoreState(previousState);
    }
  }
  redo() {
    if (this.redoStack.length > 0) {
      const nextState = this.redoStack.pop() as PreStore;
      this.undoStack.push(nextState);
      this.doRestoreState(nextState);
    }
  }
  private doRestoreState(preStore:PreStore){
    this.restoreState([...preStore]);
  }
}