
export default class Border{
  width:number;
  height:number;

  offscreen!:OffscreenCanvas | null;

  constructor(
    public ctx:CanvasRenderingContext2D,
    public borderStyle:string,
    public borderWidth:number
  ){
    const canvas = ctx.canvas;
    this.width = canvas.width;
    this.height = canvas.height;
  }
  draw(){
    if(!this.offscreen){
      this.offscreen = new OffscreenCanvas(this.width,this.height);
      const ctx = this.offscreen.getContext('2d')!;
      ctx.strokeStyle = this.borderStyle;
      ctx.lineWidth = this.borderWidth;
      ctx.strokeRect(0,0,this.width,this.height);
    }
    return this.offscreen;
  }
}