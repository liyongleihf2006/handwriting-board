import {RotateCoordinates} from '../../utils';
export default class Ruler{
  path!:Path2D;

  width = 0;
  height = 0;
  marginH = 0;
  degreeNumber = 20;


  constructor(public ctx:CanvasRenderingContext2D,public cm:number,public mm:number){
    this.marginH = this.mm * 5;
    this.width = this.cm * this.degreeNumber + this.marginH * 2;
    this.height = this.cm * 2;
  }
  getOutlineCtx(_x:number,_y:number,_angle:number,outlineVoice:number,strokeStyle:string){
    const ctx = this.ctx;
    const canvas = ctx.canvas;
    const {width,height} = canvas;
    const offscreen = new OffscreenCanvas(width, height);
    const c = offscreen.getContext('2d')!;
    const path = this.generatorOuterBorder(_x,_y,_angle,outlineVoice);
    c.strokeStyle = strokeStyle;
    c.lineWidth = outlineVoice;
    c.stroke(path);
    return c;
  }
  generatorOuterBorder(_cx:number,_cy:number,_angle:number,voice = 0){
    const width = this.width + voice;
    const height = this.height + voice;
    const x = _cx - voice/2 - width/2;
    const y = _cy - voice/2 - height/2;
    const angle = _angle;

    const cm = this.cm;
    const rotateCoordinates = RotateCoordinates(angle,_cx,_cy);
    let pathStr = '';
    pathStr += `M${rotateCoordinates(x,y).join(',')}`;
    pathStr += `L${rotateCoordinates(x+width,y).join(',')}`;
    pathStr += `L${rotateCoordinates(x+width,y+height).join(',')}`;
    const offestX = 1.5 * cm + this.marginH + voice/2;
    const beginWaveX = x+width - offestX;
    const beginWaveY = y+height;
    const endWaveX = x + offestX;
    const waveUnit = cm *2/3;
    const waveUnitY = waveUnit/4;
    const waveY = beginWaveY - waveUnitY;
    pathStr += `L${rotateCoordinates(beginWaveX,beginWaveY).join(',')}`;
    let currentWaveUnit = beginWaveX - waveUnit;
    while(currentWaveUnit>endWaveX){
      pathStr += `C${[...rotateCoordinates(currentWaveUnit + waveUnit/3, waveY - waveUnitY),...rotateCoordinates(currentWaveUnit + waveUnit*2/3, waveY + waveUnitY), ...rotateCoordinates(currentWaveUnit, beginWaveY)].join(',')}`;
      currentWaveUnit -= waveUnit;
    }
    pathStr += `L${rotateCoordinates(x,beginWaveY).join(',')}`;

    pathStr += 'z';
    const path = new Path2D(pathStr);
    this.path = path;
    return path;
  }
  draw(cx:number,cy:number,angle:number){
    const ctx = this.ctx;
    const canvas = ctx.canvas;
    const marginH = this.marginH;
    const cm = this.cm;
    const mm = this.mm;
    const degreeNumber = this.degreeNumber;
    const width = this.width;
    const height = this.height;
    const rotateCoordinates = RotateCoordinates(angle,cx,cy);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,.08)';
    const path = this.generatorOuterBorder(cx,cy,angle);
    ctx.fill(path);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'black';
    ctx.font = "3mm serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.beginPath();
    const cmLen = 0.5 * cm;
    const x = cx - width/2;
    const y = cy - height/2;
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
  isPointInPath(x:number,y:number,fillRule:CanvasFillRule){
    return this.ctx.isPointInPath(this.path,x,y,fillRule);
  }
}