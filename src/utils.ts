export function debounce(func: Function, delay: number) {
  let timer: number;

  return function(this:any,...args: any[]) {
    clearTimeout(timer);

    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
export function rotateCoordinates(x: number, y: number, angle: number): [number, number] {  
  const angleInRadians = angle * Math.PI / 180; 
  const cosAngle = Math.cos(angleInRadians);  
  const sinAngle = Math.sin(angleInRadians);  
  const x0 = x * cosAngle - y * sinAngle; 
  const y0 = x * sinAngle + y * cosAngle;  
  return [x0, y0];
}