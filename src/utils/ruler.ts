export default class Ruler{
  x = 100;
  y = 100;
  cm = 0;
  mm = 0;
  width = 0;
  height = 0;
  marginH = 0;
  degreeNumber = 20;
  constructor(public ctx:CanvasRenderingContext2D){
    this.cm = 96/2.54;
    this.mm = this.cm / 10;
    this.marginH = this.mm * 5;
    this.width = this.cm * this.degreeNumber + this.marginH * 2;
    this.height = this.cm * 2;
  }
  draw(){
    const ctx = this.ctx;
    const x = this.x;
    const y = this.y;
    const width = this.width;
    const height = this.height;
    const marginH = this.marginH;
    const cm = this.cm;
    const mm = this.mm;
    const degreeNumber = this.degreeNumber;

    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,.08)';
    ctx.moveTo(x,y);
    ctx.lineTo(x+width,y);
    ctx.lineTo(x+width,y+height);
    const offestX = 1.5 * cm + this.marginH;
    const beginWaveX = x+width - offestX;
    const beginWaveY = y+height;
    const endWaveX = x + offestX;
    const waveUnit = cm/2;
    const waveUnitY = waveUnit/4;
    const waveY = beginWaveY - waveUnitY;
    ctx.lineTo(beginWaveX,beginWaveY);
    let currentWaveUnit = beginWaveX - waveUnit;
    while(currentWaveUnit>endWaveX){
      ctx.bezierCurveTo(currentWaveUnit + waveUnit/3, waveY - waveUnitY, currentWaveUnit + waveUnit*2/3, waveY + waveUnitY, currentWaveUnit, beginWaveY);
      currentWaveUnit -= waveUnit;
    }
    ctx.lineTo(x,beginWaveY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'black';
    ctx.font = "3mm serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.beginPath();
    const cmLen = 0.5 * cm;
    const textPos = y + cmLen + mm;
    const mmLen = cmLen * 0.6;
    const halfCmLen = cmLen * 0.8;
    for(let i = 0;i<=degreeNumber;i++){
      const currentX = x + marginH + i * cm;
      ctx.moveTo(currentX,y);
      ctx.lineTo(currentX,y + cmLen);
      ctx.fillText(String(i),currentX,textPos);
      if(i<degreeNumber){
        for(let j = 1;j<10;j++){
          const currentMmX = currentX + j * mm;
          ctx.moveTo(currentMmX,y);
          if(j === 5){
            ctx.lineTo(currentMmX,y + halfCmLen);
          }else{
            ctx.lineTo(currentMmX,y + mmLen);
          }
        }
      }
    }
    ctx.stroke();
    ctx.restore();
  }

}