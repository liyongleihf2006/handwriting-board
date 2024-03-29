import type { Options, PreStore,Store, ContainerOffset, Coords, OnChange, ScrollRange,GatherAreasObj } from './type';
import { Stack } from './stack';
import { WriteModel, BGPattern, ScrollDirection, ShapeType } from './enum';
import { debounce, getTripleTouchAngleAndCenter, rotateCoordinate, negativeRemainder } from './utils';
import ToolShape from './component/ToolShape';
import Background from './component/Background';
import RuleAuxiliary from './component/RuleAuxiliary';
import Border from './component/Border';
import Writing from './component/Writing';
import Eraser from './component/Eraser';
import BrushDrawing from './component/BrushDrawing';
export { WriteModel, BGPattern, ScrollDirection, ShapeType };
function isTouchDevice() {
  return 'ontouchstart' in self;
}
/**
 * 滚动范围
 */
const defaultScrollRange: ScrollRange = [[null, null], [null, null]];
/**
 * 滚动方向
 */
const defaultScrollDirection = ScrollDirection.ALL;
/**
 * 背景格式
 */
const defaultBGPattern = BGPattern.GRID;
/**
 * 是否启用全览模式
 */
// const defaultEnableEagleEyeMode = false;
/**
 * 绘画模式 书写模式 绘画模式
 */
const defaultWriteModel = WriteModel.WRITE;
/**
 * 是否使用背景
 */
const defaultEnableBG = true;
/**
 * 棋盘格子的间距
 */
const defaultGridGap = 100;
/**
 * 田字格的尺寸
 */
const defaultGridPaperGap = 100;
/**
 * 四线格纵向空白
 */
const defaultQuadrillePaperVerticalMargin = 40;
/**
 * 四线格线的间距
 */
const defaultQuadrillePaperGap = 30;
/**
 * 棋盘格子的填充色
 */
const defaultGridFillStyle = 'rgb(250,250,250)';
/**
 * 田字格边框颜色
 */
const defaultGridPaperStrokeStyle = 'green';
/**
 * 四线格四条线的颜色
 */
const defaultQuadrillePaperStrokeStyles = ['rgba(0,0,255,.5)', 'rgba(255,0,0,.5)', 'rgba(0,0,255,1)', 'rgba(0,0,255,.5)'];
/**
 * 是否使用标尺
 */
const defaultRule = true;
/**
 * 标尺的间距
 */
const defaultRuleGap = 10;
/**
 * 标尺刻度的长度
 */
const defaultRuleUnitLen = 5;
/**
 * 标尺的颜色
 */
const defaultRuleStrokeStyle = 'rgba(0,0,0,0.5)';
/**
 * 笔尖的粗细
 */
const defaultVoice = 1;
/**
 * 墨水颜色
 */
const defaultColor = 'rgba(0,0,0,1)';
/**
 * 是否启用操作历史
 */
const defaultStack = false;
/**
 * 橡皮擦除的半径
 */
const defaultCleanR = 20;
/**
 * 滚动的时候执行的次数
 */
const defaultMoveCountTotal = 20;
/**
 * 是否锁定书写
 */
const defaultWriteLocked = false;
/**
 * 是否锁定拖拽
 */
const defaultDragLocked = false;
/**
 * 是否显示边框
 */
const defaultShowBorder = true;
/**
 * 边框的颜色
 */
const defaultBorderStyle = '#333';
/**
 * 边框的宽度
 */
const defaultBorderWidth = 0;
/**
 * 是否使用尺子等工具
 */
const defaultUseShapeType = false;
/**
 * hash 组件的hash
 */
const defaultHash = '';
const defaultOptions = {
  scrollRange: defaultScrollRange,
  scrollDirection: defaultScrollDirection,
  bgPattern: defaultBGPattern,
  writeModel: defaultWriteModel,
  enableBG: defaultEnableBG,
  gridGap: defaultGridGap,
  gridPaperGap: defaultGridPaperGap,
  quadrillePaperVerticalMargin: defaultQuadrillePaperVerticalMargin,
  quadrillePaperGap: defaultQuadrillePaperGap,
  gridFillStyle: defaultGridFillStyle,
  gridPaperStrokeStyle: defaultGridPaperStrokeStyle,
  quadrillePaperStrokeStyles: defaultQuadrillePaperStrokeStyles,
  rule: defaultRule,
  ruleGap: defaultRuleGap,
  ruleUnitLen: defaultRuleUnitLen,
  ruleStrokeStyle: defaultRuleStrokeStyle,
  voice: defaultVoice,
  color: defaultColor,
  stack: defaultStack,
  cleanR: defaultCleanR,
  moveCountTotal: defaultMoveCountTotal,
  writeLocked: defaultWriteLocked,
  dragLocked: defaultDragLocked,
  showBorder: defaultShowBorder,
  borderStyle: defaultBorderStyle,
  borderWidth: defaultBorderWidth,
  useShapeType: defaultUseShapeType,
  hash: defaultHash
};
export default class Board {
  private width: number;
  private height: number;
  worldOffsetX = 0;
  worldOffsetY = 0;
  private scrolling = false;
  
  private cleanState = false;
  private cleanX?: number;
  private cleanY?: number;
  private cleanPress = false;
  private stackObj!: Stack;
  private moveT = false;
  private debounceBindOnChange: () => void;

  private toolShape: ToolShape;
  private activateToolShape = false;
  private background: Background;
  private ruleAuxiliary: RuleAuxiliary;
  private border: Border;
  private writing: Writing;
  private eraser: Eraser;
  private eraserHasContent = false;
  private brushDrawing:BrushDrawing;

  scrollRange: ScrollRange;
  scrollDirection: ScrollDirection;
  bgPattern: BGPattern;
  writeModel: WriteModel;
  enableBG: boolean;
  gridGap: number;
  gridPaperGap: number;
  quadrillePaperVerticalMargin: number;
  quadrillePaperGap: number;
  gridFillStyle: string;
  gridPaperStrokeStyle: string;
  quadrillePaperStrokeStyles: string[];
  rule: boolean;
  ruleGap: number;
  ruleUnitLen: number;
  ruleStrokeStyle: string;
  voice: number;
  color: string;
  cleanR: number;
  stack: boolean;
  moveCountTotal: number;
  writeLocked: boolean;
  dragLocked: boolean;
  showBorder: boolean;
  borderStyle: string;
  borderWidth: number;
  useShapeType: boolean;
  containerOffset: ContainerOffset;
  onChange: OnChange | undefined;
  store:Store = {};
  hash:number|string;
  justifyDus = [0,45,90,135,180,225,270,315,360];
  constructor(public container: HTMLDivElement, options: Options = defaultOptions) {
    this.scrollRange = options.scrollRange ?? defaultScrollRange;
    this.scrollDirection = options.scrollDirection ?? defaultScrollDirection;
    this.bgPattern = options.bgPattern ?? defaultBGPattern;
    this.writeModel = options.writeModel ?? defaultWriteModel;
    this.enableBG = options.enableBG ?? defaultEnableBG;
    this.gridGap = options.gridGap ?? defaultGridGap;
    this.gridPaperGap = options.gridPaperGap ?? defaultGridPaperGap;
    this.quadrillePaperVerticalMargin = options.quadrillePaperVerticalMargin ?? defaultQuadrillePaperVerticalMargin;
    this.quadrillePaperGap = options.quadrillePaperGap ?? defaultQuadrillePaperGap;
    this.gridFillStyle = options.gridFillStyle ?? defaultGridFillStyle;
    this.gridPaperStrokeStyle = options.gridPaperStrokeStyle ?? defaultGridPaperStrokeStyle;
    this.quadrillePaperStrokeStyles = options.quadrillePaperStrokeStyles ?? defaultQuadrillePaperStrokeStyles;
    this.rule = options.rule ?? defaultRule;
    this.ruleGap = options.ruleGap ?? defaultRuleGap;
    this.ruleUnitLen = options.ruleUnitLen ?? defaultRuleUnitLen;
    this.ruleStrokeStyle = options.ruleStrokeStyle ?? defaultRuleStrokeStyle;
    this.voice = options.voice ?? defaultVoice;
    this.color = options.color ?? defaultColor;
    this.stack = options.stack ?? defaultStack;
    this.cleanR = options.cleanR ?? defaultCleanR;
    this.moveCountTotal = options.moveCountTotal ?? defaultMoveCountTotal;
    this.writeLocked = options.writeLocked ?? defaultWriteLocked;
    this.dragLocked = options.dragLocked ?? defaultDragLocked;
    this.showBorder = options.showBorder ?? defaultShowBorder;
    this.borderStyle = options.borderStyle ?? defaultBorderStyle;
    this.borderWidth = options.borderWidth ?? defaultBorderWidth;
    this.useShapeType = options.useShapeType ?? defaultUseShapeType;
    this.hash = options.hash ?? defaultHash;
    this.containerOffset = options.containerOffset ?? (() => {
      const scrollingElement = document.scrollingElement as HTMLElement;
      const rect = this.container.getBoundingClientRect();
      return {
        x: rect.x + scrollingElement.scrollLeft,
        y: rect.y + scrollingElement.scrollTop
      };
    });
    this.onChange = options.onChange;
    this.debounceBindOnChange = debounce(this.triggerOnChange, 500);
    this.loadEvent();
    if (this.stack) {
      const container = this.container;
      const rect = container.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);
      this.stackObj = new Stack(width, height, this.hash);
      this.stackObj.restoreState = (preStore: PreStore) => {
        const storeLen = preStore.length;
        const lastStoreItem = preStore[storeLen - 1];
        const prevWorldOffsetX = this.worldOffsetX;
        const prevWorldOffsetY = this.worldOffsetY;
        const targetWorldOffsetX = lastStoreItem.worldOffsetX;
        const targetWorldOffsetY = lastStoreItem.worldOffsetY;
        const offsetX = targetWorldOffsetX - prevWorldOffsetX;
        const offsetY = targetWorldOffsetY - prevWorldOffsetY;
        if (!offsetX && !offsetY) {
this.worldOffsetX = lastStoreItem.worldOffsetX;
          this.worldOffsetY = lastStoreItem.worldOffsetY;
          this.preStore = preStore;
          this.writing.store = preStore;
          this.draw();
        } else {
          const preOffsetX = offsetX / this.moveCountTotal;
          const preOffsetY = offsetY / this.moveCountTotal;
          this.writing.store = preStore;
          this.moveT = true;
          this.doMove(preOffsetX, preOffsetY);
        }
      };
    }
    this.resize();
  }
  set preStore(preStore){
    const store = this.store;
    const hash = this.hash;
    if(!store[hash]){
      store[hash] = [];
    }
    store[hash] = preStore;
  }
  get preStore(){
    const store = this.store;
    const hash = this.hash;
    if(!store[hash]){
      store[hash] = [];
    }
    return store[hash];
  }
  updateWorldOffset(deltaX:number,deltaY:number){
    this.worldOffsetX += deltaX;
    this.worldOffsetY += deltaY;
  }
  updateHash(hash:number|string){
    this.hash = hash;
    this.stack && this.stackObj.updateHash(hash);
    this.writing.store = this.preStore;
    this.writing.refresh(this.worldOffsetX,this.worldOffsetY);
  }
  resize(){
    const container = this.container;
    const rect = container.getBoundingClientRect();
    this.width = Math.floor(rect.width);
    this.height = Math.floor(rect.height);
    if(this.enableBG){
      if(!this.background){
        this.background = new Background(this.width, this.height, this.gridGap, this.gridFillStyle, this.gridPaperGap, this.gridPaperStrokeStyle, this.quadrillePaperVerticalMargin, this.quadrillePaperGap, this.quadrillePaperStrokeStyles);
        this.container.append(this.background.canvas);
      }else{
        this.background.resize(this.width, this.height);
      }
    }
    if(this.rule){
      if(!this.ruleAuxiliary){
        this.ruleAuxiliary = new RuleAuxiliary(this.width, this.height, this.ruleStrokeStyle, this.ruleGap, this.ruleUnitLen);
        this.container.append(this.ruleAuxiliary.canvas);
      }else{
        this.ruleAuxiliary.resize(this.width, this.height);
      }
    }
    if(!this.writing){
      this.writing = new Writing(this.width, this.height,this.preStore);
      this.container.append(this.writing.canvas);
    }else{
      this.writing.resize(this.width, this.height);
    }
    if(this.useShapeType){
      if(!this.toolShape){
        this.toolShape = new ToolShape(this.width, this.height, this.voice, container, this.getPageCoords);
        this.container.append(this.toolShape.canvas);
      }else{
        this.toolShape.resize(this.width, this.height);
      }
    }
    if(!this.eraser){
      this.eraser = new Eraser(this.width, this.height);
      this.container.append(this.eraser.canvas);
    }else{
      this.eraser.resize(this.width, this.height);
    }
    this.brushDrawing = new BrushDrawing(this.width,this.height,this.voice,this.writing);
    if(this.stack){
      this.stackObj.width = this.width;
      this.stackObj.height = this.height;
    }
    this.draw();
  }
  setVoice(voice = 1) {
    this.voice = voice;
    this.brushDrawing.voice = voice;
    this.brushDrawing.d = voice;
  }
  showBG() {
    this.enableBG = true;
    this.draw();
  }
  hideBG() {
    this.enableBG = false;
    this.draw();
  }
  showRule() {
    this.rule = true;
    this.draw();
  }
  hideRule() {
    this.rule = false;
    this.draw();
  }
  showToolShape() {
    this.useShapeType = true;
    this.drawToolShape();
  }
  hideToolShape() {
    this.useShapeType = false;
    this.drawToolShape();
  }
  setToolShapeType(shapeType: ShapeType) {
    this.toolShape.toolShapeType = shapeType;
    this.drawToolShape();
  }
  private adjustOffset() {
    const [[minX, maxX], [minY, maxY]] = this.scrollRange;
    if (typeof minX === 'number') {
      this.worldOffsetX = Math.max(minX, this.worldOffsetX);
    }
    if (typeof maxX === 'number') {
      this.worldOffsetX = Math.min(maxX, this.worldOffsetX);
    }
    if (typeof minY === 'number') {
      this.worldOffsetY = Math.max(minY, this.worldOffsetY);
    }
    if (typeof maxY === 'number') {
      this.worldOffsetY = Math.min(maxY, this.worldOffsetY);
    }
    this.worldOffsetX = Math.round(this.worldOffsetX);
    this.worldOffsetY = Math.round(this.worldOffsetY);
  }
  private doMove(preOffsetX: number, preOffsetY: number, i = 0) {
    if (this.scrollDirection === ScrollDirection.ALL) {
      this.worldOffsetX += preOffsetX;
      this.worldOffsetY += preOffsetY;
    } else if (this.scrollDirection === ScrollDirection.X) {
      this.worldOffsetX += preOffsetX;
    } else if (this.scrollDirection === ScrollDirection.Y) {
      this.worldOffsetY += preOffsetY;
    }
    this.adjustOffset();
    this.draw();
    self.requestAnimationFrame(() => {
      if (this.moveT && i < this.moveCountTotal) {
        this.doMove(preOffsetX, preOffsetY, ++i);
      } else {
        this.moveT = false;
      }
    });
  }
  scrollBy(x = 0, y = 0) {
    if (!this.dragLocked) {
      const preOffsetX = x / this.moveCountTotal;
      const preOffsetY = y / this.moveCountTotal;
      this.moveT = true;
      this.doMove(preOffsetX, preOffsetY);
    }
  }
  clear() {
    this.worldOffsetX = 0;
    this.worldOffsetY = 0;
    this.writing.clear();
    this.draw();
    this.stack && this.stackObj.saveState([...this.writing.store]);
  }
  triggerOnChange() {
    window.requestIdleCallback(() => {
      if (this.onChange) {
        const canvas = this.exportAsCanvas();
        this.onChange(canvas);
      }
    });
  }
  exportAsCanvas() {
    return this.writing.getWholeCanvas();
  }
  exportAsPaperCanvas() {
    const imageCanvas = this.writing.getPaperCanvas();
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    canvas.width = imageCanvas.width;
    canvas.height = imageCanvas.height;
    const ctx = canvas.getContext('2d')!;
    if (this.enableBG) {
      this.loadBackground(ctx);
    }
    ctx.drawImage(imageCanvas, 0, 0);
    return canvas;
  }
  undo() {
    this.stack && this.stackObj.undo();
  }
  redo() {
    this.stack && this.stackObj.redo();
  }
  clean() {
    this.cleanState = true;
  }
  unclean() {
    this.cleanState = false;
  }
  draw(showDu=false,duCx=0,duCy=0) {
    if (this.enableBG) {
      this.loadBackground();
    }
    if(this.rule){
      this.loadRule();
    }
    this.writing.refresh(this.worldOffsetX, this.worldOffsetY);
    this.drawEraser();
    if(this.useShapeType){
      this.drawToolShape(showDu,duCx,duCy);
    }
    this.debounceBindOnChange();
  }
  private doPushPoints(x:number,y:number,event:PointerEvent){
    if(event.pointerType === 'pen'){
      
    }
    this.brushDrawing.pushPoints({x,y,pressure:event.pressure,pointerType:event.pointerType});
  }
  private loadEvent() {
    let hasMoved = false;
    let hasWrited = false;
    let isDoubleTouch = false;
    let isToolShapeDoubleTouch = false;
    let isToolShapeSingleTouch = false;
    let rotationCenter!: { x: number, y: number };
    let turnStartAngle = 0;

    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartTime = 0;
    let dragEndX = 0;
    let dragEndY = 0;
    let dragEndTime = 0;

    let isSingleTouch = false;


    const handleWriteStart = (coords: Coords,event: PointerEvent) => {
      const x = coords.pageX;
      const y = coords.pageY;
      this.brushDrawing.reset(this.color);
      hasMoved = false;
      hasWrited = false;
      let conformingToDistance = false;
      if (this.useShapeType) {
        const distanceAndPoint = this.toolShape.getNearestDistanceAndPoint(coords.pageX, coords.pageY, this.voice, this.color);
        conformingToDistance = distanceAndPoint.conformingToDistance;
      }

      if (!this.cleanState && conformingToDistance) {
        this.activateToolShape = true;
      } else {
        if (!this.cleanState && this.useShapeType && this.toolShape.isPointInPath(coords.pageX, coords.pageY, 'evenodd')) {
          isSingleTouch = false;
        }else if(!this.cleanState){
          this.brushDrawing.setPrev(x,y,event.pressure)
        }
        this.activateToolShape = false;
      }
      if (this.cleanState) {
        this.cleanX = x;
        this.cleanY = y;
        this.cleanPress = true;
        this.drawEraser();
      }
    };
    const handleTouchStart = (event: TouchEvent) => {
      this.moveT = false;
      this.scrolling = false;
      const touches = event.touches;
      const coords = this.getPageCoords(touches);
      let isPointInPath = false;
      
      dragEndX = coords.pageX;
      dragEndY = coords.pageY;
      if (touches.length === 2) {
        isDoubleTouch = true;
        isSingleTouch = false;
        if (this.dragLocked) { return; }
        dragEndTime = performance.now();
        if (this.cleanState) {
          this.cleanPress = false;
          this.draw();
        }
        if (this.useShapeType && this.toolShape.isPointInPath(coords.pageX, coords.pageY, 'nonzero')) {
          isPointInPath = true;
        }
        if (isPointInPath) {
          isToolShapeDoubleTouch = true;
          isToolShapeSingleTouch = false;
          rotationCenter = { x: coords.pageX, y: coords.pageY };
          turnStartAngle = Math.atan2(touches[1].pageY - touches[0].pageY,touches[1].pageX - touches[0].pageX) / Math.PI * 180;
          if(turnStartAngle<0){
            turnStartAngle += 360;
          }
        } else {
          isToolShapeDoubleTouch = false;
        }
      } else if (touches.length === 1 && !this.writeLocked) {
        if (this.useShapeType && this.toolShape.isPointInPath(coords.pageX, coords.pageY,'evenodd')) {
          isPointInPath = true;
        }
        if (isPointInPath) {
          isToolShapeDoubleTouch = false;
          isToolShapeSingleTouch = true;
        } else {
          isToolShapeSingleTouch = false;
        }
        isSingleTouch = true;
      }else{
        isSingleTouch = false;
      }
    };
    const handlePointerdown = (event: PointerEvent) => {
      isSingleTouch = true;
      event.preventDefault();
      if (!this.writeLocked) {
        setTimeout(() => {
          if(isSingleTouch){
            const { pageX, pageY } = event;
            const coords = this.getPageCoords([{ pageX, pageY }]);
            handleWriteStart(coords,event);
          }
        });
      }
    };
    const doInsertPointByToolShape = (gatherAreasObj:GatherAreasObj) => {
      this.writing.singlePointsWriting(gatherAreasObj);
    };
    const handleWriteMove = (coords: Coords,event: PointerEvent) => {
      const x = coords.pageX;
      const y = coords.pageY;
      hasMoved = true;
      hasWrited = true;
      if (this.cleanState) {
        this.doClean(this.cleanX!,this.cleanY!,x, y);
        this.cleanX = x;
        this.cleanY = y;
        this.drawEraser();
      } else {
        if (this.useShapeType && this.activateToolShape) {
          const lineWidth = this.voice;
          const { gatherAreasObj } = this.toolShape.getNearestDistanceAndPoint(coords.pageX, coords.pageY, lineWidth, this.color);
          doInsertPointByToolShape(gatherAreasObj!);
        } else {
          this.doPushPoints(x,y,event);
        }
      }
    };
    const handlePointermove = (event: PointerEvent) => {
      setTimeout(() => {
        if (isSingleTouch) {
          if(!this.useShapeType || !isToolShapeSingleTouch){
            const { pageX, pageY } = event;
            const coords = this.getPageCoords([{ pageX, pageY }]);
            handleWriteMove(coords,event);
          }
        }
      });
    };
    const handleTouchMove = (event: TouchEvent) => {
      const touches = event.touches;
      if (isDoubleTouch) {
        if (this.dragLocked) { return; }
        dragStartX = dragEndX;
        dragStartY = dragEndY;
        dragStartTime = dragEndTime;
        const coords = this.getPageCoords(touches);
        dragEndX = coords.pageX;
        dragEndY = coords.pageY;
        dragEndTime = performance.now();
        if (this.useShapeType && isToolShapeDoubleTouch) {
          if (event.touches.length === 2) {
            let { angle } = getTripleTouchAngleAndCenter(event);
            if(angle<0){
              angle += 360;
            }
            let deltaAngle = angle - turnStartAngle;
            turnStartAngle = angle;
            const [newX, newY] = rotateCoordinate(rotationCenter.x, rotationCenter.y, deltaAngle, this.toolShape.toolShapeCenterX, this.toolShape.toolShapeCenterY);
            this.toolShape.toolShapeCenterX = newX;
            this.toolShape.toolShapeCenterY = newY;
            this.toolShape.angle += deltaAngle;
            this.draw(true,rotationCenter.x,rotationCenter.y)
          }
        } else {
          let deltaX = 0;
          let deltaY = 0;
          if (this.scrollDirection === ScrollDirection.ALL) {
            deltaX = dragEndX - dragStartX;
            deltaY = dragEndY - dragStartY;
          } else if (this.scrollDirection === ScrollDirection.X) {
            deltaX = dragEndX - dragStartX;
          } else if (this.scrollDirection === ScrollDirection.Y) {
            deltaY = dragEndY - dragStartY;
          }
          this.worldOffsetX -= deltaX;
          this.worldOffsetY -= deltaY;
          this.adjustOffset();
          this.draw();
        }
      }else if(this.useShapeType && isToolShapeSingleTouch){
        dragStartX = dragEndX;
        dragStartY = dragEndY;
        const coords = this.getPageCoords(touches);
        dragEndX = coords.pageX;
        dragEndY = coords.pageY;
        const deltaX = dragEndX - dragStartX;
        const deltaY = dragEndY - dragStartY;

        this.toolShape.toolShapeCenterX += deltaX;
        this.toolShape.toolShapeCenterY += deltaY;
        this.draw();
      }
    };
    const scrollDecay = (speedX: number, speedY: number) => {
      this.scrolling = true;
      const minSpeed = 0.1;
      let t = 0;
      const _scrollDecay = (speedX: number, speedY: number) => {
        if (Math.abs(speedX) > minSpeed || Math.abs(speedY) > minSpeed) {
          this.worldOffsetX -= speedX;
          this.worldOffsetY -= speedY;
          this.adjustOffset();
          this.draw();
          const ratio = Math.max((99 - 0.01 * t++), 50) / 100;
          speedX = ratio * speedX;
          speedY = ratio * speedY;
          self.requestAnimationFrame(() => {
            if (this.scrolling) {
              _scrollDecay(speedX, speedY);
            }
          });
        } else {
          this.scrolling = false;
        }
      };
      _scrollDecay(speedX, speedY);
    };
    const handleWriteEnd = (coords: Coords) => {
      if (isDoubleTouch) {
        if (this.dragLocked) { return; }
        const deltaX = dragEndX - dragStartX;
        const deltaY = dragEndY - dragStartY;
        const deltaTime = dragEndTime - dragStartTime;
        let speedX = 0;
        let speedY = 0;
        if (this.scrollDirection === ScrollDirection.ALL) {
          speedX = deltaX / deltaTime;
          speedY = deltaY / deltaTime;
        } else if (this.scrollDirection === ScrollDirection.X) {
          speedX = deltaX / deltaTime;
        } else if (this.scrollDirection === ScrollDirection.Y) {
          speedY = deltaY / deltaTime;
        }
        // if (!isToolShapeDoubleTouch && !isToolShapeSingleTouch) {
        //   scrollDecay(speedX, speedY);
        // }
      }
      if(this.useShapeType && isToolShapeDoubleTouch){
        let angle = this.toolShape.angle;
        angle = (Math.floor(angle)%360 + 360)%360;
        let needJustify = false;
        for(let i = 0;i<this.justifyDus.length;i++){
          const justifyDu = this.justifyDus[i];
          if(Math.abs(justifyDu - angle)<15){
            turnStartAngle = justifyDu;
            needJustify = true;
            break;
          }
        }
        if(needJustify){
          let deltaAngle = turnStartAngle - angle;
          const [newX, newY] = rotateCoordinate(rotationCenter.x, rotationCenter.y, deltaAngle, this.toolShape.toolShapeCenterX, this.toolShape.toolShapeCenterY);
          this.toolShape.toolShapeCenterX = newX;
          this.toolShape.toolShapeCenterY = newY;
          this.toolShape.angle += deltaAngle;
          this.draw(true,rotationCenter.x,rotationCenter.y)
          setTimeout(() => {
            this.draw();
          },500);
        }else{
          setTimeout(() => {
            this.draw();
          },500);
        }
      }
    };
    const handleTouchEnd = (event: TouchEvent) => {
      const touches = event.changedTouches;
      const coords = this.getPageCoords(touches);
      handleWriteEnd(coords);
    };
    const handlePointerup = (event: PointerEvent) => {
      this.brushDrawing.submit();
      if (isSingleTouch) {
        if (!this.cleanState || this.eraserHasContent) {
          this.eraserHasContent = false;
          this.writing.pushImageData(this.worldOffsetX, this.worldOffsetY);
          if (this.stack && hasWrited) {
            this.stackObj.saveState(this.writing.store);
          }
        }
      }

      if (this.cleanState) {
        this.cleanPress = false;
        this.draw();
      }
      isDoubleTouch = false;
      isSingleTouch = false;
      if(this.useShapeType){
        this.toolShape.prevPoint = null;
      }
    };
    const container = this.container;
    if (isTouchDevice()) {
      container.addEventListener("touchstart", handleTouchStart, { passive: true });
      container.addEventListener("touchmove", handleTouchMove, { passive: true });
      container.addEventListener("touchend", handleTouchEnd, { passive: true });
    }
    container.addEventListener("pointerdown", handlePointerdown);
    self.addEventListener("pointermove", handlePointermove);
    self.addEventListener("pointerup", handlePointerup);

  }
  getPageCoords = (touches: TouchList | Coords[]) => {
    const { x: containerX, y: containerY } = this.containerOffset();
    const length = touches.length;
    let totalX = 0;
    let totalY = 0;
    for (let i = 0; i < length; i++) {
      const touch = touches[i];
      totalX += touch.pageX - containerX;
      totalY += touch.pageY - containerY;
    }
    totalX /= length;
    totalY /= length;
    return { pageX: totalX, pageY: totalY };
  };
  private drawEraser() {
    if (this.cleanState && this.cleanPress) {
      this.eraser.draw(this.cleanX as number, this.cleanY as number, this.cleanR as number);
    }
    this.eraser.canvas.style.opacity = (this.cleanState && this.cleanPress) ? '1' : '0';
  }
  private doClean(x1:number,y1:number,x2: number, y2: number) {
    const hasContent = this.writing.doClean(x1, y1, x2, y2,this.cleanR,true);
    if (hasContent) {
      this.eraserHasContent = true;
    }
  }
  private loadBackground(ctx: CanvasRenderingContext2D | null = null) {
    let coordX = 0;
    let coordY = 0;
    let background: Background;
    if (!ctx) {
      const offsetX = negativeRemainder(this.worldOffsetX, this.gridGap * 2);
      const offsetY = negativeRemainder(this.worldOffsetY, this.gridGap * 2);
      coordX = -offsetX;
      coordY = -offsetY;
      background = this.background;
    } else {
      const canvas = ctx.canvas;
      const { width, height } = canvas;
      background = new Background(width, height, this.gridGap, this.gridFillStyle, this.gridPaperGap, this.gridPaperStrokeStyle, this.quadrillePaperVerticalMargin, this.quadrillePaperGap, this.quadrillePaperStrokeStyles);
    }
    if (this.enableBG) {
      background.draw(coordX, coordY, this.bgPattern);
      if (ctx) {
        ctx.drawImage(background.canvas, 0, 0);
      }
    }
    background.canvas.style.opacity = this.enableBG ? '1' : '0';
  }
  private loadRule() {
    if (this.rule) {
      this.ruleAuxiliary.draw(this.worldOffsetX, this.worldOffsetY);
    }
    this.ruleAuxiliary.canvas.style.opacity = this.rule ? '1' : '0';
  }
  private drawToolShape(showDu=false,duCx=0,duCy=0) {
    this.toolShape.canvas.style.opacity = this.useShapeType ? '1' : '0';
    if(this.useShapeType){
      this.toolShape.draw(showDu,duCx,duCy);
    }
  }
}
export { Board };