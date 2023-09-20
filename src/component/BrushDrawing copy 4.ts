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

    const getBezierCurveControls = (p1:PointType,p2:PointType)=>{
      
      const x1 = p1.x;
      const y1 = p1.y;
      const x3 = p2.x;
      const y3 = p2.y;
      const distance = (p1.distance + p2.distance)/2;
      
      const {x:x2,y:y2} = this.svgPath.getPointAtLength(distance);


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

    cleanSvgPoints.forEach(points=>{
      // points.forEach(point=>{
      //   this.ctx.save();
      //   this.ctx.beginPath();
      //   this.ctx.arc(point.x,point.y,2,0,Math.PI * 2);
      //   this.ctx.stroke();
      //   this.ctx.restore();
      // })
      for(let i = 0;i<points.length - 1;i++){
        const p1 = points[i];
        const p2 = points[i+1];
        const [p3,p4] = getBezierCurveControls(p1,p2);
        // for(let i = 0;i<controls.length;i++){
        //   const {x,y} = controls[i];
        //   this.ctx.save();
        //   this.ctx.strokeStyle = i%2?'red':'green';
        //   this.ctx.beginPath();
        //   this.ctx.arc(x,y,2,0,Math.PI * 2);
        //   this.ctx.stroke();
        //   this.ctx.restore();
        // }

        let pathStr = `M${p1.x},${p1.y}C${p3.x},${p3.y},${p4.x},${p4.y},${p2.x},${p2.y}`;

        this.ctx.beginPath();
        this.ctx.save();
        this.ctx.strokeStyle = 'red';
        const path = new Path2D(pathStr);
        this.ctx.stroke(path);
        this.ctx.restore();
        
      }
    })

    
    function getQuadraticPoint(p1:PointType,p2:PointType){
      let targetX:number;
      let targetY:number;
      if((p1.angle === 90 || p1.angle === -90) && (p2.angle === 90 || p2.angle === -90)){
        targetX = (p1.x + p2.x)/2;
        targetY = (p2.y + p2.y)/2;
      }else if(p1.angle === 90 || p1.angle === -90){
        const k2 = Math.tan(p2.angle / 180 * Math.PI);
        const b2 = p2.y - k2 * p2.x;
        targetX = p1.x;
        targetY = k2 * targetX + b2;
      }else if (p2.angle === 90 || p2.angle === -90){
        const k1 = Math.tan(p1.angle / 180 * Math.PI);
        const b1 = p1.y - k1 * p1.x;
        targetX = p2.x;
        targetY = k1 * targetX + b1;
      }else{
        const k1 = Math.tan(p1.angle / 180 * Math.PI);
        const k2 = Math.tan(p2.angle / 180 * Math.PI);
        const b1 = p1.y - k1 * p1.x;
        const b2 = p2.y - k2 * p2.x;
        targetX = (b2 - b1)/(k1 - k2);
        targetY = k1 * targetX + b1;
      }
      return {x:targetX,y:targetY};
    }

    // if(this.basePoints.length>1){
    //   const size = this.svgFragmentLens.length;
    //   const prevFragmentLen = this.svgFragmentLens[size - 2];
    //   const currentFragmentLen = this.svgFragmentLens[size - 1];
    //   const {x:x1,y:y1} = this.svgPath.getPointAtLength(currentFragmentLen - 5);
    //   const {x:x2,y:y2} = this.svgPath.getPointAtLength(currentFragmentLen);
    //   const angle = Math.atan2(y2-y1,x2-x1);
      
      



    //   console.log(angle/Math.PI * 180);
    //   this.ctx.save();
    //   if(angle/Math.PI * 180 !==0){
    //     this.ctx.strokeStyle = 'red';
    //   }
    //   this.ctx.beginPath();
    //   this.ctx.arc(x2,y2,2,0,Math.PI * 2);
    //   this.ctx.stroke();
    //   this.ctx.restore();
      
    // }
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
        
        this.draw(writeEndX,writeEndY,this.basePoints.length===1);
      } else if (this.writeModel === WriteModel.DRAW) {
        this.d = this.voice;
      }
    }
  }

}