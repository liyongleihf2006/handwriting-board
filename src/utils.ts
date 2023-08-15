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