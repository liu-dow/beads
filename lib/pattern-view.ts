export type ChartOrientation = "horizontal" | "vertical";

// A view transform only: the design's row/column indices never change.
export function chartPoint(x:number,y:number,orientation:ChartOrientation){
  return orientation==="vertical"?{x:y,y:x}:{x,y};
}

export function chartCellAt(x:number,y:number,rows:number,cols:number,cell:number,pad:number,orientation:ChartOrientation){
  const point=chartPoint(x,y,orientation);
  const col=Math.floor((point.x-pad)/cell);
  const row=Math.floor((point.y-pad)/(cell*.88)-(col%2)*.5);
  return col>=0&&col<cols&&row>=0&&row<rows?row*cols+col:-1;
}

export function chartArrow(key:string,orientation:ChartOrientation){
  if(orientation==="horizontal")return key;
  return ({ArrowRight:"ArrowDown",ArrowLeft:"ArrowUp",ArrowDown:"ArrowRight",ArrowUp:"ArrowLeft"} as Record<string,string>)[key]??key;
}
