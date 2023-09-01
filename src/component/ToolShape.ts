import { ShapeType } from '../enum';
import { generateCanvas } from '../utils';
import Ruler from './shape/Ruler';
import Compass from './shape/Compass';
import Compass360 from './shape/Compass360';
import Triangle from './shape/Triangle';
import type { GetPageCoords } from '../type';
export default class ToolShape {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  getNearestDistanceAndPointVoice: number;
  outlineCtx!: OffscreenCanvasRenderingContext2D;
  outlineImageData!: ImageData;
  outline!: [number, number, Uint8ClampedArray][] | null;
  outlineMap!: Record<number, Record<number, Uint8ClampedArray>>;

  longestDistance = 30;

  // 像素点采集宽度
  gatherAreaWidth = 10;
  prevPoint: [number, number] | null = null;
  private _x!: number;
  private _y!: number;
  private _angle!: number;
  private _toolShapeType!: ShapeType;
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
  isoscelesTriangle: Triangle;
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
    this.isoscelesTriangle = new Triangle(this.ctx, this.cm, this.mm, 6, 6, this.cm * 2, this.cm * 2);
  }
  set x(x: number) {
    this._x = x;
    this.reset();
  }
  get x() {
    return this._x;
  }
  set y(y: number) {
    this._y = y;
    this.reset();
  }
  get y() {
    return this._y;
  }
  set angle(angle: number) {
    this._angle = angle;
    this.reset();
  }
  get angle() {
    return this._angle;
  }
  set toolShapeType(toolShapeType: ShapeType) {
    this._toolShapeType = toolShapeType;
    this.reset();
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
      case ShapeType.SOSCELESL_TRIANGLE: shape = this.isoscelesTriangle; break;
      default: shape = this.ruler;
    }
    return shape;
  }
  reset() {
    this.outline = null;
    this.prevPoint = null;
  }
  getGathers(x1: number, y1: number, x2: number, y2: number, gatherAreaWidth: number) {
    const topLeftX = Math.min(x1, x2) - gatherAreaWidth / 2;
    const topLeftY = Math.min(y1, y2) - gatherAreaWidth / 2;
    const bottomRightX = Math.max(x1, x2) + gatherAreaWidth / 2;
    const bottomRightY = Math.max(y1, y2) + gatherAreaWidth / 2;

    const gathers: [number, number][] = [];
    for (let x = topLeftX; x <= bottomRightX; x++) {
      for (let y = topLeftY; y <= bottomRightY; y++) {
        gathers.push([x, y]);
      }
    }
    return gathers;
  }
  getNearestDistanceAndPoint(x: number, y: number, getNearestDistanceAndPointVoice: number, strokeStyle: string) {
    if (!this.outline || getNearestDistanceAndPointVoice !== this.getNearestDistanceAndPointVoice || this.strokeStyle !== strokeStyle) {
      this.getNearestDistanceAndPointVoice = getNearestDistanceAndPointVoice;
      this.strokeStyle = strokeStyle;
      this.outlineCtx = this.getOutlineCtx(this.getNearestDistanceAndPointVoice, strokeStyle);
      this.outlineImageData = this.outlineCtx.getImageData(0, 0, this.w, this.h);
      this.outline = this.getOutline(this.outlineImageData);
      this.outlineMap = this.getOutlineMap(this.outline);
    }
    const outline = this.outline;
    const len = outline.length;
    let prevPoint = this.prevPoint!;
    const gatherAreaWidth = this.gatherAreaWidth;
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
      let gathers: [number, number][] = [];
      if (gatherPoint) {
        gathers = this.getGathers(prevPoint[0], prevPoint[1], gatherPoint[0], gatherPoint[1], gatherAreaWidth);
      }
      const drawPoints = [];
      const gathersLen = gathers.length;
      for (let i = 0; i < gathersLen; i++) {
        const p = gathers[i];
        const imageData = this.outlineMap?.[p[0]]?.[p[1]];
        if (imageData) {
          const data = imageData;
          drawPoints.push({ x: p[0], y: p[1], fillStyle: `rgba(${data[0]},${data[1]},${data[2]},${data[3] / 255})` });
        }
      }
      this.prevPoint = gatherPoint;
      return { conformingToDistance: true, drawPoints };
    }
  }
  getOutlineCtx(outlineVoice: number, strokeStyle: string) {
    return this.shape.getOutlineCtx(this._x, this._y, this._angle, outlineVoice, strokeStyle);
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
  getOutlineMap(outline: [number, number, Uint8ClampedArray][]) {
    const map: Record<number, Record<number, Uint8ClampedArray>> = {};
    const len = outline.length;
    for (let i = 0; i < len; i++) {
      const [x, y, uints] = outline[i];
      if (!map[x]) {
        map[x] = {};
      }
      map[x][y] = uints;
    }
    return map;
  }
  isPointInPath(x: number, y: number, fillRule: CanvasFillRule) {
    return this.shape.isPointInPath(x, y, fillRule);
  }
  draw(x: number, y: number, angle: number, toolShapeType: ShapeType) {
    if (this.x !== x || this.y !== y || this.angle !== angle || this.toolShapeType !== toolShapeType) {
      this.x = x;
      this.y = y;
      this.angle = angle;
      this.toolShapeType = toolShapeType;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);
      this.shape.draw(this._x, this._y, this._angle);
    }
  }
}