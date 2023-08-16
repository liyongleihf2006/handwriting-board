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

  const x1 = touch1.pageX;
  const y1 = touch1.pageY;
  const x2 = touch2.pageX;
  const y2 = touch2.pageY;
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  const centerX = (x1 + x2)/2;
  const centerY = (y1 + y2)/2;
  return {angle,center:[centerX,centerY]};
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
export function negativeRemainder(a:number, b:number) {
  return ((a % b) + b) % b;
}
export function generateCanvas(width:number,height:number){
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  Object.assign(canvas.style,{
    left:'0',
    top:'0',
    position:'absolute',
    'pointer-events':'none'
  });
  return canvas;
}