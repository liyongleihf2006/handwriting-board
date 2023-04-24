'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

class Stack {
    undoStack = [];
    redoStack = [];
    restoreState = () => undefined;
    saveState(state) {
        this.undoStack.push(deepCopy(state));
        this.redoStack.length = 0;
    }
    undo() {
        if (this.undoStack.length > 0) {
            const lastState = this.undoStack.pop();
            this.redoStack.push(lastState);
            const previousState = this.undoStack[this.undoStack.length - 1] || { worldOffsetX: 0, worldOffsetY: 0, pointGroup: [] };
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
    doRestoreState(state) {
        this.restoreState(deepCopy(state));
    }
}
function deepCopy(obj, hash = new WeakMap()) {
    if (Object(obj) !== obj) { // primitive types
        return obj;
    }
    if (hash.has(obj)) { // handle circular reference
        return hash.get(obj);
    }
    const result = Array.isArray(obj) ? [] : {};
    hash.set(obj, result); // add to the hash
    Object.keys(obj).forEach(key => {
        if (obj[key] && typeof obj[key] === 'object') {
            result[key] = deepCopy(obj[key], hash); // recursively copy nested objects
        }
        else {
            result[key] = obj[key];
        }
    });
    return result;
}

function isTouchDevice() {
    return 'ontouchstart' in self;
}
/**
 * 是否使用棋盘
 */
const defaultGrid = true;
/**
 * 棋盘格子的间距
 */
const defaultGridGap = 100;
/**
 * 棋盘格子的填充色
 */
const defaultGridFillStyle = 'rgb(250,250,250)';
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
const defaultColor = 'rgb(0,0,0)';
/**
 * 是否启用操作历史
 */
const defaultStack = true;
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
const defaultBorderWidth = 2;
const defaultOptions = {
    grid: defaultGrid,
    gridGap: defaultGridGap,
    gridFillStyle: defaultGridFillStyle,
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
    borderWidth: defaultBorderWidth
};
class Board {
    canvas;
    width;
    height;
    ctx;
    worldOffsetX = 0;
    worldOffsetY = 0;
    scrolling = false;
    d = 1;
    maxD = 2;
    pointsGroup = [];
    cleanState = false;
    cleanX;
    cleanY;
    cleanPress = false;
    stackObj;
    minX;
    minY;
    maxX;
    maxY;
    moveT = false;
    grid;
    gridGap;
    gridPattern;
    gridFillStyle;
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
    containerOffset;
    constructor(canvas, options = defaultOptions) {
        this.canvas = canvas;
        this.grid = options.grid ?? defaultGrid;
        this.gridGap = options.gridGap ?? defaultGridGap;
        this.gridFillStyle = options.gridFillStyle ?? defaultGridFillStyle;
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
        this.containerOffset = options.containerOffset ?? (() => {
            const scrollingElement = document.scrollingElement;
            const rect = this.canvas.getBoundingClientRect();
            return {
                x: rect.x + scrollingElement.scrollLeft,
                y: rect.y + scrollingElement.scrollTop
            };
        });
        if (this.stack) {
            this.stackObj = new Stack();
            this.stackObj.restoreState = (state) => {
                const prevWorldOffsetX = this.worldOffsetX;
                const prevWorldOffsetY = this.worldOffsetY;
                const targetWorldOffsetX = state.worldOffsetX;
                const targetWorldOffsetY = state.worldOffsetY;
                const offsetX = targetWorldOffsetX - prevWorldOffsetX;
                const offsetY = targetWorldOffsetY - prevWorldOffsetY;
                if (!offsetX && !offsetY) {
                    this.worldOffsetX = state.worldOffsetX;
                    this.worldOffsetY = state.worldOffsetY;
                    this.pointsGroup = state.pointGroup;
                    this.draw();
                }
                else {
                    const preOffsetX = offsetX / this.moveCountTotal;
                    const preOffsetY = offsetY / this.moveCountTotal;
                    this.pointsGroup = state.pointGroup;
                    this.moveT = true;
                    this.doMove(preOffsetX, preOffsetY);
                }
            };
        }
        const rect = canvas.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        canvas.width = this.width;
        canvas.height = this.height;
        this.ctx = this.canvas.getContext('2d');
        this.gridPattern = this.generateGridPattern();
        this.loadEvent();
        this.draw();
    }
    setVoice(voice = 1) {
        this.voice = voice;
        this.d = voice;
        this.maxD = voice * 2;
    }
    showGrid() {
        this.grid = true;
        this.draw();
    }
    hideGrid() {
        this.grid = false;
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
    doMove(preOffsetX, preOffsetY, i = 0) {
        this.worldOffsetX += preOffsetX;
        this.worldOffsetY += preOffsetY;
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
        this.pointsGroup = [];
        this.draw();
        this.stackObj.saveState({
            worldOffsetX: this.worldOffsetX,
            worldOffsetY: this.worldOffsetY,
            pointGroup: this.pointsGroup
        });
    }
    exportAsCanvas() {
        const canvas = document.createElement('canvas');
        if (this.minX !== undefined) {
            canvas.width = this.maxX - this.minX;
            canvas.height = this.maxY - this.minY;
            const ctx = canvas.getContext('2d');
            this.pointsGroup?.forEach(({ corners, fillStyle }) => {
                corners.forEach(([[wx11, wy11], [wx12, wy12], [wx21, wy21], [wx22, wy22]]) => {
                    const x11 = wx11 - this.minX;
                    const y11 = wy11 - this.minY;
                    const x12 = wx12 - this.minX;
                    const y12 = wy12 - this.minY;
                    const x21 = wx21 - this.minX;
                    const y21 = wy21 - this.minY;
                    const x22 = wx22 - this.minX;
                    const y22 = wy22 - this.minY;
                    ctx.save();
                    ctx.fillStyle = fillStyle;
                    ctx.beginPath();
                    ctx.moveTo(x11, y11);
                    ctx.lineTo(x12, y12);
                    ctx.lineTo(x22, y22);
                    ctx.lineTo(x21, y21);
                    ctx.fill();
                    ctx.restore();
                });
            });
        }
        else {
            canvas.width = 0;
            canvas.height = 0;
        }
        return canvas;
    }
    undo() {
        this.stackObj.undo();
    }
    redo() {
        this.stackObj.redo();
    }
    clean() {
        this.cleanState = true;
    }
    unclean() {
        this.cleanState = false;
    }
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.loadGrid();
        this.doWriting();
        this.drawEraser();
        this.loadRule();
        this.loadBorder();
    }
    loadEvent() {
        let hasWrited = false;
        let isDoubleTouch = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let dragStartTime = 0;
        let dragEndX = 0;
        let dragEndY = 0;
        let dragEndTime = 0;
        let needPushPoints = false;
        let isSingleTouch = false;
        let writeStartX = 0;
        let writeStartY = 0;
        let writeStartTime = 0;
        let writeEndX = 0;
        let writeEndY = 0;
        let writeEndTime = 0;
        const handleWriteStart = (coords) => {
            hasWrited = false;
            isSingleTouch = true;
            needPushPoints = true;
            writeEndX = coords.pageX;
            writeEndY = coords.pageY;
            writeEndTime = performance.now();
            if (this.cleanState) {
                this.cleanX = writeEndX;
                this.cleanY = writeEndY;
                this.cleanPress = true;
                this.draw();
            }
        };
        const handleTouchStart = (event) => {
            this.moveT = false;
            this.scrolling = false;
            const touches = event.touches;
            if (touches.length === 2) {
                isDoubleTouch = true;
                if (this.dragLocked) {
                    return;
                }
                const coords = getPageCoords(touches);
                dragEndX = coords.pageX;
                dragEndY = coords.pageY;
                dragEndTime = performance.now();
                if (this.cleanState) {
                    this.cleanPress = false;
                    this.draw();
                }
            }
            else if (touches.length === 1) {
                if (!this.writeLocked) {
                    const coords = getPageCoords(touches);
                    handleWriteStart(coords);
                }
            }
        };
        const handleMouseStart = (event) => {
            if (!this.writeLocked) {
                const { pageX, pageY } = event;
                const coords = getPageCoords([{ pageX, pageY }]);
                handleWriteStart(coords);
            }
        };
        const handleWriteMove = (coords) => {
            hasWrited = true;
            writeStartX = writeEndX;
            writeStartY = writeEndY;
            writeStartTime = writeEndTime;
            writeEndX = coords.pageX;
            writeEndY = coords.pageY;
            writeEndTime = performance.now();
            if (this.cleanState) {
                this.cleanX = writeEndX;
                this.cleanY = writeEndY;
                this.doClean(writeEndX, writeEndY);
            }
            else {
                if (needPushPoints) {
                    this.pointsGroup.push({
                        corners: [],
                        fillStyle: this.color
                    });
                    needPushPoints = false;
                }
                this.pushPoints(writeStartX, writeStartY, writeEndX, writeEndY, writeStartTime, writeEndTime);
            }
            this.draw();
        };
        const handleMouseMove = (event) => {
            if (isSingleTouch) {
                const { pageX, pageY } = event;
                const coords = getPageCoords([{ pageX, pageY }]);
                handleWriteMove(coords);
            }
        };
        const handleTouchMove = (event) => {
            const touches = event.touches;
            if (isDoubleTouch) {
                if (this.dragLocked) {
                    return;
                }
                dragStartX = dragEndX;
                dragStartY = dragEndY;
                dragStartTime = dragEndTime;
                const coords = getPageCoords(touches);
                dragEndX = coords.pageX;
                dragEndY = coords.pageY;
                dragEndTime = performance.now();
                const deltaX = dragEndX - dragStartX;
                const deltaY = dragEndY - dragStartY;
                this.worldOffsetX -= deltaX;
                this.worldOffsetY -= deltaY;
                this.draw();
            }
            else if (isSingleTouch) {
                const coords = getPageCoords(touches);
                handleWriteMove(coords);
            }
        };
        const scrollDecay = (speedX, speedY) => {
            this.scrolling = true;
            const minSpeed = 0.1;
            let t = 0;
            const _scrollDecay = (speedX, speedY) => {
                if (Math.abs(speedX) > minSpeed || Math.abs(speedY) > minSpeed) {
                    this.worldOffsetX -= speedX;
                    this.worldOffsetY -= speedY;
                    this.draw();
                    const ratio = Math.max((99 - 0.01 * t++), 50) / 100;
                    speedX = ratio * speedX;
                    speedY = ratio * speedY;
                    self.requestAnimationFrame(() => {
                        if (this.scrolling) {
                            _scrollDecay(speedX, speedY);
                        }
                    });
                }
                else {
                    this.scrolling = false;
                }
            };
            _scrollDecay(speedX, speedY);
        };
        const handleWriteEnd = () => {
            if (isDoubleTouch) {
                if (this.dragLocked) {
                    return;
                }
                const deltaX = dragEndX - dragStartX;
                const deltaY = dragEndY - dragStartY;
                const deltaTime = dragEndTime - dragStartTime;
                const speedX = deltaX / deltaTime;
                const speedY = deltaY / deltaTime;
                scrollDecay(speedX, speedY);
            }
            else if (isSingleTouch) {
                if (this.stack && hasWrited) {
                    this.stackObj.saveState({
                        worldOffsetX: this.worldOffsetX,
                        worldOffsetY: this.worldOffsetY,
                        pointGroup: this.pointsGroup
                    });
                }
            }
            if (this.cleanState) {
                this.cleanPress = false;
                this.draw();
            }
            isDoubleTouch = false;
            isSingleTouch = false;
        };
        const canvas = this.canvas;
        if (isTouchDevice()) {
            canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
            canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
            canvas.addEventListener("touchend", handleWriteEnd, { passive: true });
        }
        else {
            canvas.addEventListener("mousedown", handleMouseStart, { passive: true });
            self.addEventListener("mousemove", handleMouseMove, { passive: true });
            self.addEventListener("mouseup", handleWriteEnd, { passive: true });
        }
        const getPageCoords = (touches) => {
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
    }
    drawEraser() {
        if (this.cleanState && this.cleanPress) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.fillStyle = 'rgba(0,0,0,.1)';
            this.ctx.strokeStyle = 'rgba(0,0,0,.15)';
            this.ctx.arc(this.cleanX, this.cleanY, this.cleanR, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.restore();
            this.ctx.beginPath();
        }
    }
    doClean(writeEndX, writeEndY) {
        const x0 = writeEndX + this.worldOffsetX;
        const y0 = writeEndY + this.worldOffsetY;
        this.pointsGroup.forEach(group => {
            const corners = group.corners;
            for (let i = corners.length - 1; i >= 0; i--) {
                const [[x1, y1], [x2, y2], [x4, y4], [x3, y3]] = corners[i];
                if (this.isCircleIntersectRect(x0, y0, this.cleanR, x1, y1, x2, y2, x3, y3, x4, y4)) {
                    corners.splice(i, 1);
                }
            }
        });
    }
    isCircleIntersectRect(x0, y0, r, x1, y1, x2, y2, x3, y3, x4, y4) {
        // 检查圆心是否在矩形内部
        if (x0 >= x1 && x0 <= x3 && y0 >= y1 && y0 <= y3) {
            return true;
        }
        // 检查矩形的四条边是否与圆相交
        const dist = (x, y) => Math.sqrt((x - x0) ** 2 + (y - y0) ** 2);
        const edges = [
            [x1, y1, x2, y2],
            [x2, y2, x4, y4],
            [x4, y4, x3, y3],
            [x3, y3, x1, y1]
        ];
        for (let i = 0; i < edges.length; i++) {
            const [ex1, ey1, ex2, ey2] = edges[i];
            const d1 = dist(ex1, ey1);
            const d2 = dist(ex2, ey2);
            if (d1 <= r || d2 <= r) {
                return true;
            }
            const dx = ex2 - ex1;
            const dy = ey2 - ey1;
            const t = ((x0 - ex1) * dx + (y0 - ey1) * dy) / (dx ** 2 + dy ** 2);
            if (t < 0 || t > 1) {
                continue;
            }
            const cx = ex1 + t * dx;
            const cy = ey1 + t * dy;
            const dt = dist(cx, cy);
            if (dt <= r) {
                return true;
            }
        }
        return false;
    }
    getCornerCoordinate(a, b, c, d, x, y) {
        return [
            [x - b * d / Math.sqrt(a ** 2 + b ** 2), y + a * d / Math.sqrt(a ** 2 + b ** 2)],
            [x + b * d / Math.sqrt(a ** 2 + b ** 2), y - a * d / Math.sqrt(a ** 2 + b ** 2)]
        ];
    }
    getCornersCoordinate(x1, y1, x2, y2, d) {
        const a = x2 - x1;
        const b = y2 - y1;
        const c = a * x1 + b * y1 + d * Math.sqrt(a ** 2 + b ** 2);
        const [[x11, y11], [x12, y12]] = this.getCornerCoordinate(a, b, c, d, x1, y1);
        const [[x21, y21], [x22, y22]] = this.getCornerCoordinate(a, b, c, d, x2, y2);
        return [[x11, y11], [x12, y12], [x21, y21], [x22, y22]];
    }
    pushPoints(writeStartX, writeStartY, writeEndX, writeEndY, writeStartTime, writeEndTime) {
        const x1 = writeStartX + this.worldOffsetX;
        const y1 = writeStartY + this.worldOffsetY;
        const x2 = writeEndX + this.worldOffsetX;
        const y2 = writeEndY + this.worldOffsetY;
        const distance = ((y2 - y1) ** 2 + (x2 - x1) ** 2) ** 0.5;
        const originD = (writeEndTime - writeStartTime) / distance * this.voice;
        if (!isNaN(originD)) {
            if (originD > this.d * 1.2) {
                this.d *= 1.2;
            }
            else if (originD < this.d / 1.2) {
                this.d /= 1.2;
            }
            else {
                this.d = originD;
            }
            if (this.d > this.maxD) {
                this.d = this.maxD;
            }
            const points = this.getCornersCoordinate(x1, y1, x2, y2, this.d);
            const hasNaN = points.flat().some(xy => {
                return isNaN(xy);
            });
            if (!hasNaN) {
                const corners = this.pointsGroup[this.pointsGroup.length - 1].corners;
                if (corners.length) {
                    const lastPoints = corners[corners.length - 1];
                    points[0] = lastPoints[2];
                    points[1] = lastPoints[3];
                }
                corners.push(points);
            }
        }
    }
    doWriting() {
        this.pointsGroup.forEach(({ corners, fillStyle }, idx) => {
            this.ctx.save();
            this.ctx.fillStyle = fillStyle;
            this.ctx.beginPath();
            corners.forEach(([[wx11, wy11], [wx12, wy12], [wx21, wy21], [wx22, wy22]], i) => {
                const x11 = wx11 - this.worldOffsetX;
                const y11 = wy11 - this.worldOffsetY;
                const x12 = wx12 - this.worldOffsetX;
                const y12 = wy12 - this.worldOffsetY;
                const x21 = wx21 - this.worldOffsetX;
                const y21 = wy21 - this.worldOffsetY;
                const x22 = wx22 - this.worldOffsetX;
                const y22 = wy22 - this.worldOffsetY;
                this.ctx.moveTo(x11, y11);
                this.ctx.lineTo(x12, y12);
                this.ctx.lineTo(x22, y22);
                this.ctx.lineTo(x21, y21);
                if (!idx && !i) {
                    this.minX = Math.min(wx11, wx12, wx21, wx22);
                    this.minY = Math.min(wy11, wy12, wy21, wy22);
                    this.maxX = Math.max(wx11, wx12, wx21, wx22);
                    this.maxY = Math.max(wy11, wy12, wy21, wy22);
                }
                else {
                    this.minX = Math.min(this.minX, wx11, wx12, wx21, wx22);
                    this.minY = Math.min(this.minY, wy11, wy12, wy21, wy22);
                    this.maxX = Math.max(this.maxX, wx11, wx12, wx21, wx22);
                    this.maxY = Math.max(this.maxY, wy11, wy12, wy21, wy22);
                }
            });
            this.ctx.fill();
            this.ctx.restore();
        });
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
    loadGrid() {
        if (this.grid) {
            const offsetX = this.negativeRemainder(this.worldOffsetX, this.gridGap * 2);
            const offsetY = this.negativeRemainder(this.worldOffsetY, this.gridGap * 2);
            const coordX = -offsetX;
            const coordY = -offsetY;
            const ctx = this.ctx;
            ctx.save();
            ctx.translate(coordX, coordY);
            ctx.fillStyle = this.gridPattern;
            ctx.fillRect(0, 0, this.width + this.gridGap * 2, this.height + this.gridGap * 2);
            ctx.restore();
        }
    }
    negativeRemainder(a, b) {
        return ((a % b) + b) % b;
    }
    loadBorder() {
        if (this.showBorder) {
            const ctx = this.ctx;
            ctx.beginPath();
            ctx.save();
            ctx.strokeStyle = this.borderStyle;
            ctx.lineWidth = this.borderWidth;
            ctx.strokeRect(0, 0, this.width, this.height);
            ctx.restore();
        }
    }
    loadRule() {
        if (this.rule) {
            const ctx = this.ctx;
            ctx.beginPath();
            ctx.save();
            ctx.strokeStyle = this.ruleStrokeStyle;
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = this.ruleStrokeStyle;
            const offsetX = this.negativeRemainder(this.worldOffsetX, (this.ruleGap * 10));
            const offsetY = this.negativeRemainder(this.worldOffsetY, (this.ruleGap * 10));
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
            ctx.restore();
        }
    }
}

exports.Board = Board;
exports.default = Board;
//# sourceMappingURL=index.cjs.js.map
