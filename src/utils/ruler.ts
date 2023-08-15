import {RotateCoordinates} from '../utils';
export default class Ruler{
  path!:Path2D;
  pathInner!:Path2D|null;
  isPointInPathInnerVoice:number;
  getNearestDistanceAndPointVoice:number;
  outline!:[number,number][] | null;
  offscreen!:OffscreenCanvas | null;

  longestDistance = 30;
  // 可以用来绘制的距离
  shouldWriteDistance = 3;
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


  constructor(public ctx:CanvasRenderingContext2D,public voice:number){
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
    this.offscreen = null;
  }
  setXYAngle(x:number,y:number,angle:number){
    this.x = x;
    this.y = y;
    this.angle = angle;
  }
  getNearestDistanceAndPoint(x:number,y:number,getNearestDistanceAndPointVoice:number){
    if(!this.outline || getNearestDistanceAndPointVoice !== this.getNearestDistanceAndPointVoice){
      this.getNearestDistanceAndPointVoice = getNearestDistanceAndPointVoice;
      this.outline = this.getOutline(this.getNearestDistanceAndPointVoice);
    }
    const outline = this.outline;
    const len = outline.length;
    const points:[number,number][] = [];
    let nearestDistance = Number.MAX_SAFE_INTEGER;
    for(let i = 0;i<len;i++){
      const [x0,y0] = outline[i];
      const distance = ((x-x0)**2 + (y-y0)**2)**0.5;
      if(distance<nearestDistance){
        nearestDistance = distance;
      }
    }
    for(let i = 0;i<len;i++){
      const [x0,y0] = outline[i];
      const distance = ((x-x0)**2 + (y-y0)**2)**0.5;
      if(distance<=nearestDistance + this.shouldWriteDistance){
        points.push([x0,y0]);
      }
    }
    return {conformingToDistance:nearestDistance<=this.longestDistance,nearestPoints:points};
  }
  getOutline(outlineVoice:number){
    const ctx = this.ctx;
    const canvas = ctx.canvas;
    const {width,height} = canvas;
    const offscreen = new OffscreenCanvas(width, height);
    const c = offscreen.getContext('2d')!;
    const path = this.generatorOuterBorder(outlineVoice);
    c.strokeStyle = 'red';
    c.stroke(path);
    const imageData = c.getImageData(0,0,width,height);
    const data = imageData.data;
    const len = data.length;
    const outline:[number,number][] = [];
    let row = 0;
    let column = -1;
    for(let i = 0;i<len;i+=4){
      column++;
      if(data[i+3]>128){
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
      this.pathInner = this.generatorOuterBorder(-isPointInPathInnerVoice);
    }
    return this.ctx.isPointInPath(this.pathInner,x,y);
  }
  isPointInPath(x:number,y:number){
    return this.ctx.isPointInPath(this.path,x,y);
  }
  generatorOuterBorder(voice = 0){
    const x = this._x - voice;
    const y = this._y - voice;
    const angle = this._angle;
    const width = this.width + voice * 2;
    const height = this.height + voice * 2;
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
  draw(){
    if(!this.offscreen){
      const c = this.ctx;
      const canvas = c.canvas;
      this.offscreen = new OffscreenCanvas(canvas.width,canvas.height);
      const ctx = this.offscreen.getContext('2d')!;
      const marginH = this.marginH;
      const cm = this.cm;
      const mm = this.mm;
      const degreeNumber = this.degreeNumber;
      const x = this.x;
      const y = this.y;
      const angle = this.angle;
      const rotateCoordinates = RotateCoordinates(angle,x,y);
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
    return this.offscreen;
  }
}