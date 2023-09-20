import type { Points } from '../type';
import { WriteModel } from '../enum';
import { generateCanvas } from '../utils';
export default class Eraser{
  canvas:HTMLCanvasElement;
  ctx:CanvasRenderingContext2D;

  basePointsGroup:[number,number,number][] = [];

  d = 1;
  prevD = 0;
  prevOriginD = 0;
  maxD = 2;
  color!:string;

  writeModel:WriteModel = WriteModel.WRITE;

  k = 0.5;

  constructor(
    public width:number,
    public height:number,
    public voice:number
  ){
    this.canvas = generateCanvas(width,height);
    this.ctx = this.canvas.getContext('2d')!;
  }
  checkoutPoints(){
    const minD = this.voice * 10;
    const checkoutPoints:[number,number,number][] = [];
    let firstPoints = this.basePointsGroup[0];
    let lastPoints = this.basePointsGroup[this.basePointsGroup.length - 1];
    let prevPoints:[number,number]|null = null;
    for(let i = 0;i<this.basePointsGroup.length;i++){
      const basePoints = this.basePointsGroup[i];
      if(!prevPoints){
        checkoutPoints.push(basePoints);
        prevPoints = [basePoints[0],basePoints[1]];
      }else if(i === this.basePointsGroup.length - 1){
        checkoutPoints.push(basePoints);
      }else{
        const prevX = prevPoints[0];
        const prevY = prevPoints[1];

        const firstX = firstPoints[0];
        const firstY = firstPoints[1];

        const lastX = lastPoints[0];
        const lastY = lastPoints[1];

        const baseX = basePoints[0];
        const baseY = basePoints[1];

        const prevLen = ((baseX - prevX) ** 2 + (baseY - prevY) ** 2) ** .5;
        const firstLen = ((baseX - firstX) ** 2 + (baseY - firstY) ** 2) ** .5;
        const lastLen = ((baseX - lastX) ** 2 + (baseY - lastY) ** 2) ** .5;

        if(prevLen<minD || firstLen<minD || lastLen<minD){
          continue;
        }else{
          checkoutPoints.push(basePoints);
          prevPoints = [basePoints[0],basePoints[1]];
        }
      }
    }
    return checkoutPoints;
  }
  draw(){
    this.ctx.clearRect(0,0,this.width,this.height);
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = this.color;
    const pointsGroup:[[number,number],[number,number],[number,number]][] = [];


    const group = this.checkoutPoints();
    for(let i = 0;i<group.length;i++){
      const basePoints = group[i];
      this.ctx.save();
      this.ctx.fillStyle = 'green';
      this.ctx.beginPath();
      this.ctx.arc(basePoints[0],basePoints[1],3,0,Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
    this.ctx.stroke();

    this.ctx.beginPath();

    for(let i = 0;i<group.length;i++){
      const basePoints = group[i];
      let x1;
      let y1;
      let x2;
      let y2;
      if(!i){
        [[x1,y1],[x2,y2]] = this.getOutlinePoints(basePoints,basePoints,group[1]||basePoints,basePoints[2]);
      }else if(i === group.length - 1){
        [[x1,y1],[x2,y2]] = this.getOutlinePoints(group[i-1],basePoints,basePoints,basePoints[2]);
      }else{
        [[x1,y1],[x2,y2]] = this.getOutlinePoints(group[i-1],basePoints,group[i + 1],basePoints[2]);
        this.ctx.beginPath();
        this.ctx.arc(x1,y1,3,0,Math.PI * 2);
        this.ctx.fill();

        this.ctx.save();
        this.ctx.fillStyle = 'red';
        this.ctx.beginPath();
        this.ctx.arc(x2,y2,3,0,Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
      
      

      
    }
    this.ctx.stroke();

  }

  findPerpendicularIntersection(A:[number,number,number], B:[number,number,number], C:[number,number,number],d:number): [number,number] {
    const x1 = A[0];
    const y1 = A[1];
    const x2 = B[0];
    const y2 = B[1];
    const x3 = C[0];
    const y3 = C[1];
    
    if(x1 === x3){
      return [x1,y2];
    }

    if(y1 === y3){
      return [x2,y1];
    }
  
    const k = (y3 - y1)/(x3 - x1);

    const b = (y1 * x3 - y3 * x1) / (x3 - x1);

    const k2 = -1/k;

    const b2 = y2 - k2 * x2;

    const x = (b2 - b)/(k - k2);

    const y = k * x + b;
    return [x,y];
  }

  private getOutlinePoints(A:[number,number,number],B:[number,number,number],C:[number,number,number],d:number):[[number,number],[number,number]]{
    const [tx,ty] = this.findPerpendicularIntersection(A,B,C,d);
    const tbL = ((tx - B[0]) ** 2 + (ty - B[1]) ** 2) ** .5;

    return [this.calculateExtendedPoint(B[0],B[1],tx,ty,d - tbL),this.calculateExtendedPoint(tx,ty,B[0],B[1],d)];
  }

  private getBezierCurveControls(A:[number,number],B:[number,number],C:[number,number]){
    const k = this.k;
    const bx = A[0] * (1 - k) + B[0] * k;
    const by = A[1] * (1 - k) + B[1] * k;
    const cx = B[0] * k + C[0] * (1 - k);
    const cy = B[1] * k + C[1] * (1 - k);
    const AB = ((B[0] - A[0]) ** 2 + (B[1] - A[1]) ** 2)**0.5;
    const BC = ((C[0] - B[0]) ** 2 + (C[1] - B[1]) ** 2)**0.5;
    if(AB === 0 && BC === 0){
      return [B,B];
    }
    const tx = bx * (AB/(AB + BC)) + cx * (BC/(AB + BC));
    const ty = by * (AB/(AB + BC)) + cy * (BC/(AB + BC));

    const mx = bx - tx;
    const my = by - ty;

    const b1x = bx + mx;
    const b1y = by + my;

    const c1x = cx + mx;
    const c1y = cy + my;

    return [[b1x,b1y],[c1x,c1y]];

  }
  calculateExtendedPoint(x1: number, y1: number, x2: number, y2: number, d: number): [number, number ] {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    const extendedLength = length + d;
    const ratio = extendedLength / length;
    
    const extendedX = x2 + (dx * ratio);
    const extendedY = y2 + (dy * ratio);
    
    return [extendedX, extendedY];
  }
  reset(color:string){
    this.color = color;
  }
  submit(writingCtx:CanvasRenderingContext2D){
    writingCtx.drawImage(this.canvas,0,0);
    this.ctx.clearRect(0,0,this.width,this.height);
    this.basePointsGroup.length = 0;
  }
  pushPoints(writeStartX: number, writeStartY: number, writeEndX: number, writeEndY: number, writeStartTime: number, writeEndTime: number) {
    const x1 = writeStartX;
    const y1 = writeStartY;
    const x2 = writeEndX;
    const y2 = writeEndY;
    const distance = ((y2 - y1) ** 2 + (x2 - x1) ** 2) ** 0.5;
    const originD = (writeEndTime - writeStartTime) / distance * this.voice;
    if (!isNaN(originD)) {
      if (this.writeModel === WriteModel.WRITE) {
        if(!this.prevOriginD){
          if (originD > this.d * 1.2) {
            this.d *= 1.2;
          } else if (originD < this.d / 1.2) {
            this.d /= 1.2;
          } else {
            this.d = originD;
          }
        }else{
          if(this.prevOriginD>originD){
            this.d -= 0.1;
          }else if(this.prevOriginD<originD){
            this.d += 0.1;
          }
        }
        this.prevOriginD = originD;
        if (this.d > this.maxD) {
          this.d = this.maxD;
        }
        this.prevD = this.d;

        this.basePointsGroup.push([writeEndX,writeEndY,this.d]);
        this.draw();
      } else if (this.writeModel === WriteModel.DRAW) {
        this.d = this.voice;
      }
      
    }
  }
}