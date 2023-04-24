# handwriting-board
手写板,支持导出画布,移动端支持双指无限拖拽
1. 导出操作直接导出原生canvas,对于生成ObjectURL或者DataURL或者其他添加水印等等操作可以在导出canvas后,您自己对canvas进行处理
2. 导出的canvas的大小只包含绘画内容的范围,也就是无论画布拖拽的范围多么广大,但导出的时候只会导出从绘画的所有的图形的左上角到右下角的矩形区域

#### 在线实例

[sample](https://liyongleihf2006.github.io/handwriting-board/)

**安装**
```sh
npm install @liyongleihf2006/handwriting-board --save
```
**使用**
```html
<canvas id="containerRef"></canvas>
```
```javascript
import Board from 'handwriting-board'
const containerRef = document.querySelector('#containerRef');
const handwritingBoard = new Board(containerRef, {
  grid: true,
  gridGap: 100,
  gridFillStyle: 'rgb(250,250,250)',
  rule: true,
  ruleGap: 10,
  ruleUnitLen: 5,
  ruleStrokeStyle: 'rgba(0,0,0,0.5)',
  voice: 1,
  color: '#333',
  stack: true,
  cleanR: 20,
  moveCountTotal: 20,
  writeLocked: false,
  dragLocked: false,
  showBorder: true,
  borderStyle: '#333',
  borderWidth: 2
});
```
**参数说明**

名称 | 类型 | 默认值 | 参数说明
--  | --   | --    | --
grid| boolean|true|是否启用棋盘
gridGap|number|100|棋盘间距
gridFillStyle|string|'rgb(250,250,250)'|棋盘填充色
rule|boolean|true|是否启用标尺
ruleGap|number|10|标尺间距
ruleUnitLen|number|5|标尺刻度长度
ruleStrokeStyle|string|'rgba(0,0,0,0.5)'|标尺刻度颜色
voice|number|1|笔尖的粗细
color|string|'rgb(0,0,0)'|墨水的颜色
stack|boolean|true|是否启用操作历史,对于刻度,拖拽,棋盘操作无效
cleanR|number|20|橡皮擦半径
moveCountTotal|number|20|滚动行为执行的次数
writeLocked|boolean|false|是否锁定书写
dragLocked|boolean|false|是否锁定拖拽
showBorder|boolean|true|是否显示边框
borderStyle|string|'#333'|边框颜色
borderWidth|number|2|边框宽度
containerOffset|function|[默认位置函数](#containerOffset)|容器在页面中的位置

_注意_

1. 实例上面最好不要直接修改`grid` `rule`属性,因为这两个属性修改后需要重新渲染画布才能体现在视觉上
2. 实例上不要直接修改`voice`属性,因为笔尖粗细是一个循序渐进的过程,直接设置并不能立即生效
3. stack只能在初始化的时候配置,因为对于记录历史应该初始化时就决定了
4. 其他属性可以随时在实例上面进行修改

<a id="containerOffset"></a>
默认位置函数
```javascript
// dom元素的相对于文档的位置不好确定,情况比较复杂,所以获取画布的位置的工作交给每个使用者根据自己具体场景来获取了
// 为什么需要画布的位置呢? 因为画笔在绘画的时候需要通过鼠标/触摸来获取其在画布上面的位置,对于触摸事件来说尚不支持offsetY和offsetX这种获取其相对于画布自身的偏移位置,所以只能使用pageX和pageY来获取事件激活的相对于文档位置,而想要定位到画布上面的具体位置,就要使用其减去画布自身相对于文档的位置。
(()=>{
  const scrollingElement = document.scrollingElement as HTMLElement;
  const rect = this.canvas.getBoundingClientRect();
  return {
    x:rect.x + scrollingElement.scrollLeft,
    y:rect.y + scrollingElement.scrollTop
  }
});
```

**实例方法**

名称 | 参数 | 返回值 | 参数说明 | 方法说明
--  | --   | --    | -- | --
showGrid|-|void|-|显示棋盘
hideGrid|-|void|-|隐藏棋盘
showRule|-|void|-|显示刻度
hideRule|-|void|-|隐藏刻度
scrollBy |x:number,y:number|void|要滚动的偏移量|pc端上面画布偏移移动需要调用该方法,移动端直接双指滑动就可以了
clear|-|void|-|清空画布并返回初始坐标位置
clean|-|void|-|启用橡皮擦
unclean|-|void|-|关闭橡皮擦
undo|-|void|-|若是启用了stack,操作历史后退
redo|-|void|-|若是启用了stack,操作历史前进
exportAsCanvas|-|void|-|导出绘画的内容画布