class Stack {
    width;
    height;
    hash;
    stackObj = {};
    get preStackObj() {
        if (!this.stackObj[this.hash]) {
            this.stackObj[this.hash] = {
                undoStack: [],
                redoStack: []
            };
        }
        return this.stackObj[this.hash];
    }
    get undoStack() {
        return this.preStackObj.undoStack;
    }
    get redoStack() {
        return this.preStackObj.redoStack;
    }
    constructor(width, height, hash = '') {
        this.width = width;
        this.height = height;
        this.hash = hash;
    }
    updateHash(hash) {
        this.hash = hash;
    }
    restoreState = () => undefined;
    saveState(preStore) {
        this.undoStack.push([...preStore]);
        this.redoStack.length = 0;
    }
    undo() {
        if (this.undoStack.length > 0) {
            const lastState = this.undoStack.pop();
            this.redoStack.push(lastState);
            let previousState = this.undoStack[this.undoStack.length - 1];
            if (!previousState) {
                const data = new Uint8ClampedArray(this.width * 4 * this.height);
                const imageData = new ImageData(data, this.width, this.height);
                previousState = [{ worldOffsetX: 0, worldOffsetY: 0, imageData, fragments: [], colLen: 0 }];
            }
            this.doRestoreState(previousState);
        }
    }
    redo() {
        if (this.redoStack.length > 0) {
            const nextState = this.redoStack.pop();
            this.undoStack.push(nextState);
            this.doRestoreState(nextState);
        }
    }
    doRestoreState(preStore) {
        this.restoreState([...preStore]);
    }
}

var WriteModel;
(function (WriteModel) {
    WriteModel["WRITE"] = "write";
    WriteModel["DRAW"] = "draw";
})(WriteModel || (WriteModel = {}));
var BGPattern;
(function (BGPattern) {
    BGPattern["GRID"] = "grid";
    BGPattern["GRID_PAPER"] = "gridPaper";
    BGPattern["QUADRILLE_PAPER"] = "quadrillePaper";
})(BGPattern || (BGPattern = {}));
var ScrollDirection;
(function (ScrollDirection) {
    ScrollDirection["ALL"] = "all";
    ScrollDirection["X"] = "x";
    ScrollDirection["Y"] = "y";
})(ScrollDirection || (ScrollDirection = {}));
var ShapeType;
(function (ShapeType) {
    ShapeType["RULER"] = "ruler";
    ShapeType["COMPASS"] = "compass";
    ShapeType["COMPASS360"] = "compass360";
    ShapeType["RIGHT_ANGLE_TRIANGLE"] = "rightAngleTriangle";
    ShapeType["EQUILATERAL_TRIANGLE"] = "equilateralTriangle";
})(ShapeType || (ShapeType = {}));

function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}
function RotateCoordinates(angle, x0, y0) {
    const angleInRadians = angle * Math.PI / 180;
    const cosAngle = Math.cos(angleInRadians);
    const sinAngle = Math.sin(angleInRadians);
    return function (x, y) {
        const x1 = x - x0;
        const y1 = y - y0;
        const targetX = x1 * cosAngle - y1 * sinAngle + x0;
        const targetY = x1 * sinAngle + y1 * cosAngle + y0;
        return [targetX, targetY];
    };
}
function rotateAngle(angle, angle0) {
    // 将角度转换为弧度
    const radian = (angle + angle0) * (Math.PI / 180);
    return radian;
}
function calculateRotatedPoint(rx, ry, r, angle, _angle) {
    const angleRad = angle * (Math.PI / 180); // 将角度转换为弧度
    const _angleRad = _angle * (Math.PI / 180); // 将旋转角度转换为弧度
    const x = rx + r * Math.cos(angleRad + _angleRad); // 计算点的 x 坐标
    const y = ry + r * Math.sin(angleRad + _angleRad); // 计算点的 y 坐标
    return [x, y];
}
function getTripleTouchAngleAndCenter(event) {
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    const x1 = touch1.pageX;
    const y1 = touch1.pageY;
    const x2 = touch2.pageX;
    const y2 = touch2.pageY;
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    return { angle, center: [centerX, centerY] };
}
function rotateCoordinate(x0, y0, angle, originX, originY) {
    const radians = angle * (Math.PI / 180);
    const deltaX = originX - x0;
    const deltaY = originY - y0;
    const newX = Math.cos(radians) * deltaX - Math.sin(radians) * deltaY;
    const newY = Math.sin(radians) * deltaX + Math.cos(radians) * deltaY;
    const rotatedX = newX + x0;
    const rotatedY = newY + y0;
    return [rotatedX, rotatedY];
}
function negativeRemainder(a, b) {
    return ((a % b) + b) % b;
}
function generateCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    Object.assign(canvas.style, {
        left: '0',
        top: '0',
        position: 'absolute',
        'pointer-events': 'none',
        width: '100%',
        height: '100%'
    });
    return canvas;
}

class Ruler {
    ctx;
    cm;
    mm;
    path;
    width = 0;
    height = 0;
    marginH = 0;
    degreeNumber = 20;
    toolShapeCenterX = 500;
    toolShapeCenterY = 300;
    angle = 45;
    constructor(ctx, cm, mm) {
        this.ctx = ctx;
        this.cm = cm;
        this.mm = mm;
        this.marginH = this.mm * 5;
        this.width = this.cm * this.degreeNumber + this.marginH * 2;
        this.height = this.cm * 2.5;
    }
    getOutlineCtx(_x, _y, _angle, outlineVoice, strokeStyle) {
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        const { width, height } = canvas;
        const offscreen = new OffscreenCanvas(width, height);
        const c = offscreen.getContext('2d');
        const path = this.generatorOuterBorder(_x, _y, _angle, outlineVoice);
        c.strokeStyle = strokeStyle;
        c.lineWidth = outlineVoice;
        c.stroke(path);
        return c;
    }
    generatorOuterBorder(_cx, _cy, _angle, voice = 0) {
        const width = this.width;
        const height = this.height;
        const x = _cx - voice / 2 - width / 2;
        const y = _cy - voice / 2 - height / 2;
        const angle = _angle;
        const cm = this.cm;
        const rotateCoordinates = RotateCoordinates(angle, _cx, _cy);
        let pathStr = '';
        pathStr += `M${rotateCoordinates(x, y).join(',')}`;
        pathStr += `L${rotateCoordinates(x + width + voice, y).join(',')}`;
        pathStr += `L${rotateCoordinates(x + width + voice, y + height + voice).join(',')}`;
        const offestX = 1.5 * cm + this.marginH;
        const beginWaveX = x + width - offestX;
        const beginWaveY = y + height + voice;
        const endWaveX = x + offestX + voice;
        const waveUnit = cm * 2 / 3;
        const waveUnitY = waveUnit / 4;
        const waveY = beginWaveY - waveUnitY;
        pathStr += `L${rotateCoordinates(beginWaveX, beginWaveY).join(',')}`;
        let currentWaveUnit = beginWaveX - waveUnit;
        while (currentWaveUnit > endWaveX) {
            pathStr += `C${[...rotateCoordinates(currentWaveUnit + waveUnit / 3, waveY - waveUnitY), ...rotateCoordinates(currentWaveUnit + waveUnit * 2 / 3, waveY + waveUnitY), ...rotateCoordinates(currentWaveUnit, beginWaveY)].join(',')}`;
            currentWaveUnit -= waveUnit;
        }
        pathStr += `L${rotateCoordinates(x, beginWaveY).join(',')}`;
        pathStr += 'z';
        const path = new Path2D(pathStr);
        this.path = path;
        return path;
    }
    draw(showDu = false, duCx = 0, duCy = 0) {
        const angle = this.angle;
        const cx = this.toolShapeCenterX;
        const cy = this.toolShapeCenterY;
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        const marginH = this.marginH;
        const cm = this.cm;
        const mm = this.mm;
        const degreeNumber = this.degreeNumber;
        const width = this.width;
        const height = this.height;
        const rotateCoordinates = RotateCoordinates(angle, cx, cy);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0,0,0,.08)';
        const path = this.generatorOuterBorder(cx, cy, angle);
        ctx.fill(path);
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = 'black';
        ctx.font = "3mm serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.beginPath();
        const cmLen = 0.5 * cm;
        const x = cx - width / 2;
        const y = cy - height / 2;
        const textPos = y + cmLen + mm;
        const mmLen = cmLen * 0.6;
        const halfCmLen = cmLen * 0.8;
        for (let i = 0; i <= degreeNumber; i++) {
            const currentX = x + marginH + i * cm;
            ctx.moveTo(...rotateCoordinates(currentX, y));
            ctx.lineTo(...rotateCoordinates(currentX, y + cmLen));
            ctx.save();
            ctx.translate(...rotateCoordinates(currentX, textPos));
            ctx.rotate(angle * Math.PI / 180);
            ctx.fillText(String(i), 0, 0);
            ctx.restore();
            if (i < degreeNumber) {
                for (let j = 1; j < 10; j++) {
                    const currentMmX = currentX + j * mm;
                    ctx.moveTo(...rotateCoordinates(currentMmX, y));
                    if (j === 5) {
                        ctx.lineTo(...rotateCoordinates(currentMmX, y + halfCmLen));
                    }
                    else {
                        ctx.lineTo(...rotateCoordinates(currentMmX, y + mmLen));
                    }
                }
            }
        }
        ctx.stroke();
        ctx.restore();
        if (showDu) {
            const xx = duCx;
            const yy = duCy;
            ctx.save();
            ctx.beginPath();
            ctx.lineWidth = 1 / window.devicePixelRatio / 4;
            ctx.strokeStyle = 'rgba(0,0,0,.8)';
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            const arcR = this.cm / 5 * 3;
            const [realCx, realCy] = [xx, yy];
            ctx.arc(realCx, realCy, arcR, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.lineWidth = 1 / window.devicePixelRatio / 2;
            ctx.moveTo(realCx + Math.cos(Math.PI) * arcR, realCy);
            ctx.lineTo(realCx + Math.cos(Math.PI) * arcR / 3 * 2, realCy);
            ctx.stroke();
            ctx.moveTo(realCx + Math.cos(0) * arcR, realCy);
            ctx.lineTo(realCx + Math.cos(0) * arcR / 3 * 2, realCy);
            ctx.stroke();
            ctx.fillStyle = 'rgba(0,0,0,1)';
            ctx.font = "4mm serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            let displayAngle = (Math.floor(this.angle) % 360 + 360) % 360;
            if (displayAngle >= 270) {
                displayAngle = 360 - displayAngle;
            }
            else if (displayAngle >= 180) {
                displayAngle = displayAngle - 180;
            }
            else if (displayAngle >= 90) {
                displayAngle = 180 - displayAngle;
            }
            ctx.fillText(String(displayAngle), ...[xx, yy]);
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            const duR = 2;
            const duAngle = -Math.PI / 5;
            ctx.arc(realCx + Math.cos(duAngle) * (arcR - 2 * duR), realCy + Math.sin(duAngle) * (arcR - 2 * duR), duR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
    isPointInPath(x, y, fillRule) {
        return this.ctx.isPointInPath(this.path, x, y, fillRule);
    }
}

let Compass$1 = class Compass {
    ctx;
    cm;
    mm;
    path;
    r;
    middleR;
    smallR;
    middleGap;
    startAngle = 170;
    endAngle = 370;
    innerStartAngle = 180;
    innerEndAngle = 360;
    toolShapeCenterX = 500;
    toolShapeCenterY = 300;
    angle = 10;
    constructor(ctx, cm, mm) {
        this.ctx = ctx;
        this.cm = cm;
        this.mm = mm;
        this.r = cm * 6;
        this.middleR = cm * 3.5;
        this.middleGap = cm * 1;
        this.smallR = cm * 2.2;
    }
    getOutlineCtx(_x, _y, _angle, outlineVoice, strokeStyle) {
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        const { width, height } = canvas;
        const offscreen = new OffscreenCanvas(width, height);
        const c = offscreen.getContext('2d');
        const path = this.generatorOuterBorder(_x, _y, _angle, outlineVoice);
        c.strokeStyle = strokeStyle;
        c.lineWidth = outlineVoice;
        c.stroke(path);
        return c;
    }
    generatorOuterBorder(_cx, _cy, _angle, voice = 0) {
        const startAngle = this.startAngle;
        const endAngle = this.endAngle;
        const innerStartAngle = this.innerStartAngle;
        const innerEndAngle = this.innerEndAngle;
        const r = this.r + voice / 2;
        const middleInsideR = this.middleR + voice / 2;
        const middleOutsideR = middleInsideR + this.middleGap - voice;
        const smallR = this.smallR - voice / 2;
        const cx = _cx;
        const cy = _cy;
        const innerCx = _cx;
        const innerCy = _cy;
        const path = new Path2D();
        path.arc(cx, cy, r, rotateAngle(startAngle, _angle), rotateAngle(endAngle, _angle));
        path.closePath();
        path.moveTo(...calculateRotatedPoint(innerCx, innerCy, middleOutsideR, innerStartAngle, _angle));
        path.arc(innerCx, innerCy, middleOutsideR, rotateAngle(innerStartAngle, _angle), rotateAngle(innerEndAngle, _angle));
        path.lineTo(...calculateRotatedPoint(innerCx, innerCy, middleInsideR, innerEndAngle, _angle));
        path.arc(innerCx, innerCy, middleInsideR, rotateAngle(innerEndAngle, _angle), rotateAngle(innerStartAngle, _angle), true);
        path.lineTo(...calculateRotatedPoint(innerCx, innerCy, middleOutsideR, innerStartAngle, _angle));
        path.moveTo(...calculateRotatedPoint(innerCx, innerCy, smallR, innerStartAngle, _angle));
        path.arc(innerCx, innerCy, smallR, rotateAngle(innerStartAngle, _angle), rotateAngle(innerEndAngle, _angle));
        path.closePath();
        this.path = path;
        return path;
    }
    drawDegree(cx, cy, r, smallUnitL, unitL, bigUnitL, ruleFontSize, fontGap, showText, showSmall, showMiddle, textOnInner, _angle, reverse = false) {
        const ctx = this.ctx;
        // 刻度设置
        const total = 180; // 总刻度数
        const unitS = Math.PI / total; // 刻度线间隔角度
        const unitBigInterval = 10;
        const unitInterval = unitBigInterval;
        const ruleLoose = 5;
        // 绘制刻度和刻度的数值
        let angle = (180 + _angle) * Math.PI / 180;
        ctx.save();
        ctx.textAlign = 'center'; // 设置文本对齐方式
        ctx.textBaseline = 'middle';
        ctx.font = `${ruleFontSize}px Arial`; // 文本字体
        if (!textOnInner) {
            r += bigUnitL;
            ctx.textBaseline = 'bottom';
        }
        for (let i = 0; i <= total; i++) {
            if (i % unitBigInterval === 0) { // 大刻度
                const startX = cx + Math.cos(angle) * (r - bigUnitL); // 刻度线起始点横坐标
                const startY = cy + Math.sin(angle) * (r - bigUnitL); // 刻度线起始点纵坐标
                const endX = cx + Math.cos(angle) * r; // 刻度线结束点横坐标
                const endY = cy + Math.sin(angle) * r; // 刻度线结束点纵坐标
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                if (showText && i % unitInterval === 0) {
                    const textX = cx + Math.cos(angle) * (r - (bigUnitL + fontGap) * Number(textOnInner)); // 刻度文本位置横坐标
                    const textY = cy + Math.sin(angle) * (r - (bigUnitL + fontGap) * Number(textOnInner)); // 刻度文本位置纵坐标
                    ctx.save();
                    ctx.textAlign = 'center';
                    ctx.translate(textX, textY);
                    ctx.rotate(angle + Math.PI / 2);
                    ctx.fillText((reverse ? total - i : i).toString(), 0, 0);
                    ctx.restore();
                }
            }
            else if (!(i % ruleLoose)) { // 中刻度
                if (showMiddle) {
                    const startX = cx + Math.cos(angle) * (r - unitL); // 刻度线起始点横坐标
                    const startY = cy + Math.sin(angle) * (r - unitL); // 刻度线起始点纵坐标
                    const endX = cx + Math.cos(angle) * r; // 刻度线结束点横坐标
                    const endY = cy + Math.sin(angle) * r; // 刻度线结束点纵坐标
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                }
            }
            else if (showSmall) {
                const startX = cx + Math.cos(angle) * (r - smallUnitL); // 刻度线起始点横坐标
                const startY = cy + Math.sin(angle) * (r - smallUnitL); // 刻度线起始点纵坐标
                const endX = cx + Math.cos(angle) * r; // 刻度线结束点横坐标
                const endY = cy + Math.sin(angle) * r; // 刻度线结束点纵坐标
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
            angle += unitS; // 更新角度
        }
        ctx.restore();
    }
    drawContent(_cx, _cy, _angle) {
        const r = this.r;
        const middleR = this.middleR;
        const smallR = this.smallR;
        const cx = _cx;
        const cy = _cy;
        const ctx = this.ctx;
        ctx.save();
        this.drawDegree(cx, cy, r, 10, 15, 20, 8, 10, true, true, true, true, _angle);
        this.drawDegree(cx, cy, middleR, 10, 12, 15, 0, 0, false, true, true, true, _angle);
        this.drawDegree(cx, cy, smallR, 0, 0, 12, 7, 10, true, false, false, false, _angle, true);
        ctx.restore();
    }
    drawPosition(cx, cy, angle) {
        const r = 20;
        const ctx = this.ctx;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(...calculateRotatedPoint(cx, cy, r, 90, angle));
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, r, rotateAngle(0, angle), rotateAngle(180, angle));
        ctx.stroke();
        ctx.restore();
    }
    draw() {
        const angle = this.angle;
        const cx = this.toolShapeCenterX;
        const cy = this.toolShapeCenterY;
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0,0,0,.08)';
        const path = this.generatorOuterBorder(cx, cy, angle);
        ctx.fill(path, 'evenodd');
        ctx.restore();
        this.drawContent(cx, cy, angle);
        this.drawPosition(cx, cy, angle);
    }
    isPointInPath(x, y, fillRule) {
        return this.ctx.isPointInPath(this.path, x, y, fillRule);
    }
};

class Compass {
    ctx;
    cm;
    mm;
    container;
    getPageCoords;
    toolShape;
    path;
    outsideR;
    insideR;
    pointerW;
    startAngle = 0;
    endAngle = 360;
    firstPointerAngle = 0;
    secondPointerAngle = 30;
    pointer1;
    pointer2;
    toolShapeCenterX = 500;
    toolShapeCenterY = 300;
    angle = 10;
    constructor(ctx, cm, mm, container, getPageCoords, toolShape) {
        this.ctx = ctx;
        this.cm = cm;
        this.mm = mm;
        this.container = container;
        this.getPageCoords = getPageCoords;
        this.toolShape = toolShape;
        this.outsideR = cm * 6;
        this.insideR = cm * 4.5;
        this.pointerW = cm * 1;
        this.loadEvent();
    }
    calculateRotationAngle(dragStartX, dragStartY, dragEndX, dragEndY) {
        const cx = this.toolShapeCenterX;
        const cy = this.toolShapeCenterY;
        // 计算向量a的x和y分量
        const aX = dragStartX - cx;
        const aY = dragStartY - cy;
        // 计算向量b的x和y分量
        const bX = dragEndX - cx;
        const bY = dragEndY - cy;
        // 计算向量a和向量b的夹角
        const dotProduct = aX * bX + aY * bY; // 向量的点乘
        const aLength = Math.sqrt(aX * aX + aY * aY); // 向量a的长度
        const bLength = Math.sqrt(bX * bX + bY * bY); // 向量b的长度
        const cosTheta = dotProduct / (aLength * bLength); // 夹角的余弦值
        const theta = Math.acos(cosTheta); // 夹角的弧度值
        // 判断旋转方向，如果向量a和向量b形成逆时针方向，则旋转角度为正值，否则为负值
        const crossProduct = aX * bY - aY * bX; // 向量的叉乘
        const rotationAngle = crossProduct >= 0 ? theta : -theta;
        // 将弧度转换为角度
        const rotationAngleInDegrees = rotationAngle * 180 / Math.PI;
        return rotationAngleInDegrees;
    }
    loadEvent() {
        const container = this.container;
        let dragStartX = 0;
        let dragStartY = 0;
        let dragEndX = 0;
        let dragEndY = 0;
        let doTurn = false;
        let movePointer1 = false;
        let movePointer2 = false;
        const turnPoinerStart = (coords, event) => {
            const ctx = this.ctx;
            const pointer1 = this.pointer1;
            const pointer2 = this.pointer2;
            dragEndX = coords.pageX;
            dragEndY = coords.pageY;
            if (pointer2 && ctx.isPointInPath(pointer2, coords.pageX, coords.pageY)) {
                event.stopImmediatePropagation();
                movePointer2 = true;
                doTurn = true;
            }
            else if (pointer1 && ctx.isPointInPath(pointer1, coords.pageX, coords.pageY)) {
                event.stopImmediatePropagation();
                movePointer1 = true;
                doTurn = true;
            }
        };
        const handleMouseStart = (event) => {
            event.preventDefault();
            const { pageX, pageY } = event;
            const coords = this.getPageCoords([{ pageX, pageY }]);
            turnPoinerStart(coords, event);
        };
        const turnPointerMove = (coords) => {
            dragStartX = dragEndX;
            dragStartY = dragEndY;
            dragEndX = coords.pageX;
            dragEndY = coords.pageY;
            const deltaAngle = this.calculateRotationAngle(dragStartX, dragStartY, dragEndX, dragEndY);
            if (!isNaN(deltaAngle)) {
                if (movePointer1) {
                    this.firstPointerAngle += deltaAngle;
                }
                else if (movePointer2) {
                    this.secondPointerAngle += deltaAngle;
                }
            }
            this.draw();
            this.toolShape.reset();
        };
        const handleMouseMove = (event) => {
            if (doTurn) {
                event.stopImmediatePropagation();
                const { pageX, pageY } = event;
                const coords = this.getPageCoords([{ pageX, pageY }]);
                turnPointerMove(coords);
            }
        };
        const turnPointerEnd = () => {
            doTurn = false;
            movePointer1 = false;
            movePointer2 = false;
        };
        const handleMouseEnd = (event) => {
            turnPointerEnd();
        };
        container.addEventListener("pointerdown", handleMouseStart);
        self.addEventListener("pointermove", handleMouseMove, { passive: true });
        self.addEventListener("pointerup", handleMouseEnd, { passive: true });
    }
    getOutlineCtx(_x, _y, _angle, outlineVoice, strokeStyle) {
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        const { width, height } = canvas;
        const offscreen = new OffscreenCanvas(width, height);
        const c = offscreen.getContext('2d');
        const cx = _x;
        const cy = _y;
        const angle = _angle;
        this.drawBorder(c, cx, cy, angle, 0, 'rgba(0,0,0,1)');
        this.drawPointer(c, cx, cy, angle, this.firstPointerAngle, 0, 'rgba(0,0,0,1)');
        this.drawPointer(c, cx, cy, angle, this.secondPointerAngle, 0, 'rgba(0,0,0,1)');
        c.globalCompositeOperation = 'source-out';
        const offscreen1 = new OffscreenCanvas(width, height);
        const c2 = offscreen1.getContext('2d');
        this.drawBorder(c2, cx, cy, angle, outlineVoice, 'rgba(0,0,0,1)');
        this.drawPointer(c2, cx, cy, angle, this.firstPointerAngle, outlineVoice, 'rgba(0,0,0,1)');
        this.drawPointer(c2, cx, cy, angle, this.secondPointerAngle, outlineVoice, 'rgba(0,0,0,1)');
        c.drawImage(offscreen1, 0, 0);
        c.globalCompositeOperation = 'source-in';
        c.fillStyle = strokeStyle;
        c.fillRect(0, 0, width, height);
        return c;
    }
    generatorOuterBorder(_cx, _cy, _angle) {
        const startAngle = this.startAngle;
        const endAngle = this.endAngle;
        const outsideR = this.outsideR;
        const insideR = this.insideR;
        const r = (outsideR + insideR) / 2;
        const cx = _cx;
        const cy = _cy;
        const path = new Path2D();
        path.arc(cx, cy, r, rotateAngle(startAngle, _angle), rotateAngle(endAngle, _angle));
        this.path = path;
        return path;
    }
    generatorPointer(_cx, _cy, _angle, pointerAngle, outlineVoice) {
        const outsideR = this.outsideR;
        const pointerW = this.pointerW;
        const cx = _cx;
        const cy = _cy;
        const r = pointerW / 2 + outlineVoice;
        let angle = _angle;
        angle += pointerAngle;
        const rotateCoordinates = RotateCoordinates(angle, _cx, _cy);
        let pathStr = '';
        pathStr += `M${rotateCoordinates(cx, cy - r).join(',')}`;
        pathStr += `A${r},${r},1,1,1,${rotateCoordinates(cx, cy + r).join(',')}`;
        pathStr += `L${rotateCoordinates(cx - outsideR, cy + r).join(',')}`;
        pathStr += `A${r},${r},1,1,1,${rotateCoordinates(cx - outsideR, cy - r).join(',')}`;
        pathStr += 'z';
        const path = new Path2D(pathStr);
        return path;
    }
    drawDegree(cx, cy, r, smallUnitL, unitL, bigUnitL, ruleFontSize, fontGap, showText, showSmall, showMiddle, showBig, textOnInner, _angle, reverse) {
        const ctx = this.ctx;
        // 刻度设置
        const total = 360; // 总刻度数
        const unitS = 2 * Math.PI / total; // 刻度线间隔角度
        const unitBigInterval = 10;
        const unitInterval = unitBigInterval;
        const ruleLoose = 5;
        // 绘制刻度和刻度的数值
        let angle = (180 + _angle) * Math.PI / 180;
        ctx.save();
        ctx.textAlign = 'center'; // 设置文本对齐方式
        ctx.textBaseline = 'middle';
        ctx.font = `${ruleFontSize}px Arial`; // 文本字体
        if (!textOnInner) {
            r += bigUnitL;
            ctx.textBaseline = 'bottom';
        }
        for (let i = 0; i <= total; i++) {
            if (i % unitBigInterval === 0) { // 大刻度
                const startX = cx + Math.cos(angle) * (r - bigUnitL); // 刻度线起始点横坐标
                const startY = cy + Math.sin(angle) * (r - bigUnitL); // 刻度线起始点纵坐标
                const endX = cx + Math.cos(angle) * r; // 刻度线结束点横坐标
                const endY = cy + Math.sin(angle) * r; // 刻度线结束点纵坐标
                if (showBig) {
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                }
                if (i !== total && showText && i % unitInterval === 0) {
                    const textX = cx + Math.cos(angle) * (r - (bigUnitL + fontGap) * Number(textOnInner)); // 刻度文本位置横坐标
                    const textY = cy + Math.sin(angle) * (r - (bigUnitL + fontGap) * Number(textOnInner)); // 刻度文本位置纵坐标
                    ctx.save();
                    ctx.textAlign = 'center';
                    ctx.translate(textX, textY);
                    ctx.rotate(angle + Math.PI / 2);
                    ctx.fillText((reverse ? total - i : i).toString(), 0, 0);
                    ctx.restore();
                }
            }
            else if (!(i % ruleLoose)) { // 中刻度
                if (showMiddle) {
                    const startX = cx + Math.cos(angle) * (r - unitL); // 刻度线起始点横坐标
                    const startY = cy + Math.sin(angle) * (r - unitL); // 刻度线起始点纵坐标
                    const endX = cx + Math.cos(angle) * r; // 刻度线结束点横坐标
                    const endY = cy + Math.sin(angle) * r; // 刻度线结束点纵坐标
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                }
            }
            else if (showSmall) {
                const startX = cx + Math.cos(angle) * (r - smallUnitL); // 刻度线起始点横坐标
                const startY = cy + Math.sin(angle) * (r - smallUnitL); // 刻度线起始点纵坐标
                const endX = cx + Math.cos(angle) * r; // 刻度线结束点横坐标
                const endY = cy + Math.sin(angle) * r; // 刻度线结束点纵坐标
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
            angle += unitS; // 更新角度
        }
        ctx.restore();
    }
    drawContent(_cx, _cy, _angle) {
        const outsideR = this.outsideR;
        const cx = _cx;
        const cy = _cy;
        const ctx = this.ctx;
        ctx.save();
        this.drawDegree(cx, cy, outsideR, 10, 15, 20, 8, 10, true, true, true, true, true, _angle, false);
        this.drawDegree(cx, cy, outsideR, 10, 15, 20, 8, 25, true, false, false, false, true, _angle, true);
        ctx.restore();
    }
    drawBorder(ctx, cx, cy, angle, outlineVoice, strokeStyle) {
        const outsideR = this.outsideR;
        const insideR = this.insideR;
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = outsideR - insideR + 2 * outlineVoice;
        ctx.strokeStyle = strokeStyle;
        const path = this.generatorOuterBorder(cx, cy, angle);
        ctx.stroke(path);
        ctx.restore();
    }
    drawPointer(ctx, cx, cy, angle, pointerAngle, outlineVoice, fillStyle) {
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = fillStyle;
        const path = this.generatorPointer(cx, cy, angle, pointerAngle, outlineVoice);
        ctx.fill(path);
        ctx.restore();
        return path;
    }
    drawFixedPoint(cx, cy, angle) {
        const ctx = this.ctx;
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0,0,0,.08)';
        ctx.arc(cx, cy, this.pointerW / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    draw() {
        const angle = this.angle;
        const cx = this.toolShapeCenterX;
        const cy = this.toolShapeCenterY;
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.drawBorder(ctx, cx, cy, angle, 0, 'rgba(0,0,0,.08)');
        this.drawContent(cx, cy, angle);
        this.pointer1 = this.drawPointer(ctx, cx, cy, angle, this.firstPointerAngle, 0, 'rgba(0,0,0,.08)');
        this.pointer2 = this.drawPointer(ctx, cx, cy, angle, this.secondPointerAngle, 0, 'rgba(0,0,0,.08)');
        this.drawFixedPoint(cx, cy, angle);
    }
    isPointInPath(x, y, fillRule) {
        const ctx = this.ctx;
        if (fillRule === 'evenodd') {
            let isPointInStroke = false;
            ctx.save();
            ctx.lineWidth = this.outsideR - this.insideR;
            isPointInStroke = ctx.isPointInStroke(this.path, x, y);
            ctx.restore();
            return isPointInStroke;
        }
        else {
            return ctx.isPointInPath(this.path, x, y);
        }
    }
}

class Triangle {
    ctx;
    cm;
    mm;
    degreeNumberH;
    degreeNumberV;
    marginH;
    marginV;
    path;
    width = 0;
    height = 0;
    marginC = 0;
    gap = 0;
    toolShapeCenterX = 500;
    toolShapeCenterY = 300;
    angle = 0;
    constructor(ctx, cm, mm, degreeNumberH, degreeNumberV, marginH, marginV) {
        this.ctx = ctx;
        this.cm = cm;
        this.mm = mm;
        this.degreeNumberH = degreeNumberH;
        this.degreeNumberV = degreeNumberV;
        this.marginH = marginH;
        this.marginV = marginV;
        this.marginC = this.cm;
        this.width = this.cm * this.degreeNumberH + this.marginH + this.marginC;
        this.height = this.cm * this.degreeNumberV + this.marginV + this.marginC;
        this.gap = this.cm * 1.5;
    }
    getOutlineCtx(_x, _y, _angle, outlineVoice, strokeStyle) {
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        const { width, height } = canvas;
        const offscreen = new OffscreenCanvas(width, height);
        const c = offscreen.getContext('2d');
        const path = this.generatorOuterBorder(_x, _y, _angle, outlineVoice);
        c.strokeStyle = strokeStyle;
        c.lineWidth = outlineVoice;
        c.stroke(path);
        return c;
    }
    generatorOuterBorder(_cx, _cy, _angle, voice = 0) {
        const width = this.width;
        const height = this.height;
        const x = _cx - width / 2 - voice / 2;
        const y = _cy - height / 2 - voice / 2;
        const angle = _angle;
        const rotateCoordinates = RotateCoordinates(angle, _cx, _cy);
        const path = new Path2D();
        path.moveTo(...rotateCoordinates(x + width + voice + voice * width / (width + height), y));
        path.lineTo(...rotateCoordinates(x, y));
        path.lineTo(...rotateCoordinates(x, y + height + voice + voice * height / (width + height)));
        path.closePath();
        const gap = this.gap;
        const smallX = x + gap + voice;
        const smallY = y + gap + voice;
        const smallWidth = width / 2;
        const smallHeight = height / 2;
        path.moveTo(...rotateCoordinates(smallX + smallWidth - voice - voice * width / (width + height), smallY));
        path.lineTo(...rotateCoordinates(smallX, smallY));
        path.lineTo(...rotateCoordinates(smallX, smallY + smallHeight - voice - voice * width / (width + height)));
        path.closePath();
        this.path = path;
        return path;
    }
    draw() {
        const angle = this.angle;
        const cx = this.toolShapeCenterX;
        const cy = this.toolShapeCenterY;
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        const marginC = this.marginC;
        const cm = this.cm;
        const mm = this.mm;
        const degreeNumberH = this.degreeNumberH;
        const degreeNumberV = this.degreeNumberV;
        const width = this.width;
        const height = this.height;
        const rotateCoordinates = RotateCoordinates(angle, cx, cy);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0,0,0,.08)';
        const path = this.generatorOuterBorder(cx, cy, angle);
        ctx.fill(path, 'evenodd');
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = 'black';
        ctx.font = "3mm serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.beginPath();
        const cmLen = 0.5 * cm;
        const x = cx - width / 2;
        const y = cy - height / 2;
        const mmLen = cmLen * 0.6;
        const halfCmLen = cmLen * 0.8;
        for (let i = 0; i <= degreeNumberH; i++) {
            const currentX = x + marginC + i * cm;
            ctx.moveTo(...rotateCoordinates(currentX, y));
            ctx.lineTo(...rotateCoordinates(currentX, y + cmLen));
            ctx.save();
            ctx.translate(...rotateCoordinates(currentX, y + cmLen + mm));
            ctx.rotate(angle * Math.PI / 180);
            ctx.fillText(String(i), 0, 0);
            ctx.restore();
            if (i < degreeNumberH) {
                for (let j = 1; j < 10; j++) {
                    const currentMmX = currentX + j * mm;
                    ctx.moveTo(...rotateCoordinates(currentMmX, y));
                    if (j === 5) {
                        ctx.lineTo(...rotateCoordinates(currentMmX, y + halfCmLen));
                    }
                    else {
                        ctx.lineTo(...rotateCoordinates(currentMmX, y + mmLen));
                    }
                }
            }
        }
        for (let i = 0; i <= degreeNumberV; i++) {
            const currentY = y + marginC + i * cm;
            ctx.moveTo(...rotateCoordinates(x, currentY));
            ctx.lineTo(...rotateCoordinates(x + cmLen, currentY));
            ctx.save();
            ctx.translate(...rotateCoordinates(x + cmLen + mm, currentY));
            ctx.rotate(angle * Math.PI / 180 - Math.PI / 2);
            ctx.fillText(String(i), 0, 0);
            ctx.restore();
            if (i < degreeNumberV) {
                for (let j = 1; j < 10; j++) {
                    const currentMmY = currentY + j * mm;
                    ctx.moveTo(...rotateCoordinates(x, currentMmY));
                    if (j === 5) {
                        ctx.lineTo(...rotateCoordinates(x + halfCmLen, currentMmY));
                    }
                    else {
                        ctx.lineTo(...rotateCoordinates(x + mmLen, currentMmY));
                    }
                }
            }
        }
        ctx.stroke();
        ctx.restore();
    }
    isPointInPath(x, y, fillRule) {
        return this.ctx.isPointInPath(this.path, x, y, fillRule);
    }
}

class ToolShape {
    w;
    h;
    voice;
    canvas;
    ctx;
    getNearestDistanceAndPointVoice;
    outlineCtx;
    outlineImageData;
    outline;
    longestDistance = 30;
    // 像素点采集宽度
    gatherAreaWidth = 10;
    prevPoint = null;
    _toolShapeType = ShapeType.RULER;
    strokeStyle;
    cm = 0;
    mm = 0;
    width = 0;
    height = 0;
    marginH = 0;
    degreeNumber = 20;
    ruler;
    compass;
    compass360;
    rightAngleTriangle;
    equilateralTriangle;
    constructor(w, h, voice, container, getPageCoords) {
        this.w = w;
        this.h = h;
        this.voice = voice;
        this.canvas = generateCanvas(w, h);
        this.ctx = this.canvas.getContext('2d');
        this.cm = 96 / 2.54;
        this.mm = this.cm / 10;
        this.getNearestDistanceAndPointVoice = voice;
        this.ruler = new Ruler(this.ctx, this.cm, this.mm);
        this.compass = new Compass$1(this.ctx, this.cm, this.mm);
        this.compass360 = new Compass(this.ctx, this.cm, this.mm, container, getPageCoords, this);
        this.rightAngleTriangle = new Triangle(this.ctx, this.cm, this.mm, 9, 5, this.cm * 3, this.cm * 1);
        this.equilateralTriangle = new Triangle(this.ctx, this.cm, this.mm, 6, 6, this.cm * 2, this.cm * 2);
    }
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    set toolShapeCenterX(x) {
        this.shape.toolShapeCenterX = x;
        this.reset();
    }
    get toolShapeCenterX() {
        return this.shape.toolShapeCenterX;
    }
    set toolShapeCenterY(y) {
        this.shape.toolShapeCenterY = y;
        this.reset();
    }
    get toolShapeCenterY() {
        return this.shape.toolShapeCenterY;
    }
    set angle(angle) {
        this.shape.angle = angle;
        this.reset();
    }
    get angle() {
        return this.shape.angle;
    }
    set toolShapeType(toolShapeType) {
        this._toolShapeType = toolShapeType;
        this.reset();
        this.draw();
    }
    get toolShapeType() {
        return this._toolShapeType;
    }
    get shape() {
        let shape;
        switch (this.toolShapeType) {
            case ShapeType.RULER:
                shape = this.ruler;
                break;
            case ShapeType.COMPASS:
                shape = this.compass;
                break;
            case ShapeType.COMPASS360:
                shape = this.compass360;
                break;
            case ShapeType.RIGHT_ANGLE_TRIANGLE:
                shape = this.rightAngleTriangle;
                break;
            case ShapeType.EQUILATERAL_TRIANGLE:
                shape = this.equilateralTriangle;
                break;
            default: shape = this.ruler;
        }
        return shape;
    }
    reset() {
        this.outline = null;
        this.prevPoint = null;
    }
    getGatherAreas(x1, y1, x2, y2, gatherAreaWidth) {
        const imageData = this.outlineImageData;
        const data = imageData.data;
        const width = this.w;
        const rowLen = width * 4;
        const gatherAreas = [];
        const topLeftX = Math.min(x1, x2) - gatherAreaWidth / 2;
        const topLeftY = Math.min(y1, y2) - gatherAreaWidth / 2;
        const bottomRightX = Math.max(x1, x2) + gatherAreaWidth / 2;
        const bottomRightY = Math.max(y1, y2) + gatherAreaWidth / 2;
        const startX = topLeftX * 4;
        const startY = topLeftY;
        const endX = (bottomRightX + 1) * 4;
        const endY = bottomRightY + 1;
        const fragmentLen = endX - startX;
        let k = 0;
        for (let j = startY; j < endY; j++) {
            const base = j * rowLen;
            const start = base + startX;
            const end = base + endX;
            const fragment = data.subarray(start, end);
            gatherAreas.push({ start: fragmentLen * k, end: fragmentLen * (k + 1), data: fragment });
            k++;
        }
        return { x: topLeftX, y: topLeftY, width: bottomRightX - topLeftX + 1, height: bottomRightY - topLeftY + 1, fragments: gatherAreas };
    }
    getNearestDistanceAndPoint(x, y, getNearestDistanceAndPointVoice, strokeStyle) {
        if (!this.outline || getNearestDistanceAndPointVoice !== this.getNearestDistanceAndPointVoice || this.strokeStyle !== strokeStyle) {
            this.getNearestDistanceAndPointVoice = getNearestDistanceAndPointVoice;
            this.strokeStyle = strokeStyle;
            this.outlineCtx = this.getOutlineCtx(this.getNearestDistanceAndPointVoice, strokeStyle);
            this.outlineImageData = this.outlineCtx.getImageData(0, 0, this.w, this.h);
            this.outline = this.getOutline(this.outlineImageData);
        }
        const outline = this.outline;
        const len = outline.length;
        let prevPoint = this.prevPoint;
        const gatherAreaWidth = Math.max(this.gatherAreaWidth, getNearestDistanceAndPointVoice * 3);
        if (!prevPoint) {
            let nearestDistance = Number.MAX_SAFE_INTEGER;
            for (let i = 0; i < len; i++) {
                const [x0, y0] = outline[i];
                const distance = ((x - x0) ** 2 + (y - y0) ** 2) ** 0.5;
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    prevPoint = [x0, y0];
                }
            }
            this.prevPoint = prevPoint;
            return { conformingToDistance: nearestDistance <= this.longestDistance, drawPoints: [] };
        }
        else {
            const innerAreaPoints = [];
            for (let i = 0; i < len; i++) {
                const [x0, y0] = outline[i];
                const gatherDistance = ((prevPoint[0] - x0) ** 2 + (prevPoint[1] - y0) ** 2) ** 0.5;
                if (gatherDistance <= gatherAreaWidth) {
                    innerAreaPoints.push(outline[i]);
                }
            }
            let nearestDistance = Number.MAX_SAFE_INTEGER;
            let gatherPoint = null;
            for (let i = 0; i < innerAreaPoints.length; i++) {
                const [x0, y0] = innerAreaPoints[i];
                const distance = ((x - x0) ** 2 + (y - y0) ** 2) ** 0.5;
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    gatherPoint = [x0, y0];
                }
            }
            let gatherAreasObj = { x: 0, y: 0, width: 0, height: 0, fragments: [] };
            if (gatherPoint) {
                gatherAreasObj = this.getGatherAreas(prevPoint[0], prevPoint[1], gatherPoint[0], gatherPoint[1], gatherAreaWidth);
            }
            this.prevPoint = gatherPoint;
            return { conformingToDistance: true, gatherAreasObj };
        }
    }
    getOutlineCtx(outlineVoice, strokeStyle) {
        return this.shape.getOutlineCtx(this.toolShapeCenterX, this.toolShapeCenterY, this.angle, outlineVoice, strokeStyle);
    }
    getOutline(imageData) {
        const data = imageData.data;
        const len = data.length;
        const outline = [];
        let row = 0;
        let column = -1;
        for (let i = 0; i < len; i += 4) {
            column++;
            if (data[i + 3]) {
                outline.push([column, row, data.slice(i, i + 4)]);
            }
            if (column === this.w - 1) {
                row++;
                column = -1;
            }
        }
        return outline;
    }
    isPointInPath(x, y, fillRule) {
        return this.shape.isPointInPath(x, y, fillRule);
    }
    draw(showDu = false, duCx = 0, duCy = 0) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.w, this.h);
        this.shape.draw(showDu, duCx, duCy);
    }
}

class Background {
    width;
    height;
    gridGap;
    gridFillStyle;
    gridPaperGap;
    gridPaperStrokeStyle;
    quadrillePaperVerticalMargin;
    quadrillePaperGap;
    quadrillePaperStrokeStyles;
    gridPattern;
    gridPaperPattern;
    quadrillePaperPattern;
    bgPattern;
    canvas;
    ctx;
    coordX;
    coordY;
    constructor(width, height, gridGap, gridFillStyle, gridPaperGap, gridPaperStrokeStyle, quadrillePaperVerticalMargin, quadrillePaperGap, quadrillePaperStrokeStyles) {
        this.width = width;
        this.height = height;
        this.gridGap = gridGap;
        this.gridFillStyle = gridFillStyle;
        this.gridPaperGap = gridPaperGap;
        this.gridPaperStrokeStyle = gridPaperStrokeStyle;
        this.quadrillePaperVerticalMargin = quadrillePaperVerticalMargin;
        this.quadrillePaperGap = quadrillePaperGap;
        this.quadrillePaperStrokeStyles = quadrillePaperStrokeStyles;
        this.canvas = generateCanvas(width, height);
        this.ctx = this.canvas.getContext('2d');
        this.gridPattern = this.generateGridPattern();
        this.gridPaperPattern = this.generateGridPaperPattern();
        this.quadrillePaperPattern = this.generateQuadrillePaperPattern();
    }
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    draw(coordX, coordY, bgPattern) {
        if (coordX !== this.coordX || coordY !== this.coordY || bgPattern !== this.bgPattern) {
            this.coordX = coordX;
            this.coordY = coordY;
            this.bgPattern = bgPattern;
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.width + this.gridGap * 2, this.height + this.gridGap * 2);
            ctx.save();
            ctx.beginPath();
            ctx.translate(coordX, coordY);
            if (this.bgPattern === BGPattern.GRID) {
                ctx.fillStyle = this.gridPattern;
            }
            else if (this.bgPattern === BGPattern.GRID_PAPER) {
                ctx.fillStyle = this.gridPaperPattern;
            }
            else if (this.bgPattern === BGPattern.QUADRILLE_PAPER) {
                ctx.fillStyle = this.quadrillePaperPattern;
            }
            ctx.fillRect(0, 0, this.width + this.gridGap * 2, this.height + this.gridGap * 2);
            ctx.restore();
        }
    }
    generateGridPattern() {
        const gap = this.gridGap;
        const bgOffscreen = new OffscreenCanvas(gap * 2, gap * 2);
        const ctx = bgOffscreen.getContext("2d");
        ctx.fillStyle = this.gridFillStyle;
        ctx.fillRect(0, 0, gap, gap);
        ctx.fillRect(gap, gap, gap, gap);
        const pattern = ctx.createPattern(bgOffscreen, "repeat");
        return pattern;
    }
    generateGridPaperPattern() {
        const gap = this.gridPaperGap;
        const bgOffscreen = new OffscreenCanvas(gap, gap);
        const ctx = bgOffscreen.getContext("2d");
        ctx.strokeStyle = this.gridPaperStrokeStyle;
        ctx.strokeRect(0, 0, gap, gap);
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(gap / 2, 0);
        ctx.lineTo(gap / 2, gap);
        ctx.moveTo(0, gap / 2);
        ctx.lineTo(gap, gap / 2);
        ctx.stroke();
        const pattern = ctx.createPattern(bgOffscreen, "repeat");
        return pattern;
    }
    generateQuadrillePaperPattern() {
        const quadrillePaperVerticalMargin = this.quadrillePaperVerticalMargin;
        const gap = this.quadrillePaperGap;
        const quadrillePaperStrokeStyles = this.quadrillePaperStrokeStyles;
        const height = quadrillePaperVerticalMargin * 2 + gap * 3;
        const bgOffscreen = new OffscreenCanvas(this.width, height);
        const ctx = bgOffscreen.getContext("2d");
        for (let i = 0; i < quadrillePaperStrokeStyles.length; i++) {
            ctx.strokeStyle = quadrillePaperStrokeStyles[i];
            ctx.beginPath();
            ctx.moveTo(0, quadrillePaperVerticalMargin + gap * i);
            ctx.lineTo(this.width, quadrillePaperVerticalMargin + gap * i);
            ctx.stroke();
        }
        const pattern = ctx.createPattern(bgOffscreen, "repeat");
        return pattern;
    }
}

class RuleAuxiliary {
    width;
    height;
    ruleStrokeStyle;
    ruleGap;
    ruleUnitLen;
    canvas;
    ctx;
    worldOffsetX;
    worldOffsetY;
    constructor(width, height, ruleStrokeStyle, ruleGap, ruleUnitLen) {
        this.width = width;
        this.height = height;
        this.ruleStrokeStyle = ruleStrokeStyle;
        this.ruleGap = ruleGap;
        this.ruleUnitLen = ruleUnitLen;
        this.canvas = generateCanvas(width, height);
        this.ctx = this.canvas.getContext('2d');
    }
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    draw(worldOffsetX, worldOffsetY) {
        if (worldOffsetX !== this.worldOffsetX || worldOffsetY !== this.worldOffsetY) {
            this.worldOffsetX = worldOffsetX;
            this.worldOffsetY = worldOffsetY;
            const ctx = this.ctx;
            ctx.beginPath();
            ctx.clearRect(0, 0, this.width, this.height);
            ctx.strokeStyle = this.ruleStrokeStyle;
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = this.ruleStrokeStyle;
            const offsetX = negativeRemainder(this.worldOffsetX, (this.ruleGap * 10));
            const offsetY = negativeRemainder(this.worldOffsetY, (this.ruleGap * 10));
            const offsetXRule = (this.worldOffsetX - this.worldOffsetX % (this.ruleGap * 10)) / (this.ruleGap * 10) * 10;
            const offsetYRule = (this.worldOffsetY - this.worldOffsetY % (this.ruleGap * 10)) / (this.ruleGap * 10) * 10;
            let i = 0;
            let j = 0;
            let coordX = -offsetX;
            let coordY = -offsetY;
            const fontGap = 3;
            while (coordX <= this.width) {
                let len = this.ruleUnitLen;
                if (!(i % 10)) {
                    len = this.ruleUnitLen * 2.5;
                }
                else if (!(i % 5)) {
                    len = this.ruleUnitLen * 1.5;
                }
                ctx.moveTo(coordX, 0);
                ctx.lineTo(coordX, len);
                ctx.moveTo(coordX, this.height);
                ctx.lineTo(coordX, this.height - len);
                if (!(i % 10)) {
                    ctx.textBaseline = "top";
                    ctx.fillText(String(i + offsetXRule), coordX, len + fontGap);
                    ctx.textBaseline = "bottom";
                    ctx.fillText(String(i + offsetXRule), coordX, this.height - len - fontGap);
                }
                coordX += this.ruleGap;
                i++;
            }
            ctx.textBaseline = "middle";
            while (coordY <= this.height) {
                let len = this.ruleUnitLen;
                if (!(j % 10)) {
                    len = this.ruleUnitLen * 2.5;
                }
                else if (!(j % 5)) {
                    len = this.ruleUnitLen * 1.5;
                }
                ctx.moveTo(0, coordY);
                ctx.lineTo(len, coordY);
                ctx.moveTo(this.width, coordY);
                ctx.lineTo(this.width - len, coordY);
                if (!(j % 10)) {
                    ctx.textAlign = "left";
                    ctx.fillText(String(j + offsetYRule), len + fontGap, coordY);
                    ctx.textAlign = "right";
                    ctx.fillText(String(j + offsetYRule), this.width - len - fontGap, coordY);
                }
                coordY += this.ruleGap;
                j++;
            }
            ctx.stroke();
        }
    }
}

class Writing {
    store;
    canvas;
    ctx;
    scale = 1;
    width;
    height;
    constructor(width, height, store) {
        this.width = width * this.scale;
        this.height = height * this.scale;
        this.canvas = generateCanvas(this.width, this.height);
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.store = store;
    }
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    refresh(worldOffsetX, worldOffsetY) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.putImageData(worldOffsetX, worldOffsetY);
    }
    singlePointsWriting(gatherAreasObj) {
        const ctx = this.ctx;
        const { x, y, width, height, fragments } = gatherAreasObj;
        const imageData = ctx.getImageData(x, y, width, height);
        const data = imageData.data;
        const rowLen = width * 4;
        for (let i = 0; i < fragments.length; i++) {
            const { data: fdata } = fragments[i];
            const baseStart = rowLen * i;
            for (let j = 0; j < fdata.length; j += 4) {
                const fa = fdata[j + 3];
                const a = data[baseStart + j + 3];
                if (fa || a) {
                    const fr = fdata[j];
                    const fg = fdata[j + 1];
                    const fb = fdata[j + 2];
                    const r = data[baseStart + j];
                    const g = data[baseStart + j + 1];
                    const b = data[baseStart + j + 2];
                    if (fa !== a || fr !== r || fg !== g || fb !== b) {
                        const alphaT = fa / 255;
                        const alphaB = a / 255;
                        const alphaF = alphaT + alphaB * (1 - alphaT);
                        const tr = this.colorOverlay(fr, alphaT, r, alphaB, alphaF);
                        const tg = this.colorOverlay(fg, alphaT, g, alphaB, alphaF);
                        const tb = this.colorOverlay(fb, alphaT, b, alphaB, alphaF);
                        data[baseStart + j + 3] = alphaF * 255;
                        data[baseStart + j] = tr;
                        data[baseStart + j + 1] = tg;
                        data[baseStart + j + 2] = tb;
                    }
                }
            }
        }
        this.ctx.putImageData(imageData, x, y);
    }
    // colorT，alphaT：表示前景色和前景色的透明度
    // colorB，alphaB：表示背景色和背景色的透明度
    // colorF，alphaF：表示计算得到的颜色和透明度
    colorOverlay(colorT, alphaT, colorB, alphaB, alphaF) {
        const colorF = (colorT * alphaT + colorB * alphaB * (1 - alphaT)) / alphaF;
        return colorF;
    }
    clear() {
        this.store.length = 0;
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.pushImageData(0, 0);
    }
    doClean(x1, y1, x2, y2, r, determineIfThereHasContent = false) {
        x1 = this.scale * x1;
        y1 = this.scale * y1;
        x2 = this.scale * x2;
        y2 = this.scale * y2;
        r = this.scale * r;
        let hasContent = false;
        let originData;
        const clipX = Math.min(x1, x2) - r;
        const clipY = Math.min(y1, y2) - r;
        const clipWidth = Math.abs(x2 - x1) + 2 * r;
        const clipHeight = Math.abs(y2 - y1) + 2 * r;
        if (determineIfThereHasContent) {
            const imageData = this.ctx.getImageData(clipX, clipY, clipWidth, clipHeight);
            originData = imageData.data;
        }
        const ctx = this.ctx;
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = r * 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
        if (determineIfThereHasContent) {
            const imageData = this.ctx.getImageData(clipX, clipY, clipWidth, clipHeight);
            const data = imageData.data;
            const len = data.length;
            for (let i = 0; i < len; i += 4) {
                if (data[i + 3] !== originData[i + 3]) {
                    hasContent = true;
                    break;
                }
            }
        }
        return hasContent;
    }
    pushImageData(worldOffsetX, worldOffsetY) {
        const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;
        const fragments = [];
        const total = data.length;
        const colLen = this.width * 4;
        let index = 0;
        for (let i = 0; i < total; i += colLen) {
            const subData = data.subarray(i, i + colLen);
            let notOpacity = false;
            let hasBegin = false;
            let startCol = 0;
            let endCol = 0;
            for (let j = 0; j < colLen; j += 4) {
                if (subData[j + 3]) {
                    notOpacity = true;
                    if (!hasBegin) {
                        hasBegin = true;
                        startCol = j;
                    }
                    endCol = j;
                }
            }
            if (notOpacity) {
                fragments.push({ data: subData, index, startCol, endCol });
            }
            index++;
        }
        const store = this.store;
        const len = store.length;
        for (let i = len - 1; i >= 0; i--) {
            const storeItem = store[i];
            if (storeItem.worldOffsetX === worldOffsetX && storeItem.worldOffsetY === worldOffsetY) {
                store.splice(i, 1);
            }
        }
        store.push({
            worldOffsetX,
            worldOffsetY,
            imageData,
            fragments,
            colLen,
            height: this.height
        });
        this.washStore();
    }
    washStore() {
        const store = this.store;
        const lastStoreItem = store[store.length - 1];
        const { worldOffsetX: lastWorldOffsetX, worldOffsetY: lastWorldOffsetY, colLen: lastColLen, height: lastHeight } = lastStoreItem;
        const preStoreItems = store.slice(0, store.length - 1);
        for (let i = 0; i < preStoreItems.length; i++) {
            const { fragments, worldOffsetX, worldOffsetY } = preStoreItems[i];
            const clearStartRow = lastWorldOffsetY - worldOffsetY;
            const clearStartCol = (lastWorldOffsetX - worldOffsetX) * 4;
            const clearEndCol = clearStartCol + lastColLen;
            const clearEndRow = clearStartRow + lastHeight;
            for (let j = fragments.length - 1; j >= 0; j--) {
                const fragment = fragments[j];
                const { index } = fragment;
                if (index >= clearStartRow && index < clearEndRow) {
                    const data = fragment.data;
                    const len = Math.min(data.length, clearEndCol);
                    for (let i = clearStartCol; i < len; i += 4) {
                        if (data[i + 3]) {
                            data[i + 3] = 0;
                        }
                    }
                }
            }
        }
    }
    putImageData(worldOffsetX, worldOffsetY) {
        const width = this.width;
        const height = this.height;
        const colLen = width * 4;
        const rowLen = height;
        const total = colLen * rowLen;
        const store = this.store;
        const storeLen = store.length;
        const displayData = new Uint8ClampedArray(total);
        const subDatas = [];
        for (let i = 0; i < total; i += colLen) {
            const subData = displayData.subarray(i, i + colLen);
            subDatas.push(subData);
        }
        const subDatasLen = subDatas.length;
        for (let i = 0; i < storeLen; i++) {
            const storeItem = store[i];
            const storeItemWorldOffsetX = storeItem.worldOffsetX;
            const storeItemWorldOffsetY = storeItem.worldOffsetY;
            const storeItemFragments = storeItem.fragments;
            const datasLen = storeItemFragments.length;
            const beginX = (storeItemWorldOffsetX - worldOffsetX) * 4;
            const benginY = storeItemWorldOffsetY - worldOffsetY;
            for (let j = 0; j < datasLen; j++) {
                const { data: rowData, index, startCol, endCol } = storeItemFragments[j];
                const displayRow = benginY + index;
                if (displayRow >= 0 && displayRow < subDatasLen) {
                    for (let k = startCol; k <= endCol; k += 4) {
                        const displayCol = beginX + k;
                        if (displayCol >= 0 && displayCol < colLen) {
                            const a = rowData[k + 3];
                            if (a && !subDatas[displayRow][displayCol + 3]) {
                                subDatas[displayRow][displayCol] = rowData[k];
                                subDatas[displayRow][displayCol + 1] = rowData[k + 1];
                                subDatas[displayRow][displayCol + 2] = rowData[k + 2];
                                subDatas[displayRow][displayCol + 3] = rowData[k + 3];
                            }
                        }
                    }
                }
            }
        }
        if (storeLen) {
            const displayImageData = new ImageData(displayData, width, height);
            this.ctx.putImageData(displayImageData, 0, 0);
        }
    }
    getWholeCanvas() {
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
        for (let i = 0; i < storeLen; i++) {
            const storeItem = store[i];
            const storeItemWorldOffsetX = storeItem.worldOffsetX;
            const storeItemWorldOffsetY = storeItem.worldOffsetY;
            if (minX === undefined || minX > storeItemWorldOffsetX) {
                minX = storeItemWorldOffsetX;
            }
            if (minY === undefined || minY > storeItemWorldOffsetY) {
                minY = storeItemWorldOffsetY;
            }
            if (maxX === undefined || maxX < storeItemWorldOffsetX) {
                maxX = storeItemWorldOffsetX;
            }
            if (maxY === undefined || maxY < storeItemWorldOffsetY) {
                maxY = storeItemWorldOffsetY;
            }
        }
        const canvas = document.createElement('canvas');
        if (minX === undefined || minY === undefined || maxX === undefined || maxY === undefined) {
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
        for (let i = 0; i < storeLen; i++) {
            const storeItem = store[i];
            const storeItemWorldOffsetX = storeItem.worldOffsetX;
            const storeItemWorldOffsetY = storeItem.worldOffsetY;
            const storeItemData = storeItem.imageData.data;
            let currentCol = 0;
            let currentRow = 0;
            for (let j = 0; j < total;) {
                const displayCol = currentCol - minX + storeItemWorldOffsetX;
                const displayRow = currentRow - minY + storeItemWorldOffsetY;
                const r = storeItemData[j];
                const g = storeItemData[j + 1];
                const b = storeItemData[j + 2];
                const a = storeItemData[j + 3];
                if (a !== 0) {
                    if (displayCol < minPixelX) {
                        minPixelX = displayCol;
                    }
                    if (displayRow < minPixelY) {
                        minPixelY = displayRow;
                    }
                    if (displayCol > maxPixelX) {
                        maxPixelX = displayCol;
                    }
                    if (displayRow > maxPixelY) {
                        maxPixelY = displayRow;
                    }
                }
                const displayJ = (displayCol + displayRow * wholeWidth) * 4;
                displayData[displayJ] = r;
                displayData[displayJ + 1] = g;
                displayData[displayJ + 2] = b;
                displayData[displayJ + 3] = a;
                j += 4;
                if (j % colLen) {
                    currentCol++;
                }
                else {
                    currentCol = 0;
                    currentRow += 1;
                }
            }
        }
        const displayImageData = new ImageData(displayData, wholeWidth, wholeHeight);
        const targetWidth = maxPixelX - minPixelX;
        const targetHeight = maxPixelY - minPixelY;
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(displayImageData, -minPixelX, -minPixelY);
        return canvas;
    }
    getPaperCanvas() {
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
        for (let i = 0; i < storeLen; i++) {
            const storeItem = store[i];
            const storeItemWorldOffsetY = storeItem.worldOffsetY;
            if (maxY === undefined || maxY < storeItemWorldOffsetY) {
                maxY = storeItemWorldOffsetY;
            }
        }
        maxY += height;
        let maxPixelY = 0;
        const canvas = document.createElement('canvas');
        const wholeWidth = (maxX - minX);
        const wholeHeight = (maxY - minY);
        const wholeTotal = wholeWidth * 4 * wholeHeight;
        const displayData = new Uint8ClampedArray(wholeTotal);
        for (let i = 0; i < storeLen; i++) {
            const storeItem = store[i];
            const storeItemWorldOffsetX = storeItem.worldOffsetX;
            const storeItemWorldOffsetY = storeItem.worldOffsetY;
            const storeItemData = storeItem.imageData.data;
            let currentCol = 0;
            let currentRow = 0;
            for (let j = 0; j < total;) {
                const displayCol = currentCol - minX + storeItemWorldOffsetX;
                const displayRow = currentRow - minY + storeItemWorldOffsetY;
                if (displayCol >= minX
                    &&
                        displayRow >= minY
                    &&
                        displayCol < maxX
                    &&
                        displayRow < maxY) {
                    const r = storeItemData[j];
                    const g = storeItemData[j + 1];
                    const b = storeItemData[j + 2];
                    const a = storeItemData[j + 3];
                    if (a !== 0) {
                        if (displayRow > maxPixelY) {
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
                if (j % colLen) {
                    currentCol++;
                }
                else {
                    currentCol = 0;
                    currentRow += 1;
                }
            }
        }
        const targetHeight = (Math.floor(maxPixelY / height) + 1) * height;
        const displayImageData = new ImageData(displayData, maxX, maxY);
        canvas.width = maxX;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(displayImageData, 0, 0);
        return canvas;
    }
}

let Eraser$1 = class Eraser {
    width;
    height;
    canvas;
    ctx;
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.canvas = generateCanvas(width, height);
        this.ctx = this.canvas.getContext('2d');
    }
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    draw(cleanX, cleanY, r) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.fillStyle = 'rgba(0,0,0,.1)';
        this.ctx.strokeStyle = 'rgba(0,0,0,.15)';
        this.ctx.arc(cleanX, cleanY, r, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.restore();
        this.ctx.beginPath();
    }
};

class Eraser {
    writing;
    writeModel = WriteModel.WRITE;
    width;
    height;
    voice;
    color;
    x = null;
    y = null;
    d = null;
    prevX = null;
    prevY = null;
    prevD = null;
    constructor(width, height, voice, writing) {
        this.writing = writing;
        this.width = width;
        this.height = height;
        this.voice = voice;
    }
    reset(color) {
        this.color = color;
    }
    submit() {
        this.x = null;
        this.y = null;
        this.d = null;
        this.prevX = null;
        this.prevY = null;
        this.prevD = null;
    }
    draw(pointerType, { prevX, prevY, prevD, x, y, d }) {
        const writingCtx = this.writing.ctx;
        const endX = x;
        const endY = y;
        const endD = d;
        const startX = prevX;
        const startY = prevY;
        const startD = prevD;
        const threshold = 0.8;
        const angle = Math.atan2(endY - startY, endX - startX);
        const angle1 = angle - Math.PI / 2;
        const angle2 = angle + Math.PI / 2;
        const halfStartD = Math.max(startD / 2, threshold / 2);
        const halfEndD = Math.max(endD / 2, threshold / 2);
        const x1 = Math.cos(angle1) * halfStartD + startX;
        const y1 = Math.sin(angle1) * halfStartD + startY;
        const x2 = Math.cos(angle1) * halfEndD + endX;
        const y2 = Math.sin(angle1) * halfEndD + endY;
        const x3 = Math.cos(angle2) * halfEndD + endX;
        const y3 = Math.sin(angle2) * halfEndD + endY;
        const x4 = Math.cos(angle2) * halfStartD + startX;
        const y4 = Math.sin(angle2) * halfStartD + startY;
        writingCtx.save();
        writingCtx.fillStyle = this.color;
        writingCtx.strokeStyle = this.color;
        writingCtx.beginPath();
        writingCtx.moveTo(x1, y1);
        writingCtx.lineTo(x2, y2);
        writingCtx.arc(endX, endY, halfEndD, angle1, angle2);
        writingCtx.lineTo(x3, y3);
        writingCtx.lineTo(x4, y4);
        writingCtx.arc(startX, startY, halfStartD, angle2, angle1);
        writingCtx.closePath();
        writingCtx.fill();
        writingCtx.restore();
    }
    generateD(pressure) {
        const minPressure = 0.1;
        const maxPressure = 0.9;
        pressure = Math.min(Math.max(minPressure, pressure), maxPressure);
        const d = this.voice * (.5 + 1.5 * (pressure - minPressure) / (maxPressure - minPressure));
        return d;
    }
    setPrev(x, y, pressure) {
        const d = this.generateD(pressure);
        this.prevX = x;
        this.prevY = y;
        this.prevD = d;
    }
    pushPoints({ x, y, pressure, pointerType }) {
        let prevX = this.prevX;
        let prevY = this.prevY;
        const prevD = this.prevD;
        this.x = x;
        this.y = y;
        const d = this.generateD(pressure);
        this.d = d;
        this.draw(pointerType, {
            prevX,
            prevY,
            prevD,
            x,
            y,
            d
        });
        this.prevX = x;
        this.prevY = y;
        this.prevD = d;
    }
}

function isTouchDevice() {
    return 'ontouchstart' in self;
}
/**
 * 滚动范围
 */
const defaultScrollRange = [[null, null], [null, null]];
/**
 * 滚动方向
 */
const defaultScrollDirection = ScrollDirection.ALL;
/**
 * 背景格式
 */
const defaultBGPattern = BGPattern.GRID;
/**
 * 是否启用全览模式
 */
// const defaultEnableEagleEyeMode = false;
/**
 * 绘画模式 书写模式 绘画模式
 */
const defaultWriteModel = WriteModel.WRITE;
/**
 * 是否使用背景
 */
const defaultEnableBG = true;
/**
 * 棋盘格子的间距
 */
const defaultGridGap = 100;
/**
 * 田字格的尺寸
 */
const defaultGridPaperGap = 100;
/**
 * 四线格纵向空白
 */
const defaultQuadrillePaperVerticalMargin = 40;
/**
 * 四线格线的间距
 */
const defaultQuadrillePaperGap = 30;
/**
 * 棋盘格子的填充色
 */
const defaultGridFillStyle = 'rgb(250,250,250)';
/**
 * 田字格边框颜色
 */
const defaultGridPaperStrokeStyle = 'green';
/**
 * 四线格四条线的颜色
 */
const defaultQuadrillePaperStrokeStyles = ['rgba(0,0,255,.5)', 'rgba(255,0,0,.5)', 'rgba(0,0,255,1)', 'rgba(0,0,255,.5)'];
/**
 * 是否使用标尺
 */
const defaultRule = true;
/**
 * 标尺的间距
 */
const defaultRuleGap = 10;
/**
 * 标尺刻度的长度
 */
const defaultRuleUnitLen = 5;
/**
 * 标尺的颜色
 */
const defaultRuleStrokeStyle = 'rgba(0,0,0,0.5)';
/**
 * 笔尖的粗细
 */
const defaultVoice = 1;
/**
 * 墨水颜色
 */
const defaultColor = 'rgba(0,0,0,1)';
/**
 * 是否启用操作历史
 */
const defaultStack = false;
/**
 * 橡皮擦除的半径
 */
const defaultCleanR = 20;
/**
 * 滚动的时候执行的次数
 */
const defaultMoveCountTotal = 20;
/**
 * 是否锁定书写
 */
const defaultWriteLocked = false;
/**
 * 是否锁定拖拽
 */
const defaultDragLocked = false;
/**
 * 是否显示边框
 */
const defaultShowBorder = true;
/**
 * 边框的颜色
 */
const defaultBorderStyle = '#333';
/**
 * 边框的宽度
 */
const defaultBorderWidth = 0;
/**
 * 是否使用尺子等工具
 */
const defaultUseShapeType = false;
/**
 * hash 组件的hash
 */
const defaultHash = '';
const defaultOptions = {
    scrollRange: defaultScrollRange,
    scrollDirection: defaultScrollDirection,
    bgPattern: defaultBGPattern,
    writeModel: defaultWriteModel,
    enableBG: defaultEnableBG,
    gridGap: defaultGridGap,
    gridPaperGap: defaultGridPaperGap,
    quadrillePaperVerticalMargin: defaultQuadrillePaperVerticalMargin,
    quadrillePaperGap: defaultQuadrillePaperGap,
    gridFillStyle: defaultGridFillStyle,
    gridPaperStrokeStyle: defaultGridPaperStrokeStyle,
    quadrillePaperStrokeStyles: defaultQuadrillePaperStrokeStyles,
    rule: defaultRule,
    ruleGap: defaultRuleGap,
    ruleUnitLen: defaultRuleUnitLen,
    ruleStrokeStyle: defaultRuleStrokeStyle,
    voice: defaultVoice,
    color: defaultColor,
    stack: defaultStack,
    cleanR: defaultCleanR,
    moveCountTotal: defaultMoveCountTotal,
    writeLocked: defaultWriteLocked,
    dragLocked: defaultDragLocked,
    showBorder: defaultShowBorder,
    borderStyle: defaultBorderStyle,
    borderWidth: defaultBorderWidth,
    useShapeType: defaultUseShapeType,
    hash: defaultHash
};
class Board {
    container;
    width;
    height;
    worldOffsetX = 0;
    worldOffsetY = 0;
    scrolling = false;
    cleanState = false;
    cleanX;
    cleanY;
    cleanPress = false;
    stackObj;
    moveT = false;
    debounceBindOnChange;
    toolShape;
    activateToolShape = false;
    background;
    ruleAuxiliary;
    border;
    writing;
    eraser;
    eraserHasContent = false;
    brushDrawing;
    scrollRange;
    scrollDirection;
    bgPattern;
    writeModel;
    enableBG;
    gridGap;
    gridPaperGap;
    quadrillePaperVerticalMargin;
    quadrillePaperGap;
    gridFillStyle;
    gridPaperStrokeStyle;
    quadrillePaperStrokeStyles;
    rule;
    ruleGap;
    ruleUnitLen;
    ruleStrokeStyle;
    voice;
    color;
    cleanR;
    stack;
    moveCountTotal;
    writeLocked;
    dragLocked;
    showBorder;
    borderStyle;
    borderWidth;
    useShapeType;
    containerOffset;
    onChange;
    store = {};
    hash;
    justifyDus = [0, 45, 90, 135, 180, 225, 270, 315, 360];
    constructor(container, options = defaultOptions) {
        this.container = container;
        this.scrollRange = options.scrollRange ?? defaultScrollRange;
        this.scrollDirection = options.scrollDirection ?? defaultScrollDirection;
        this.bgPattern = options.bgPattern ?? defaultBGPattern;
        this.writeModel = options.writeModel ?? defaultWriteModel;
        this.enableBG = options.enableBG ?? defaultEnableBG;
        this.gridGap = options.gridGap ?? defaultGridGap;
        this.gridPaperGap = options.gridPaperGap ?? defaultGridPaperGap;
        this.quadrillePaperVerticalMargin = options.quadrillePaperVerticalMargin ?? defaultQuadrillePaperVerticalMargin;
        this.quadrillePaperGap = options.quadrillePaperGap ?? defaultQuadrillePaperGap;
        this.gridFillStyle = options.gridFillStyle ?? defaultGridFillStyle;
        this.gridPaperStrokeStyle = options.gridPaperStrokeStyle ?? defaultGridPaperStrokeStyle;
        this.quadrillePaperStrokeStyles = options.quadrillePaperStrokeStyles ?? defaultQuadrillePaperStrokeStyles;
        this.rule = options.rule ?? defaultRule;
        this.ruleGap = options.ruleGap ?? defaultRuleGap;
        this.ruleUnitLen = options.ruleUnitLen ?? defaultRuleUnitLen;
        this.ruleStrokeStyle = options.ruleStrokeStyle ?? defaultRuleStrokeStyle;
        this.voice = options.voice ?? defaultVoice;
        this.color = options.color ?? defaultColor;
        this.stack = options.stack ?? defaultStack;
        this.cleanR = options.cleanR ?? defaultCleanR;
        this.moveCountTotal = options.moveCountTotal ?? defaultMoveCountTotal;
        this.writeLocked = options.writeLocked ?? defaultWriteLocked;
        this.dragLocked = options.dragLocked ?? defaultDragLocked;
        this.showBorder = options.showBorder ?? defaultShowBorder;
        this.borderStyle = options.borderStyle ?? defaultBorderStyle;
        this.borderWidth = options.borderWidth ?? defaultBorderWidth;
        this.useShapeType = options.useShapeType ?? defaultUseShapeType;
        this.hash = options.hash ?? defaultHash;
        this.containerOffset = options.containerOffset ?? (() => {
            const scrollingElement = document.scrollingElement;
            const rect = this.container.getBoundingClientRect();
            return {
                x: rect.x + scrollingElement.scrollLeft,
                y: rect.y + scrollingElement.scrollTop
            };
        });
        this.onChange = options.onChange;
        this.debounceBindOnChange = debounce(this.triggerOnChange, 500);
        this.loadEvent();
        if (this.stack) {
            const container = this.container;
            const rect = container.getBoundingClientRect();
            const width = Math.floor(rect.width);
            const height = Math.floor(rect.height);
            this.stackObj = new Stack(width, height, this.hash);
            this.stackObj.restoreState = (preStore) => {
                const storeLen = preStore.length;
                const lastStoreItem = preStore[storeLen - 1];
                const prevWorldOffsetX = this.worldOffsetX;
                const prevWorldOffsetY = this.worldOffsetY;
                const targetWorldOffsetX = lastStoreItem.worldOffsetX;
                const targetWorldOffsetY = lastStoreItem.worldOffsetY;
                const offsetX = targetWorldOffsetX - prevWorldOffsetX;
                const offsetY = targetWorldOffsetY - prevWorldOffsetY;
                if (!offsetX && !offsetY) {
                    this.worldOffsetX = lastStoreItem.worldOffsetX;
                    this.worldOffsetY = lastStoreItem.worldOffsetY;
                    this.preStore = preStore;
                    this.writing.store = preStore;
                    this.draw();
                }
                else {
                    const preOffsetX = offsetX / this.moveCountTotal;
                    const preOffsetY = offsetY / this.moveCountTotal;
                    this.writing.store = preStore;
                    this.moveT = true;
                    this.doMove(preOffsetX, preOffsetY);
                }
            };
        }
        this.resize();
    }
    set preStore(preStore) {
        const store = this.store;
        const hash = this.hash;
        if (!store[hash]) {
            store[hash] = [];
        }
        store[hash] = preStore;
    }
    get preStore() {
        const store = this.store;
        const hash = this.hash;
        if (!store[hash]) {
            store[hash] = [];
        }
        return store[hash];
    }
    updateWorldOffset(deltaX, deltaY) {
        this.worldOffsetX += deltaX;
        this.worldOffsetY += deltaY;
    }
    updateHash(hash) {
        this.hash = hash;
        this.stack && this.stackObj.updateHash(hash);
        this.writing.store = this.preStore;
        this.writing.refresh(this.worldOffsetX, this.worldOffsetY);
    }
    resize() {
        const container = this.container;
        const rect = container.getBoundingClientRect();
        this.width = Math.floor(rect.width);
        this.height = Math.floor(rect.height);
        if (this.enableBG) {
            if (!this.background) {
                this.background = new Background(this.width, this.height, this.gridGap, this.gridFillStyle, this.gridPaperGap, this.gridPaperStrokeStyle, this.quadrillePaperVerticalMargin, this.quadrillePaperGap, this.quadrillePaperStrokeStyles);
                this.container.append(this.background.canvas);
            }
            else {
                this.background.resize(this.width, this.height);
            }
        }
        if (this.rule) {
            if (!this.ruleAuxiliary) {
                this.ruleAuxiliary = new RuleAuxiliary(this.width, this.height, this.ruleStrokeStyle, this.ruleGap, this.ruleUnitLen);
                this.container.append(this.ruleAuxiliary.canvas);
            }
            else {
                this.ruleAuxiliary.resize(this.width, this.height);
            }
        }
        if (!this.writing) {
            this.writing = new Writing(this.width, this.height, this.preStore);
            this.container.append(this.writing.canvas);
        }
        else {
            this.writing.resize(this.width, this.height);
        }
        if (this.useShapeType) {
            if (!this.toolShape) {
                this.toolShape = new ToolShape(this.width, this.height, this.voice, container, this.getPageCoords);
                this.container.append(this.toolShape.canvas);
            }
            else {
                this.toolShape.resize(this.width, this.height);
            }
        }
        if (!this.eraser) {
            this.eraser = new Eraser$1(this.width, this.height);
            this.container.append(this.eraser.canvas);
        }
        else {
            this.eraser.resize(this.width, this.height);
        }
        this.brushDrawing = new Eraser(this.width, this.height, this.voice, this.writing);
        if (this.stack) {
            this.stackObj.width = this.width;
            this.stackObj.height = this.height;
        }
        this.draw();
    }
    setVoice(voice = 1) {
        this.voice = voice;
        this.brushDrawing.voice = voice;
        this.brushDrawing.d = voice;
    }
    showBG() {
        this.enableBG = true;
        this.draw();
    }
    hideBG() {
        this.enableBG = false;
        this.draw();
    }
    showRule() {
        this.rule = true;
        this.draw();
    }
    hideRule() {
        this.rule = false;
        this.draw();
    }
    showToolShape() {
        this.useShapeType = true;
        this.drawToolShape();
    }
    hideToolShape() {
        this.useShapeType = false;
        this.drawToolShape();
    }
    setToolShapeType(shapeType) {
        this.toolShape.toolShapeType = shapeType;
        this.drawToolShape();
    }
    adjustOffset() {
        const [[minX, maxX], [minY, maxY]] = this.scrollRange;
        if (typeof minX === 'number') {
            this.worldOffsetX = Math.max(minX, this.worldOffsetX);
        }
        if (typeof maxX === 'number') {
            this.worldOffsetX = Math.min(maxX, this.worldOffsetX);
        }
        if (typeof minY === 'number') {
            this.worldOffsetY = Math.max(minY, this.worldOffsetY);
        }
        if (typeof maxY === 'number') {
            this.worldOffsetY = Math.min(maxY, this.worldOffsetY);
        }
        this.worldOffsetX = Math.round(this.worldOffsetX);
        this.worldOffsetY = Math.round(this.worldOffsetY);
    }
    doMove(preOffsetX, preOffsetY, i = 0) {
        if (this.scrollDirection === ScrollDirection.ALL) {
            this.worldOffsetX += preOffsetX;
            this.worldOffsetY += preOffsetY;
        }
        else if (this.scrollDirection === ScrollDirection.X) {
            this.worldOffsetX += preOffsetX;
        }
        else if (this.scrollDirection === ScrollDirection.Y) {
            this.worldOffsetY += preOffsetY;
        }
        this.adjustOffset();
        this.draw();
        self.requestAnimationFrame(() => {
            if (this.moveT && i < this.moveCountTotal) {
                this.doMove(preOffsetX, preOffsetY, ++i);
            }
            else {
                this.moveT = false;
            }
        });
    }
    scrollBy(x = 0, y = 0) {
        if (!this.dragLocked) {
            const preOffsetX = x / this.moveCountTotal;
            const preOffsetY = y / this.moveCountTotal;
            this.moveT = true;
            this.doMove(preOffsetX, preOffsetY);
        }
    }
    clear() {
        this.worldOffsetX = 0;
        this.worldOffsetY = 0;
        this.writing.clear();
        this.draw();
        this.stack && this.stackObj.saveState([...this.writing.store]);
    }
    triggerOnChange() {
        window.requestIdleCallback(() => {
            if (this.onChange) {
                const canvas = this.exportAsCanvas();
                this.onChange(canvas);
            }
        });
    }
    exportAsCanvas() {
        return this.writing.getWholeCanvas();
    }
    exportAsPaperCanvas() {
        const imageCanvas = this.writing.getPaperCanvas();
        const canvas = document.createElement('canvas');
        canvas.width = imageCanvas.width;
        canvas.height = imageCanvas.height;
        const ctx = canvas.getContext('2d');
        if (this.enableBG) {
            this.loadBackground(ctx);
        }
        ctx.drawImage(imageCanvas, 0, 0);
        return canvas;
    }
    undo() {
        this.stack && this.stackObj.undo();
    }
    redo() {
        this.stack && this.stackObj.redo();
    }
    clean() {
        this.cleanState = true;
    }
    unclean() {
        this.cleanState = false;
    }
    draw(showDu = false, duCx = 0, duCy = 0) {
        if (this.enableBG) {
            this.loadBackground();
        }
        if (this.rule) {
            this.loadRule();
        }
        this.writing.refresh(this.worldOffsetX, this.worldOffsetY);
        this.drawEraser();
        if (this.useShapeType) {
            this.drawToolShape(showDu, duCx, duCy);
        }
        this.debounceBindOnChange();
    }
    doPushPoints(x, y, event) {
        if (event.pointerType === 'pen') ;
        this.brushDrawing.pushPoints({ x, y, pressure: event.pressure, pointerType: event.pointerType });
    }
    loadEvent() {
        let hasWrited = false;
        let isDoubleTouch = false;
        let isToolShapeDoubleTouch = false;
        let isToolShapeSingleTouch = false;
        let rotationCenter;
        let turnStartAngle = 0;
        let dragStartX = 0;
        let dragStartY = 0;
        let dragEndX = 0;
        let dragEndY = 0;
        let isSingleTouch = false;
        const handleWriteStart = (coords, event) => {
            const x = coords.pageX;
            const y = coords.pageY;
            this.brushDrawing.reset(this.color);
            hasWrited = false;
            let conformingToDistance = false;
            if (this.useShapeType) {
                const distanceAndPoint = this.toolShape.getNearestDistanceAndPoint(coords.pageX, coords.pageY, this.voice, this.color);
                conformingToDistance = distanceAndPoint.conformingToDistance;
            }
            if (!this.cleanState && conformingToDistance) {
                this.activateToolShape = true;
            }
            else {
                if (!this.cleanState && this.useShapeType && this.toolShape.isPointInPath(coords.pageX, coords.pageY, 'evenodd')) {
                    isSingleTouch = false;
                }
                else if (!this.cleanState) {
                    this.brushDrawing.setPrev(x, y, event.pressure);
                }
                this.activateToolShape = false;
            }
            if (this.cleanState) {
                this.cleanX = x;
                this.cleanY = y;
                this.cleanPress = true;
                this.drawEraser();
            }
        };
        const handleTouchStart = (event) => {
            this.moveT = false;
            this.scrolling = false;
            const touches = event.touches;
            const coords = this.getPageCoords(touches);
            let isPointInPath = false;
            dragEndX = coords.pageX;
            dragEndY = coords.pageY;
            if (touches.length === 2) {
                isDoubleTouch = true;
                isSingleTouch = false;
                if (this.dragLocked) {
                    return;
                }
                performance.now();
                if (this.cleanState) {
                    this.cleanPress = false;
                    this.draw();
                }
                if (this.useShapeType && this.toolShape.isPointInPath(coords.pageX, coords.pageY, 'nonzero')) {
                    isPointInPath = true;
                }
                if (isPointInPath) {
                    isToolShapeDoubleTouch = true;
                    isToolShapeSingleTouch = false;
                    rotationCenter = { x: coords.pageX, y: coords.pageY };
                    turnStartAngle = Math.atan2(touches[1].pageY - touches[0].pageY, touches[1].pageX - touches[0].pageX) / Math.PI * 180;
                    if (turnStartAngle < 0) {
                        turnStartAngle += 360;
                    }
                }
                else {
                    isToolShapeDoubleTouch = false;
                }
            }
            else if (touches.length === 1 && !this.writeLocked) {
                if (this.useShapeType && this.toolShape.isPointInPath(coords.pageX, coords.pageY, 'evenodd')) {
                    isPointInPath = true;
                }
                if (isPointInPath) {
                    isToolShapeDoubleTouch = false;
                    isToolShapeSingleTouch = true;
                }
                else {
                    isToolShapeSingleTouch = false;
                }
                isSingleTouch = true;
            }
            else {
                isSingleTouch = false;
            }
        };
        const handlePointerdown = (event) => {
            isSingleTouch = true;
            event.preventDefault();
            if (!this.writeLocked) {
                setTimeout(() => {
                    if (isSingleTouch) {
                        const { pageX, pageY } = event;
                        const coords = this.getPageCoords([{ pageX, pageY }]);
                        handleWriteStart(coords, event);
                    }
                });
            }
        };
        const doInsertPointByToolShape = (gatherAreasObj) => {
            this.writing.singlePointsWriting(gatherAreasObj);
        };
        const handleWriteMove = (coords, event) => {
            const x = coords.pageX;
            const y = coords.pageY;
            hasWrited = true;
            if (this.cleanState) {
                this.doClean(this.cleanX, this.cleanY, x, y);
                this.cleanX = x;
                this.cleanY = y;
                this.drawEraser();
            }
            else {
                if (this.useShapeType && this.activateToolShape) {
                    const lineWidth = this.voice;
                    const { gatherAreasObj } = this.toolShape.getNearestDistanceAndPoint(coords.pageX, coords.pageY, lineWidth, this.color);
                    doInsertPointByToolShape(gatherAreasObj);
                }
                else {
                    this.doPushPoints(x, y, event);
                }
            }
        };
        const handlePointermove = (event) => {
            setTimeout(() => {
                if (isSingleTouch) {
                    if (!this.useShapeType || !isToolShapeSingleTouch) {
                        const { pageX, pageY } = event;
                        const coords = this.getPageCoords([{ pageX, pageY }]);
                        handleWriteMove(coords, event);
                    }
                }
            });
        };
        const handleTouchMove = (event) => {
            const touches = event.touches;
            if (isDoubleTouch) {
                if (this.dragLocked) {
                    return;
                }
                dragStartX = dragEndX;
                dragStartY = dragEndY;
                const coords = this.getPageCoords(touches);
                dragEndX = coords.pageX;
                dragEndY = coords.pageY;
                performance.now();
                if (this.useShapeType && isToolShapeDoubleTouch) {
                    if (event.touches.length === 2) {
                        let { angle } = getTripleTouchAngleAndCenter(event);
                        if (angle < 0) {
                            angle += 360;
                        }
                        let deltaAngle = angle - turnStartAngle;
                        turnStartAngle = angle;
                        const [newX, newY] = rotateCoordinate(rotationCenter.x, rotationCenter.y, deltaAngle, this.toolShape.toolShapeCenterX, this.toolShape.toolShapeCenterY);
                        this.toolShape.toolShapeCenterX = newX;
                        this.toolShape.toolShapeCenterY = newY;
                        this.toolShape.angle += deltaAngle;
                        this.draw(true, rotationCenter.x, rotationCenter.y);
                    }
                }
                else {
                    let deltaX = 0;
                    let deltaY = 0;
                    if (this.scrollDirection === ScrollDirection.ALL) {
                        deltaX = dragEndX - dragStartX;
                        deltaY = dragEndY - dragStartY;
                    }
                    else if (this.scrollDirection === ScrollDirection.X) {
                        deltaX = dragEndX - dragStartX;
                    }
                    else if (this.scrollDirection === ScrollDirection.Y) {
                        deltaY = dragEndY - dragStartY;
                    }
                    this.worldOffsetX -= deltaX;
                    this.worldOffsetY -= deltaY;
                    this.adjustOffset();
                    this.draw();
                }
            }
            else if (this.useShapeType && isToolShapeSingleTouch) {
                dragStartX = dragEndX;
                dragStartY = dragEndY;
                const coords = this.getPageCoords(touches);
                dragEndX = coords.pageX;
                dragEndY = coords.pageY;
                const deltaX = dragEndX - dragStartX;
                const deltaY = dragEndY - dragStartY;
                this.toolShape.toolShapeCenterX += deltaX;
                this.toolShape.toolShapeCenterY += deltaY;
                this.draw();
            }
        };
        const handleWriteEnd = (coords) => {
            if (isDoubleTouch) {
                if (this.dragLocked) {
                    return;
                }
                if (this.scrollDirection === ScrollDirection.ALL) ;
                else if (this.scrollDirection === ScrollDirection.X) ;
                else if (this.scrollDirection === ScrollDirection.Y) ;
                // if (!isToolShapeDoubleTouch && !isToolShapeSingleTouch) {
                //   scrollDecay(speedX, speedY);
                // }
            }
            if (this.useShapeType && isToolShapeDoubleTouch) {
                let angle = this.toolShape.angle;
                angle = (Math.floor(angle) % 360 + 360) % 360;
                let needJustify = false;
                for (let i = 0; i < this.justifyDus.length; i++) {
                    const justifyDu = this.justifyDus[i];
                    if (Math.abs(justifyDu - angle) < 15) {
                        turnStartAngle = justifyDu;
                        needJustify = true;
                        break;
                    }
                }
                if (needJustify) {
                    let deltaAngle = turnStartAngle - angle;
                    const [newX, newY] = rotateCoordinate(rotationCenter.x, rotationCenter.y, deltaAngle, this.toolShape.toolShapeCenterX, this.toolShape.toolShapeCenterY);
                    this.toolShape.toolShapeCenterX = newX;
                    this.toolShape.toolShapeCenterY = newY;
                    this.toolShape.angle += deltaAngle;
                    this.draw(true, rotationCenter.x, rotationCenter.y);
                    setTimeout(() => {
                        this.draw();
                    }, 500);
                }
                else {
                    setTimeout(() => {
                        this.draw();
                    }, 500);
                }
            }
        };
        const handleTouchEnd = (event) => {
            const touches = event.changedTouches;
            this.getPageCoords(touches);
            handleWriteEnd();
        };
        const handlePointerup = (event) => {
            this.brushDrawing.submit();
            if (isSingleTouch) {
                if (!this.cleanState || this.eraserHasContent) {
                    this.eraserHasContent = false;
                    this.writing.pushImageData(this.worldOffsetX, this.worldOffsetY);
                    if (this.stack && hasWrited) {
                        this.stackObj.saveState(this.writing.store);
                    }
                }
            }
            if (this.cleanState) {
                this.cleanPress = false;
                this.draw();
            }
            isDoubleTouch = false;
            isSingleTouch = false;
            if (this.useShapeType) {
                this.toolShape.prevPoint = null;
            }
        };
        const container = this.container;
        if (isTouchDevice()) {
            container.addEventListener("touchstart", handleTouchStart, { passive: true });
            container.addEventListener("touchmove", handleTouchMove, { passive: true });
            container.addEventListener("touchend", handleTouchEnd, { passive: true });
        }
        container.addEventListener("pointerdown", handlePointerdown);
        self.addEventListener("pointermove", handlePointermove);
        self.addEventListener("pointerup", handlePointerup);
    }
    getPageCoords = (touches) => {
        const { x: containerX, y: containerY } = this.containerOffset();
        const length = touches.length;
        let totalX = 0;
        let totalY = 0;
        for (let i = 0; i < length; i++) {
            const touch = touches[i];
            totalX += touch.pageX - containerX;
            totalY += touch.pageY - containerY;
        }
        totalX /= length;
        totalY /= length;
        return { pageX: totalX, pageY: totalY };
    };
    drawEraser() {
        if (this.cleanState && this.cleanPress) {
            this.eraser.draw(this.cleanX, this.cleanY, this.cleanR);
        }
        this.eraser.canvas.style.opacity = (this.cleanState && this.cleanPress) ? '1' : '0';
    }
    doClean(x1, y1, x2, y2) {
        const hasContent = this.writing.doClean(x1, y1, x2, y2, this.cleanR, true);
        if (hasContent) {
            this.eraserHasContent = true;
        }
    }
    loadBackground(ctx = null) {
        let coordX = 0;
        let coordY = 0;
        let background;
        if (!ctx) {
            const offsetX = negativeRemainder(this.worldOffsetX, this.gridGap * 2);
            const offsetY = negativeRemainder(this.worldOffsetY, this.gridGap * 2);
            coordX = -offsetX;
            coordY = -offsetY;
            background = this.background;
        }
        else {
            const canvas = ctx.canvas;
            const { width, height } = canvas;
            background = new Background(width, height, this.gridGap, this.gridFillStyle, this.gridPaperGap, this.gridPaperStrokeStyle, this.quadrillePaperVerticalMargin, this.quadrillePaperGap, this.quadrillePaperStrokeStyles);
        }
        if (this.enableBG) {
            background.draw(coordX, coordY, this.bgPattern);
            if (ctx) {
                ctx.drawImage(background.canvas, 0, 0);
            }
        }
        background.canvas.style.opacity = this.enableBG ? '1' : '0';
    }
    loadRule() {
        if (this.rule) {
            this.ruleAuxiliary.draw(this.worldOffsetX, this.worldOffsetY);
        }
        this.ruleAuxiliary.canvas.style.opacity = this.rule ? '1' : '0';
    }
    drawToolShape(showDu = false, duCx = 0, duCy = 0) {
        this.toolShape.canvas.style.opacity = this.useShapeType ? '1' : '0';
        if (this.useShapeType) {
            this.toolShape.draw(showDu, duCx, duCy);
        }
    }
}

export { BGPattern, Board, ScrollDirection, ShapeType, WriteModel, Board as default };
//# sourceMappingURL=index.esm.js.map