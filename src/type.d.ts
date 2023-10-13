import { BGPattern, WriteModel, ScrollDirection } from './enum';
export type ScrollRange = [[number | null, number | null], [number | null, number | null]];
export type OnChange = (canvas: HTMLCanvasElement) => void;
export type Options = {
  scrollRange?: ScrollRange,
  scrollDirection?: ScrollDirection,
  bgPattern?: BGPattern,
  // enableEagleEyeMode?:boolean,
  writeModel?: WriteModel,
  enableBG?: boolean,
  gridGap?: number,
  gridPaperGap?: number,
  quadrillePaperVerticalMargin?: number,
  quadrillePaperGap?: number,
  gridFillStyle?: string,
  gridPaperStrokeStyle?: string,
  quadrillePaperStrokeStyles?: string[],
  rule?: boolean,
  ruleGap?: number,
  ruleUnitLen?: number,
  ruleStrokeStyle?: string,
  voice?: number,
  color?: string,
  stack?: boolean,
  cleanR?: number,
  moveCountTotal?: number,
  writeLocked?: boolean,
  dragLocked?: boolean,
  showBorder?: boolean;
  borderStyle?: string;
  borderWidth?: number;
  useShapeType?: boolean;
  hash?:number|string;
  containerOffset?: ContainerOffset
  onChange?: OnChange;
}
export type ContainerOffset = () => ({ x: number, y: number });
export type Coords = { pageX: number, pageY: number };
export type StoreItem = {
  worldOffsetX: number,
  worldOffsetY: number,
  imageData: ImageData,
  fragments: {data:Uint8ClampedArray,index:number,startCol:number,endCol:number}[],
  colLen: number,
  height:number
}
export type PreStore = StoreItem[];
export type Store = Record<number|string,PreStore>;
export type Points = [[number, number], [number, number], [number, number], [number, number],[number,number],[number,number],[number,number]];
export type GetPageCoords = (touches: TouchList | Coords[]) => { pageX: number, pageY: number }
export type GatherAreas = {start:number,end:number,data:Uint8ClampedArray}[];
export type GatherAreasObj = {x:number,y:number,width:number,height:number,fragments:GatherAreas}