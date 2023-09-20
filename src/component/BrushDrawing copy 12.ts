import { WriteModel } from '../enum';
import { generateCanvas } from '../utils';
export default class Eraser{
  canvas:HTMLCanvasElement;
  ctx:CanvasRenderingContext2D;
  svgPath = document.createElementNS('http://www.w3.org/2000/svg','path');
  svgPathStr:string = '';
  basePoints:[number,number,number][] = [];

  d = 1;
  prevD = 0;
  prevOriginD = 0;
  maxD = 2;

  writeModel:WriteModel = WriteModel.WRITE;

  k = 0.5;

  scale = 2;
  width:number;
  height:number;
  voice:number;

  color!:string;
  constructor(
    width:number,
    height:number,
    voice:number
  ){
    this.width = this.scale*width;
    this.height = this.scale*height;
    this.voice = this.scale*voice;
    this.canvas = generateCanvas(this.width,this.height);
    this.ctx = this.canvas.getContext('2d')!;
  }

  reset(color:string){
    this.color = color;
  }
  submit(writingCtx:CanvasRenderingContext2D){
    // 做个延时是为了防止有线条突然变长的突突感
    this.ctx.clearRect(0,0,this.width,this.height);
    this.draw(true);
    writingCtx.drawImage(this.canvas,0,0,this.width/this.scale,this.height/this.scale);
    this.ctx.clearRect(0,0,this.width,this.height);
    this.basePoints.length = 0;
    this.prevOriginD = 0;
    
  }
  
  draw(adjust = false){
    this.ctx.clearRect(0,0,this.width,this.height);
    if(!this.basePoints?.length){
      return;
    }
    type PointType = {x:number,y:number,d:number,distance:number};
    const svgPoints:PointType[] = [];
    const svgFragmentLens:number[] = [];
    this.basePoints.forEach((basePoint,idx)=>{
      if(!idx){
        this.svgPathStr = `M${basePoint[0]},${basePoint[1]}`;
        svgFragmentLens.push(0);
      }else{
        this.svgPathStr += `L${basePoint[0]},${basePoint[1]}`;
        this.svgPath.setAttribute('d',this.svgPathStr);
        const totalLen = this.svgPath.getTotalLength();
        svgFragmentLens.push(totalLen);
      }
    })
    svgFragmentLens.forEach((currentLen,idx)=>{
      const currentBasePoint = this.basePoints[idx];
      const [x,y] = currentBasePoint;
      svgPoints.push({x,y,d:currentBasePoint[2],distance:currentLen});
    })    
    const totalLength = this.svgPath.getTotalLength();
    const firstPoint = svgPoints[0];
    const lastPoint = svgPoints[svgPoints.length - 1];
    const halfLen = totalLength/2;
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
      const lineWidth = AB + BC;
      if(!lineWidth){
        return [{x:x1,y:y1},{x:x2,y:y2}];
      }
      const tx = bx * (AB/lineWidth) + cx * (BC/lineWidth);
      const ty = by * (AB/lineWidth) + cy * (BC/lineWidth);
  
      const mx = bx - tx;
      const my = by - ty;
  
      const b1x = bx + mx;
      const b1y = by + my;
  
      const c1x = cx + mx;
      const c1y = cy + my;
  
      return [{x:b1x,y:b1y},{x:c1x,y:c1y}];
    }
    const getAvgD = ()=>{
      const points = svgPoints;
      const midDistance = totalLength/2;
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
    let avgD = firstPoint.d;
    if(adjust){
      avgD = getAvgD();
    }

    let pathStr = '';
    const pathStrs:{start:number,end:number,pathStr:string}[] = [];
    for(let i = 0;i<svgPoints.length - 1;i++){
      const p1 = svgPoints[i];
      const p2 = svgPoints[i+1];
      const midDistance = (p1.distance + p2.distance)/2;
      const pm = this.svgPath.getPointAtLength(midDistance);
      const [p3,p4] = getBezierCurveControls(p1,p2,pm);
      const str = `M${p1.x},${p1.y}C${p3.x},${p3.y},${p4.x},${p4.y},${p2.x},${p2.y}`;
      if(!i){
        pathStr = str;
      }else{
        pathStr += `C${p3.x},${p3.y},${p4.x},${p4.y},${p2.x},${p2.y}`;
      }
      pathStrs.push({
        start:p1.distance,
        end:p2.distance,
        pathStr:str
      });
    }
    if(adjust){
      for(let i = 0;i<svgPoints.length;i++){
        const point = svgPoints[i];
        const distance = point.distance;
        let R = 0;
        if(distance<halfLen){
          R = firstPoint.d + (avgD - firstPoint.d) * distance/halfLen;
        }else{
          R = avgD + (lastPoint.d - avgD) * (distance - halfLen)/halfLen;
        }
        const r = R/2;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.fillStyle = this.color;
        this.ctx.arc(point.x,point.y,r,0,Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
      pathStrs.forEach(({start,end,pathStr})=>{
        const len = end - start;
        for(let i = 0;i<len;i+=0.5){
          this.ctx.save();
          this.ctx.beginPath();
          this.ctx.strokeStyle = this.color;
          this.ctx.miterLimit = this.voice * 2;
          this.ctx.setLineDash([0,i,1,Number.MAX_SAFE_INTEGER]);
          if((i+start)<halfLen){
            this.ctx.lineWidth = firstPoint.d + (avgD - firstPoint.d) * (i + start)/halfLen;
          }else{
            this.ctx.lineWidth = avgD + (lastPoint.d - avgD) * (i + start - halfLen)/halfLen;
          }
          const path = new Path2D(pathStr);
          this.ctx.stroke(path);
          this.ctx.restore();
        }
      })
    }else{
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.miterLimit = this.voice * 2;
      this.ctx.lineWidth = this.voice;
      const path = new Path2D(pathStr);
      this.ctx.strokeStyle = this.color;
      this.ctx.lineCap = 'round';
      this.ctx.stroke(path);
      this.ctx.restore();
    }
  }
  pushPoints(writeStartX: number, writeStartY: number, writeEndX: number, writeEndY: number, writeStartTime: number, writeEndTime: number) {
    const x1 = writeStartX * this.scale;
    const y1 = writeStartY * this.scale;
    const x2 = writeEndX * this.scale;
    const y2 = writeEndY * this.scale;
    const distance = ((y2 - y1) ** 2 + (x2 - x1) ** 2) ** 0.5;
    // 乘以3是因为根据在板子上面测试发现标准书写速度中时间距离比大约为3
    const originD = (writeEndTime - writeStartTime) / (distance * 3) * this.voice;
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
        }else if(this.d < this.voice * .1){
          this.d = this.voice * .1;
        }
        this.prevD = this.d;
        this.basePoints.push([x2,y2,this.d]);
        this.draw();
      } else if (this.writeModel === WriteModel.DRAW) {
        this.d = this.voice;
      }
    }
  }

}