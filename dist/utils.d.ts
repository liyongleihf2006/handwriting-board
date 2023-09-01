export declare function debounce(func: any, delay: number): (this: any, ...args: any[]) => void;
export declare function RotateCoordinates(angle: number, x0: number, y0: number): (x: number, y: number) => [number, number];
export declare function rotateAngle(angle: number, angle0: number): number;
export declare function calculateRotatedPoint(rx: number, ry: number, r: number, angle: number, _angle: number): [number, number];
export declare function getTripleTouchAngleAndCenter(event: TouchEvent): {
    angle: number;
    center: number[];
};
export declare function rotateCoordinate(x0: number, y0: number, angle: number, originX: number, originY: number): [number, number];
export declare function negativeRemainder(a: number, b: number): number;
export declare function generateCanvas(width: number, height: number): HTMLCanvasElement;
