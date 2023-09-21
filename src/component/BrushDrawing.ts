import { WriteModel } from '../enum';
import { generateCanvas } from '../utils';
import Writing from './Writing';
export default class Eraser{
  canvas:HTMLCanvasElement;
  ctx:CanvasRenderingContext2D;
  writeModel:WriteModel = WriteModel.WRITE;

  width:number;
  height:number;
  voice:number;

  color!:string;

  x:number|null = null;
  y:number|null = null;
  d:number|null = null;
  prevX:number|null = null;
  prevY:number|null = null;
  prevD:number|null = null;

  constructor(
    width:number,
    height:number,
    voice:number,
    public writing:Writing
  ){
    this.width = width;
    this.height = height;
    this.voice = voice;
    this.canvas = generateCanvas(this.width,this.height);
    this.ctx = this.canvas.getContext('2d',{willReadFrequently:true})!;
  }

  reset(color:string){
    this.color = color;
  }
  submit(){
    this.x = null;
    this.y = null;
    this.d = null;
    this.prevX = null;
    this.prevY = null;
    this.prevD = null;
  }
  draw(pointerType:string,{
    prevX,prevY,prevD,x,y,d
  }:{prevX:number|null,prevY:number|null,prevD:number|null,x:number|null,y:number|null,d:number|null}){
    const writingCtx = this.writing.ctx;
    const endX = x!;
    const endY = y!;
    const endD = d!;
    const startX = prevX!;
    const startY = prevY!;
    const startD = prevD!;
    if(startX!==null&&startY!==null&&startD!==null){
      if(startX!==endX&&startY!==endY){
        const threshold = 0.8;
        const angle = Math.atan2(endY - startY,endX - startX);
        const angle1 = angle - Math.PI/2;
        const angle2 = angle + Math.PI/2;
        const halfStartD = Math.max(startD/2,threshold/2);
        const halfEndD = Math.max(endD/2,threshold/2);
        const x1 = Math.cos(angle1) * halfStartD + startX;
        const y1 = Math.sin(angle1) * halfStartD + startY;
        const x2 = Math.cos(angle1) * halfEndD + endX;
        const y2 = Math.sin(angle1) * halfEndD + endY;
        const x3 = Math.cos(angle2) * halfEndD + endX;
        const y3 = Math.sin(angle2) * halfEndD + endY;
        const x4 = Math.cos(angle2) * halfStartD + startX;
        const y4 = Math.sin(angle2) * halfStartD + startY;

        writingCtx.save();
        writingCtx.fillStyle = this.color;
        writingCtx.strokeStyle = this.color;
        writingCtx.beginPath();
        writingCtx.moveTo(x1,y1);
        writingCtx.lineTo(x2,y2);
        writingCtx.arc(endX,endY,halfEndD,angle1,angle2);
        writingCtx.lineTo(x3,y3);
        writingCtx.lineTo(x4,y4);
        writingCtx.arc(startX,startY,halfStartD,angle2,angle1);
        writingCtx.closePath();
        writingCtx.fill();
        writingCtx.restore();
      }
    }
    
  }
  pushPoints({x, y,pressure,pointerType}:{x:number,y:number,pressure:number,pointerType:string}) {
    let prevX = this.prevX;
    let prevY = this.prevY;
    const prevD = this.d;
    if(this.x===null || (x!==this.x && y!==this.y)){
      prevX = this.x;
      prevY = this.y;
      this.prevX = prevX;
      this.prevY = prevY;
    }
    this.x = x;
    this.y = y;

    if(pointerType){
      const minPressure = 0.1;
      const maxPressure = 0.9;
      pressure = Math.min(Math.max(minPressure,pressure),maxPressure);
      const d = this.voice * (.5 + 1.5 * (pressure - minPressure)/(maxPressure - minPressure));
      this.d = d;
      this.draw(pointerType,{
        prevX,
        prevY,
        prevD,
        x,
        y,
        d
      });
    }else{
      this.d = this.voice;
      this.draw(pointerType,{
        prevX,
        prevY,
        prevD,
        x,
        y,
        d:this.d
      });
    }
    
  }

}