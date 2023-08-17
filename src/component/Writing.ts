import type {StoreItem,Store} from '../type';
import { PointsGroup } from "../type";

import { generateCanvas } from '../utils';
export default class Writing{

  store:Store = [];

  worldOffsetX!:number;
  worldOffsetY!:number;

  canvas:HTMLCanvasElement;
  ctx:CanvasRenderingContext2D;

  constructor(
    public width:number,
    public height:number
  ){
    this.canvas = generateCanvas(width,height);
    this.ctx = this.canvas.getContext('2d',{ willReadFrequently: true })!;
  }
  writing(pointsGroup:PointsGroup,worldOffsetX:number,worldOffsetY:number,needClean = true){
    this.worldOffsetX = worldOffsetX;
    this.worldOffsetY = worldOffsetY;
    if(needClean){
      this.ctx.clearRect(0,0,this.width,this.height);
      this.putImageData(this.worldOffsetX,this.worldOffsetY);
    }else{
      pointsGroup.forEach(({corners,fillStyle})=>{
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
  }
  doClean(x:number,y:number,width:number,height:number){
    this.ctx.clearRect(x,y,width,height);
  }
  pushImageData(){
    const imageData = this.ctx.getImageData(0,0,this.width,this.height);
    const store = this.store;
    const len = store.length;
    for(let i = len - 1;i>=0;i--){
      const storeItem = store[i];
      if(storeItem.worldOffsetX === this.worldOffsetX && storeItem.worldOffsetY === this.worldOffsetY){
        store.splice(i,1);
      }
    }
    store.push({
      worldOffsetX:this.worldOffsetX,
      worldOffsetY:this.worldOffsetY,
      imageData
    })
  }
  putImageData(worldOffsetX:number,worldOffsetY:number){
    const width = this.width;
    const height = this.height;
    const colLen = width * 4;
    const rowLen = height;
    const total = colLen * rowLen;
    const store = this.store;
    const storeLen = store.length;
    const displayData = new Uint8ClampedArray(total);
    for(let i = 0;i<storeLen;i++){
      const storeItem = store[i];
      const storeItemWorldOffsetX = storeItem.worldOffsetX;
      const storeItemWorldOffsetY = storeItem.worldOffsetY;
      const storeItemData = storeItem.imageData.data;
      if(Math.abs(storeItemWorldOffsetX - worldOffsetX)>=width || Math.abs(storeItemWorldOffsetY - worldOffsetY)>=height){
        continue;
      }
      let currentCol = 0;
      let currentRow = 0;
      for(let j = 0;j<total;){
        const displayCol = currentCol - worldOffsetX + storeItemWorldOffsetX;
        const displayRow = currentRow - worldOffsetY + storeItemWorldOffsetY;
        if(
          displayCol >= 0
          &&
          displayRow >= 0
          &&
          displayCol < width
          &&
          displayRow < height
        ){
          const r = storeItemData[j];
          const g = storeItemData[j+1];
          const b = storeItemData[j+2];
          const a = storeItemData[j+3];
          const displayJ = (displayCol + displayRow * width) * 4;
          displayData[displayJ] = r;
          displayData[displayJ + 1] = g;
          displayData[displayJ + 2] = b;
          displayData[displayJ + 3] = a;
        }
        j += 4;
        if(j%colLen){
          currentCol++;
        }else{
          currentCol = 0;
          currentRow += 1;
        }
      }
    }
    const displayImageData = new ImageData(displayData,width,height);
    this.ctx.putImageData(displayImageData,0,0);
  }

}