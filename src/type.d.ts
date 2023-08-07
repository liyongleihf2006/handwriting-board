import { WriteModel } from './enum';
export type OnChange = (canvas:HTMLCanvasElement)=>{};
export type Options = {
  // enableEagleEyeMode?:boolean,
  writeModel?:WriteModel,
  grid?:boolean,
  gridGap?:number,
  gridFillStyle?:string,
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