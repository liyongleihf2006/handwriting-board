import { ShapeType } from '../enum';
import { generateCanvas } from '../utils';
import Ruler from './shape/Ruler';
import Compass from './shape/Compass';
import Compass360 from './shape/Compass360';
import Triangle from './shape/Triangle';
import type { GetPageCoords,GatherAreas,GatherAreasObj } from '../type';
export default class ToolShape {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  getNearestDistanceAndPointVoice: number;
  outlineCtx!: OffscreenCanvasRenderingContext2D;
  outlineImageData!: ImageData;
  outline!: [number, number, Uint8ClampedArray][] | null;

  longestDistance = 30;

  // 像素点采集宽度
  gatherAreaWidth = 10;
  prevPoint: [number, number] | null = null;
  private _toolShapeType = ShapeType.RULER;
  private strokeStyle!: string;
  cm = 0;
  mm = 0;
  width = 0;
  height = 0;
  marginH = 0;
  degreeNumber = 20;

  ruler: Ruler;
  compass: Compass;
  compass360: Compass360;
  rightAngleTriangle: Triangle;
  equilateralTriangle: Triangle;
  constructor(public w: number, public h: number, public voice: number, container: HTMLDivElement, getPageCoords: GetPageCoords) {

    this.canvas = generateCanvas(w, h);
    this.ctx = this.canvas.getContext('2d')!;

    this.cm = 96 / 2.54;
    this.mm = this.cm / 10;
    this.getNearestDistanceAndPointVoice = voice;
    this.ruler = new Ruler(this.ctx, this.cm, this.mm);
    this.compass = new Compass(this.ctx, this.cm, this.mm);
    this.compass360 = new Compass360(this.ctx, this.cm, this.mm, container, getPageCoords, this);
    this.rightAngleTriangle = new Triangle(this.ctx, this.cm, this.mm, 9, 5, this.cm * 3, this.cm * 1);
    this.equilateralTriangle = new Triangle(this.ctx, this.cm, this.mm, 6, 6, this.cm * 2, this.cm * 2);
  }
  resize(width:number,height:number){
    this.width = width;
    this.height = height;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }
  set toolShapeCenterX(x: number) {
    this.shape.toolShapeCenterX = x;
    this.reset();
  }
  get toolShapeCenterX() {
    return this.shape.toolShapeCenterX;
  }
  set toolShapeCenterY(y: number) {
    this.shape.toolShapeCenterY = y;
    this.reset();
  }
  get toolShapeCenterY() {
    return this.shape.toolShapeCenterY;
  }
  set angle(angle: number) {
    this.shape.angle = angle;
    this.reset();
  }
  get angle() {
    return this.shape.angle;
  }
  set toolShapeType(toolShapeType: ShapeType) {
    this._toolShapeType = toolShapeType;
    this.reset();
    this.draw();
  }
  get toolShapeType() {
    return this._toolShapeType;
  }
  get shape() {
    let shape;
    switch (this.toolShapeType) {
      case ShapeType.RULER: shape = this.ruler; break;
      case ShapeType.COMPASS: shape = this.compass; break;
      case ShapeType.COMPASS360: shape = this.compass360; break;
      case ShapeType.RIGHT_ANGLE_TRIANGLE: shape = this.rightAngleTriangle; break;
      case ShapeType.EQUILATERAL_TRIANGLE: shape = this.equilateralTriangle; break;
      default: shape = this.ruler;
    }
    return shape;
  }
  reset() {
    this.outline = null;
    this.prevPoint = null;
  }
  getGatherAreas(x1: number, y1: number, x2: number, y2: number, gatherAreaWidth: number) {
    const imageData = this.outlineImageData;
    const data = imageData.data;
    const width = this.w;
    const rowLen = width * 4;
    const gatherAreas: GatherAreas= [];

    const topLeftX = Math.min(x1, x2) - gatherAreaWidth / 2;
    const topLeftY = Math.min(y1, y2) - gatherAreaWidth / 2;
    const bottomRightX = Math.max(x1, x2) + gatherAreaWidth / 2;
    const bottomRightY = Math.max(y1, y2) + gatherAreaWidth / 2;

    const startX = topLeftX * 4;
    const startY = topLeftY;
    const endX = (bottomRightX + 1) * 4;
    const endY = bottomRightY + 1;
    const fragmentLen = endX - startX;
    let k = 0;
    for(let j = startY;j<endY;j++){
      const base = j * rowLen;
      const start = base + startX;
      const end = base + endX;
      const fragment = data.subarray(start,end);
      gatherAreas.push({start:fragmentLen * k,end:fragmentLen * (k+1),data:fragment});
      k++;
    }
    return {x:topLeftX,y:topLeftY,width:bottomRightX - topLeftX + 1,height:bottomRightY - topLeftY + 1,fragments:gatherAreas};
  }
  getNearestDistanceAndPoint(x: number, y: number, getNearestDistanceAndPointVoice: number, strokeStyle: string) {
    if (!this.outline || getNearestDistanceAndPointVoice !== this.getNearestDistanceAndPointVoice || this.strokeStyle !== strokeStyle) {
      this.getNearestDistanceAndPointVoice = getNearestDistanceAndPointVoice;
      this.strokeStyle = strokeStyle;
      this.outlineCtx = this.getOutlineCtx(this.getNearestDistanceAndPointVoice, strokeStyle);
      this.outlineImageData = this.outlineCtx.getImageData(0, 0, this.w, this.h);
      this.outline = this.getOutline(this.outlineImageData);
    }
    const outline = this.outline;
    const len = outline.length;
    let prevPoint = this.prevPoint!;
    const gatherAreaWidth = Math.max(this.gatherAreaWidth,getNearestDistanceAndPointVoice * 3);
    if (!prevPoint) {
      let nearestDistance = Number.MAX_SAFE_INTEGER;
      for (let i = 0; i < len; i++) {
        const [x0, y0] = outline[i];
        const distance = ((x - x0) ** 2 + (y - y0) ** 2) ** 0.5;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          prevPoint = [x0, y0];
        }
      }
      this.prevPoint = prevPoint;
      return { conformingToDistance: nearestDistance <= this.longestDistance, drawPoints: [] };
    } else {
      const innerAreaPoints: [number, number, Uint8ClampedArray][] = [];

      for (let i = 0; i < len; i++) {
        const [x0, y0] = outline[i];
        const gatherDistance = ((prevPoint[0] - x0) ** 2 + (prevPoint[1] - y0) ** 2) ** 0.5;
        if (gatherDistance <= gatherAreaWidth) {
          innerAreaPoints.push(outline[i]);
        }
      }

      let nearestDistance = Number.MAX_SAFE_INTEGER;
      let gatherPoint: [number, number] | null = null;
      for (let i = 0; i < innerAreaPoints.length; i++) {
        const [x0, y0] = innerAreaPoints[i];
        const distance = ((x - x0) ** 2 + (y - y0) ** 2) ** 0.5;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          gatherPoint = [x0, y0];
        }
      }
      let gatherAreasObj:GatherAreasObj= {x:0,y:0,width:0,height:0,fragments:[]};
      if(gatherPoint){
        gatherAreasObj = this.getGatherAreas(prevPoint[0], prevPoint[1], gatherPoint[0], gatherPoint[1], gatherAreaWidth);
      }
      this.prevPoint = gatherPoint;
      return { conformingToDistance: true,gatherAreasObj};
    }
  }
  getOutlineCtx(outlineVoice: number, strokeStyle: string) {
    return this.shape.getOutlineCtx(this.toolShapeCenterX, this.toolShapeCenterY, this.angle, outlineVoice, strokeStyle);
  }
  getOutline(imageData: ImageData) {
    const data = imageData.data;
    const len = data.length;
    const outline: [number, number, Uint8ClampedArray][] = [];
    let row = 0;
    let column = -1;
    for (let i = 0; i < len; i += 4) {
      column++;
      if (data[i + 3]) {
        outline.push([column, row, data.slice(i, i + 4)]);
      }
      if (column === this.w - 1) {
        row++;
        column = -1;
      }
    }
    return outline;
  }
  isPointInPath(x: number, y: number, fillRule: CanvasFillRule) {
    return this.shape.isPointInPath(x, y, fillRule);
  }
  draw(showDu=false,duCx=0,duCy=0) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    this.shape.draw(showDu,duCx,duCy);
  }
}