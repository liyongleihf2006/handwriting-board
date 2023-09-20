import type { Points } from '../type';
import { WriteModel } from '../enum';
import { generateCanvas } from '../utils';
export default class Eraser{
  canvas:HTMLCanvasElement;
  ctx:CanvasRenderingContext2D;

  pointsGroup:Points[] = [];
  basePoints:[number,number,number,number,number][] = [];

  d = 1;
  prevD = 0;
  prevOriginD = 0;
  prevAngle!:number|undefined;
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
  draw(){
    this.ctx.clearRect(0,0,this.width,this.height);
    this.basePoints.forEach((basePoint=>{
      this.drawEllipse(...basePoint);
    }))
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = this.color;
    const pointsGroup = this.pointsGroup;
    // for(let i = pointsGroup.length - 1;i>=0;i--){
    //   if(i&&i!==pointsGroup.length - 1){
    //     const points = pointsGroup[i];
    //     const [x1,y1] = points[5];
    //     const [x2,y2] = points[6];
    //     if(((x2 - x1) ** 2 + (y2 - y1) ** 2) ** .5 <this.voice){
    //       pointsGroup.splice(i,1);
    //     }
    //   }
    // }
    const len = pointsGroup.length;
    if(len){
      const polyline1:[number,number][] = [];
      const polyline2:[number,number][] = [];
      const len = pointsGroup.length;

      for(let i = 0;i<len;i++){
        const points = pointsGroup[i];
        const [[x11,y11],[x12,y12],[x21,y21],_2,[x3,y3],[x1,y1],[x2,y2]] = points;

        // this.ctx.save();
        // this.ctx.fillStyle = 'yellow';
        // this.ctx.beginPath();
        // this.ctx.arc(x1,y1,3,0,Math.PI * 2);
        // this.ctx.fill();
        // this.ctx.restore();

        // this.ctx.save();
        // this.ctx.fillStyle = 'green';
        // this.ctx.beginPath();
        // this.ctx.arc(x2,y2,3,0,Math.PI * 2);
        // this.ctx.fill();
        // this.ctx.restore();

        // this.ctx.beginPath();
        // this.ctx.arc(x11,y11,3,0,Math.PI * 2);
        // this.ctx.fill();

        // this.ctx.save();
        // this.ctx.fillStyle = 'red';
        // this.ctx.beginPath();
        // this.ctx.arc(x12,y12,3,0,Math.PI * 2);
        // this.ctx.fill();
        // this.ctx.restore();
        if(!i){
          polyline1.push([x11,y11],[x21,y21]);
        }else if(i === len - 1){
          polyline1.push([x21,y21]);
          polyline1.push([x3,y3]);
          this.ctx.beginPath();
          this.ctx.arc(x3,y3,3,0,Math.PI * 2);
          this.ctx.fill();
        }else{
          polyline1.push([x21,y21]);
        }
      }
      // for(let i = len - 1;i>=0;i--){
      //   const points = pointsGroup[i];
      //   const [_,[x12,y12],_2,[x22,y22],[x3,y3]] = points;
      //   if(i === len - 1){
      //     polyline2.push([x22,y22],[x12,y12]);
      //   }else if (!i){
      //     polyline2.push([x12,y12]);
      //     polyline2.push([x3,y3]);
      //     this.ctx.beginPath();
      //     this.ctx.arc(x3,y3,3,0,Math.PI * 2);
      //     this.ctx.fill();
      //   }else{
      //     polyline2.push([x12,y12]);
      //   }
      // }
      // const polyline:[number,number][] = new Array().concat(polyline1).concat(polyline2);
      // const polylineL = polyline.length;
      // let pathStr = '';
      // for(let i = -1;i<polylineL;i++){
      //   const A = polyline[(i + polylineL)%polylineL];
      //   const B = polyline[(i + 1 + polylineL)%polylineL];
      //   const C = polyline[(i + 2 + polylineL)%polylineL];
      //   const [B1,B2] = this.getBezierCurveControls(A,B,C);
      //   if(i === -1){
      //     pathStr += `M${B[0]},${B[1]}C${B2[0]},${B2[1]},`;
      //   } else if(i=== polylineL - 1){
      //     pathStr += `${B1[0]},${B1[1]},${B[0]},${B[1]}`;
      //   }else{
      //     pathStr += `${B1[0]},${B1[1]},${B[0]},${B[1]},C${B2[0]},${B2[1]},`;
      //   }
      // }
      // this.ctx.beginPath();
      // const path = new Path2D(pathStr);
      // this.ctx.stroke(path);
      // this.ctx.beginPath();

    }
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
  private getCornersCoordinate(x1: number, y1: number, x2: number, y2: number, d: number): [[number, number], [number, number], [number, number], [number, number],[number,number],[number,number],[number,number]] {
    const [x3,y3] = this.calculateExtendedPoint(x1,y1,x2,y2,d);
    const angle1 = -Math.PI/2;
    const angle2 = Math.PI/2;
    let angle = Math.atan2(y2 - y1,x2 - x1);
    
    const x11 = x1 + Math.cos(angle + angle1) * d;
    const y11 = y1 + Math.sin(angle + angle1) * d;
    const x12 = x1 + Math.cos(angle + angle2) * d;
    const y12 = y1 + Math.sin(angle + angle2) * d;

    const x21 = x2 + Math.cos(angle + angle1) * d;
    const y21 = y2 + Math.sin(angle + angle1) * d;
    const x22 = x2 + Math.cos(angle + angle2) * d;
    const y22 = y2 + Math.sin(angle + angle2) * d;
    const pointsGroupLen = this.pointsGroup.length;
    if(pointsGroupLen){
      const lastPoints = this.pointsGroup[pointsGroupLen-1];
      const [lastX21,lastY21] = lastPoints[2];
      if(((x11 - lastX21) ** 2 + (y11 - lastY21) ** 2) >((x12 - lastX21) ** 2 + (y12 - lastY21) ** 2)){
        return [[x12, y12],[x11, y11], [x22, y22],[x21, y21],[x3,y3],[x1,y1],[x2,y2]];
      }
    }
    return [[x11, y11], [x12, y12], [x21, y21], [x22, y22],[x3,y3],[x1,y1],[x2,y2]];
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
    this.pointsGroup.length = 0;
    this.basePoints.length = 0;
    this.prevAngle = undefined;
  }
  drawEllipse(x:number,y:number,rx:number,ry:number,angle:number){
    this.ctx.save();
    this.ctx.translate(x,y);
    this.ctx.rotate(angle);
    this.ctx.beginPath();
    this.ctx.ellipse(0,0,1,1,0,0,Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
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
        if(!this.prevD){
          this.prevD = this.d;
        }
        const angle = Math.atan2(y2 - y1,x2 - x1);
        if(this.prevAngle === undefined){
          this.prevAngle = angle;
        }
        const xLen = Math.abs(x2 - x1);
        const yLen = Math.abs(y2 - y1);
        const len = Math.max(xLen,yLen);
        const preX = (x2 - x1) / len;
        const preY = (y2 - y1) / len;
        const preD = (this.d - this.prevD) / len;
        const preAngle = (angle - this.prevAngle) / len;
        
        for(let i = 0;i<len;i++){
          const rx = (this.prevD + preD * i) * 0.8;
          const ry = (this.prevD + preD * i) * 0.6;
          this.basePoints.push([x1 + preX * i,y1 + preY * i,rx,ry,this.prevAngle + preAngle]);
        }

        this.prevAngle = angle;
        this.prevD = this.d;
      } else if (this.writeModel === WriteModel.DRAW) {
        this.d = this.voice;
      }
      const points = this.getCornersCoordinate(x1, y1, x2, y2, this.d);
      const hasNaN = points.flat().some(xy => {
        return isNaN(xy);
      });
      if (!hasNaN) {
        this.pointsGroup.push(points);
      } else if (!distance) {
        let d = this.voice;
        if (this.writeModel === WriteModel.WRITE) {
          let rate = (writeEndTime - writeStartTime) / 250;
          if (rate > 2) {
            rate = 2;
          } else if (rate < 1) {
            rate = 1;
          }
          d = this.voice * rate;
        }
        const points: Points = [
          [x1 - d, y1 - d],
          [x1 - d, y1 + d],
          [x1 + d, y1 - d],
          [x1 + d, y1 + d],
          [x1,y1],
          [x1,y1],
          [x1,y1]
        ];
        this.pointsGroup.push(points);
      }
      this.draw();
    }
  }
}