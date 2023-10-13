import { negativeRemainder } from "../utils";
import { generateCanvas } from '../utils';
export default class RuleAuxiliary{

  canvas:HTMLCanvasElement;
  ctx:CanvasRenderingContext2D;

  worldOffsetX!:number;
  worldOffsetY!:number;

  constructor(
    public width:number,
    public height:number,
    public ruleStrokeStyle:string,
    public ruleGap:number,
    public ruleUnitLen:number,
  ){
    this.canvas = generateCanvas(width,height);
    this.ctx = this.canvas.getContext('2d')!;
  }
  resize(width:number,height:number){
    this.width = width;
    this.height = height;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }
  draw(worldOffsetX:number,worldOffsetY:number){
    if(worldOffsetX!==this.worldOffsetX || worldOffsetY!==this.worldOffsetY){
      this.worldOffsetX = worldOffsetX;
      this.worldOffsetY = worldOffsetY;
      const ctx = this.ctx;
      ctx.beginPath();
      ctx.clearRect(0,0,this.width,this.height);
      ctx.strokeStyle = this.ruleStrokeStyle;
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = this.ruleStrokeStyle; 
      const offsetX = negativeRemainder(this.worldOffsetX,(this.ruleGap * 10));
      const offsetY = negativeRemainder(this.worldOffsetY,(this.ruleGap * 10));
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
    }
  }
}