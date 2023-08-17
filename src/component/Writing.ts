import { PointsGroup } from "../type";

import { generateCanvas } from '../utils';
export default class Writing{
  worldOffsetX!:number;
  worldOffsetY!:number;

  canvas:HTMLCanvasElement;
  ctx:CanvasRenderingContext2D;

  constructor(
    public width:number,
    public height:number
  ){
    this.canvas = generateCanvas(width,height);
    this.ctx = this.canvas.getContext('2d')!;
  }
  writing(pointsGroup:PointsGroup,worldOffsetX:number,worldOffsetY:number,needClean = true){
    if(needClean){
      this.ctx.clearRect(0,0,this.width,this.height);
    }
    this.worldOffsetX = worldOffsetX;
    this.worldOffsetY = worldOffsetY;
    pointsGroup.forEach(({corners,fillStyle})=>{
      this.ctx.save();
      this.ctx.fillStyle = fillStyle;
      this.ctx.beginPath();
      corners.forEach(([[wx11,wy11],[wx12,wy12],[wx21,wy21],[wx22,wy22]],i)=>{
        const x11 = wx11 - this.worldOffsetX;
        const y11 = wy11 - this.worldOffsetY;
        const x12 = wx12 - this.worldOffsetX;
        const y12 = wy12 - this.worldOffsetY;
        const x21 = wx21 - this.worldOffsetX;
        const y21 = wy21 - this.worldOffsetY;
        const x22 = wx22 - this.worldOffsetX;
        const y22 = wy22 - this.worldOffsetY;
        this.ctx.moveTo(x11,y11);
        this.ctx.lineTo(x12,y12);
        this.ctx.lineTo(x22,y22);
        this.ctx.lineTo(x21,y21);
      })
      this.ctx.fill();
      this.ctx.restore();
    })
  }
  drawEraser(cleanX:number,cleanY:number,cleanR:number){
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