import type {Store, Points} from '../type';

import { generateCanvas } from '../utils';
export default class Writing{

  store:Store = [];

  canvas:HTMLCanvasElement;
  ctx:CanvasRenderingContext2D;

  constructor(
    public width:number,
    public height:number
  ){
    this.canvas = generateCanvas(width,height);
    this.ctx = this.canvas.getContext('2d',{ willReadFrequently: true })!;
  }
  refresh(worldOffsetX:number,worldOffsetY:number){
    this.ctx.clearRect(0,0,this.width,this.height);
    this.putImageData(worldOffsetX,worldOffsetY);
  }
  writing(points:Points,color:string){
    this.ctx.save();
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    const [[wx11,wy11],[wx12,wy12],[wx21,wy21],[wx22,wy22]] = points;
    const x11 = wx11;
    const y11 = wy11;
    const x12 = wx12;
    const y12 = wy12;
    const x21 = wx21;
    const y21 = wy21;
    const x22 = wx22;
    const y22 = wy22;
    this.ctx.moveTo(x11,y11);
    this.ctx.lineTo(x12,y12);
    this.ctx.lineTo(x22,y22);
    this.ctx.lineTo(x21,y21);
    this.ctx.fill();
    this.ctx.restore();
  }
  clear(){
    this.store.length = 0;
    this.doClean(0,0,this.width,this.height);
    this.pushImageData(0,0);
  }
  doClean(x:number,y:number,width:number,height:number,determineIfThereHasContent = false){
    let hasContent = false;
    if(determineIfThereHasContent){
      const imageData = this.ctx.getImageData(x,y,width,height);
      const data = imageData.data;
      let len = data.length;
      for(let i = 0;i<len;i+=4){
        if(data[i+3]){
          hasContent = true;
          break;
        }
      }
    }
    this.ctx.clearRect(x,y,width,height);
    return hasContent;
  }
  pushImageData(worldOffsetX:number,worldOffsetY:number){
    const imageData = this.ctx.getImageData(0,0,this.width,this.height);
    const store = this.store;
    const len = store.length;
    for(let i = len - 1;i>=0;i--){
      const storeItem = store[i];
      if(storeItem.worldOffsetX === worldOffsetX && storeItem.worldOffsetY === worldOffsetY){
        store.splice(i,1);
      }
    }
    store.push({
      worldOffsetX,
      worldOffsetY,
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
  getWholeCanvas(){
    const width = this.width;
    const height = this.height;
    const colLen = width * 4;
    const rowLen = height;
    const total = colLen * rowLen;
    const store = this.store;
    const storeLen = store.length;
    let minX;
    let minY;
    let maxX;
    let maxY;
    for(let i = 0;i<storeLen;i++){
      const storeItem = store[i];
      const storeItemWorldOffsetX = storeItem.worldOffsetX;
      const storeItemWorldOffsetY = storeItem.worldOffsetY;
      if(minX === undefined || minX > storeItemWorldOffsetX){
        minX = storeItemWorldOffsetX;
      }
      if(minY === undefined || minY > storeItemWorldOffsetY){
        minY = storeItemWorldOffsetY;
      }
      if(maxX === undefined || maxX < storeItemWorldOffsetX){
        maxX = storeItemWorldOffsetX;
      }
      if(maxY === undefined || maxY < storeItemWorldOffsetY){
        maxY = storeItemWorldOffsetY;
      }
    }
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    if(minX === undefined || minY === undefined || maxX === undefined || maxY === undefined){
      canvas.width = 0;
      canvas.height = 0;
      return canvas;
    }
    maxX += width;
    maxY += height;
    const wholeWidth = (maxX - minX);
    const wholeHeight = (maxY - minY);
    const wholeTotal = wholeWidth * 4 * wholeHeight;
    const displayData = new Uint8ClampedArray(wholeTotal);
    let minPixelX = wholeWidth;
    let minPixelY = wholeHeight;
    let maxPixelX = 0;
    let maxPixelY = 0;
    for(let i = 0;i<storeLen;i++){
      const storeItem = store[i];
      const storeItemWorldOffsetX = storeItem.worldOffsetX;
      const storeItemWorldOffsetY = storeItem.worldOffsetY;
      const storeItemData = storeItem.imageData.data;
      let currentCol = 0;
      let currentRow = 0;
      for(let j = 0;j<total;){
        const displayCol = currentCol - minX + storeItemWorldOffsetX;
        const displayRow = currentRow - minY + storeItemWorldOffsetY;
        const r = storeItemData[j];
        const g = storeItemData[j+1];
        const b = storeItemData[j+2];
        const a = storeItemData[j+3];
        if(a!==0){
          if(displayCol<minPixelX){
            minPixelX = displayCol;
          }
          if(displayRow<minPixelY){
            minPixelY = displayRow; 
          }
          if(displayCol>maxPixelX){
            maxPixelX = displayCol;
          }
          if(displayRow>maxPixelY){
            maxPixelY = displayRow;
          }
        }
        const displayJ = (displayCol + displayRow * wholeWidth) * 4;
        displayData[displayJ] = r;
        displayData[displayJ + 1] = g;
        displayData[displayJ + 2] = b;
        displayData[displayJ + 3] = a;
        j += 4;
        if(j%colLen){
          currentCol++;
        }else{
          currentCol = 0;
          currentRow += 1;
        }
      }
    }
    const displayImageData = new ImageData(displayData,wholeWidth,wholeHeight);
    const targetWidth = maxPixelX - minPixelX;
    const targetHeight = maxPixelY - minPixelY;
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.putImageData(displayImageData,-minPixelX,-minPixelY);
    return canvas;
  }
  getPaperCanvas(){
    const width = this.width;
    const height = this.height;
    const colLen = width * 4;
    const rowLen = height;
    const total = colLen * rowLen;
    const store = this.store;
    const storeLen = store.length;
    let minX = 0;
    let minY = 0;
    let maxX = width;
    let maxY = 0;
    for(let i = 0;i<storeLen;i++){
      const storeItem = store[i];
      const storeItemWorldOffsetY = storeItem.worldOffsetY;
      if(maxY === undefined || maxY < storeItemWorldOffsetY){
        maxY = storeItemWorldOffsetY;
      }
    }
    maxY += height;
    let maxPixelY = 0;
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    const wholeWidth = (maxX - minX);
    const wholeHeight = (maxY - minY);
    const wholeTotal = wholeWidth * 4 * wholeHeight;
    const displayData = new Uint8ClampedArray(wholeTotal);
    for(let i = 0;i<storeLen;i++){
      const storeItem = store[i];
      const storeItemWorldOffsetX = storeItem.worldOffsetX;
      const storeItemWorldOffsetY = storeItem.worldOffsetY;
      const storeItemData = storeItem.imageData.data;
      let currentCol = 0;
      let currentRow = 0;
      for(let j = 0;j<total;){
        const displayCol = currentCol - minX + storeItemWorldOffsetX;
        const displayRow = currentRow - minY + storeItemWorldOffsetY;
        if(
          displayCol >= minX
          &&
          displayRow >= minY
          &&
          displayCol < maxX
          &&
          displayRow < maxY
        ){
          const r = storeItemData[j];
          const g = storeItemData[j+1];
          const b = storeItemData[j+2];
          const a = storeItemData[j+3];
          if(a!==0){
            if(displayRow>maxPixelY){
              maxPixelY = displayRow;
            }
          }
          const displayJ = (displayCol + displayRow * wholeWidth) * 4;
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
    const targetHeight = (Math.floor(maxPixelY/height) + 1 )* height;
    const displayImageData = new ImageData(displayData,maxX,maxY);
    canvas.width = maxX;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.putImageData(displayImageData,0,0);
    return canvas;
  }
}