import type { Points } from '../type';
import { WriteModel } from '../enum';
import { generateCanvas } from '../utils';
export default class Eraser{
  canvas:HTMLCanvasElement;
  ctx:CanvasRenderingContext2D;
  svgPath = document.createElementNS('http://www.w3.org/2000/svg','path');
  svgPathStr:string = '';
  svgFragmentLen = 10;
  svgPointsGroup:{x:number,y:number,angle:number,d:number,x1:number,y1:number,x2:number,y2:number}[][] = [];

  basePointsGroup:[number,number,number][] = [];

  d = 1;
  prevD = 0;
  prevOriginD = 0;
  maxD = 2;
  color!:string;

  writeModel:WriteModel = WriteModel.WRITE;

  k = 0.8;

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
    this.ctx.lineJoin = 'round';
    this.ctx.lineWidth = this.voice;
    this.ctx.strokeStyle = this.color;


    const svgPointsGroup = this.svgPointsGroup;
    const groupLen = svgPointsGroup.length;
    if(groupLen){
      const originPoints:[number,number][] = [];
      this.svgPointsGroup.forEach(svgPoints=>{
        const len = svgPoints.length;
        const polyline1:[number,number][] = [];
        const polyline2:[number,number][] = [];

        for(let i = 0;i<len;i++){
          const points = svgPoints[i];
          const {x,y,x1,y1,x2,y2,angle} = points;
          if(!i){
            this.ctx.save();
            this.ctx.strokeStyle = 'green';
            this.ctx.beginPath();
            this.ctx.arc(x1,y1,2,0,Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();

            this.ctx.save();
            this.ctx.strokeStyle = 'blue';
            this.ctx.beginPath();
            this.ctx.arc(x2,y2,2,0,Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();

            this.ctx.save();
            this.ctx.strokeStyle = 'orange';
            this.ctx.beginPath();
            this.ctx.arc(x,y,2,0,Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
          }
          originPoints.push([x,y]);

        }


        for(let i = 0;i<len;i++){
          const points = svgPoints[i];
          const {x1,y1} = points;
          polyline1.push([x1,y1]);
        }

        for(let i = len - 1;i>=0;i--){
          const points = svgPoints[i];
          const {x2,y2} = points;
          polyline2.push([x2,y2]);
        }

        const polyline:[number,number][] = new Array().concat(polyline1).concat(polyline2);
        const polylineL = polyline.length;
        let pathStr = '';
        for(let i = -1;i<polylineL;i++){
          const A = polyline[(i + polylineL)%polylineL];
          const B = polyline[(i + 1 + polylineL)%polylineL];
          const C = polyline[(i + 2 + polylineL)%polylineL];
          const [B1,B2] = this.getBezierCurveControls(A,B,C);
          // if(i === -1){
          //   pathStr += `M${B[0]},${B[1]}C${B2[0]},${B2[1]},`;
          // } else if(i=== polylineL - 1){
          //   pathStr += `${B1[0]},${B1[1]},${B[0]},${B[1]}`;
          // }else{
          //   pathStr += `${B1[0]},${B1[1]},${B[0]},${B[1]},C${B2[0]},${B2[1]},`;
          // }

          if(i === -1){
            pathStr += `M${B[0]},${B[1]},`;
          } else{
            pathStr += `L${B[0]},${B[1]},`;
          }
        }
        this.ctx.beginPath();
        const path = new Path2D(pathStr);
        this.ctx.stroke(path);
        this.ctx.fill(path);

        // this.ctx.save();
        // this.ctx.strokeStyle = 'red';
        // this.ctx.beginPath();
        // originPoints.forEach((originPoint,idx)=>{
        //   if(!idx){
        //     this.ctx.moveTo(...originPoint);
        //   }else{
        //     this.ctx.lineTo(...originPoint);
        //   }
        // })
        // this.ctx.stroke();
        // this.ctx.restore();
      })
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
  reset(color:string){
    this.color = color;
    this.svgPointsGroup.length = 0;
  }
  submit(writingCtx:CanvasRenderingContext2D){
    writingCtx.drawImage(this.canvas,0,0);
    this.ctx.clearRect(0,0,this.width,this.height);
    this.basePointsGroup.length = 0;
    this.svgPointsGroup.length = 0;
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
          if (originD > this.voice * 2) {
            this.d = this.voice * 2;
          } else if (originD < this.voice * .5) {
            this.d = this.voice * .5;
          } else {
            this.d = originD;
          }
        }else{
          if(this.prevOriginD>originD){
            this.d -= 0.1 * this.voice;
          }else if(this.prevOriginD<originD){
            this.d += 0.1 * this.voice;
          }
        }
        this.prevOriginD = originD;
        if (this.d > this.maxD) {
          this.d = this.maxD;
        }else if(this.d < this.voice * .5){
          this.d = this.voice;
        }
        this.prevD = this.d;

        this.basePointsGroup.push([writeEndX,writeEndY,this.d]);
        this.basePointsGroup.forEach((basePoint,idx)=>{
          if(!idx){
            this.svgPathStr = `M${basePoint[0]},${basePoint[1]}`;
          }else{
            this.svgPathStr += `L${basePoint[0]},${basePoint[1]}`;
            this.svgPath.setAttribute('d',this.svgPathStr);
          }
        })
        const totalLen = this.svgPath.getTotalLength();
        if(this.basePointsGroup.length>1){
          const {x:startX,y:startY} = this.svgPath.getPointAtLength(Math.max(0,totalLen - this.svgFragmentLen));
          const {x:middleX,y:middleY} = this.svgPath.getPointAtLength((Math.max(0,totalLen - this.svgFragmentLen) + totalLen)/2);
          const {x:endX,y:endY} = this.svgPath.getPointAtLength(totalLen);
          const angle = Math.atan2(endY-startY,endX-startX);
          if(this.basePointsGroup.length === 2){
            this.pushSVGPoint(writeEndX,writeEndY,angle,0);
          }
          const justiceD = this.getJusticeD(this.d);
          this.pushSVGPoint(middleX,middleY,angle,justiceD);
        }
        this.svgPointsGroup.forEach(svgPoints=>{
          const firstSvgPoint = svgPoints[0];
          this.updateSVGPoint(firstSvgPoint,{d:0,angle:firstSvgPoint.angle});

          let avgAngle = 0;
          let count = 0;
          if(totalLen<this.voice * 10){
            svgPoints.forEach(point=>{
              avgAngle += point.angle;
              count ++;
            })
            if(count){
              avgAngle /= count;
              svgPoints.forEach(point=>{
                this.updateSVGPoint(point,{d:point.d,angle:avgAngle});
              })
            }
          }
        })
        this.draw();
      } else if (this.writeModel === WriteModel.DRAW) {
        this.d = this.voice;
      }
    }
  }
  getJusticeD(d:number){
    const flatPointsGloup = this.svgPointsGroup.flat();
    const expectLen = 5;
    const base = 20;
    let total = base;
    let sum = (base + expectLen) * d;
    const nearsestPoints = flatPointsGloup.slice(-expectLen);
    let len = nearsestPoints.length;
    for(let i = len - 1;i>=0;i--){
      const point = nearsestPoints[i];
      total += base + (i + 1);
      sum += (base + (i + 1)) * point.d;
    }
    return sum/total;
  }


  updateSVGPoint(point:{x:number,y:number,angle:number,d:number,x1:number,y1:number,x2:number,y2:number},attrs:{d:number,angle:number}){
    const angle1 = -Math.PI/2;
    const angle2 = Math.PI/2;
    const x1 = point.x + Math.cos(attrs.angle + angle1) * attrs.d;
    const y1 = point.y + Math.sin(attrs.angle + angle1) * attrs.d;
    const x2 = point.x + Math.cos(attrs.angle + angle2) * attrs.d;
    const y2 = point.y + Math.sin(attrs.angle + angle2) * attrs.d;
    point.x1 = x1;
    point.y1 = y1;
    point.x2 = x2;
    point.y2 = y2;
  }
  pushSVGPoint(x:number,y:number,angle:number,d:number){
    const angle1 = -Math.PI/2;
    const angle2 = Math.PI/2;
    const x1 = x + Math.cos(angle + angle1) * d;
    const y1 = y + Math.sin(angle + angle1) * d;
    const x2 = x + Math.cos(angle + angle2) * d;
    const y2 = y + Math.sin(angle + angle2) * d;
    const newPoint = {x,y,angle,d,x1,y1,x2,y2};
    let lastSvgPoints = this.svgPointsGroup[this.svgPointsGroup.length - 1];
    if(!lastSvgPoints){
      lastSvgPoints = [newPoint];
      this.svgPointsGroup.push(lastSvgPoints);
    }else{
      const lastSvgPoint = lastSvgPoints[lastSvgPoints.length - 1];
      const lastAngle = lastSvgPoint.angle;
      if(false){
        const newSvgPoints = [{...lastSvgPoint,angle},newPoint];
        this.svgPointsGroup.push(newSvgPoints);
      }else{
        lastSvgPoints.push(newPoint)
      }
    }
  }
}