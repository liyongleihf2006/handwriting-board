import {RotateCoordinates} from '../../utils';
export default class Triangle{
  path!:Path2D;

  width = 0;
  height = 0;
  marginC = 0;
  gap = 0;

  toolShapeCenterX = 500;
  toolShapeCenterY = 300;
  angle = 10;

  constructor(public ctx:CanvasRenderingContext2D,public cm:number,public mm:number,public degreeNumberH:number,public degreeNumberV:number,public marginH:number,public marginV:number){
    this.marginC = this.cm;
    this.width = this.cm * this.degreeNumberH + this.marginH + this.marginC;
    this.height = this.cm * this.degreeNumberV + this.marginV + this.marginC;
    this.gap = this.cm * 1.5;
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


    const rotateCoordinates = RotateCoordinates(angle,_cx,_cy);
    const path = new Path2D();
    path.moveTo(...rotateCoordinates(x+width,y));
    path.lineTo(...rotateCoordinates(x,y));
    path.lineTo(...rotateCoordinates(x,y+height));
    path.closePath();

    const gap = this.gap;
    const smallX = x + gap;
    const smallY = y + gap;
    const smallWidth = width / 2;
    const smallHeight = height / 2;
    path.moveTo(...rotateCoordinates(smallX+smallWidth,smallY));
    path.lineTo(...rotateCoordinates(smallX,smallY ));
    path.lineTo(...rotateCoordinates(smallX,smallY+smallHeight));
    path.closePath();

    this.path = path;
    return path;
  }
  draw(){
    const angle = this.angle;
    const cx = this.toolShapeCenterX;
    const cy = this.toolShapeCenterY;
    const ctx = this.ctx;
    const canvas = ctx.canvas;
    const marginC = this.marginC;
    const cm = this.cm;
    const mm = this.mm;
    const degreeNumberH = this.degreeNumberH;
    const degreeNumberV = this.degreeNumberV;

    const width = this.width;
    const height = this.height;
    const rotateCoordinates = RotateCoordinates(angle,cx,cy);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,.08)';
    const path = this.generatorOuterBorder(cx,cy,angle);
    ctx.fill(path,'evenodd');
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
    const mmLen = cmLen * 0.6;
    const halfCmLen = cmLen * 0.8;


    for(let i = 0;i<=degreeNumberH;i++){
      const currentX = x + marginC + i * cm;
      ctx.moveTo(...rotateCoordinates(currentX,y));
      ctx.lineTo(...rotateCoordinates(currentX,y + cmLen));
      ctx.save();
      ctx.translate(...rotateCoordinates(currentX,y + cmLen + mm));
      ctx.rotate(angle * Math.PI / 180);
      ctx.fillText(String(i),0,0);
      ctx.restore();
      if(i<degreeNumberH){
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
    for(let i = 0;i<=degreeNumberV;i++){
      const currentY = y + marginC + i * cm;
      ctx.moveTo(...rotateCoordinates(x,currentY));
      ctx.lineTo(...rotateCoordinates(x + cmLen,currentY));
      ctx.save();
      ctx.translate(...rotateCoordinates(x + cmLen + mm,currentY));
      ctx.rotate(angle * Math.PI / 180 - Math.PI/2);
      ctx.fillText(String(i),0,0);
      ctx.restore();
      if(i<degreeNumberV){
        for(let j = 1;j<10;j++){
          const currentMmY = currentY + j * mm;
          ctx.moveTo(...rotateCoordinates(x,currentMmY));
          if(j === 5){
            ctx.lineTo(...rotateCoordinates(x + halfCmLen,currentMmY));
          }else{
            ctx.lineTo(...rotateCoordinates(x + mmLen,currentMmY));
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