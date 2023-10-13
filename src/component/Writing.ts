import type {PreStore,GatherAreas,GatherAreasObj} from '../type';

import { generateCanvas } from '../utils';
export default class Writing{

  store:PreStore;

  canvas:HTMLCanvasElement;
  ctx:CanvasRenderingContext2D;
  scale = 1;
  width:number;
  height:number;
  constructor(
    width:number,
    height:number,
    store:PreStore
  ){
    this.width = width * this.scale;
    this.height = height * this.scale;
    this.canvas = generateCanvas(this.width,this.height);
    this.ctx = this.canvas.getContext('2d',{ willReadFrequently: true })!;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.store = store;
  }
  resize(width:number,height:number){
    this.width = width;
    this.height = height;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }
  refresh(worldOffsetX:number,worldOffsetY:number){
    this.ctx.clearRect(0,0,this.width,this.height);
    this.putImageData(worldOffsetX,worldOffsetY);
  }
  singlePointsWriting(gatherAreasObj:GatherAreasObj){
    const ctx = this.ctx;
    const {x,y,width,height,fragments} = gatherAreasObj;
    const imageData = ctx.getImageData(x,y,width,height);
    const data = imageData.data;
    const rowLen = width * 4;
    for(let i = 0;i<fragments.length;i++){
      const {data:fdata} = fragments[i];
      const baseStart = rowLen * i;
      for(let j = 0;j<fdata.length;j+=4){
        const fa = fdata[j + 3];
        const a = data[baseStart + j + 3];
        if(fa || a){
          const fr = fdata[j];
          const fg = fdata[j+1];
          const fb = fdata[j+2];

          const r = data[baseStart + j];
          const g = data[baseStart + j + 1];
          const b = data[baseStart + j + 2];

          if(fa!==a || fr!==r || fg !== g || fb !== b){
            const alphaT = fa/255;
            const alphaB = a/255;
            const alphaF = alphaT + alphaB*(1 - alphaT);
            const tr = this.colorOverlay(fr,alphaT,r,alphaB,alphaF);
            const tg = this.colorOverlay(fg,alphaT,g,alphaB,alphaF);
            const tb = this.colorOverlay(fb,alphaT,b,alphaB,alphaF);
            data[baseStart + j + 3] = alphaF * 255;
            data[baseStart + j] = tr;
            data[baseStart + j + 1] = tg;
            data[baseStart + j + 2] = tb;
          }
        }
      }
    }
    this.ctx.putImageData(imageData,x,y);
  }
  // colorT，alphaT：表示前景色和前景色的透明度
  // colorB，alphaB：表示背景色和背景色的透明度
  // colorF，alphaF：表示计算得到的颜色和透明度
  colorOverlay(colorT:number,alphaT:number,colorB:number,alphaB:number,alphaF:number){
    const colorF = (colorT*alphaT + colorB*alphaB*(1 - alphaT)) / alphaF;
    return colorF;
  }
  clear(){
    this.store.length = 0;
    this.ctx.clearRect(0,0,this.width,this.height);
    this.pushImageData(0,0);
  }
  doClean(x1:number,y1:number,x2:number,y2:number,r:number,determineIfThereHasContent = false){
    x1 = this.scale * x1;
    y1 = this.scale * y1;
    x2 = this.scale * x2;
    y2 = this.scale * y2;
    r = this.scale * r;
    let hasContent = false;
    let originData!:Uint8ClampedArray;
    const clipX = Math.min(x1,x2) - r;
    const clipY = Math.min(y1,y2) - r;
    const clipWidth = Math.abs(x2 - x1) + 2 * r;
    const clipHeight = Math.abs(y2 - y1) + 2 * r;

    if(determineIfThereHasContent){
      const imageData = this.ctx.getImageData(clipX,clipY,clipWidth,clipHeight);
      originData = imageData.data;
    }
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = r * 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
    ctx.restore();

    if(determineIfThereHasContent){
      const imageData = this.ctx.getImageData(clipX,clipY,clipWidth,clipHeight);
      const data = imageData.data;
      const len = data.length;
      for(let i = 0;i<len;i+=4){
        if(data[i+3] !== originData[i+3]){
          hasContent = true;
          break;
        }
      }
    }
    return hasContent;
  }
  pushImageData(worldOffsetX:number,worldOffsetY:number){
    const imageData = this.ctx.getImageData(0,0,this.width,this.height);
    const data  = imageData.data;
    const fragments:{data:Uint8ClampedArray,index:number,startCol:number,endCol:number}[] = [];
    const total = data.length;
    const colLen = this.width * 4;
    let index = 0;
    for(let i = 0;i<total;i+=colLen){
      const subData = data.subarray(i,i + colLen);
      let notOpacity = false;
      let hasBegin = false;
      let startCol = 0;
      let endCol = 0;
      for(let j = 0;j<colLen;j+=4){
        if(subData[j+3]){
          notOpacity = true;
          if(!hasBegin){
            hasBegin = true;
            startCol = j;
          }
          endCol = j;
        }
      }
      if(notOpacity){
        fragments.push({data:subData,index,startCol,endCol});
      }
      index++;
    }
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
      imageData,
      fragments,
      colLen,
      height:this.height
    });
    this.washStore();
  }
  washStore(){
    const store = this.store;
    const lastStoreItem = store[store.length - 1];
    const {worldOffsetX:lastWorldOffsetX,worldOffsetY:lastWorldOffsetY,colLen:lastColLen,height:lastHeight} = lastStoreItem;

    const preStoreItems = store.slice(0,store.length - 1);
    for(let i = 0;i<preStoreItems.length;i++){
      const {fragments,worldOffsetX,worldOffsetY} = preStoreItems[i];
      const clearStartRow = lastWorldOffsetY - worldOffsetY;
      const clearStartCol = (lastWorldOffsetX - worldOffsetX) * 4;
      const clearEndCol = clearStartCol + lastColLen;
      const clearEndRow = clearStartRow + lastHeight;
      for(let j = fragments.length - 1;j>=0;j--){
        const fragment = fragments[j];
        const {index} = fragment;
        if(index>=clearStartRow && index<clearEndRow){
          const data = fragment.data;
          const len = Math.min(data.length,clearEndCol);
          for(let i = clearStartCol;i<len;i+=4){
            if(data[i+3]){
              data[i+3] = 0;
            }
          }
        }
      }
    }

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
    const subDatas:Uint8ClampedArray[] = [];
    for(let i = 0;i<total;i+=colLen){
      const subData = displayData.subarray(i,i + colLen);
      subDatas.push(subData);
    }
    const subDatasLen = subDatas.length;


    for(let i = 0;i<storeLen;i++){
      const storeItem = store[i];
      const storeItemWorldOffsetX = storeItem.worldOffsetX;
      const storeItemWorldOffsetY = storeItem.worldOffsetY;
      const storeItemFragments = storeItem.fragments;
      const datasLen = storeItemFragments.length;

      const beginX = (storeItemWorldOffsetX  - worldOffsetX ) * 4;
      const benginY = storeItemWorldOffsetY  - worldOffsetY;
      for(let j = 0;j<datasLen;j++){
        const {data:rowData,index,startCol,endCol} = storeItemFragments[j];
        const displayRow = benginY + index;
        if(displayRow>=0 && displayRow<subDatasLen){
          for(let k = startCol;k<=endCol;k+=4){
            const displayCol = beginX + k;
            if(displayCol>=0 && displayCol<colLen){
              const a = rowData[k + 3];
              if(a && !subDatas[displayRow][displayCol+3]){
                subDatas[displayRow][displayCol] = rowData[k];
                subDatas[displayRow][displayCol+1] = rowData[k+1];
                subDatas[displayRow][displayCol+2] = rowData[k+2];
                subDatas[displayRow][displayCol+3] = rowData[k+3];
              }
            }
          }
        }
      }
    }
    if(storeLen){
      const displayImageData = new ImageData(displayData,width,height);
      this.ctx.putImageData(displayImageData,0,0);
    }
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
    const minX = 0;
    const minY = 0;
    const maxX = width;
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