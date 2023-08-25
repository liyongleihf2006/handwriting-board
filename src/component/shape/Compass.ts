import {RotateCoordinates,rotateAngle,calculateRotatedPoint} from '../../utils';
export default class Compass{
  path!:Path2D;

  r:number;
  middleR:number;
  smallR:number;
  middleGap:number;
  startAngle:number = 170;
  endAngle:number = 370;
  innerStartAngle:number = 180;
  innerEndAngle:number = 360;
  


  constructor(public ctx:CanvasRenderingContext2D,public cm:number,public mm:number){
    this.r = cm * 5;
    this.middleR = cm * 3.5;
    this.middleGap = cm * 0.5;
    this.smallR = cm * 2.2;
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
  generatorOuterBorder(_x:number,_y:number,_angle:number,voice = 0){
    const startAngle = this.startAngle;
    const endAngle = this.endAngle;
    const innerStartAngle = this.innerStartAngle;
    const innerEndAngle = this.innerEndAngle;
    const r = this.r + voice;
    const middleInsideR = this.middleR + voice;
    const middleOutsideR = middleInsideR + this.middleGap - voice;
    const smallR = this.smallR - voice;
    const cx = _x - voice + r;
    const cy = _y - voice + r;
    const innerCx = cx;
    const innerCy = cy - voice;
    const path = new Path2D();
    console.log(rotateAngle(startAngle,_angle));
    path.arc(cx,cy,r,rotateAngle(startAngle,_angle),rotateAngle(endAngle,_angle));
    path.closePath();
    path.moveTo(...calculateRotatedPoint(innerCx,innerCy,middleOutsideR,innerStartAngle,_angle));
    path.arc(innerCx,innerCy,middleOutsideR,rotateAngle(innerStartAngle,_angle),rotateAngle(innerEndAngle,_angle));
    path.lineTo(...calculateRotatedPoint(innerCx,innerCy,middleInsideR,innerEndAngle,_angle));
    path.arc(innerCx,innerCy,middleInsideR,rotateAngle(innerEndAngle,_angle),rotateAngle(innerStartAngle,_angle),true);
    path.lineTo(...calculateRotatedPoint(innerCx,innerCy,middleOutsideR,innerStartAngle,_angle));

    path.moveTo(...calculateRotatedPoint(innerCx,innerCy,smallR,innerStartAngle,_angle));
    path.arc(innerCx,innerCy,smallR,rotateAngle(innerStartAngle,_angle),rotateAngle(innerEndAngle,_angle));
    path.closePath();

    this.path = path;
    return path;
  }
  drawDegree(
    cx:number,
    cy:number,
    r:number,
    smallUnitL:number,
    unitL:number,
    bigUnitL:number,
    ruleFontSize:number,
    fontGap:number,
    showText:boolean,
    showSmall:boolean,
    showMiddle:boolean,
    textOnInner:boolean
  ){

    const ctx = this.ctx;
    
    // 刻度设置
    const total = 180; // 总刻度数
    const unitS = Math.PI / total; // 刻度线间隔角度
    const unitBigInterval = 10;
    const unitInterval = unitBigInterval;
    const ruleLoose = 5;
    // 绘制刻度和刻度的数值
    let angle = Math.PI; // 从圆弧顶点开始绘制
    ctx.save();
    ctx.textAlign = 'center'; // 设置文本对齐方式
    ctx.textBaseline = 'middle';
    ctx.font = `${ruleFontSize}px Arial`; // 文本字体
    if(!textOnInner){
      r += bigUnitL;
      ctx.textBaseline = 'bottom';
    }
    for (let i = 0; i <= total; i++) {
      if (i % unitBigInterval === 0) { // 大刻度
        const startX = cx + Math.cos(angle) * (r - bigUnitL); // 刻度线起始点横坐标
        const startY = cy + Math.sin(angle) * (r - bigUnitL); // 刻度线起始点纵坐标
        const endX = cx + Math.cos(angle) * r; // 刻度线结束点横坐标
        const endY = cy + Math.sin(angle) * r; // 刻度线结束点纵坐标
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        if(showText && i%unitInterval ===0){
          const textX = cx + Math.cos(angle) * (r - (bigUnitL + fontGap) * Number(textOnInner)); // 刻度文本位置横坐标
          const textY = cy + Math.sin(angle) * (r - (bigUnitL + fontGap) * Number(textOnInner)); // 刻度文本位置纵坐标
          ctx.save();
          ctx.textAlign = 'center';
          ctx.translate(textX,textY);
          ctx.rotate(angle + Math.PI/2);
          ctx.fillText(i.toString(),0,0);
          ctx.restore();
        }
      } else if(!(i%ruleLoose)) { // 中刻度
        if(showMiddle){
          const startX = cx + Math.cos(angle) * (r - unitL); // 刻度线起始点横坐标
          const startY = cy + Math.sin(angle) * (r - unitL); // 刻度线起始点纵坐标
          const endX = cx + Math.cos(angle) * r; // 刻度线结束点横坐标
          const endY = cy + Math.sin(angle) * r; // 刻度线结束点纵坐标
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      } else if(showSmall){
        const startX = cx + Math.cos(angle) * (r - smallUnitL); // 刻度线起始点横坐标
        const startY = cy + Math.sin(angle) * (r - smallUnitL); // 刻度线起始点纵坐标
        const endX = cx + Math.cos(angle) * r; // 刻度线结束点横坐标
        const endY = cy + Math.sin(angle) * r; // 刻度线结束点纵坐标
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
      angle += unitS; // 更新角度
    }
    ctx.restore();
  }
  drawContent(_x:number,_y:number,_angle:number){
    const r = this.r;
    const middleR = this.middleR;
    const smallR = this.smallR;
    const cx = _x + r;
    const cy = _y + r;

    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cx,cy);
    this.drawDegree(cx,cy,r,10,15,20,8,10,true,true,true,true);
    this.drawDegree(cx,cy,middleR,10,12,15,0,0,false,true,true,true);
    this.drawDegree(cx,cy,smallR,0,0,12,7,10,true,false,false,false);
    ctx.restore();
    

  }
  draw(x:number,y:number,angle:number){
    const ctx = this.ctx;
    const {width,height} = ctx.canvas;
    const cm = this.cm;
    const mm = this.mm;
    ctx.clearRect(0,0,width,height);
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,.08)';
    const path = this.generatorOuterBorder(x,y,angle);
    ctx.fill(path,'evenodd');
    ctx.stroke(path);
    ctx.restore();

    this.drawContent(x,y,angle);
  }

}