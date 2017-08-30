/**
* 日期：2016-09-22
* 作者：HuangKun
* 描述：定义流程图绘制类
*/

var FlowChart = (function(){

	/**
	*  定义流程图绘制类属性
	*/
    function FlowChart(container){
        
        // Canvas元素
        this.canvas = document.getElementById(container);

        // 获取Canvas上下文
    	this.context = this.canvas.getContext("2d");
    	
    	// 是否支持Html5 Canvas
    	if(!this.context){
            alert("当前浏览器不支持HTML5 canvas，试试更换成Chrome,FireFox,IE9...");
            return;
    	}

        // 默认字体与大小
        //this.context.font = 
        // 画布padding值
        this.padding = 10;
    	// 默认起始坐标X
    	this.startX = this.padding;
    	// 默认起始坐标Y
    	this.startY = this.padding;

    	// 矩形宽度
    	this.rectWidth = 150;
    	// 矩形高度
    	this.rectHeight = 75;
    	// 矩形圆角半径
    	this.rectRadius = this.rectWidth/15;
        // 矩形Padding值
    	this.rectPadding = 20;
        // 矩形margin值
        this.rectMargin = 20;

    	// 当前步骤显示颜色
    	this.rectActiveColor = "rgba(255,128,0,0.5)";
    	// 非当前步骤显示颜色
    	this.rectColor = "rgba(208,208,208,0.5)";
        // 边框颜色
    	this.rectStrokeColor = "#666";
    	// 文字颜色
    	this.rectTextColor = "#666";
        
        // 悬浮框宽度
    	this.tipWidth = 150;
    	// 悬浮框高度
    	this.tipHeight = 60;
    	// 悬浮框底色
        this.tipBackground = "rgba(255, 193, 7, 0.8)";
        // 悬浮框边框颜色
        this.tipBorder = "1px solid #666";

    	// 边框宽度
    	this.lineWidth = 1;

    	// 箭尾横向长度
    	this.arrowLine = 50;
    	// 箭头长度
    	this.arrowHead = 10;
        // 箭头颜色
        this.arrowColor = "#666";
        
        // 流程步骤数据
        this.flowData = [];
        
        // 保存已绘制矩形中心坐标位置
        // 格式{步骤id:中心坐标}，如{1:{x:1,y:2}}
        this.rectCenters = {};

        // 保存悬浮框元素
        this.tip = null;
    }

    
    /**
    *  绘制流程图
    *  @method
    *  @param flowData  {Object} 流程步骤数据
    *  @param nextSteps {Object} 下一步流程可选步骤数据
    *  @param isShowNextSteps {boolean} 是否显示下一步可选步骤
    */
    FlowChart.prototype.draw = function(flowData, nextSteps, isShowNextSteps){
        // 流程步骤数据
        this.flowData = flowData;
        nextSteps = nextSteps || [];

    	// 建立二维数组，映射每一层需绘制的步骤id
    	// 如[[1],[2,3,4],[5,6],[7]]
    	var mapping = _getMappingData(flowData);
        
        // 获取纵向最大节点数
    	var maxLeafCount = _getMaxLenInArray(mapping);
    	maxLeafCount = (isShowNextSteps&&nextSteps&&nextSteps.length > maxLeafCount)
    					? nextSteps.length : maxLeafCount;

    	// 调整Canvas的宽度
        this.justifyCanvasSize(mapping.length, maxLeafCount);
    	
    	// 调整起始点
    	this.calcStartPosition(maxLeafCount);

        // 绘制已走过步骤
	    this.drawExistedSteps(mapping);

        // 画下一个可选步骤
	    if(isShowNextSteps && nextSteps && nextSteps.length>0){
    		this.drawNextSteps(nextSteps);
	    }

	    // 添加hover, click事件，显示步骤完整内容
	    this.addTipEvent();
    }
    
    /**
    *  调整Canvas大小
    *  @method
    *  @param countX {number} 横向最大节点数
    *  @param countY {number} 纵向最大节点数
    */    
    FlowChart.prototype.justifyCanvasSize = function(countX, countY){      
        // canvas 默认宽高
        var defWidth = this.canvas.width;
        var defHeight = this.canvas.height;

        var width = this.padding*2+countX*this.rectWidth+(countX-1)*this.arrowLine;
        var height = this.padding*2+countY*this.rectHeight+(countY-1)*this.rectMargin;

        // 设计高度需要预留向下偏移量
        height += this.rectHeight/2 + this.rectMargin;

        // 预留下一个可选步骤
        width += this.arrowLine+this.rectWidth;
        
        // 宽高大于默认高度时进行调整
        if(width > defWidth){
        	this.canvas.width = width;   
        }

        if(height > defHeight){
        	this.canvas.height = height;
        }       	
    }
       
    /**
    *  调整起始点位置
    *  @method
    *  @param count {number} 纵向最大节点数
    */ 
    FlowChart.prototype.calcStartPosition = function(count){
    	var height = this.padding*2+count*this.rectHeight+(count-1)*this.rectMargin;
    	this.startY = height/2 - this.rectHeight/2;
    }
   
    /**
    *  绘制已走过步骤
    *  @method
    *  @param mapping  {array}   每层节点步骤id映射
    *  @param flowData {object}  流程步骤数据
    */ 
    FlowChart.prototype.drawExistedSteps = function(mapping){

    	// 绘制起始点
    	var rootData = _getFlowDatumById(mapping[0][0], this.flowData);
    	this.drawStep(rootData);

    	// 存储箭头信息
    	var arrowInfo = [];
        
        // 按层次绘制步骤，从第二层开始
    	for(var i=1;i<mapping.length;i++){ 
            
            // 建立该层节点与其父节点的关系
            // {父节点步骤id:[子节点步骤id,...]}
            var nodeDict = _buildParentChildrenDict(mapping[i], this.flowData);
	        
	        for(var parentId in nodeDict){
	        	
	        	// 子节点即此层需绘制步骤
	        	var children = nodeDict[parentId];
	        	
	        	for(var t=0;t<children.length;t++){
	        		var childData = _getFlowDatumById(children[t], this.flowData);
	        		var point;
                    
                    // 计算该层节点位置
                    // 有多个父节点，子节点定位在所在父节点中心
                    // 其它情况，子节点围绕父节点上下发散
	                if(childData.lastStepIds && childData.lastStepIds.length > 1){
	                	point = this.calcStepPositionWithParents(childData.lastStepIds, childData.id);
	                }else{
		        		point = this.calcStepPositionWithChildren(parentId, t+1, children, mapping[i]); 
	        		}
                    
                    // 绘制步骤
	        		this.drawStep(childData, point);
                    
                    // 保存箭头起终映射
	        		arrowInfo.push({
	        			parentId: parentId, 
	        			childId: childData.id,
	        			childPoint:point
	        		});
	        	}
	        }
	    }
        
        //console.log("arrow info: " + JSON.stringify(arrowInfo));
        //console.log("existed recCenters: " + JSON.stringify(this.rectCenters));

	    // 绘制箭头
	    for(var i=0;i<arrowInfo.length; i++){
	    	var info = arrowInfo[i];
            this.drawArrow(info.parentId, info.childPoint);
        }
    }

    /**
    *  画下一个可选步骤
    *  @method
    *  @param nextSteps  {array}  可选步骤数据
    */ 
    FlowChart.prototype.drawNextSteps = function(nextSteps){   	
        var maxRectX = this.canvas.width - this.rectWidth - this.padding;        
        var start = {x:maxRectX};

        // 绘制隔离线
        var lineStart = {
        	x:maxRectX - this.arrowLine/2,
        	y:this.padding
        }

        var lineEnd = {
        	x:lineStart.x,
        	y:(this.startY-this.padding+this.rectHeight/2)*2 + this.rectHeight/2
        }

        this.drawLine(lineStart, lineEnd);
        
        var count = nextSteps.length;
        for(var i=0;i<count;i++){
        	var data = nextSteps[i];
            if(count%2 == 1){
	    		var isUp = i+1 <= parseInt(count/2)+1;
	    		start.y = this.startY + (i+1 - parseInt(count/2)-1)*(this.rectMargin+this.rectHeight*(isUp?1:0))
	    					+(isUp?-1:1)*this.rectHeight/2+this.rectHeight/2;
	    	}else{
	    		var isUp = i+1 <= count/2;
	    		start.y = this.startY + (i+1-(count/2+(isUp?0:1)))*(this.rectMargin+this.rectHeight)
	    					+(isUp?-1:0)*this.rectHeight+(isUp?-1:1)*this.rectMargin/2+this.rectHeight/2;
	    	}
            
            // 绘制步骤
	    	this.drawStep(data, start);
            
            // 添加数据
	    	this.flowData.push(data);
        }
    }
    
    /**
    *  绘制步骤矩形块
    *  @method
    *  @param data  {object}  当前步骤数据
    *  @param start {object}  矩形块左上顶点坐标，如{x:10, y:10}
    */ 
    FlowChart.prototype.drawStep = function(data, start){
        
        // 判断当前步骤是否已画过
        data = data || {};
        if(this.getRectCenterById(data.id)){
       	   return;
        }
        
        // 获得当前步骤位置
        var startX = start? start.x : this.startX;
        var startY = start? start.y : this.startY;
        
        // 绘制步骤图形
        this.context.strokeStyle = this.rectStrokeColor;
        this.context.lineWidth = this.lineWidth;

        // 显示流程步骤名称
        this.context.beginPath();
		this.context.moveTo(startX + this.rectRadius, startY);
		this.context.arcTo(startX+this.rectWidth, startY, startX+this.rectWidth, startY+this.rectHeight/2, this.rectRadius);
		this.context.lineTo(startX+this.rectWidth, startY+this.rectHeight/2);
		this.context.lineTo(startX, startY+this.rectHeight/2);
		this.context.arcTo(startX, startY, startX+this.rectWidth, startY, this.rectRadius);
        this.context.fillStyle = data.isActive ? this.rectActiveColor : this.rectColor;
        this.context.fill();
        this.context.strokeText(_hideText(data.step), startX + this.rectPadding, startY + this.rectPadding);
		this.context.stroke();
		this.context.closePath();

        // 显示流程处理人
		this.context.beginPath();
		this.context.moveTo(startX+this.rectWidth, startY+this.rectHeight/2);
		this.context.arcTo(startX+this.rectWidth, startY+this.rectHeight, startX, startY+this.rectHeight,this.rectRadius);
        this.context.arcTo(startX, startY+this.rectHeight, startX, startY+this.rectHeight/2, this.rectRadius);
		this.context.lineTo(startX, startY+this.rectHeight/2);
		this.context.fillStyle = this.rectTextColor;
		this.context.fillText(_hideText(data.user), startX + this.rectPadding, startY+this.rectHeight-this.rectPadding);
		this.context.stroke();
		this.context.closePath();
        
        // 保存已绘制步骤中心点
		var center = {x: startX+this.rectWidth/2, y:startY+this.rectHeight/2};
		this.rectCenters[data.id] = center;
    }
    
    /**
    *  计算子节点步骤左上顶点坐标，适用于多子节点
    *  @method
    *  @param parentId {string|number}  父节点步骤id
    *  @param index {number} 子节点序号
    *  @param childIds {array} 子节点id集合
    *  @param levelIds {array} 当前层所有节点id集合
    *  @return {x: 横坐标, y:纵坐标} 返回子节点步骤左上顶点坐标
    */ 
    FlowChart.prototype.calcStepPositionWithChildren = function(parentId, index, childIds, levelIds){
        
        // 父节点位置
    	var center = this.getRectCenterById(parentId);       
    	var position = {};

    	var id = childIds[index-1];
    	var count = childIds.length;
        
        // 当前步骤已存在，返回当前节点位置
        var current = this.getRectCenterById(id);
        if(current){
        	position.x = current.x - this.rectWidth/2;
        	position.y = current.y - this.rectHeight/2;

        	return position;
        }

    	if(center){
	    	position.x = center.x + this.rectWidth/2 + this.arrowLine;
            
	    	if(count%2 == 1){
	    		var isUp = index <= parseInt(count/2)+1;
	    		position.y = center.y+(index - parseInt(count/2)-1)*(this.rectMargin+this.rectHeight*(isUp?1:0))
	    					+(isUp?-1:1)*this.rectHeight/2;
	    	}else{
	    		var isUp = index <= count/2;
	    		position.y = center.y+(index-(count/2+(isUp?0:1)))*(this.rectMargin+this.rectHeight)
	    					+(isUp?-1:0)*this.rectHeight+(isUp?-1:1)*this.rectMargin/2;
	    	}
            
            // 计算当前节点是否与前一节点重叠
            // 传入position为节点左上顶点坐标
			var posCenter = {
				x:position.x + this.rectWidth/2,
				y:position.y + this.rectHeight/2
			}
            
            // 求取最大偏移距离
            var maxOverDistance = 0;
            for(var i=0;i<levelIds.length;i++){
	            var latest = this.getRectCenterById(levelIds[i]);
	            if(latest){
		            var distance = (latest.x - posCenter.x)*(latest.x - posCenter.x)
		            			+(latest.y - posCenter.y)*(latest.y - posCenter.y);			        
			        var overDistance = this.rectMargin + this.rectHeight - Math.sqrt(distance);	    	
                    if(overDistance > maxOverDistance){
                    	maxOverDistance = overDistance;
                    }
		    	}
	    	}
            
            // 向下偏移
		    if(maxOverDistance > 0) {	
	    		position.y += maxOverDistance;
	    	}
    	}

        return position;
    }

   
    /**
    *  计算子节点步骤左上顶点坐标，适用于多父节点
    *  @method
    *  @param parentIds {array}  父节点步骤id数组
    *  @param id {string|number} 子节点步骤id
    */ 
    FlowChart.prototype.calcStepPositionWithParents = function(parentIds, id){
    	var position = {};

    	// 当前步骤已存在，返回当前节点位置
        var current = this.getRectCenterById(id);
        if(current){
        	position.x = current.x - this.rectWidth/2;
        	position.y = current.y - this.rectHeight/2;

        	return position;
        }

    	// 父节点位置
    	var minY = 0;
    	var maxY = 0;
    	var maxX = 0;
    	for(var i=0;i<parentIds.length;i++){
    		var center = this.getRectCenterById(parentIds[i]);
    		if(center){
	            if(minY > center.y || minY == 0){
	            	minY = center.y;
	            }

	            if(maxY < center.y){
	            	maxY = center.y;
	            }

	            if(maxX < center.x){
	            	maxX = center.x;
	            }
            }
    	}

    	position.x = maxX + this.rectWidth/2 + this.arrowLine;
    	position.y = (minY+maxY)/2 - this.rectHeight/2;

    	return position;
    }
    
    /**
    *  绘制箭头
    *  @method
    *  @param parentId {string|number}  父节点步骤id
    *  @param end      {object}  子节点步骤左上顶点坐标, 如{x:19,y:8}
    */ 
    FlowChart.prototype.drawArrow = function(parentId, end){
        var center = this.getRectCenterById(parentId);
        if(center){
	        var start = {
	        	y:center.y
	        };

	        if(center.x <= end.x+this.rectWidth/2){
	        	start.x = center.x + this.rectWidth/2;
	        }else{
	        	start.x = center.x - this.rectWidth/2;
	        	end.x+=this.rectWidth;
	        }

	        end.y += this.rectHeight/2;
	         
	        var arrowLen = Math.sqrt((end.x-start.x)*(end.x-start.x)+(end.y-start.y)*(end.y-start.y));
	        var angle = end.x == start.x ? (Math.PI/2) 
	        			: Math.atan((end.y-start.y)/(end.x-start.x));

	        angle = (angle == 0 && center.x > end.x + this.rectWidth/2) ? Math.PI:angle;

	    	this.context.save();
	    	this.context.translate(start.x, start.y);
	        this.context.rotate(angle);
	        this.context.lineWidth = this.lineWidth;
	        this.context.strokeStyle = this.arrowColor;
	  		this.context.beginPath();

	  		// 绘制箭尾
			this.context.moveTo(0, 0);
			this.context.lineTo(arrowLen, 0);
	        
	        // 绘制箭头部分
			var upSpaceX, upSpaceY, downSpaceX, downSpaceY;

	    	upSpaceX = -this.arrowHead*Math.cos(30*Math.PI/180);
	    	downSpaceX = -this.arrowHead*Math.cos(30*Math.PI/180);
			upSpaceY = -this.arrowHead*Math.sin(30*Math.PI/180);
			downSpaceY = this.arrowHead*Math.sin(30*Math.PI/180);

	        this.context.lineTo(arrowLen + upSpaceX, upSpaceY);
	        this.context.moveTo(arrowLen, 0);
	        this.context.lineTo(arrowLen + downSpaceX,  downSpaceY);

			this.context.closePath();
			this.context.stroke();
			this.context.restore();
		}
    }

    /**
    *  绘制线段
    *  @method
    *  @param start {object}  起点坐标
    *  @param end   {object}  终点坐标，如{x:19,y:8}
    */ 
    FlowChart.prototype.drawLine = function(start, end){
    	this.context.lineWidth = this.lineWidth;
    	this.context.strokeStyle = this.arrowColor;

    	this.context.beginPath();
    	this.context.moveTo(start.x, start.y);
    	this.context.lineTo(end.x, end.y);
    	this.context.closePath();
		this.context.stroke();
    }

    /**
    *  通过步骤id取已绘制步骤中心坐标
    *  @method
    *  @param id {string|number} 步骤id
    *  @return {object|boolean}  如果不存在返回false, 存在返回中心点坐标
    */ 
	FlowChart.prototype.getRectCenterById = function(id){
		var result = false;
		for(var key in this.rectCenters){
			if(key == id){
				result = this.rectCenters[id];
				break;
			}
		}

		return result;
	}

    /**
    *  监听事件显示悬浮框
    *  @method
    */  
	FlowChart.prototype.addTipEvent = function(){
	    var that = this;       
        
        // hover事件
		this.canvas.addEventListener("mousemove", function(e) { 

			var e = window.event || e
	        var box = this.getBoundingClientRect();

	        //获取鼠标在canvas中的坐标
	        var mouse = {
	        	x: e.clientX - box.left,
	            y: e.clientY - box.top
	        }
	        
	        //console.log("mouse location: " + JSON.stringify(mouse));
	        var rect = that.getRectByMouse(mouse);
	        if(rect){
	        	var data = _getFlowDatumById(rect.id, that.flowData);
	        	var start = {};
	        	start.x = e.clientX + that.rectMargin;
	        	start.y = e.clientY - that.tipHeight/2;
	        	
	        	that.showTip(data, start);
	        }else{
	        	that.hideTip();
	        }
		});
	}
    
    /**
    *  判断mouse是否在矩形中。是则返回矩形中心位置
    *  @method
    *  @param point {object} mouse坐标
    */  
    FlowChart.prototype.getRectByMouse = function(point){
        var result = null;
    	
    	for(var id in this.rectCenters){
    		var center = this.rectCenters[id];
    		if(center){
	            var minX = center.x-this.rectWidth/2;
	            var maxX = center.x+this.rectWidth/2;
	            var minY = center.y-this.rectHeight/2;
	            var maxY = center.y+this.rectHeight/2;
                
                // 判断mouse是否在某一矩形内
	            if(point.x <= maxX && point.x >= minX && point.y<= maxY && point.y>= minY){
	            	result = {id: id, center:center};
	            	break;
	            }
            }
    	}

    	return result;
    }

    /**
    *  显示tip内容
    *  @method
    *  @param data  {object} 流程数据
    *  @param position {object} 相对位置 
    */ 
    FlowChart.prototype.showTip = function(data, position){
    	data = data || {};

    	if(this.tip){
    		this.tip.style.display = "block";
            this.tip.style.top = position.y + "px";
            this.tip.style.left = position.x + "px";
            this.tip.style.height = this.calTipHeight(data.step.length+data.user.length)+"px";
            this.tip.innerHTML = _getTipInnerHtml(data.step, data.user);
    	}else{
    	    this.createTip(data, position);
    	}
    }
   
    /**
    *  创建tip内容
    *  @method
    *  @param data  {object} 流程数据
    *  @param position {object} 相对位置 
    */ 
	FlowChart.prototype.createTip = function(data, position){
        // 创建tip层
		var tipElem = document.createElement("div");

		tipElem.style.background = this.tipBackground;
		//tipElem.style.border = this.tipBorder;
		tipElem.style.borderRadius = "4px";
		tipElem.style.width = this.tipWidth+"px";
		tipElem.style.height = this.calTipHeight(data.step.length+data.user.length)+"px";
		tipElem.style.position = "fixed";
		tipElem.style.top = position.y + "px";
		tipElem.style.left = position.x + "px";
		tipElem.style.zIndex = 2;
		tipElem.style.padding = this.padding+"px";
		tipElem.style.wordWrap = "break-word";
        tipElem.style.wordBreak = "normal";
        tipElem.style.whiteSpace = "normal";
		tipElem.innerHTML = _getTipInnerHtml(data.step, data.user);

		this.canvas.parentNode.appendChild(tipElem); 

		this.tip = tipElem;
	}

    /**
	* 计算tip框高度
	* @param count 标题长度
	*/
    FlowChart.prototype.calTipHeight = function(count){
    	if(count > 27){
    		return this.tipHeight/27 * count;
    	}

    	return this.tipHeight;
    }

    /**
    *  隐藏tip
    *  @method
    */ 
	FlowChart.prototype.hideTip = function(){
        if(this.tip){
        	this.tip.style.display = "none";
        }                
	}

    /**
    *  私有变量及方法
    */
    
    // 显示文字长度
    var _maxTextLen = 10;

    var _tipInnerHtml = '<strong>{title}</strong><br/>{content}';

	/**
	* 省略过长文字
	* @param text {string} 输入文字内容
	*/
	var _hideText = function(input){

		var output = input || ""; 

		if(input && input.length > _maxTextLen){

			output = input.substr(0, _maxTextLen-2) + '...'

		}

		return output;
	}
    
    /**
	* 建立二维数组，映射每一层需绘制的步骤id
	* @param flowData {object} 流程数据
	*/
	var _getMappingData = function(flowData){
		var mapping = [];
		for(var i=0;i<flowData.length;i++){
			var data = flowData[i];
			if(data.lastStepIds && data.lastStepIds.length>0){
				
				var maxParentLevel = 0;
				
				for(var j=0;j<data.lastStepIds.length;j++){
					var parentId = data.lastStepIds[j];
					var parentLevel = _getLevelInMapping(parentId, mapping);
					if(parentLevel > maxParentLevel){
						maxParentLevel = parentLevel;
					}
				}

				if(maxParentLevel >= 0){
					if(mapping[maxParentLevel+1]){
						mapping[maxParentLevel+1].push(data.id);
					}else{
						mapping[maxParentLevel+1] = [data.id];
					}
				}

			}else{
				// 起始点
				mapping[0] = [data.id];
			}
		}

		console.log("generate mapping: " + JSON.stringify(mapping));

		return mapping;
	}
    
    /**
	* 当前步骤id映射在哪一层
	* @param id {string|number} 步骤id
	* @param mapping {array}    映射数组
	*/
	var _getLevelInMapping = function(id, mapping){
		var level = -1;
		for(var i=0;i<mapping.length;i++){
			if(mapping[i] && mapping[i].length>0){
				for(var j=0;j<mapping[i].length;j++){
					if(id == mapping[i][j]){
						level = i;
						break;
					}
				}
			}
		}

		return level;
	}
    
    /**
	* 求取数组最大长度
	* @param array {array} 数组
	*/
	var _getMaxLenInArray = function (array){
	    var max = 0;
	    if(array && array.length > 0){
	    	for(var i=0;i<array.length;i++){
	    		var count = array[i].length;
	    		if(count > max){
	    			max = count;
	    		}
	    	}
	    }

	    return max;
	}
    
    /**
	* 通过id求取数组数据
	* @param id {string|number} id
	* @param array {array} 数组
	*/
	var _getFlowDatumById = function(id, array){
		var flowDatum = null;
		for(var i=0; i<array.length;i++){
			if(id == array[i].id){
				flowDatum = array[i];
				break;
			}
		}

		return flowDatum;
	}
    
    /**
	* 建立每一层节点与其父节点的关系
	* @param mappingLevel {array} 当前层id集合
	* @param flowData {object} 流程数据
	*/
	var _buildParentChildrenDict = function(mappingLevel, flowData){
    	
        // 父子节点的关系映射
    	var dict = {};   
    	
    	for(var j=0;j < mappingLevel.length;j++){
    	    var data = _getFlowDatumById(mappingLevel[j], flowData);

            for(var k=0;k < data.lastStepIds.length; k++){
            	var parentId = data.lastStepIds[k];

                if(dict[parentId]){
                	if(!_isInArray(data.id, dict[parentId])){
                        dict[parentId].push(data.id);
                    }  
                }else{
                	dict[parentId] = [data.id];
                }
            }
        }

        return dict;
    }
    
    /**
	* 判断数值是否在数组中
	* @param value {string|number} 数值
	* @param array {array} 数组
	*/
	var _isInArray = function(value, array){
		var result = false;
		if(array && array.length>0){
			for(var i=0;i<array.length;i++){
				if(value == array[i]){
					result = true;
					break;
				}
			}
		}

		return result;
	}
    
	
    /**
	* 获取tip元素内容
	* @param value {string|number} 数值
	* @param array {array} 数组
	*/
	var _getTipInnerHtml = function(title, content){

		var html = _tipInnerHtml.replace(/{title}/, title).replace(/{content}/,content);

		return html;
	}

	return FlowChart;

})();