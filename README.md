# 利用原生canvas绘制流程图

## FlowChart类
通过传入<canvas>元素Id，生成FlowChart实例，调用draw()方法可自动生成流程图。

**draw(flowData:[], nextSteps:[], isShowNextSteps:boolean)**

参数说明：
flowData:{object array} 流程步骤数据
字段如下：
```
{
 id: 1,   // {number} 步骤Id
 step:"", // {string} 步骤名称
 user:"", // {string} 用户
 isActive:false,   // {boolean} 是否用当前步骤
 lastStepIds:[1,3] // {array} 上一步骤id
}
```
nextSteps:{object array} 流程下一可选步骤
字段如下：
```
{
 id:9, // {number} 步骤Id
 step:"", // {string} 步骤名称
 user:"", // {string} 用户
}
```
isShowNextSteps:{boolean} 是否显示下一可选步骤

用法如下：
```
// 创建流程图实例
var flowChart = new FlowChart("myCanvas"/*canvas id*/);

// 传入流程数据
var flowData = [{
  id:2,
  step:"步骤2",
  user:"用户3,用户4",
  isActive:false,
  lastStepIds:[1]
 },{},...];
 
 // 画流程图
 flowChart.draw(flowData);
 ```
## 效果图如下
![](/img.png)