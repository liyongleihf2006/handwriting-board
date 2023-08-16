import {Options,PointsGroup,StackType,ContainerOffset,Coords, OnChange, ScrollRange} from './type';
import {Stack} from './stack';
import {WriteModel,BGPattern,ScrollDirection} from './enum';
import {debounce,getTripleTouchAngleAndCenter,rotateCoordinate} from './utils'
import Ruler from './utils/ruler';
export {WriteModel};
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
const defaultBorderWidth = 2;

const defaultOptions = {
  scrollRange:defaultScrollRange,
  scrollDirection:defaultScrollDirection,
  bgPattern:defaultBGPattern,
  // enableEagleEyeMode:defaultEnableEagleEyeMode,
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
  cleanR:defaultCleanR,
  moveCountTotal:defaultMoveCountTotal,
  writeLocked:defaultWriteLocked,
  dragLocked:defaultDragLocked,
  showBorder:defaultShowBorder,
  borderStyle:defaultBorderStyle,
  borderWidth:defaultBorderWidth
}
export default class Board{
  // private eagleEyeOffscreen!:OffscreenCanvas;
  // private eagleEyeOffscreenCtx!:OffscreenCanvasRenderingContext2D;
  private width:number;
  private height:number;
  private ctx:CanvasRenderingContext2D;
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
  private maxX!:number;
  private maxY!:number;
  private moveT = false;
  private debounceBindOnChange:Function;
  private gridPattern:CanvasPattern;
  private gridPaperPattern:CanvasPattern;
  private quadrillePaperPattern:CanvasPattern;
  private ruler:Ruler;
  private activateAuxiliaryTools = false;
  private rulerX:number;
  private rulerY:number;
  private rulerAngle:number;

  coherentDistance = 30;
  scrollRange:ScrollRange;
  scrollDirection:ScrollDirection;
  bgPattern:BGPattern;
  // enableEagleEyeMode:boolean;
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
  cleanR:number;
  stack:boolean;
  moveCountTotal:number;
  writeLocked:boolean;
  dragLocked:boolean;
  showBorder:boolean;
  borderStyle:string;
  borderWidth:number;
  containerOffset:ContainerOffset;
  onChange:OnChange|undefined;
  constructor(public canvas:HTMLCanvasElement,options:Options = defaultOptions){
    this.scrollRange = options.scrollRange ?? defaultScrollRange;
    this.scrollDirection = options.scrollDirection ?? defaultScrollDirection;
    this.bgPattern = options.bgPattern ?? defaultBGPattern;
    // this.enableEagleEyeMode = options.enableEagleEyeMode ?? defaultEnableEagleEyeMode;
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
    this.cleanR = options.cleanR ?? defaultCleanR;
    this.moveCountTotal = options.moveCountTotal ?? defaultMoveCountTotal;
    this.writeLocked = options.writeLocked ?? defaultWriteLocked;
    this.dragLocked = options.dragLocked ?? defaultDragLocked;
    this.showBorder = options.showBorder ?? defaultShowBorder;
    this.borderStyle = options.borderStyle ?? defaultBorderStyle;
    this.borderWidth = options.borderWidth ?? defaultBorderWidth;
    this.containerOffset = options.containerOffset ?? (()=>{
      const scrollingElement = document.scrollingElement as HTMLElement;
      const rect = this.canvas.getBoundingClientRect();
      return {
        x:rect.x + scrollingElement.scrollLeft,
        y:rect.y + scrollingElement.scrollTop
      }
    });
    this.onChange = options.onChange;
    this.debounceBindOnChange = debounce(this.triggerOnChange,500);
    if(this.stack){
      this.stackObj = new Stack();
      this.stackObj.restoreState = (state:StackType)=>{
        const prevWorldOffsetX = this.worldOffsetX;
        const prevWorldOffsetY = this.worldOffsetY;
        const targetWorldOffsetX = state.worldOffsetX;
        const targetWorldOffsetY = state.worldOffsetY;
        const offsetX = targetWorldOffsetX - prevWorldOffsetX;
        const offsetY = targetWorldOffsetY - prevWorldOffsetY;
        if(!offsetX&&!offsetY){
          this.worldOffsetX = state.worldOffsetX;
          this.worldOffsetY = state.worldOffsetY;
          this.pointsGroup = state.pointGroup;
          this.draw();
        }else{
          const preOffsetX = offsetX/this.moveCountTotal;
          const preOffsetY = offsetY/this.moveCountTotal;
          this.pointsGroup = state.pointGroup;
          this.moveT = true;
          this.doMove(preOffsetX,preOffsetY);
        }
      };
    }
    const rect = canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    canvas.width = this.width;
    canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.ctx.imageSmoothingQuality = "high";
    this.gridPattern = this.generateGridPattern();
    this.gridPaperPattern = this.generateGridPaperPattern();
    this.quadrillePaperPattern = this.generateQuadrillePaperPattern();
    this.ruler = new Ruler(this.ctx,this.voice);
    this.rulerX = 100;
    this.rulerY = 100;
    this.rulerAngle = 15;
    this.ruler.setXYAngle(this.rulerX,this.rulerY,this.rulerAngle);
    this.loadEvent();
    this.draw();
  }
  // setEnableEagleEyeMode(enable:boolean){
  //   this.enableEagleEyeMode = enable;
  //   this.draw();
  // }
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
    })
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
    this.pointsGroup = [];
    this.draw();
    this.stackObj.saveState({
      worldOffsetX:this.worldOffsetX,
      worldOffsetY:this.worldOffsetY,
      pointGroup:this.pointsGroup
    });
  }
  triggerOnChange(){
    window.requestIdleCallback(()=>{
      if(this.onChange){
        const canvas = this.exportAsCanvas();
        this.onChange(canvas);
      }
    })
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
      })
    })
  }
  exportAsCanvas(){
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    this.calcSize();
    if(this.minX!==undefined){
      canvas.width = this.maxX - this.minX;
      canvas.height = this.maxY - this.minY;
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      this.drawPureCanvas(ctx);
    }else{
      canvas.width = 0;
      canvas.height = 0;
    }
    return canvas;
  }
  exportAsPaperCanvas(){
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    this.calcSize();
    canvas.width = this.width;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    if(this.minX!==undefined){
      canvas.height = Math.ceil(this.maxY/this.height) * this.height;
      this.loadGrid(ctx,false);
      this.drawPureCanvas(ctx,false);
    }else{
      canvas.height = this.height;
      this.loadGrid(ctx,false);
    }
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
  private singleDraw(pointsGroup:PointsGroup){
    this.doWriting(pointsGroup);
    this.debounceBindOnChange();
  }
  drawRuler(){
    const rulerShape = this.ruler.draw();
    this.ctx.drawImage(rulerShape!,0,0);
  }
  draw(){
    this.ctx.clearRect(0,0,this.width,this.height);
    this.loadGrid(this.ctx);
    this.loadRule();
    this.loadBorder();
    this.doWriting(this.pointsGroup);
    this.drawRuler();
    this.drawEraser();
    // this.drawEagleEye();
    this.debounceBindOnChange();
  }
  private loadEvent(){
    let hasMoved = false;
    let hasWrited = false;
    let isDoubleTouch = false;
    let isRulerDoubleTouch = false;
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
      const {conformingToDistance,nearestPoints} = this.ruler.getNearestDistanceAndPoint(coords.pageX,coords.pageY,this.voice);
      if(conformingToDistance){
        this.activateAuxiliaryTools = true;
        doInsertPointByRuler(nearestPoints);
      }else{
        this.activateAuxiliaryTools = false;
        writeEndX = coords.pageX;
        writeEndY = coords.pageY;
      }
      writeEndTime = performance.now();
      if(this.cleanState){
        this.cleanX = writeEndX;
        this.cleanY = writeEndY;
        this.cleanPress = true;
        this.draw();
      }
    }
    const handleTouchStart = (event:TouchEvent) => {
      this.moveT = false;
      this.scrolling = false;
      const touches = event.touches;
      const coords = getPageCoords(touches);
      let isPointInPath = false;
      for(let i = 0;i<touches.length;i++){
        const touch = touches[i];
        if(this.ruler.isPointInPath(touch.pageX,touch.pageY)){
          isPointInPath = true;
          break;
        }
      }
      if (touches.length === 2) {
        isDoubleTouch = true;
        isSingleTouch = false;
        if(this.dragLocked){return}
        
        dragEndX = coords.pageX;
        dragEndY = coords.pageY;
        dragEndTime = performance.now();
        if(this.cleanState){
          this.cleanPress = false;
          this.draw();
        }
        if(isPointInPath){
          isRulerDoubleTouch = true;
          rotationCenter = {x:coords.pageX,y:coords.pageY};
        }else{
          isRulerDoubleTouch = false;
        }
      }else if(touches.length === 1){
        if(!this.writeLocked){
          if(!isPointInPath){
            handleWriteStart(coords);
          }
        }
      }
    }
    const handleMouseStart = (event:MouseEvent) => {
      event.preventDefault();
      if(!this.writeLocked){
        const {pageX,pageY} = event;
        const coords = getPageCoords([{pageX,pageY}]);
        handleWriteStart(coords);
      }
    }
    const doInsertPointByRuler = (nearestPoints:[number,number][]) => {
      const len = nearestPoints.length;
      if( len > 1){
        for(let i = 1;i<len;i++){
          const prevPoint = nearestPoints[i-1];
          const currentPoint = nearestPoints[i];

          const prevMiddleX = (prevPoint[0] + writeEndX)/2;
          const prevMiddleY = (prevPoint[1] + writeEndY)/2;
          const prevIsInPath = this.ruler.isPointInPathInner(prevMiddleX,prevMiddleY,this.voice);
          

          const currentMiddleX = (currentPoint[0] + writeEndX)/2;
          const currentMiddleY = (currentPoint[1] + writeEndY)/2;
          const currentIsInPath = this.ruler.isPointInPathInner(currentMiddleX,currentMiddleY,this.voice);
          
          
          if(!currentIsInPath && !prevIsInPath){
            doInsertPoint(prevPoint[0],prevPoint[1],currentPoint[0],currentPoint[1]);
          }else{
            needPushPoints = true;
          }
        }
      }
      writeEndX = nearestPoints[len-1][0];
      writeEndY = nearestPoints[len-1][1];
    }
    const doInsertPoint = (writeStartX:number,writeStartY:number,writeEndX:number,writeEndY:number) => {
      if(needPushPoints){
        this.pointsGroup.push({
          corners:[],
          fillStyle:this.color
        });
        needPushPoints = false;
      }
      const points = this.pushPoints(writeStartX,writeStartY,writeEndX,writeEndY,writeStartTime,writeEndTime);
      if(points){
        this.singleDraw([{
          corners:[points],
          fillStyle:this.color
        }])
      }
    }
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
        this.draw();
      }else{
        if(this.activateAuxiliaryTools){
          const {nearestPoints} = this.ruler.getNearestDistanceAndPoint(coords.pageX,coords.pageY,this.voice);
          doInsertPointByRuler(nearestPoints);
        }else{
          doInsertPoint(writeStartX,writeStartY,writeEndX,writeEndY);
        }
      }
    }
    const handleMouseMove = (event:MouseEvent) => {
      if(isSingleTouch){
        const {pageX,pageY} = event;
        const coords = getPageCoords([{pageX,pageY}]);
        handleWriteMove(coords);
      }
    }
    const handleTouchMove = (event:TouchEvent) => {
      const touches = event.touches;
      if (isDoubleTouch) {
        if(this.dragLocked){return}
        dragStartX = dragEndX;
        dragStartY = dragEndY;
        dragStartTime = dragEndTime;
        const coords = getPageCoords(touches);
        dragEndX = coords.pageX;
        dragEndY = coords.pageY;
        dragEndTime = performance.now();
        if(isRulerDoubleTouch){
          const deltaX = dragEndX - dragStartX;
          const deltaY = dragEndY - dragStartY;
          this.rulerX += deltaX;
          this.rulerY += deltaY;
          if(event.touches.length === 2){
            const {angle} = getTripleTouchAngleAndCenter(event);
            let deltaAngle = angle - turnStartAngle;
            deltaAngle %= 10;
            turnStartAngle = angle;
            const [newX,newY] = rotateCoordinate(rotationCenter.x,rotationCenter.y,deltaAngle,this.rulerX,this.rulerY);
            this.rulerX = newX;
            this.rulerY = newY;
            this.rulerAngle += deltaAngle;
            this.ruler.setXYAngle(this.rulerX,this.rulerY,this.rulerAngle);
          }
          this.draw();
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
    }
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
          speedX = ratio * speedX
          speedY = ratio * speedY
          self.requestAnimationFrame(()=>{
            if(this.scrolling){
              _scrollDecay(speedX,speedY)
            }
          })
        }else{
          this.scrolling = false;
        }
      }
      _scrollDecay(speedX,speedY);
    }
    const handleWriteEnd = (coords:Coords) => {
      if (isDoubleTouch) {
        if(this.dragLocked){return}
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
        if(!isRulerDoubleTouch){
          scrollDecay(speedX,speedY);
        }
      } else if (isSingleTouch){
        if(!hasMoved){
          handleWriteMove(coords);
        }
        if(this.stack && hasWrited){
          this.stackObj.saveState({
            worldOffsetX:this.worldOffsetX,
            worldOffsetY:this.worldOffsetY,
            pointGroup:this.pointsGroup
          });
        }
      }
      if(this.cleanState){
        this.cleanPress = false;
        this.draw();
      }
      isDoubleTouch = false;
      isSingleTouch = false;
    }
    const handleTouchEnd = (event:TouchEvent) => {
      const touches = event.changedTouches;
      const coords = getPageCoords(touches);
      handleWriteEnd(coords);
    }
    const handleMouseEnd = (event:MouseEvent) => {
      const {pageX,pageY} = event;
      const coords = getPageCoords([{pageX,pageY}]);
      handleWriteEnd(coords);
    }
    const canvas = this.canvas;
    if(isTouchDevice()){
      canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
      canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
      canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
    }else{
      canvas.addEventListener("mousedown", handleMouseStart);
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
    }
  }
  private drawEraser(){
    if(this.cleanState && this.cleanPress){
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.fillStyle = 'rgba(0,0,0,.1)';
      this.ctx.strokeStyle = 'rgba(0,0,0,.15)';
      this.ctx.arc(this.cleanX as number,this.cleanY as number,this.cleanR as number,0,Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();
      this.ctx.beginPath();
    }
  }
  private doClean(writeEndX:number,writeEndY:number){
    const x0 = writeEndX + this.worldOffsetX;
    const y0 = writeEndY + this.worldOffsetY;
    this.pointsGroup.forEach(group=>{
      const corners = group.corners;
      for(let i = corners.length - 1;i>=0;i--){
        const [[x1,y1],[x2,y2],[x4,y4],[x3,y3]] = corners[i];
        if(this.isCircleIntersectRect(x0,y0,this.cleanR as number,x1,y1,x2,y2,x3,y3,x4,y4)){
          corners.splice(i,1);
        }
      }
    })
  }
  private isCircleIntersectRect(x0: number, y0: number, r: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): boolean {
    // 检查圆心是否在矩形内部
    if (x0 >= x1 && x0 <= x3 && y0 >= y1 && y0 <= y3) {
      return true;
    }
  
    // 检查矩形的四条边是否与圆相交
    const dist = (x: number, y: number) => Math.sqrt((x - x0) ** 2 + (y - y0) ** 2);
  
    const edges: [number, number, number, number][] = [
      [x1, y1, x2, y2],
      [x2, y2, x4, y4],
      [x4, y4, x3, y3],
      [x3, y3, x1, y1]
    ];
  
    for (let i = 0; i < edges.length; i++) {
      const [ex1, ey1, ex2, ey2] = edges[i];
      const d1 = dist(ex1, ey1);
      const d2 = dist(ex2, ey2);
  
      if (d1 <= r || d2 <= r) {
        return true;
      }
  
      const dx = ex2 - ex1;
      const dy = ey2 - ey1;
      const t = ((x0 - ex1) * dx + (y0 - ey1) * dy) / (dx ** 2 + dy ** 2);
  
      if (t < 0 || t > 1) {
        continue;
      }
  
      const cx = ex1 + t * dx;
      const cy = ey1 + t * dy;
      const dt = dist(cx, cy);
  
      if (dt <= r) {
        return true;
      }
    }
  
    return false;
  }
  private getCornerCoordinate(a:number,b:number,c:number,d:number,x:number,y:number):[[number,number],[number,number]]{
    return [
      [x - b * d / Math.sqrt(a**2 + b**2),y + a * d / Math.sqrt(a**2 + b**2)],
      [x + b * d / Math.sqrt(a**2 + b**2), y - a * d / Math.sqrt(a**2 + b**2)]
    ]
  }
  private getCornersCoordinate(x1:number,y1:number,x2:number,y2:number,d:number):[[number,number],[number,number],[number,number],[number,number]]{
    const a = x2 - x1
    const b = y2 - y1
    const c = a * x1 + b * y1 + d * Math.sqrt(a**2 + b**2)
    const [[x11,y11],[x12,y12]] = this.getCornerCoordinate(a,b,c,d,x1,y1);
    const [[x21,y21],[x22,y22]] = this.getCornerCoordinate(a,b,c,d,x2,y2);
    return [[x11,y11],[x12,y12],[x21,y21],[x22,y22]];
  }
  private pushPoints(writeStartX:number,writeStartY:number,writeEndX:number,writeEndY:number,writeStartTime:number,writeEndTime:number){
    const x1 = writeStartX + this.worldOffsetX;
    const y1 = writeStartY + this.worldOffsetY;
    const x2 = writeEndX + this.worldOffsetX;
    const y2 = writeEndY + this.worldOffsetY;
    const distance = ((y2-y1)**2 + (x2-x1)**2)**0.5;
    const originD = (writeEndTime - writeStartTime)/distance * this.voice;
    if(!isNaN(originD)){
      if(this.writeModel === WriteModel.WRITE){
        if(originD>this.d * 1.2){
          this.d *= 1.2 
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
      })
      if(!hasNaN){
        const corners  = this.pointsGroup[this.pointsGroup.length-1].corners;
        if(corners.length){
          const lastPoints = corners[corners.length - 1];
          points[0] = lastPoints[2];
          points[1] = lastPoints[3];
        }
        corners.push(points);
        return points;
      }else if(!distance){
        const corners  = this.pointsGroup[this.pointsGroup.length-1].corners;
        type Points = [[number, number], [number, number], [number, number], [number, number]];
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
        corners.push(points);
        return points;
      }
    }
  }
  private doWriting(pointsGroup:PointsGroup){
    pointsGroup.forEach(({corners,fillStyle},idx)=>{
      this.ctx.save();
      this.ctx.fillStyle = fillStyle;
      this.ctx.beginPath();
      corners.forEach(([[wx11,wy11],[wx12,wy12],[wx21,wy21],[wx22,wy22]],i)=>{
        const x11 = wx11 - this.worldOffsetX;
        const y11 = wy11 - this.worldOffsetY;
        const x12 = wx12 - this.worldOffsetX;
        const y12 = wy12 - this.worldOffsetY;
        const x21 = wx21 - this.worldOffsetX;
        const y21 = wy21 - this.worldOffsetY;
        const x22 = wx22 - this.worldOffsetX;
        const y22 = wy22 - this.worldOffsetY;
        this.ctx.moveTo(x11,y11);
        this.ctx.lineTo(x12,y12);
        this.ctx.lineTo(x22,y22);
        this.ctx.lineTo(x21,y21);
      })
      this.ctx.fill();
      this.ctx.restore();
    })
  }
  private calcSize(){
    this.pointsGroup.forEach(({corners},idx)=>{
      corners.forEach(([[wx11,wy11],[wx12,wy12],[wx21,wy21],[wx22,wy22]],i)=>{
        if(!idx && !i){
          this.minX = Math.min(wx11,wx12,wx21,wx22);
          this.minY = Math.min(wy11,wy12,wy21,wy22);
          this.maxX = Math.max(wx11,wx12,wx21,wx22);
          this.maxY = Math.max(wy11,wy12,wy21,wy22);
        }else{
          this.minX = Math.min(this.minX,wx11,wx12,wx21,wx22);
          this.minY = Math.min(this.minY,wy11,wy12,wy21,wy22);
          this.maxX = Math.max(this.maxX,wx11,wx12,wx21,wx22);
          this.maxY = Math.max(this.maxY,wy11,wy12,wy21,wy22);
        }
      })
    })
  }
  private generateGridPattern(){
    const gap = this.gridGap;
    const bgOffscreen = new OffscreenCanvas(gap * 2, gap * 2);
    const ctx = bgOffscreen.getContext("2d") as OffscreenCanvasRenderingContext2D;
    ctx.fillStyle = this.gridFillStyle;
    ctx.fillRect(0, 0, gap, gap);
    ctx.fillRect(gap, gap, gap, gap);
    const pattern = ctx.createPattern(bgOffscreen, "repeat") as CanvasPattern;
    return pattern;
  }
  private generateGridPaperPattern(){
    const gap = this.gridPaperGap;
    const bgOffscreen = new OffscreenCanvas(gap, gap);
    const ctx = bgOffscreen.getContext("2d") as OffscreenCanvasRenderingContext2D;
    ctx.strokeStyle = this.gridPaperStrokeStyle;
    ctx.strokeRect(0, 0, gap, gap);
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(gap/2,0);
    ctx.lineTo(gap/2,gap);
    ctx.moveTo(0,gap/2);
    ctx.lineTo(gap,gap/2);
    ctx.stroke();
    const pattern = ctx.createPattern(bgOffscreen, "repeat") as CanvasPattern;
    return pattern;
  }
  private generateQuadrillePaperPattern(){
  //   quadrillePaperVerticalMargin:number;
  // quadrillePaperGap:number;
  // gridFillStyle:string;
  // gridPaperStrokeStyle:string;
  // quadrillePaperStrokeStyles:string[];
    const quadrillePaperVerticalMargin = this.quadrillePaperVerticalMargin;
    const gap = this.quadrillePaperGap;
    const quadrillePaperStrokeStyles = this.quadrillePaperStrokeStyles;
    const height = quadrillePaperVerticalMargin * 2 + gap * 3;
    const bgOffscreen = new OffscreenCanvas(this.width, height);
    const ctx = bgOffscreen.getContext("2d") as OffscreenCanvasRenderingContext2D;
    for(let i = 0;i<quadrillePaperStrokeStyles.length;i++){
      ctx.strokeStyle = quadrillePaperStrokeStyles[i];
      ctx.beginPath();
      ctx.moveTo(0,quadrillePaperVerticalMargin + gap * i);
      ctx.lineTo(this.width,quadrillePaperVerticalMargin + gap * i);
      ctx.stroke();
    }
    const pattern = ctx.createPattern(bgOffscreen, "repeat") as CanvasPattern;
    return pattern;
  }
  private loadGrid(ctx:CanvasRenderingContext2D,offset=true){
    if(this.enableBG){
      let coordX = 0;
      let coordY = 0;
      if(offset){
        const offsetX = this.negativeRemainder(this.worldOffsetX,this.gridGap * 2);
        const offsetY = this.negativeRemainder(this.worldOffsetY,this.gridGap * 2);
        coordX = -offsetX;
        coordY = -offsetY;
      }
      ctx.save();
      ctx.translate(coordX,coordY);
      if(this.bgPattern === BGPattern.GRID){
        ctx.fillStyle = this.gridPattern;
      }else if(this.bgPattern === BGPattern.GRID_PAPER){
        ctx.fillStyle = this.gridPaperPattern;
      }else if(this.bgPattern === BGPattern.QUADRILLE_PAPER){
        ctx.fillStyle = this.quadrillePaperPattern;
      }
      const canvas = ctx.canvas;
      ctx.fillRect(0,0, canvas.width + this.gridGap * 2, canvas.height + this.gridGap * 2);
      ctx.restore();
    }
  }
  private negativeRemainder(a:number, b:number) {
    return ((a % b) + b) % b;
  }
  // private drawEagleEye(){
  //   if(!this.enableEagleEyeMode){
  //     return;
  //   }
  //   const ctx = this.ctx;
  //   const width = this.width;
  //   const height = this.height;
  //   const maxW = width/3;
  //   const maxH = height/3;
  //   const dx = width - maxW;
  //   const globalAlpha = 1;
  //   ctx.save();
  //   ctx.globalAlpha = globalAlpha;
  //   ctx.fillStyle = 'rgba(0,0,0,.3)';
  //   ctx.strokeStyle = 'rgba(0,0,0,1)';
  //   ctx.fillRect(dx,0,maxW,maxH);
  //   ctx.strokeRect(dx,0,maxW,maxH);
  //   ctx.restore();
  //   if(this.minX!==undefined){
  //     self.requestIdleCallback(()=>{
  //       ctx.save();
  //       ctx.globalAlpha = globalAlpha;
  //       const w = this.maxX - this.minX;
  //       const h = this.maxY - this.minY;
  //       const rate = Math.min(maxW/w,maxH/h);
  //       this.eagleEyeOffscreen = new OffscreenCanvas(w, h);
  //       this.eagleEyeOffscreenCtx = this.eagleEyeOffscreen.getContext('2d')!;
  //       this.drawPureCanvas(this.eagleEyeOffscreenCtx);
  //       ctx.translate(dx,0);
  //       ctx.scale(rate,rate);
  //       this.ctx.drawImage(this.eagleEyeOffscreen,0,0);
  //       ctx.restore();
  //     })
  //   }
  // }
  private loadBorder(){
    if(this.showBorder){
      const ctx = this.ctx;
      ctx.beginPath();
      ctx.save();
      ctx.strokeStyle = this.borderStyle;
      ctx.lineWidth = this.borderWidth;
      ctx.strokeRect(0,0,this.width,this.height);
      ctx.restore();
    }
  }
  private loadRule(){
    if(this.rule){
      const ctx = this.ctx;
      ctx.beginPath();
      ctx.save();
      ctx.strokeStyle = this.ruleStrokeStyle;
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = this.ruleStrokeStyle; 
      const offsetX = this.negativeRemainder(this.worldOffsetX,(this.ruleGap * 10));
      const offsetY = this.negativeRemainder(this.worldOffsetY,(this.ruleGap * 10));
      const offsetXRule = (this.worldOffsetX - this.worldOffsetX%(this.ruleGap * 10))/(this.ruleGap * 10) * 10;
      const offsetYRule = (this.worldOffsetY - this.worldOffsetY%(this.ruleGap * 10))/(this.ruleGap * 10) * 10;
      let i = 0;
      let j = 0;
      let coordX = -offsetX;
      let coordY = -offsetY;
      const fontGap = 3;
      while(coordX <= this.width){
        let len = this.ruleUnitLen;
        if(!(i%10)){
          len = this.ruleUnitLen * 2.5;
        }else if(!(i%5)){
          len = this.ruleUnitLen * 1.5;
        }
        ctx.moveTo(coordX,0);
        ctx.lineTo(coordX,len);
        ctx.moveTo(coordX,this.height);
        ctx.lineTo(coordX,this.height-len);
        if(!(i%10)){
          ctx.textBaseline = "top";
          ctx.fillText(String(i + offsetXRule),coordX,len + fontGap);
          ctx.textBaseline = "bottom";
          ctx.fillText(String(i + offsetXRule),coordX,this.height-len - fontGap);
        }
        coordX+=this.ruleGap;
        i++;
      }
      ctx.textBaseline = "middle";
      while(coordY <= this.height){
        let len = this.ruleUnitLen;
        if(!(j%10)){
          len = this.ruleUnitLen * 2.5;
        }else if(!(j%5)){
          len = this.ruleUnitLen * 1.5;
        }
        ctx.moveTo(0,coordY);
        ctx.lineTo(len,coordY);
        ctx.moveTo(this.width,coordY);
        ctx.lineTo(this.width - len,coordY);
        if(!(j%10)){
          ctx.textAlign = "left";
          ctx.fillText(String(j + offsetYRule),len + fontGap,coordY);
          ctx.textAlign = "right";
          ctx.fillText(String(j + offsetYRule),this.width - len - fontGap,coordY);
        }
        coordY+=this.ruleGap;
        j++;
      }
      ctx.stroke();
      ctx.restore();
    }
  }
}
export { Board }