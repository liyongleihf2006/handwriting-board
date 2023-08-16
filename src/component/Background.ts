import { BGPattern } from "../enum";
import { generateCanvas } from '../utils';

export default class Background{
  private gridPattern:CanvasPattern;
  private gridPaperPattern:CanvasPattern;
  private quadrillePaperPattern:CanvasPattern;

  bgPattern!:BGPattern;

  canvas:HTMLCanvasElement;
  ctx:CanvasRenderingContext2D;
  coordX!:number;
  coordY!:number;

  constructor(
    public width:number,
    public height:number,
    public gridGap:number,
    public gridFillStyle:string,
    public gridPaperGap:number,
    public gridPaperStrokeStyle:string,
    public quadrillePaperVerticalMargin:number,
    public quadrillePaperGap:number,
    public quadrillePaperStrokeStyles:string[]
  ){
    this.canvas = generateCanvas(width,height);
    this.ctx = this.canvas.getContext('2d')!;
    this.gridPattern = this.generateGridPattern();
    this.gridPaperPattern = this.generateGridPaperPattern();
    this.quadrillePaperPattern = this.generateQuadrillePaperPattern();
  }
  draw(coordX:number,coordY:number,bgPattern:BGPattern){
    if(coordX!==this.coordX || coordY!==this.coordY || bgPattern!==this.bgPattern){
      this.coordX = coordX;
      this.coordY = coordY;
      this.bgPattern = bgPattern;
      const ctx = this.ctx;
      ctx.clearRect(0,0,this.width + this.gridGap * 2, this.height + this.gridGap * 2);
      ctx.save();
      ctx.beginPath();
      ctx.translate(coordX,coordY);
      if(this.bgPattern === BGPattern.GRID){
        ctx.fillStyle = this.gridPattern;
      }else if(this.bgPattern === BGPattern.GRID_PAPER){
        ctx.fillStyle = this.gridPaperPattern;
      }else if(this.bgPattern === BGPattern.QUADRILLE_PAPER){
        ctx.fillStyle = this.quadrillePaperPattern;
      }
      ctx.fillRect(0,0, this.width + this.gridGap * 2, this.height + this.gridGap * 2);
      ctx.restore();
    }
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
}