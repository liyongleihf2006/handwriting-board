import { generateCanvas } from '../utils';
export default class Eraser{
  canvas:HTMLCanvasElement;
  ctx:CanvasRenderingContext2D;

  constructor(
    public width:number,
    public height:number
  ){
    this.canvas = generateCanvas(width,height);
    this.ctx = this.canvas.getContext('2d')!;
  }
  draw(cleanX:number,cleanY:number,cleanR:number){
    this.ctx.clearRect(0,0,this.width,this.height);
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.fillStyle = 'rgba(0,0,0,.1)';
    this.ctx.strokeStyle = 'rgba(0,0,0,.15)';
    this.ctx.arc(cleanX,cleanY,cleanR as number,0,Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();
    this.ctx.beginPath();
  }
}