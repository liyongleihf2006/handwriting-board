export function debounce(func: Function, delay: number) {
  let timer: number;

  return function(this:any,...args: any[]) {
    clearTimeout(timer);

    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}