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
    type PointType = {x:number,y:number,d:number,angle1:number,angle2:number,distance:number,realAngle?:number};
    const delta = 5;
    const svgPoints:PointType[] = [];
    const svgPointsGroup:PointType[][] = [];
    const cleanSvgPoints:PointType[][] = [];
    // 旋转超过度数就重新分组
    const maxAngle = 720;
    // 每个组中距离小于距离那么就舍弃掉这个点
    const minDistance = 0;
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
      if(!idx){
        const [x,y] = currentBasePoint;
        const {x:x2,y:y2} = this.svgPath.getPointAtLength(currentLen + delta);
        const angle = Math.atan2(y2-y,x2-x)/Math.PI * 180;
        svgPoints.push({x,y,d:currentBasePoint[2],angle1:angle,angle2:angle,distance:currentLen});
      }else if(idx !== this.svgFragmentLens.length - 1){
        const [x,y] = currentBasePoint;
        const {x:x1,y:y1} = this.svgPath.getPointAtLength(currentLen - delta);
        const {x:x2,y:y2} = this.svgPath.getPointAtLength(currentLen + delta);
        const angle1 = Math.atan2(y1-y,x1-x)/Math.PI * 180;
        const angle2 = Math.atan2(y2-y,x2-x)/Math.PI * 180;
        svgPoints.push({x,y,d:currentBasePoint[2],angle1,angle2,distance:currentLen});
      }else{
        const {x:x1,y:y1} = this.svgPath.getPointAtLength(currentLen - delta);
        const [x,y] = currentBasePoint;
        const angle = Math.atan2(y-y1,x-x1)/Math.PI * 180;
        svgPoints.push({x,y,d:currentBasePoint[2],angle1:angle,angle2:angle,distance:currentLen});
      }
    })

    svgPoints.reduce((prevAngle,svgPoint,idx)=>{
      if(!idx){
        svgPointsGroup.push([svgPoint]);
        return svgPoint.angle2;
      }else{
        const lastGroup = svgPointsGroup[svgPointsGroup.length - 1];
        const angle2 = svgPoint.angle2;
        if(Math.abs(angle2 - prevAngle)>maxAngle && idx !== svgPoints.length - 1){
          lastGroup.push(svgPoint);
          svgPointsGroup.push([svgPoint]);
          return angle2;
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


    
    cleanSvgPoints.forEach(points=>{
      for(let i = 0;i<points.length;i++){
        const p1 = points[i-1];
        const p2 = points[i];
        const p3 = points[i+1];
        if(!i){
          p2.realAngle = Math.atan2(p3.y - p2.y,p3.x - p2.x);
        }else if(i === points.length - 1){
          p2.realAngle = Math.atan2(p2.y - p1.y,p2.x - p1.x);
        }else{
          p2.realAngle = Math.atan2(p3.y - p1.y,p3.x - p1.x);
        }
      }
    })


    console.log(cleanSvgPoints);
    const getBezierCurveControls = (p1:{x:number,y:number},p2:{x:number,y:number},pm:{x:number,y:number})=>{
      
      const x1 = p1.x;
      const y1 = p1.y;
      const x3 = p2.x;
      const y3 = p2.y;
      
      const {x:x2,y:y2} = pm;


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

    const getAvgD = (group:PointType[],p1:PointType,p2:PointType)=>{
      const p1Index = group.indexOf(p1);
      const p2Index = group.indexOf(p2);
      const points = group.slice(p1Index,p2Index + 1);
      const midDistance = (p1.distance + p2.distance)/2;
      const baseWeight = midDistance * 2;
      let total = 0;
      let count = 0;
      points.forEach(point=>{
        const betweenDistance = Math.abs(point.distance - midDistance);
        const len = baseWeight - betweenDistance;
        count += len;
        total += point.d * len;
      })
      return total / count;
    }

    const getCornersCoordinate = (x: number, y: number, angle:number, d: number): {x:number,y:number}[] => {
      const angle1 = -Math.PI/2;
      const angle2 = Math.PI/2;
      
      const x1 = x + Math.cos(angle + angle1) * d;
      const y1 = y + Math.sin(angle + angle1) * d;

      const x2 = x + Math.cos(angle + angle2) * d;
      const y2 = y + Math.sin(angle + angle2) * d;

      return [{x:x1,y:y1},{x:x2,y:y2}];
    }
    cleanSvgPoints.forEach((points,idx)=>{

      let pathStr = '';
      const currentGroup = svgPointsGroup[idx];
      const firstPoint = currentGroup[0];
      const lastPoint = currentGroup[currentGroup.length - 1];
      const avgD = getAvgD(currentGroup,firstPoint,lastPoint);
      for(let i = 0;i<points.length - 1;i++){
        const p1 = points[i];
        const p2 = points[i+1];
        const midDistance = (p1.distance + p2.distance)/2;
        const pm = this.svgPath.getPointAtLength(midDistance);

        const [p3,p4] = getBezierCurveControls(p1,p2,pm);


        if(!i){
          pathStr = `M${p1.x},${p1.y}C${p3.x},${p3.y},${p4.x},${p4.y},${p2.x},${p2.y}`;
        }else{
          pathStr += `C${p3.x},${p3.y},${p4.x},${p4.y},${p2.x},${p2.y}`;
        }
        
      }
      
      const len = lastPoint.distance - firstPoint.distance;
      const halfLen = len/2;
      for(let i = 0;i<len;i++){
        this.ctx.save();
        this.ctx.beginPath();
        // if(!i){
        //   this.ctx.arc(firstPoint.x,firstPoint.y,firstPoint.d,0,Math.PI * 2);
        // }else if(Math.ceil(i+1) === Math.ceil(len - 1)){
        //   this.ctx.arc(lastPoint.x,lastPoint.y,lastPoint.d,0,Math.PI * 2);
        // }
        this.ctx.lineCap = 'round';
        this.ctx.miterLimit = this.voice * 2;
        this.ctx.strokeStyle = 'red';
        this.ctx.setLineDash([0,i,1,Number.MAX_SAFE_INTEGER]);
        if(i<halfLen){
          this.ctx.lineWidth = firstPoint.d + (avgD - firstPoint.d) * i/halfLen;
        }else{
          this.ctx.lineWidth = avgD + (lastPoint.d - avgD) * (i - len/2)/halfLen;
        }
        const path = new Path2D(pathStr);
        this.ctx.stroke(path);
        this.ctx.restore();
      }
      
        

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