import type {Options,PointsGroup,Store,ContainerOffset,Coords, OnChange, ScrollRange, Points} from './type';
import {Stack} from './stack';
import {WriteModel,BGPattern,ScrollDirection,ShapeType} from './enum';
import {debounce,getTripleTouchAngleAndCenter,rotateCoordinate,negativeRemainder} from './utils';
import ToolShape from './component/ToolShape';
import Background from './component/Background';
import RuleAuxiliary from './component/RuleAuxiliary';
import Border from './component/Border';
import Writing from './component/Writing';
import Eraser from './component/Eraser';
export {WriteModel,BGPattern,ScrollDirection,ShapeType};
function isTouchDevice() {
  return 'ontouchstart' in self;
}
/**
 * 滚动范围
 */
const defaultScrollRange:ScrollRange = [[null,null],[null,null]];
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
const defaultQuadrillePaperStrokeStyles = ['rgba(0,0,255,.5)','rgba(255,0,0,.5)','rgba(0,0,255,1)','rgba(0,0,255,.5)'];
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
const defaultColor = 'rgb(0,0,0)';
/**
 * 是否启用操作历史
 */
const defaultStack = true;
/**
 * 橡皮擦除的宽度
 */
const defaultCleanWidth = 20;
/**
 * 橡皮擦除的高度
 */
const defaultCleanHeight = 20;
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
const defaultBorderWidth = 2;
/**
 * 是否使用尺子等工具
 */
const defaultUseShapeType = false;

const defaultOptions = {
  scrollRange:defaultScrollRange,
  scrollDirection:defaultScrollDirection,
  bgPattern:defaultBGPattern,
  writeModel:defaultWriteModel,
  enableBG:defaultEnableBG,
  gridGap:defaultGridGap,
  gridPaperGap:defaultGridPaperGap,
  quadrillePaperVerticalMargin:defaultQuadrillePaperVerticalMargin,
  quadrillePaperGap:defaultQuadrillePaperGap,
  gridFillStyle:defaultGridFillStyle,
  gridPaperStrokeStyle:defaultGridPaperStrokeStyle,
  quadrillePaperStrokeStyles:defaultQuadrillePaperStrokeStyles,
  rule:defaultRule,
  ruleGap:defaultRuleGap,
  ruleUnitLen:defaultRuleUnitLen,
  ruleStrokeStyle:defaultRuleStrokeStyle,
  voice:defaultVoice,
  color:defaultColor,
  stack:defaultStack,
  cleanWidth:defaultCleanWidth,
  cleanHeight:defaultCleanHeight,
  moveCountTotal:defaultMoveCountTotal,
  writeLocked:defaultWriteLocked,
  dragLocked:defaultDragLocked,
  showBorder:defaultShowBorder,
  borderStyle:defaultBorderStyle,
  borderWidth:defaultBorderWidth,
  useShapeType:defaultUseShapeType
};
export default class Board{
  private width:number;
  private height:number;
  private worldOffsetX = 0;
  private worldOffsetY = 0;
  private scrolling = false;
  private d = 1;
  private maxD = 2;
  private pointsGroup: PointsGroup = [];
  private cleanState = false;
  private cleanX?:number;
  private cleanY?:number;
  private cleanPress = false;
  private stackObj!:Stack;
  private minX!:number;
  private minY!:number;
  private moveT = false;
  private debounceBindOnChange:()=>void;
  private prevPoints!:Points|null;

  private toolShape:ToolShape;
  private activateToolShape = false;
  private toolShapeCenterX:number;
  private toolShapeCenterY:number;
  private toolShapeAngle:number;
  private background:Background;
  private ruleAuxiliary:RuleAuxiliary;
  private border:Border;
  private writing:Writing;
  private eraser:Eraser;
  private eraserHasContent = false;
  private toolShapeType:ShapeType = ShapeType.RIGHT_ANGLE_TRIANGLE;

  scrollRange:ScrollRange;
  scrollDirection:ScrollDirection;
  bgPattern:BGPattern;
  writeModel:WriteModel;
  enableBG:boolean;
  gridGap:number;
  gridPaperGap:number;
  quadrillePaperVerticalMargin:number;
  quadrillePaperGap:number;
  gridFillStyle:string;
  gridPaperStrokeStyle:string;
  quadrillePaperStrokeStyles:string[];
  rule:boolean;
  ruleGap:number;
  ruleUnitLen:number;
  ruleStrokeStyle:string;
  voice:number;
  color:string;
  cleanWidth:number;
  cleanHeight:number;
  stack:boolean;
  moveCountTotal:number;
  writeLocked:boolean;
  dragLocked:boolean;
  showBorder:boolean;
  borderStyle:string;
  borderWidth:number;
  useShapeType:boolean;
  containerOffset:ContainerOffset;
  onChange:OnChange|undefined;

  constructor(public container:HTMLDivElement,options:Options = defaultOptions){
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
    this.voice = options.voice  ?? defaultVoice;
    this.color = options.color ?? defaultColor;
    this.stack = options.stack ?? defaultStack;
    this.cleanWidth = options.cleanWidth ?? defaultCleanWidth;
    this.cleanHeight = options.cleanHeight ?? defaultCleanHeight;
    this.moveCountTotal = options.moveCountTotal ?? defaultMoveCountTotal;
    this.writeLocked = options.writeLocked ?? defaultWriteLocked;
    this.dragLocked = options.dragLocked ?? defaultDragLocked;
    this.showBorder = options.showBorder ?? defaultShowBorder;
    this.borderStyle = options.borderStyle ?? defaultBorderStyle;
    this.borderWidth = options.borderWidth ?? defaultBorderWidth;
    this.useShapeType = options.useShapeType ?? defaultUseShapeType;
    this.containerOffset = options.containerOffset ?? (()=>{
      const scrollingElement = document.scrollingElement as HTMLElement;
      const rect = this.container.getBoundingClientRect();
      return {
        x:rect.x + scrollingElement.scrollLeft,
        y:rect.y + scrollingElement.scrollTop
      };
    });
    this.onChange = options.onChange;
    this.debounceBindOnChange = debounce(this.triggerOnChange,500);
    const rect = container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    if(this.stack){
      this.stackObj = new Stack(this.width,this.height);
      this.stackObj.restoreState = (store:Store)=>{
        const storeLen = store.length;
        const lastStoreItem = store[storeLen-1];
        const prevWorldOffsetX = this.worldOffsetX;
        const prevWorldOffsetY = this.worldOffsetY;
        const targetWorldOffsetX = lastStoreItem.worldOffsetX;
        const targetWorldOffsetY = lastStoreItem.worldOffsetY;
        const offsetX = targetWorldOffsetX - prevWorldOffsetX;
        const offsetY = targetWorldOffsetY - prevWorldOffsetY;
        if(!offsetX&&!offsetY){
          this.worldOffsetX = lastStoreItem.worldOffsetX;
          this.worldOffsetY = lastStoreItem.worldOffsetY;
          this.writing.store = store;
          this.draw();
        }else{
          const preOffsetX = offsetX/this.moveCountTotal;
          const preOffsetY = offsetY/this.moveCountTotal;
          this.writing.store = store;
          this.moveT = true;
          this.doMove(preOffsetX,preOffsetY);
        }
      };
    }

    this.background = new Background(this.width,this.height,this.gridGap,this.gridFillStyle,this.gridPaperGap,this.gridPaperStrokeStyle,this.quadrillePaperVerticalMargin,this.quadrillePaperGap,this.quadrillePaperStrokeStyles);
    this.container.append(this.background.canvas);
    this.ruleAuxiliary = new RuleAuxiliary(this.width,this.height,this.ruleStrokeStyle,this.ruleGap,this.ruleUnitLen);
    this.container.append(this.ruleAuxiliary.canvas);
    this.border = new Border(this.width,this.height,this.borderStyle,this.borderWidth);
    this.container.append(this.border.canvas);
    this.writing = new Writing(this.width,this.height);
    this.container.append(this.writing.canvas);
    this.toolShape = new ToolShape(this.width,this.height,this.voice);
    this.container.append(this.toolShape.canvas);
    this.toolShapeCenterX = 500;
    this.toolShapeCenterY = 200;
    this.toolShapeAngle = 10;
    this.eraser = new Eraser(this.width,this.height);
    this.container.append(this.eraser.canvas);
    this.loadEvent();
    this.draw();
  }
  setVoice(voice = 1){
    this.voice = voice;
    this.d = voice;
    this.maxD = voice * 2;
  }
  showBG(){
    this.enableBG = true;
    this.draw();
  }
  hideBG(){
    this.enableBG = false;
    this.draw();
  }
  showRule(){
    this.rule = true;
    this.draw();
  }
  hideRule(){
    this.rule = false;
    this.draw();
  }
  showToolShape(){
    this.useShapeType = true;
    this.draw();
  }
  hideToolShape(){
    this.useShapeType = false;
    this.draw();
  }
  setToolShapeType(shapeType:ShapeType){
    this.toolShapeType = shapeType;
    this.draw();
  }
  private adjustOffset(){
    const [[minX,maxX],[minY,maxY]] = this.scrollRange;
    if(typeof minX === 'number'){
      this.worldOffsetX = Math.max(minX,this.worldOffsetX);
    }
    if(typeof maxX === 'number'){
      this.worldOffsetX = Math.min(maxX,this.worldOffsetX);
    }
    if(typeof minY === 'number'){
      this.worldOffsetY = Math.max(minY,this.worldOffsetY);
    }
    if(typeof maxY === 'number'){
      this.worldOffsetY = Math.min(maxY,this.worldOffsetY);
    }
    this.worldOffsetX = Math.round(this.worldOffsetX);
    this.worldOffsetY = Math.round(this.worldOffsetY);
  }
  private doMove(preOffsetX:number,preOffsetY:number,i=0){
    if(this.scrollDirection === ScrollDirection.ALL){
      this.worldOffsetX+=preOffsetX;
      this.worldOffsetY+=preOffsetY;
    }else if(this.scrollDirection === ScrollDirection.X){
      this.worldOffsetX+=preOffsetX;
    }else if(this.scrollDirection === ScrollDirection.Y){
      this.worldOffsetY+=preOffsetY;
    }
    this.adjustOffset();
    this.draw();
    self.requestAnimationFrame(()=>{
      if(this.moveT && i<this.moveCountTotal){
        this.doMove(preOffsetX,preOffsetY,++i);
      }else{
        this.moveT = false;
      }
    });
  }
  scrollBy(x = 0,y = 0){
    if(!this.dragLocked){
      const preOffsetX = x/this.moveCountTotal;
      const preOffsetY = y/this.moveCountTotal;
      this.moveT = true;
      this.doMove(preOffsetX,preOffsetY);
    }
  }
  clear(){
    this.worldOffsetX = 0;
    this.worldOffsetY = 0;
    this.writing.clear();
    this.draw();
    this.stackObj.saveState([...this.writing.store]);
  }
  triggerOnChange(){
    window.requestIdleCallback(()=>{
      if(this.onChange){
        const canvas = this.exportAsCanvas();
        this.onChange(canvas);
      }
    });
  }
  drawPureCanvas(ctx:CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D,crop = true){
    this.pointsGroup?.forEach(({corners,fillStyle})=>{
      corners.forEach(([[wx11,wy11],[wx12,wy12],[wx21,wy21],[wx22,wy22]])=>{
        let x11 = wx11;
        let y11 = wy11;
        let x12 = wx12;
        let y12 = wy12;
        let x21 = wx21;
        let y21 = wy21;
        let x22 = wx22;
        let y22 = wy22;
        if(crop){
          x11 = wx11 - this.minX;
          y11 = wy11 - this.minY;
          x12 = wx12 - this.minX;
          y12 = wy12 - this.minY;
          x21 = wx21 - this.minX;
          y21 = wy21 - this.minY;
          x22 = wx22 - this.minX;
          y22 = wy22 - this.minY;
        }
        ctx.save();
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.moveTo(x11,y11);
        ctx.lineTo(x12,y12);
        ctx.lineTo(x22,y22);
        ctx.lineTo(x21,y21);
        ctx.fill();
        ctx.restore();
      });
    });
  }
  exportAsCanvas(){
    return this.writing.getWholeCanvas();
  }
  exportAsPaperCanvas(){
    const imageCanvas = this.writing.getPaperCanvas();
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    canvas.width = imageCanvas.width;
    canvas.height = imageCanvas.height;
    const ctx = canvas.getContext('2d')!;
    if(this.enableBG){
      this.loadBackground(ctx);
    }
    ctx.drawImage(imageCanvas,0,0);
    return canvas;
  }
  undo(){
    this.stackObj.undo();
  }
  redo(){
    this.stackObj.redo();
  }
  clean(){
    this.cleanState = true;
  }
  unclean(){
    this.cleanState = false;
  }
  draw(){
    this.loadBackground();
    this.loadRule();
    this.writing.refresh(this.worldOffsetX,this.worldOffsetY);
    this.drawEraser();
    this.drawToolShape();
    this.debounceBindOnChange();
  }
  private loadEvent(){
    let hasMoved = false;
    let hasWrited = false;
    let isDoubleTouch = false;
    let isToolShapeDoubleTouch = false;
    let rotationCenter!: { x: number, y: number };
    let turnStartAngle = 0;

    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartTime = 0;
    let dragEndX = 0;
    let dragEndY = 0;
    let dragEndTime = 0;

    let needPushPoints = false;
    let isSingleTouch = false;
    let writeStartX = 0;
    let writeStartY = 0;
    let writeStartTime = 0;
    let writeEndX = 0;
    let writeEndY = 0;
    let writeEndTime = 0;

    const handleWriteStart = (coords:Coords) => {
      hasMoved = false;
      hasWrited = false;
      isSingleTouch = true;
      needPushPoints = true;
      let conformingToDistance = false;
      if(this.useShapeType){
        const distanceAndPoint = this.toolShape.getNearestDistanceAndPoint(coords.pageX,coords.pageY,this.voice,this.color);
        conformingToDistance = distanceAndPoint.conformingToDistance;
      }

      if(!this.cleanState && conformingToDistance){
        this.activateToolShape = true;
      }else{
        if(!this.cleanState && this.useShapeType && this.toolShape.isPointInPath(coords.pageX,coords.pageY,'evenodd')){
          isSingleTouch = false;
        }
        this.activateToolShape = false;
        writeEndX = coords.pageX;
        writeEndY = coords.pageY;
      }
      writeEndTime = performance.now();
      if(this.cleanState){
        this.cleanX = writeEndX;
        this.cleanY = writeEndY;
        this.cleanPress = true;
        this.drawEraser();
      }
    };
    const handleTouchStart = (event:TouchEvent) => {
      this.moveT = false;
      this.scrolling = false;
      const touches = event.touches;
      const coords = getPageCoords(touches);
      if (touches.length === 2) {
        isDoubleTouch = true;
        isSingleTouch = false;
        if(this.dragLocked){return;}

        dragEndX = coords.pageX;
        dragEndY = coords.pageY;
        dragEndTime = performance.now();
        if(this.cleanState){
          this.cleanPress = false;
          this.draw();
        }
        let isPointInPath = false;
        if(this.useShapeType && this.toolShape.isPointInPath(coords.pageX,coords.pageY,'nonzero')){
          isPointInPath = true;
        }
        if(isPointInPath){
          isToolShapeDoubleTouch = true;
          rotationCenter = {x:coords.pageX,y:coords.pageY};
        }else{
          isToolShapeDoubleTouch = false;
        }
      }else if(touches.length === 1){
        if(!this.writeLocked){
          handleWriteStart(coords);
        }
      }
    };
    const handleMouseStart = (event:MouseEvent) => {
      event.preventDefault();
      if(!this.writeLocked){
        const {pageX,pageY} = event;
        const coords = getPageCoords([{pageX,pageY}]);
        handleWriteStart(coords);
      }
    };
    const doInsertPointByToolShape = (nearestPoints:{x:number,y:number,fillStyle:string}[]) => {
      this.writing.singlePointsWriting(nearestPoints);
    };
    const doInsertPoint = (writeStartX:number,writeStartY:number,writeEndX:number,writeEndY:number) => {
      if(needPushPoints){
        this.prevPoints = null;
        needPushPoints = false;
      }
      const points = this.pushPoints(writeStartX,writeStartY,writeEndX,writeEndY,writeStartTime,writeEndTime);
      if(points){
        this.prevPoints = points;
        this.doWriting(points);
        this.debounceBindOnChange();
      }
    };
    const handleWriteMove = (coords:Coords) => {
      hasMoved = true;
      hasWrited = true;
      writeStartX = writeEndX;
      writeStartY = writeEndY;
      writeStartTime = writeEndTime;
      writeEndX = coords.pageX;
      writeEndY = coords.pageY;
      writeEndTime = performance.now();
      if(this.cleanState){
        this.cleanX = writeEndX;
        this.cleanY = writeEndY;
        this.doClean(writeEndX,writeEndY);
        this.drawEraser();
      }else{
        if(this.useShapeType && this.activateToolShape){
          const lineWidth = this.voice;
          const {drawPoints} = this.toolShape.getNearestDistanceAndPoint(coords.pageX,coords.pageY,lineWidth,this.color);
          doInsertPointByToolShape(drawPoints);
        }else{
          doInsertPoint(writeStartX,writeStartY,writeEndX,writeEndY);
        }
      }
    };
    const handleMouseMove = (event:MouseEvent) => {
      if(isSingleTouch){
        const {pageX,pageY} = event;
        const coords = getPageCoords([{pageX,pageY}]);
        handleWriteMove(coords);
      }
    };
    const handleTouchMove = (event:TouchEvent) => {
      const touches = event.touches;
      if (isDoubleTouch) {
        if(this.dragLocked){return;}
        dragStartX = dragEndX;
        dragStartY = dragEndY;
        dragStartTime = dragEndTime;
        const coords = getPageCoords(touches);
        dragEndX = coords.pageX;
        dragEndY = coords.pageY;
        dragEndTime = performance.now();
        if(this.useShapeType && isToolShapeDoubleTouch){
          const deltaX = dragEndX - dragStartX;
          const deltaY = dragEndY - dragStartY;
          this.toolShapeCenterX += deltaX;
          this.toolShapeCenterY += deltaY;
          if(event.touches.length === 2){
            const {angle} = getTripleTouchAngleAndCenter(event);
            let deltaAngle = angle - turnStartAngle;
            deltaAngle %= 30;
            turnStartAngle = angle;
            const [newX,newY] = rotateCoordinate(rotationCenter.x,rotationCenter.y,deltaAngle,this.toolShapeCenterX,this.toolShapeCenterY);
            this.toolShapeCenterX = newX;
            this.toolShapeCenterY = newY;
            this.toolShapeAngle += deltaAngle;
            this.draw();
          }
        }else{
          let deltaX = 0;
          let deltaY = 0;
          if(this.scrollDirection === ScrollDirection.ALL){
            deltaX = dragEndX - dragStartX;
            deltaY = dragEndY - dragStartY;
          }else if(this.scrollDirection === ScrollDirection.X){
            deltaX = dragEndX - dragStartX;
          }else if(this.scrollDirection === ScrollDirection.Y){
            deltaY = dragEndY - dragStartY;
          }
          this.worldOffsetX -= deltaX;
          this.worldOffsetY -= deltaY;
          this.adjustOffset();
          this.draw();
        }
      } else if(isSingleTouch){
        const coords = getPageCoords(touches);
        handleWriteMove(coords);
      }
    };
    const scrollDecay = (speedX:number,speedY:number) => {
      this.scrolling = true;
      const minSpeed = 0.1;
      let t = 0;
      const _scrollDecay = (speedX:number,speedY:number) => {
        if(Math.abs(speedX)>minSpeed||Math.abs(speedY)>minSpeed){
          this.worldOffsetX -= speedX;
          this.worldOffsetY -= speedY;
          this.adjustOffset();
          this.draw();
          const ratio = Math.max((99 - 0.01 * t++),50)/100;
          speedX = ratio * speedX;
          speedY = ratio * speedY;
          self.requestAnimationFrame(()=>{
            if(this.scrolling){
              _scrollDecay(speedX,speedY);
            }
          });
        }else{
          this.scrolling = false;
        }
      };
      _scrollDecay(speedX,speedY);
    };
    const handleWriteEnd = (coords:Coords) => {
      if (isDoubleTouch) {
        if(this.dragLocked){return;}
        const deltaX = dragEndX - dragStartX;
        const deltaY = dragEndY - dragStartY;
        const deltaTime = dragEndTime - dragStartTime;
        let speedX = 0 ;
        let speedY = 0 ;
        if(this.scrollDirection === ScrollDirection.ALL){
          speedX = deltaX/deltaTime ;
          speedY = deltaY/deltaTime ;
        }else if(this.scrollDirection === ScrollDirection.X){
          speedX = deltaX/deltaTime ;
        }else if(this.scrollDirection === ScrollDirection.Y){
          speedY = deltaY/deltaTime ;
        }
        if(!isToolShapeDoubleTouch){
          scrollDecay(speedX,speedY);
        }
      } else if (isSingleTouch){
        if(!hasMoved){
          handleWriteMove(coords);
        }
        if(!this.cleanState || this.eraserHasContent){
          this.eraserHasContent = false;
          this.writing.pushImageData(this.worldOffsetX,this.worldOffsetY);
          if(this.stack && hasWrited){
            this.stackObj.saveState(this.writing.store);
          }
        }
      }
      if(this.cleanState){
        this.cleanPress = false;
        this.draw();
      }
      isDoubleTouch = false;
      isSingleTouch = false;
      this.toolShape.prevPoint = null;
    };
    const handleTouchEnd = (event:TouchEvent) => {
      const touches = event.changedTouches;
      const coords = getPageCoords(touches);
      handleWriteEnd(coords);
    };
    const handleMouseEnd = (event:MouseEvent) => {
      const {pageX,pageY} = event;
      const coords = getPageCoords([{pageX,pageY}]);
      handleWriteEnd(coords);
    };
    const container = this.container;
    if(isTouchDevice()){
      container.addEventListener("touchstart", handleTouchStart, { passive: true });
      container.addEventListener("touchmove", handleTouchMove, { passive: true });
      container.addEventListener("touchend", handleTouchEnd, { passive: true });
    }else{
      container.addEventListener("mousedown", handleMouseStart);
      self.addEventListener("mousemove", handleMouseMove, { passive: true });
      self.addEventListener("mouseup", handleMouseEnd, { passive: true });
    }
    const getPageCoords = (touches:TouchList|Coords[])=>{
      const {x:containerX,y:containerY} = this.containerOffset();
      const length = touches.length;
      let totalX = 0;
      let totalY = 0;
      for(let i = 0;i<length;i++){
        const touch = touches[i];
        totalX+=touch.pageX - containerX;
        totalY+=touch.pageY - containerY;
      }
      totalX /= length;
      totalY /= length;
      return {pageX:totalX,pageY:totalY};
    };
  }
  private drawEraser(){
    if(this.cleanState && this.cleanPress){
      this.eraser.draw(this.cleanX as number,this.cleanY as number,this.cleanWidth as number,this.cleanHeight as number);
    }
    this.eraser.canvas.style.opacity = (this.cleanState && this.cleanPress)?'1':'0';
  }
  private doClean(writeEndX:number,writeEndY:number){
    const hasContent = this.writing.doClean(writeEndX - this.cleanWidth/2,writeEndY - this.cleanHeight/2,this.cleanWidth,this.cleanHeight,true);
    if(hasContent){
      this.eraserHasContent = true;
    }
  }
  private getCornerCoordinate(a:number,b:number,c:number,d:number,x:number,y:number):[[number,number],[number,number]]{
    return [
      [x - b * d / Math.sqrt(a**2 + b**2),y + a * d / Math.sqrt(a**2 + b**2)],
      [x + b * d / Math.sqrt(a**2 + b**2), y - a * d / Math.sqrt(a**2 + b**2)]
    ];
  }
  private getCornersCoordinate(x1:number,y1:number,x2:number,y2:number,d:number):[[number,number],[number,number],[number,number],[number,number]]{
    const a = x2 - x1;
    const b = y2 - y1;
    const c = a * x1 + b * y1 + d * Math.sqrt(a**2 + b**2);
    const [[x11,y11],[x12,y12]] = this.getCornerCoordinate(a,b,c,d,x1,y1);
    const [[x21,y21],[x22,y22]] = this.getCornerCoordinate(a,b,c,d,x2,y2);
    return [[x11,y11],[x12,y12],[x21,y21],[x22,y22]];
  }
  private pushPoints(writeStartX:number,writeStartY:number,writeEndX:number,writeEndY:number,writeStartTime:number,writeEndTime:number){
    const x1 = writeStartX;
    const y1 = writeStartY;
    const x2 = writeEndX;
    const y2 = writeEndY;
    const distance = ((y2-y1)**2 + (x2-x1)**2)**0.5;
    const originD = (writeEndTime - writeStartTime)/distance * this.voice;
    if(!isNaN(originD)){
      if(this.writeModel === WriteModel.WRITE){
        if(originD>this.d * 1.2){
          this.d *= 1.2;
        }else if(originD<this.d/1.2){
          this.d /= 1.2;
        }else{
          this.d = originD;
        }
        if(this.d>this.maxD){
          this.d = this.maxD;
        }
      }else if (this.writeModel === WriteModel.DRAW){
        this.d = this.voice;
      }
      const points = this.getCornersCoordinate(x1,y1,x2,y2,this.d);
      const hasNaN = points.flat().some(xy=>{
        return isNaN(xy);
      });
      if(!hasNaN){
        if(this.prevPoints){
          points[0] = this.prevPoints[2];
          points[1] = this.prevPoints[3];
        }
        return points;
      }else if(!distance){
        let d = this.voice;
        if(this.writeModel === WriteModel.WRITE){
          let rate = (writeEndTime - writeStartTime)/250;
          if(rate>2){
            rate = 2;
          }else if(rate<1){
            rate = 1;
          }
          d = this.voice * rate;
        }
        const points: Points= [
          [x1 - d,y1 - d],
          [x1 - d,y1 + d],
          [x1 + d,y1 - d],
          [x1 + d,y1 + d]
        ];
        return points;
      }
    }
  }
  private doWriting(points:Points){
    this.writing.writing(points,this.color);
  }
  private loadBackground(ctx:CanvasRenderingContext2D|null = null){
    let coordX = 0;
    let coordY = 0;
    let background:Background;
    if(!ctx){
      const offsetX = negativeRemainder(this.worldOffsetX,this.gridGap * 2);
      const offsetY = negativeRemainder(this.worldOffsetY,this.gridGap * 2);
      coordX = -offsetX;
      coordY = -offsetY;
      background = this.background;
    }else{
      const canvas = ctx.canvas;
      const {width,height} = canvas;
      background = new Background(width,height,this.gridGap,this.gridFillStyle,this.gridPaperGap,this.gridPaperStrokeStyle,this.quadrillePaperVerticalMargin,this.quadrillePaperGap,this.quadrillePaperStrokeStyles);
    }
    if(this.enableBG){
      background.draw(coordX,coordY,this.bgPattern);
      if(ctx){
        ctx.drawImage(background.canvas,0,0);
      }
    }
    background.canvas.style.opacity = this.enableBG?'1':'0';
  }
  private loadRule(){
    if(this.rule){
      this.ruleAuxiliary.draw(this.worldOffsetX,this.worldOffsetY);
    }
    this.ruleAuxiliary.canvas.style.opacity = this.rule?'1':'0';
  }
  private drawToolShape(){
    if(this.useShapeType){
      this.toolShape.draw(this.toolShapeCenterX,this.toolShapeCenterY,this.toolShapeAngle,this.toolShapeType);
    }
    this.toolShape.canvas.style.opacity = this.useShapeType?'1':'0';
  }
}
export { Board };