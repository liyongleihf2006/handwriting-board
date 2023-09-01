import { rotateAngle, RotateCoordinates } from '../../utils';
import type { GetPageCoords } from '../../type';
import type ToolShape from '../ToolShape';

function isTouchDevice() {
  return 'ontouchstart' in self;
}
export default class Compass {
  path!: Path2D;

  outsideR: number;
  insideR: number;
  pointerW: number;
  startAngle = 0;
  endAngle = 360;
  firstPointerAngle = 0;
  secondPointerAngle = 30;

  pointer1!: Path2D;
  pointer2!: Path2D;
  cx!: number;
  cy!: number;
  angle!: number;

  constructor(public ctx: CanvasRenderingContext2D, public cm: number, public mm: number, public container: HTMLDivElement, public getPageCoords: GetPageCoords, public toolShape: ToolShape) {
    this.outsideR = cm * 6;
    this.insideR = cm * 4.5;
    this.pointerW = cm * 1;
    this.loadEvent();
  }
  calculateRotationAngle(cx: number, cy: number, dragStartX: number, dragStartY: number, dragEndX: number, dragEndY: number): number {
    // 计算向量a的x和y分量
    const aX = dragStartX - cx;
    const aY = dragStartY - cy;

    // 计算向量b的x和y分量
    const bX = dragEndX - cx;
    const bY = dragEndY - cy;

    // 计算向量a和向量b的夹角
    const dotProduct = aX * bX + aY * bY; // 向量的点乘
    const aLength = Math.sqrt(aX * aX + aY * aY); // 向量a的长度
    const bLength = Math.sqrt(bX * bX + bY * bY); // 向量b的长度

    const cosTheta = dotProduct / (aLength * bLength); // 夹角的余弦值
    const theta = Math.acos(cosTheta); // 夹角的弧度值

    // 判断旋转方向，如果向量a和向量b形成逆时针方向，则旋转角度为正值，否则为负值
    const crossProduct = aX * bY - aY * bX; // 向量的叉乘
    const rotationAngle = crossProduct >= 0 ? theta : -theta;

    // 将弧度转换为角度
    const rotationAngleInDegrees = rotationAngle * 180 / Math.PI;

    return rotationAngleInDegrees;
  }
  private loadEvent() {
    const container = this.container;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragEndX = 0;
    let dragEndY = 0;
    let doTurn = false;
    let movePointer1 = false;
    let movePointer2 = false;
    const turnPoinerStart = (coords: { pageX: number; pageY: number; }, event: TouchEvent | MouseEvent) => {
      const ctx = this.ctx;
      const pointer1 = this.pointer1;
      const pointer2 = this.pointer2;
      dragEndX = coords.pageX;
      dragEndY = coords.pageY;
      if (ctx.isPointInPath(pointer2, coords.pageX, coords.pageY)) {
        event.stopImmediatePropagation();
        movePointer2 = true;
        doTurn = true;
      } else if (ctx.isPointInPath(pointer1, coords.pageX, coords.pageY)) {
        event.stopImmediatePropagation();
        movePointer1 = true;
        doTurn = true;
      }
    }
    const handleTouchStart = (event: TouchEvent) => {
      const touches = event.touches;
      const coords = this.getPageCoords(touches);
      if (touches.length === 1) {
        turnPoinerStart(coords, event);
      } else {
        doTurn = false;
      }
    };
    const handleMouseStart = (event: MouseEvent) => {
      event.preventDefault();
      const { pageX, pageY } = event;
      const coords = this.getPageCoords([{ pageX, pageY }]);
      turnPoinerStart(coords, event);
    };
    const turnPointerMove = (coords: { pageX: number; pageY: number; }) => {
      dragStartX = dragEndX;
      dragStartY = dragEndY;
      dragEndX = coords.pageX;
      dragEndY = coords.pageY;
      const deltaAngle = this.calculateRotationAngle(this.cx, this.cy, dragStartX, dragStartY, dragEndX, dragEndY);
      if (movePointer1) {
        this.firstPointerAngle += deltaAngle;
      } else if (movePointer2) {
        this.secondPointerAngle += deltaAngle;
      }
      this.draw(this.cx, this.cy, this.angle);
      this.toolShape.reset();
    }
    const handleMouseMove = (event: MouseEvent) => {
      if (doTurn) {
        event.stopImmediatePropagation();
        const { pageX, pageY } = event;
        const coords = this.getPageCoords([{ pageX, pageY }]);
        turnPointerMove(coords);
      }
    };
    const handleTouchMove = (event: TouchEvent) => {
      if (doTurn) {
        event.stopImmediatePropagation();
        const touches = event.touches;
        const coords = this.getPageCoords(touches);
        turnPointerMove(coords);
      }
    };
    const turnPointerEnd = () => {
      doTurn = false;
      movePointer1 = false;
      movePointer2 = false;
    };
    const handleTouchEnd = () => {
      turnPointerEnd();
    };
    const handleMouseEnd = (event: MouseEvent) => {
      turnPointerEnd();
    };
    if (isTouchDevice()) {
      container.addEventListener("touchstart", handleTouchStart, { passive: true });
      container.addEventListener("touchmove", handleTouchMove, { passive: true });
      container.addEventListener("touchend", handleTouchEnd, { passive: true });
    } else {
      container.addEventListener("mousedown", handleMouseStart);
      self.addEventListener("mousemove", handleMouseMove, { passive: true });
      self.addEventListener("mouseup", handleMouseEnd, { passive: true });
    }
  }
  getOutlineCtx(_x: number, _y: number, _angle: number, outlineVoice: number, strokeStyle: string) {
    const ctx = this.ctx;
    const canvas = ctx.canvas;
    const { width, height } = canvas;
    const offscreen = new OffscreenCanvas(width, height);
    const c = offscreen.getContext('2d')!;
    const cx = _x;
    const cy = _y;
    const angle = _angle;
    this.drawBorder(c, cx, cy, angle, 0, 'rgba(0,0,0,1)');
    this.drawPointer(c, cx, cy, angle, this.firstPointerAngle, 0, 'rgba(0,0,0,1)');
    this.drawPointer(c, cx, cy, angle, this.secondPointerAngle, 0, 'rgba(0,0,0,1)');

    c.globalCompositeOperation = 'source-out';
    const offscreen1 = new OffscreenCanvas(width, height);
    const c2 = offscreen1.getContext('2d')!;
    this.drawBorder(c2, cx, cy, angle, outlineVoice, 'rgba(0,0,0,1)');
    this.drawPointer(c2, cx, cy, angle, this.firstPointerAngle, outlineVoice, 'rgba(0,0,0,1)');
    this.drawPointer(c2, cx, cy, angle, this.secondPointerAngle, outlineVoice, 'rgba(0,0,0,1)');
    c.drawImage(offscreen1, 0, 0);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = strokeStyle;
    c.fillRect(0, 0, width, height);
    return c;
  }
  generatorOuterBorder(_cx: number, _cy: number, _angle: number) {
    const startAngle = this.startAngle;
    const endAngle = this.endAngle;
    const outsideR = this.outsideR;
    const insideR = this.insideR;
    const r = (outsideR + insideR) / 2;
    const cx = _cx;
    const cy = _cy;
    const path = new Path2D();
    path.arc(cx, cy, r, rotateAngle(startAngle, _angle), rotateAngle(endAngle, _angle));
    this.path = path;
    return path;
  }
  generatorPointer(_cx: number, _cy: number, _angle: number, pointerAngle: number, outlineVoice: number) {
    const outsideR = this.outsideR;
    const pointerW = this.pointerW;
    const cx = _cx;
    const cy = _cy;
    const r = pointerW / 2 + outlineVoice;
    let angle = _angle;
    angle += pointerAngle;
    const rotateCoordinates = RotateCoordinates(angle, _cx, _cy);
    let pathStr = '';
    pathStr += `M${rotateCoordinates(cx, cy - r).join(',')}`;
    pathStr += `A${r},${r},1,1,1,${rotateCoordinates(cx, cy + r).join(',')}`;
    pathStr += `L${rotateCoordinates(cx - outsideR, cy + r).join(',')}`;
    pathStr += `A${r},${r},1,1,1,${rotateCoordinates(cx - outsideR, cy - r).join(',')}`;
    pathStr += 'z';
    const path = new Path2D(pathStr);
    return path;
  }
  drawDegree(
    cx: number,
    cy: number,
    r: number,
    smallUnitL: number,
    unitL: number,
    bigUnitL: number,
    ruleFontSize: number,
    fontGap: number,
    showText: boolean,
    showSmall: boolean,
    showMiddle: boolean,
    showBig: boolean,
    textOnInner: boolean,
    _angle: number,
    reverse: boolean
  ) {

    const ctx = this.ctx;

    // 刻度设置
    const total = 360; // 总刻度数
    const unitS = 2 * Math.PI / total; // 刻度线间隔角度
    const unitBigInterval = 10;
    const unitInterval = unitBigInterval;
    const ruleLoose = 5;
    // 绘制刻度和刻度的数值
    let angle = (180 + _angle) * Math.PI / 180;
    ctx.save();
    ctx.textAlign = 'center'; // 设置文本对齐方式
    ctx.textBaseline = 'middle';
    ctx.font = `${ruleFontSize}px Arial`; // 文本字体
    if (!textOnInner) {
      r += bigUnitL;
      ctx.textBaseline = 'bottom';
    }
    for (let i = 0; i <= total; i++) {
      if (i % unitBigInterval === 0) { // 大刻度
        const startX = cx + Math.cos(angle) * (r - bigUnitL); // 刻度线起始点横坐标
        const startY = cy + Math.sin(angle) * (r - bigUnitL); // 刻度线起始点纵坐标
        const endX = cx + Math.cos(angle) * r; // 刻度线结束点横坐标
        const endY = cy + Math.sin(angle) * r; // 刻度线结束点纵坐标
        if (showBig) {
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        if (i !== total && showText && i % unitInterval === 0) {
          const textX = cx + Math.cos(angle) * (r - (bigUnitL + fontGap) * Number(textOnInner)); // 刻度文本位置横坐标
          const textY = cy + Math.sin(angle) * (r - (bigUnitL + fontGap) * Number(textOnInner)); // 刻度文本位置纵坐标
          ctx.save();
          ctx.textAlign = 'center';
          ctx.translate(textX, textY);
          ctx.rotate(angle + Math.PI / 2);
          ctx.fillText((reverse ? total - i : i).toString(), 0, 0);
          ctx.restore();
        }
      } else if (!(i % ruleLoose)) { // 中刻度
        if (showMiddle) {
          const startX = cx + Math.cos(angle) * (r - unitL); // 刻度线起始点横坐标
          const startY = cy + Math.sin(angle) * (r - unitL); // 刻度线起始点纵坐标
          const endX = cx + Math.cos(angle) * r; // 刻度线结束点横坐标
          const endY = cy + Math.sin(angle) * r; // 刻度线结束点纵坐标
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      } else if (showSmall) {
        const startX = cx + Math.cos(angle) * (r - smallUnitL); // 刻度线起始点横坐标
        const startY = cy + Math.sin(angle) * (r - smallUnitL); // 刻度线起始点纵坐标
        const endX = cx + Math.cos(angle) * r; // 刻度线结束点横坐标
        const endY = cy + Math.sin(angle) * r; // 刻度线结束点纵坐标
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
      angle += unitS; // 更新角度
    }
    ctx.restore();
  }
  drawContent(_cx: number, _cy: number, _angle: number) {
    const outsideR = this.outsideR;
    const cx = _cx;
    const cy = _cy;

    const ctx = this.ctx;
    ctx.save();
    this.drawDegree(cx, cy, outsideR, 10, 15, 20, 8, 10, true, true, true, true, true, _angle, false);
    this.drawDegree(cx, cy, outsideR, 10, 15, 20, 8, 25, true, false, false, false, true, _angle, true);
    ctx.restore();
  }
  drawBorder(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, cx: number, cy: number, angle: number, outlineVoice: number, strokeStyle: string) {
    const outsideR = this.outsideR;
    const insideR = this.insideR;
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = outsideR - insideR + 2 * outlineVoice;
    ctx.strokeStyle = strokeStyle;
    const path = this.generatorOuterBorder(cx, cy, angle);
    ctx.stroke(path);
    ctx.restore();
  }
  drawPointer(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, cx: number, cy: number, angle: number, pointerAngle: number, outlineVoice: number, fillStyle: string) {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = fillStyle;
    const path = this.generatorPointer(cx, cy, angle, pointerAngle, outlineVoice);
    ctx.fill(path);
    ctx.restore();
    return path;
  }
  drawFixedPoint(cx: number, cy: number, angle: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,.08)';
    ctx.arc(cx, cy, this.pointerW / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  draw(cx: number, cy: number, angle: number) {
    const ctx = this.ctx;
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawBorder(ctx, cx, cy, angle, 0, 'rgba(0,0,0,.08)');
    this.drawContent(cx, cy, angle);
    this.pointer1 = this.drawPointer(ctx, cx, cy, angle, this.firstPointerAngle, 0, 'rgba(0,0,0,.08)');
    this.pointer2 = this.drawPointer(ctx, cx, cy, angle, this.secondPointerAngle, 0, 'rgba(0,0,0,.08)');
    this.drawFixedPoint(cx, cy, angle);
    this.cx = cx;
    this.cy = cy;
    this.angle = angle;
  }
  isPointInPath(x: number, y: number, fillRule: CanvasFillRule) {
    const ctx = this.ctx;
    if (fillRule === 'evenodd') {
      let isPointInStroke = false;
      ctx.save();
      ctx.lineWidth = this.outsideR - this.insideR;
      isPointInStroke = ctx.isPointInStroke(this.path, x, y);
      ctx.restore();
      return isPointInStroke;
    } else {
      return ctx.isPointInPath(this.path, x, y);
    }

  }

}