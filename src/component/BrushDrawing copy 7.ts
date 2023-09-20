import type { Points } from '../type';
import { WriteModel } from '../enum';
import { generateCanvas } from '../utils';
export default class Eraser{
  canvas:HTMLCanvasElement;
  ctx:CanvasRenderingContext2D;
  svgPath = document.createElementNS('http://www.w3.org/2000/svg','path');
  svgPathStr:string = '';
  svgFragmentLens:number[] = [];
  basePoints:[number,number,number][] = [];

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

  reset(color:string){
    this.color = color;
  }
  submit(writingCtx:CanvasRenderingContext2D){
    this.adjust();
    writingCtx.drawImage(this.canvas,0,0);
    this.ctx.clearRect(0,0,this.width,this.height);
    this.basePoints.length = 0;
    this.svgFragmentLens.length = 0;
  }

  draw(x:number,y:number,start:boolean){
    if(start){
      this.ctx.moveTo(x,y);
    }else{
      this.ctx.lineTo(x,y);
    }
    this.ctx.stroke();
  }
  
  adjust(){
    type PointType = {x:number,y:number,d:number,angle:number,distance:number};
    const delta = 5;
    const svgPoints:PointType[] = [];
    const svgPointsGroup:PointType[][] = [];
    const cleanSvgPoints:PointType[][] = [];
    // 旋转超过度数就重新分组
    const maxAngle = 30;
    // 每个组中距离小于距离那么就舍弃掉这个点
    const minDistance = 30;
    let restart = true;
    this.basePoints.forEach((basePoint,idx)=>{
      if(!idx){
        this.svgPathStr = `M${basePoint[0]},${basePoint[1]}`;
        this.svgFragmentLens.push(0);
      }else{
        this.svgPathStr += `L${basePoint[0]},${basePoint[1]}`;
        this.svgPath.setAttribute('d',this.svgPathStr);
        const totalLen = this.svgPath.getTotalLength();
        this.svgFragmentLens.push(totalLen);
      }
    })
  
    this.svgFragmentLens.forEach((currentLen,idx)=>{
      const currentBasePoint = this.basePoints[idx];
      if(idx !== this.svgFragmentLens.length - 1){
        const [x1,y1] = currentBasePoint;
        const {x:x2,y:y2} = this.svgPath.getPointAtLength(currentLen + delta);
        const angle = Math.atan2(y2-y1,x2-x1)/Math.PI * 180;
        svgPoints.push({x:x1,y:y1,d:currentBasePoint[2],angle,distance:currentLen});
      }else{
        const {x:x1,y:y1} = this.svgPath.getPointAtLength(currentLen - delta);
        const [x2,y2] = currentBasePoint;
        const angle = Math.atan2(y2-y1,x2-x1)/Math.PI * 180;
        svgPoints.push({x:x2,y:y2,d:currentBasePoint[2],angle,distance:currentLen});
      }
    })

    svgPoints.reduce((prevAngle,svgPoint,idx)=>{
      if(!idx){
        svgPointsGroup.push([svgPoint]);
        return svgPoint.angle;
      }else{
        const lastGroup = svgPointsGroup[svgPointsGroup.length - 1];
        const angle = svgPoint.angle;
        if(Math.abs(angle - prevAngle)>maxAngle && idx !== svgPoints.length - 1){
          lastGroup.push(svgPoint);
          svgPointsGroup.push([svgPoint]);
          return angle;
        }else{
          lastGroup.push(svgPoint);
          return prevAngle;
        }
      }
    },0);

    // svgPointsGroup.forEach(group => {
    //   const len =group.length;
    //   const total = group.reduce((prevDistance,svgPoint)=>{
    //     return prevDistance + svgPoint.d;
    //   },0)
    //   const avgD = total/len;
    //   svgPointsGroupAvgDs.push(avgD);
    // })
    svgPointsGroup.forEach(group=>{
      group.reduce((prevDistance,svgPoint,idx)=>{
        const distance = svgPoint.distance;
        if(!idx){
          cleanSvgPoints.push([svgPoint]);
          return distance;
        }else{
          const lastPoints = cleanSvgPoints[cleanSvgPoints.length - 1];
          if(idx === group.length - 1){
            lastPoints.push(svgPoint);
            return distance;
          }else{
            if(prevDistance + minDistance<distance && distance + minDistance < group[group.length - 1].distance){
              lastPoints.push(svgPoint);
              return distance;
            }else{
              return prevDistance;
            }
          }
        }
      },0);
    })


    console.log(svgPoints);

    console.log(cleanSvgPoints);

    console.log(svgPointsGroup);
    const getBezierCurveControls = (p1:PointType,p2:PointType,p3:PointType)=>{
      
      const x1 = p1.x;
      const y1 = p1.y;
      const x2 = p2.x;
      const y2 = p2.y;
      const x3 = p3.x;
      const y3 = p3.y;

      const k = this.k;
      const bx = x1 * (1 - k) + x2 * k;
      const by = y1 * (1 - k) + y2 * k;
      const cx = x2 * k + x3 * (1 - k);
      const cy = y2 * k + y3 * (1 - k);
      const AB = ((x2 - x1) ** 2 + (y2 - y1) ** 2)**0.5;
      const BC = ((x3 - x2) ** 2 + (y3 - y2) ** 2)**0.5;

      const tx = bx * (AB/(AB + BC)) + cx * (BC/(AB + BC));
      const ty = by * (AB/(AB + BC)) + cy * (BC/(AB + BC));
  
      const mx = bx - tx;
      const my = by - ty;
  
      const b1x = bx + mx;
      const b1y = by + my;
  
      const c1x = cx + mx;
      const c1y = cy + my;
  
      return [{x:b1x,y:b1y},{x:c1x,y:c1y}];
    }
    // const getBezierCurveControls = (p1:PointType,p2:PointType)=>{
      
    //   const x1 = p1.x;
    //   const y1 = p1.y;
    //   const x3 = p2.x;
    //   const y3 = p2.y;
    //   const distance = (p1.distance + p2.distance)/2;
      
    //   const {x:x2,y:y2} = this.svgPath.getPointAtLength(distance);


    //   const k = this.k;
    //   const bx = x1 * (1 - k) + x2 * k;
    //   const by = y1 * (1 - k) + y2 * k;
    //   const cx = x2 * k + x3 * (1 - k);
    //   const cy = y2 * k + y3 * (1 - k);
    //   const AB = ((x2 - x1) ** 2 + (y2 - y1) ** 2)**0.5;
    //   const BC = ((x3 - x2) ** 2 + (y3 - y2) ** 2)**0.5;

    //   const tx = bx * (AB/(AB + BC)) + cx * (BC/(AB + BC));
    //   const ty = by * (AB/(AB + BC)) + cy * (BC/(AB + BC));
  
    //   const mx = bx - tx;
    //   const my = by - ty;
  
    //   const b1x = bx + mx;
    //   const b1y = by + my;
  
    //   const c1x = cx + mx;
    //   const c1y = cy + my;
  
    //   return [{x:b1x,y:b1y},{x:c1x,y:c1y}];
    // }

    cleanSvgPoints.forEach(points=>{

      let pathStr = '';
      if(points.length <= 1){
        return;
      }else if(points.length === 2){
        const p1 = points[0];
        const p2 = points[1];
        pathStr = `M${p1.x},${p1.y}L${p2.x},${p2.y}`
      }else{
        for(let i = 1;i<points.length - 1;i++){
          const p1 = points[i-1];
          const p2 = points[i];
          const p3 = points[i+1];
          const [b1,b2] = getBezierCurveControls(p1,p2,p3);


          this.ctx.beginPath();
          this.ctx.save();
          this.ctx.strokeStyle = 'red';
          this.ctx.arc(b1.x,b1.y,2,0,Math.PI*2);
          this.ctx.stroke();
          this.ctx.restore();

          this.ctx.beginPath();
          this.ctx.save();
          this.ctx.strokeStyle = 'red';
          this.ctx.arc(b2.x,b2.y,2,0,Math.PI*2);
          this.ctx.stroke();
          this.ctx.restore();

          if(i === 1){
            pathStr += `M${p1.x},${p1.y} Q${b1.x},${b1.y},${p2.x},${p2.y}C${b2.x},${b2.y}`;
          }else if(i<points.length - 2){
            pathStr += `${b1.x},${b1.y},${p2.x},${p2.y}C${b2.x},${b2.y}`;
          }else{
            pathStr += `${b1.x},${b1.y},${p2.x},${p2.y}Q${b2.x},${b2.y},${p3.x},${p3.y}`;
          }
        }
      }
      this.ctx.beginPath();
      this.ctx.save();
      this.ctx.strokeStyle = 'green';
      const path = new Path2D(pathStr);
      this.ctx.stroke(path);
      this.ctx.restore();
    })
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

        this.basePoints.push([writeEndX,writeEndY,this.d]);
        
        // this.draw(writeEndX,writeEndY,this.basePoints.length===1);
      } else if (this.writeModel === WriteModel.DRAW) {
        this.d = this.voice;
      }
    }
  }

}