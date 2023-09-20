import { WriteModel } from '../enum';
import { generateCanvas } from '../utils';
import Writing from './Writing';
type PointType = {x:number,y:number,d:number,distance:number};
export default class Eraser{
  canvas:HTMLCanvasElement;
  ctx:CanvasRenderingContext2D;
  svgPath = document.createElementNS('http://www.w3.org/2000/svg','path');
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
    this.ctx = this.canvas.getContext('2d')!;
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
        const pathStr = `M${startX},${startY}L${endX},${endY}`;
        if(pointerType === 'pen'){
          this.svgPath.setAttribute('d',pathStr);
          const totalLength = this.svgPath.getTotalLength();
          if(!totalLength){return};
          const ratio = 1/(window.devicePixelRatio * 2);
          let prevD = -1 * this.voice;

          const fragments:number[][] = [];
          for(let i = 0;i<totalLength;i+=ratio){
              let currentD = startD * (totalLength - i)/totalLength + endD * i/totalLength;
              if(!fragments.length){
                fragments.push([i,i]);
                prevD = currentD;
              }else{
                const lastFragment = fragments[fragments.length - 1];
                if(Math.abs(currentD - prevD)<ratio){
                  lastFragment[1] = i;
                }else{
                  fragments.push([lastFragment[1],i]);
                  prevD = currentD;
                }
              }
          }
          fragments[fragments.length - 1][1] = totalLength;
          fragments.forEach(fragment=>{
            const avgI = (fragment[0] + fragment[fragment.length - 1])/2;
            let avgD = startD * (totalLength - avgI)/totalLength + endD * avgI/totalLength;
            fragment[2] = avgD;
          })
          writingCtx.save();
          writingCtx.strokeStyle = this.color;
          writingCtx.fillStyle = this.color;
          for(let i = 0;i<fragments.length;i++){
            const [start,end,d] = fragments[i];
            writingCtx.beginPath();
            writingCtx.lineWidth = d;
            writingCtx.setLineDash([0,start,end,Number.MAX_SAFE_INTEGER]);
            const path = new Path2D(pathStr);
            writingCtx.stroke(path);
            if(d>=3){
              const {x,y} = this.svgPath.getPointAtLength(start);
              writingCtx.save();
              writingCtx.globalAlpha = 1;
              writingCtx.fillStyle = this.color;
              writingCtx.beginPath();
              writingCtx.arc(x,y,d/2 - 1,0,Math.PI * 2);
              writingCtx.fill();
              writingCtx.restore();
            }
          }
          if(startD>=3){
            writingCtx.save();
            writingCtx.globalAlpha = 1;
            writingCtx.fillStyle = this.color;
            writingCtx.beginPath();
            writingCtx.arc(startX,startY,startD/2 - 1,0,Math.PI * 2);
            writingCtx.fill();
            writingCtx.restore();
          }
          if(endD>=3){
            writingCtx.save();
            writingCtx.globalAlpha = 1;
            writingCtx.fillStyle = this.color;
            writingCtx.beginPath();
            writingCtx.arc(endX,endY,endD/2 - 1,0,Math.PI * 2);
            writingCtx.fill();
            writingCtx.restore();
          }
          writingCtx.restore();
        }else{
          writingCtx.save();
          writingCtx.lineJoin = 'round';
          writingCtx.lineCap = 'round';
          writingCtx.strokeStyle = this.color;
          writingCtx.beginPath();
          writingCtx.lineWidth = d!;
          const path = new Path2D(pathStr);
          writingCtx.stroke(path);
          console.log(d);
        }
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
    if(pointerType === 'pen'){
      const minPressure = 0.2;
      const maxPressure = 0.5;
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