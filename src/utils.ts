export function debounce(func: Function, delay: number) {
  let timer: number;

  return function(this:any,...args: any[]) {
    clearTimeout(timer);

    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
export function RotateCoordinates(angle: number,x0:number,y0:number) {  
  const angleInRadians = angle * Math.PI / 180; 
  const cosAngle = Math.cos(angleInRadians);  
  const sinAngle = Math.sin(angleInRadians);
  return function(x: number, y: number):[number, number]{
    const x1 = x - x0;
    const y1 = y - y0;
    const targetX = x1 * cosAngle - y1 * sinAngle + x0; 
    const targetY = x1 * sinAngle + y1 * cosAngle + y0;  
    return [targetX, targetY];
  }
}
export function getShapeToolNewCoordAndAngle(event: TouchEvent,originX:number,originY:number,originAngle:number){
  const {angle,center} = getTripleTouchAngleAndCenter(event);
  console.log(angle,center);
  const [x0,y0] = center;
  const [newX,newY] = rotateCoordinate(x0,y0,angle,originX,originY);
  const newAngle = originAngle + angle;
  return [newX,newY,newAngle];
}
export function getTripleTouchAngleAndCenter(event: TouchEvent){
  const touch1 = event.touches[0];
  const touch2 = event.touches[1];
  const touch3 = event.touches[2];

  const ox1 = touch1.pageX;
  const oy1 = touch1.pageY;
  const ox2 = touch2.pageX;
  const oy2 = touch2.pageY;
  const ox3 = touch3.pageX;
  const oy3 = touch3.pageY;

  const len1 = (oy2 - oy1) ** 2 + (ox2 - ox1) ** 2;
  const len2 = (oy3 - oy2) ** 2 + (ox3 - ox2) ** 2;
  const len3 = (oy1 - oy3) ** 2 + (ox1 - ox3) ** 2;
  
  let x1=0,y1=0,x2=0,y2=0,x3=0,y3=0;
  if(len1>=len2&&len1>=len3){
    x1 = ox3;
    y1 = oy3;
    x2 = ox1;
    y2 = oy1;
    x3 = ox2;
    y3 = oy2;
  }else if(len2>=len1&&len2>=len3){
    x1 = ox1;
    y1 = oy1;
    x2 = ox2;
    y2 = oy2;
    x3 = ox3;
    y3 = oy3;
  }else if(len3>=len1&&len3>=len2){
    x1 = ox2;
    y1 = oy2;
    x2 = ox3;
    y2 = oy3;
    x3 = ox1;
    y3 = oy1;
  }
  const slopeBC = (y3 - y2) / (x3 - x2);
  const perpendicularSlopeBC = -1 / slopeBC;
  const angle = Math.atan2(perpendicularSlopeBC, 1) * (180 / Math.PI);
  const adjustedAngle = angle;

  return {angle:adjustedAngle,center:[x1,y1]};
}
export function rotateCoordinate(x0: number, y0: number, angle: number, originX: number, originY: number): [number, number] {
  const radians = angle * (Math.PI / 180);
  const deltaX = originX - x0;
  const deltaY = originY - y0;

  const newX = Math.cos(radians) * deltaX - Math.sin(radians) * deltaY;
  const newY = Math.sin(radians) * deltaX + Math.cos(radians) * deltaY;

  const rotatedX = newX + x0;
  const rotatedY = newY + y0;

  return [rotatedX, rotatedY];
}