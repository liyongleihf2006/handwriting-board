import { generateCanvas } from '../utils';
export default class Border{
  canvas:HTMLCanvasElement;
  ctx:CanvasRenderingContext2D;

  constructor(
    public width:number,
    public height:number,
    public borderStyle:string,
    public borderWidth:number
  ){
    this.canvas = generateCanvas(width,height);
    this.ctx = this.canvas.getContext('2d')!;
    this.draw();
  }
  resize(width:number,height:number){
    this.width = width;
    this.height = height;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }
  private draw(){
    const ctx = this.ctx;
    ctx.strokeStyle = this.borderStyle;
    ctx.lineWidth = this.borderWidth;
    ctx.strokeRect(0,0,this.width,this.height);
  }
}