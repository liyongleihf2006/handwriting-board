import {RotateCoordinates} from '../utils';
import { generateCanvas } from '../utils';
export default class Ruler{
  canvas:HTMLCanvasElement;
  ctx:CanvasRenderingContext2D;
  path!:Path2D;
  pathInner!:Path2D|null;
  isPointInPathInnerVoice:number;
  getNearestDistanceAndPointVoice:number;
  outline!:[number,number][] | null;

  longestDistance = 30;

  // 像素点采集宽度
  gatherAreaWidth = 20;
  prevPoint:[number,number]|null = null;
  private _x!:number;
  private _y!:number;
  private _angle!:number;
  cm = 0;
  mm = 0;
  width = 0;
  height = 0;
  marginH = 0;
  degreeNumber = 20;
  pathStr = '';


  constructor(public w:number,public h:number,public voice:number){

    this.canvas = generateCanvas(w,h);
    this.ctx = this.canvas.getContext('2d')!;

    this.cm = 96/2.54;
    this.mm = this.cm / 10;
    this.marginH = this.mm * 5;
    this.width = this.cm * this.degreeNumber + this.marginH * 2;
    this.height = this.cm * 2;
    this.isPointInPathInnerVoice = voice;
    this.getNearestDistanceAndPointVoice = voice;
  }
  set x(x:number){
    this._x = x;
    this.reset();
  }
  get x(){
    return this._x;
  }
  set y(y:number){
    this._y = y;
    this.reset();
  }
  get y(){
    return this._y;
  }
  set angle(angle:number){
    this._angle = angle;
    this.reset();
  }
  get angle(){
    return this._angle;
  }
  reset(){
    this.outline = null;
    this.pathInner = null;
    this.prevPoint = null;
  }
  setXYAngle(x:number,y:number,angle:number){
    if(this.x!==x||this.y!==y||this.angle!==angle){
      this.x = x;
      this.y = y;
      this.angle = angle;
      this.draw();
    }
  }
  getGathers(x1: number, y1: number, x2: number, y2: number, gatherAreaWidth: number) {
    const topLeftX = Math.min(x1, x2) - gatherAreaWidth / 2;
    const topLeftY = Math.min(y1, y2) - gatherAreaWidth / 2;
    const bottomRightX = Math.max(x1, x2) + gatherAreaWidth / 2;
    const bottomRightY = Math.max(y1, y2) + gatherAreaWidth / 2;
  
    const gathers: [number,number][] = [];
    for (let x = topLeftX; x <= bottomRightX; x++) {
      for (let y = topLeftY; y <= bottomRightY; y++) {
        gathers.push([x, y]);
      }
    }
    return gathers;
  }
  getNearestDistanceAndPoint(x:number,y:number,getNearestDistanceAndPointVoice:number){
    if(!this.outline || getNearestDistanceAndPointVoice !== this.getNearestDistanceAndPointVoice){
      this.getNearestDistanceAndPointVoice = getNearestDistanceAndPointVoice;
      this.outline = this.getOutline(this.getNearestDistanceAndPointVoice);
    }
    const outline = this.outline;
    const len = outline.length;
    let prevPoint = this.prevPoint!;
    const gatherAreaWidth = this.gatherAreaWidth;
    if(!prevPoint){
      let nearestDistance = Number.MAX_SAFE_INTEGER;
      for(let i = 0;i<len;i++){
        const [x0,y0] = outline[i];
        const distance = ((x-x0)**2 + (y-y0)**2)**0.5;
        if(distance<nearestDistance){
          nearestDistance = distance;
          prevPoint = [x0,y0];
        }
      }
      this.prevPoint = prevPoint;
      return {conformingToDistance:nearestDistance<=this.longestDistance,drawPoints:[]};
    }else{
      const innerAreaPoints:[number,number][] = [];

      for(let i = 0;i<len;i++){
        const [x0,y0] = outline[i];
        const gatherDistance = ((prevPoint[0]-x0)**2 + (prevPoint[1]-y0)**2)**0.5;
        if(gatherDistance<=gatherAreaWidth){
          innerAreaPoints.push([x0,y0])
        }
      }

      let nearestDistance = Number.MAX_SAFE_INTEGER;
      let gatherPoint:[number,number]|null = null;
      for(let i = 0;i<innerAreaPoints.length;i++){
        const [x0,y0] = innerAreaPoints[i];
        const distance = ((x-x0)**2 + (y-y0)**2)**0.5;
        if(distance<nearestDistance){
          nearestDistance = distance;
          gatherPoint = [x0,y0];
        }
      }
      let gathers:[number,number][] = [];
      if(gatherPoint){
        gathers = this.getGathers(prevPoint[0],prevPoint[1],gatherPoint[0],gatherPoint[1],gatherAreaWidth);
      }
      const drawPoints = [];
      const gathersLen = gathers.length;
      for(let i = 0;i<gathersLen;i++){
        const p = gathers[i];
        const isInPath = this.isPointInPathInner(p[0],p[1],getNearestDistanceAndPointVoice);
        if(isInPath){
          drawPoints.push(p);
        }
      }
      this.prevPoint = gatherPoint;
      return {conformingToDistance:true,drawPoints};
    }
  }
  getOutline(outlineVoice:number){
    const ctx = this.ctx;
    const canvas = ctx.canvas;
    const {width,height} = canvas;
    const offscreen = new OffscreenCanvas(width, height);
    const c = offscreen.getContext('2d')!;
    const path = this.generatorOuterBorder(outlineVoice);
    c.strokeStyle = 'rgba(0,0,0,255)';
    c.stroke(path);
    const imageData = c.getImageData(0,0,width,height);
    const data = imageData.data;
    const len = data.length;
    const outline:[number,number][] = [];
    let row = 0;
    let column = -1;
    for(let i = 0;i<len;i+=4){
      column++;
      if(data[i+3]>=255){
        outline.push([column,row]);
      }
      if(column === width - 1){
        row++;
        column = -1;
      }
    }
    return outline;
  }
  isPointInPathInner(x:number,y:number,isPointInPathInnerVoice:number){
    if(!this.pathInner || isPointInPathInnerVoice!==this.isPointInPathInnerVoice){
      this.isPointInPathInnerVoice = isPointInPathInnerVoice;
      this.pathInner = this.generatorOuterBorder(isPointInPathInnerVoice);
    }
    return this.ctx.isPointInStroke(this.pathInner,x,y);
  }
  isPointInPath(x:number,y:number){
    return this.ctx.isPointInPath(this.path,x,y);
  }
  generatorOuterBorder(voice = 0){
    const x = this._x - voice;
    const y = this._y - voice;
    const angle = this._angle;
    const width = this.width + voice;
    const height = this.height + voice;
    const cm = this.cm;
    const rotateCoordinates = RotateCoordinates(angle,x,y);
    let pathStr = '';
    pathStr += `M${rotateCoordinates(x,y).join(',')}`;
    pathStr += `L${rotateCoordinates(x+width,y).join(',')}`
    pathStr += `L${rotateCoordinates(x+width,y+height).join(',')}`
    const offestX = 1.5 * cm + this.marginH + voice;
    const beginWaveX = x+width - offestX;
    const beginWaveY = y+height;
    // const endWaveX = x + offestX;
    // const waveUnit = cm *2/3;
    // const waveUnitY = waveUnit/4;
    // const waveY = beginWaveY - waveUnitY;
    pathStr += `L${rotateCoordinates(beginWaveX,beginWaveY).join(',')}`
    // let currentWaveUnit = beginWaveX - waveUnit;
    // while(currentWaveUnit>endWaveX){
    //   pathStr += `C${[...rotateCoordinates(currentWaveUnit + waveUnit/3, waveY - waveUnitY),...rotateCoordinates(currentWaveUnit + waveUnit*2/3, waveY + waveUnitY), ...rotateCoordinates(currentWaveUnit, beginWaveY)].join(',')}`;
    //   currentWaveUnit -= waveUnit;
    // }
    pathStr += `L${rotateCoordinates(x,beginWaveY).join(',')}`

    pathStr += 'z';
    this.pathStr = pathStr;
    const path = new Path2D(pathStr);
    this.path = path;
    return path;
  }
  private draw(){
    const ctx = this.ctx;
    const marginH = this.marginH;
    const cm = this.cm;
    const mm = this.mm;
    const degreeNumber = this.degreeNumber;
    const x = this.x;
    const y = this.y;
    const angle = this.angle;
    const rotateCoordinates = RotateCoordinates(angle,x,y);
    ctx.clearRect(0,0,this.w,this.h);
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,.08)';
    const path = this.generatorOuterBorder();
    ctx.fill(path);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'black';
    ctx.font = "3mm serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.beginPath();
    const cmLen = 0.5 * cm;
    const textPos = y + cmLen + mm;
    const mmLen = cmLen * 0.6;
    const halfCmLen = cmLen * 0.8;
    for(let i = 0;i<=degreeNumber;i++){
      const currentX = x + marginH + i * cm;
      ctx.moveTo(...rotateCoordinates(currentX,y));
      ctx.lineTo(...rotateCoordinates(currentX,y + cmLen));
      ctx.save();
      ctx.translate(...rotateCoordinates(currentX,textPos));
      ctx.rotate(angle * Math.PI / 180);
      ctx.fillText(String(i),0,0);
      ctx.restore();
      if(i<degreeNumber){
        for(let j = 1;j<10;j++){
          const currentMmX = currentX + j * mm;
          ctx.moveTo(...rotateCoordinates(currentMmX,y));
          if(j === 5){
            ctx.lineTo(...rotateCoordinates(currentMmX,y + halfCmLen));
          }else{
            ctx.lineTo(...rotateCoordinates(currentMmX,y + mmLen));
          }
        }
      }
    }
    ctx.stroke();
    ctx.restore();
  }
}