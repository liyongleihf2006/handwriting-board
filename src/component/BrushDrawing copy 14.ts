import { WriteModel } from '../enum';
import { generateCanvas } from '../utils';
import Writing from './Writing';
type PointType = {x:number,y:number,d:number,distance:number};
export default class Eraser{
  canvas:HTMLCanvasElement;
  ctx:CanvasRenderingContext2D;
  svgPath = document.createElementNS('http://www.w3.org/2000/svg','path');
  svgPathStr:string = '';
  basePoints:[number,number,number][] = [];
  scaleBasePoints:[number,number,number][] = [];
  d = 1;
  maxD = 2;

  writeModel:WriteModel = WriteModel.WRITE;

  k = 1;

  width:number;
  height:number;
  voice:number;

  color!:string;

  constructor(
    width:number,
    height:number,
    voice:number,
    public writing:Writing
  ){
    this.width = width;
    this.height = height;
    this.voice = voice;
    this.canvas = generateCanvas(this.width,this.height);
    this.ctx = this.canvas.getContext('2d')!;

  }

  reset(color:string){
    this.color = color;
  }
  submit(){
    if(!this.scaleBasePoints?.length){
      return;
    }
    const writingCtx = this.writing.ctx;
    this.ctx.clearRect(0,0,this.width,this.height);

    const {svgPoints,pathStrs} = this.getPathContent(this.scaleBasePoints,true);

    const totalLength = this.svgPath.getTotalLength();
    const firstPoint = svgPoints[0];
    const lastPoint = svgPoints[svgPoints.length - 1];
    const halfLen = totalLength/2;

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
    
    const avgD = getAvgD();

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
      writingCtx.save();
      writingCtx.beginPath();
      writingCtx.fillStyle = this.color;
      writingCtx.arc(point.x,point.y,r,0,Math.PI * 2);
      writingCtx.fill();
      writingCtx.restore();
    }
    pathStrs.forEach(({start,end,pathStr})=>{
      const len = end - start;
      for(let i = 0;i<len;i+=0.5){
        writingCtx.save();
        writingCtx.beginPath();
        writingCtx.strokeStyle = this.color;
        writingCtx.miterLimit = this.voice * 2;
        writingCtx.setLineDash([0,i,1,Number.MAX_SAFE_INTEGER]);
        if((i+start)<halfLen){
          writingCtx.lineWidth = firstPoint.d + (avgD - firstPoint.d) * (i + start)/halfLen;
        }else{
          writingCtx.lineWidth = avgD + (lastPoint.d - avgD) * (i + start - halfLen)/halfLen;
        }
        const path = new Path2D(pathStr);
        writingCtx.stroke(path);
        writingCtx.restore();
      }
    })
    this.basePoints.length = 0;
    this.scaleBasePoints.length = 0;
    
  }
  getPathContent(basePoints:[number, number, number][],isScale=false){
    const svgPoints:PointType[] = [];
    const svgFragmentLens:number[] = [];
    basePoints.forEach((basePoint,idx)=>{
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
      const currentBasePoint = basePoints[idx];
      const [x,y] = currentBasePoint;
      svgPoints.push({x,y,d:currentBasePoint[2],distance:currentLen});
    })    
    
    let pathStr = '';
    const pathStrs:{start:number,end:number,pathStr:string}[] = [];
    if(svgPoints.length>2){
      const controls:{x:number,y:number}[][] = [];
      for(let i = 1;i<svgPoints.length - 1;i++){
        const p1 = svgPoints[i-1];
        const p2 = svgPoints[i];
        const p3 = svgPoints[i+1];
        const [p5,p6] = this.getBezierCurveControls(p1,p3,p2);
        if(i===1){
          controls.push([p5]);
        }
        controls.push([p5,p6]);
        if(i === svgPoints.length - 2){
          controls.push([p6]);
        }
      }
      if(!isScale){
        for(let i = 1;i<svgPoints.length;i++){
          const p1 = svgPoints[i-1];
          const p2 = svgPoints[i];
          const c1 = controls[i-1];
          const c2 = controls[i];
          if(i===1){
            pathStr = `M${p1.x},${p1.y}Q${c1[0].x},${c1[0].y},${p2.x},${p2.y}C${c2[1].x},${c2[1].y},`;
          }else if(i!==svgPoints.length - 1){
            pathStr += `${c2[0].x},${c2[0].y},${p2.x},${p2.y}C${c2[1].x},${c2[1].y},`;
          }else{
            pathStr += `${c2[0].x},${c2[0].y},${p2.x},${p2.y}`;
          }
        }
      }else{
        for(let i = 0;i<svgPoints.length-1;i++){
          const p2 = svgPoints[i];
          const p3 = svgPoints[i+1];
          const c2 = controls[i];
          const c3 = controls[i+1];
          let str = '';
          if(!i){
            str = `M${p2.x},${p2.y}Q${c2[0].x},${c2[0].y},${p3.x},${p3.y}`;
          }else if(i!==svgPoints.length - 2){
            str = `M${p2.x},${p2.y} C${c2[1].x},${c2[1].y},${c3[0].x},${c3[0].y},${p3.x},${p3.y}`;
          }else{
            str = `M${p2.x},${p2.y} Q${c2[1].x},${c2[1].y},${p3.x},${p3.y}`;
          }
          pathStrs.push({
            start:p2.distance,
            end:p3.distance,
            pathStr:str
          });
        }
      }
    }else if(svgPoints.length===2){
      const p1 = svgPoints[0];
      const p2 = svgPoints[1];
      pathStr = `M${p1.x},${p1.y}L${p2.x},${p2.y}`;
      pathStrs.push({
        start:p1.distance,
        end:p2.distance,
        pathStr:pathStr
      });
    }
    return {svgPoints,pathStrs,pathStr};
  }
  getBezierCurveControls(p1:{x:number,y:number},p2:{x:number,y:number},pm:{x:number,y:number}){
      
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
  draw(){
    this.ctx.clearRect(0,0,this.width,this.height);
    if(!this.basePoints?.length){
      return;
    }
    const {pathStr} = this.getPathContent(this.basePoints);
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
  pushPoints({x, y,pressure}:{x:number,y:number,pressure:number}) {
    console.log('pressure',pressure);
    const scale = this.writing.scale;
    this.d = this.voice;
    this.basePoints.push([x,y,this.d]);
    this.scaleBasePoints.push([x * scale,y * scale,this.d * scale]);
    this.draw();
  }

}