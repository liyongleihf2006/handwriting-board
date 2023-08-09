import { BGPattern, WriteModel,ScrollDirection } from './enum';
export type ScrollRange = [[number|null,number|null],[number|null,number|null]];
export type OnChange = (canvas:HTMLCanvasElement)=>{};
export type Options = {
  scrollRange?:ScrollRange,
  scrollDirection?:ScrollDirection,
  bgPattern?:BGPattern,
  // enableEagleEyeMode?:boolean,
  writeModel?:WriteModel,
  enableBG?:boolean,
  gridGap?:number,
  gridPaperGap?:number,
  quadrillePaperVerticalMargin?:number,
  quadrillePaperGap?:number,
  gridFillStyle?:string,
  gridPaperStrokeStyle?:string,
  quadrillePaperStrokeStyles?:string[],
  rule?:boolean,
  ruleGap?:number,
  ruleUnitLen?:number,
  ruleStrokeStyle?:string,
  voice?:number,
  color?:string,
  stack?:boolean,
  cleanR?:number,
  moveCountTotal?:number,
  writeLocked?:boolean,
  dragLocked?:boolean,
  showBorder?:boolean;
  borderStyle?:string;
  borderWidth?:number;
  containerOffset?:ContainerOffset
  onChange?: OnChange;
}
export type PointsGroup = {
  corners:[[number,number],[number,number],[number,number],[number,number]][],
  fillStyle:string
}[];
export type StackType = {
  pointGroup:PointsGroup,
  worldOffsetX:number,
  worldOffsetY:number
}
export type ContainerOffset = ()=>({x:number,y:number});
export type Coords = {pageX:number,pageY:number};