window.onload = function(){
	
	// 流程数据
	var flowData = [{
		id:1,
		step:"步骤步骤步骤步骤步骤步骤步骤1",
		user:"中文中文中文中文中文中文，中文中文中文中文，中文中文中文中文中文中文",
		isActive:false,
		lastStepIds:null
	},{
		id:2,
	    step:"步骤2",
		user:"用户3,用户4",
		isActive:false,
		lastStepIds:[1]
	},{
	    id:3,
	    step:"步骤3",
		user:"用户5,用户6",
		isActive:false,
		lastStepIds:[1]
	},{
        id:4,
        step:"步骤4",
		user:"用户7,用户8",
		isActive:false,
		lastStepIds:[1]
	},{
        id:5,
        step:"步骤5",
		user:"用户7,用户8",
		isActive:false,
		lastStepIds:[2,3]
	},{
        id:6,
        step:"步骤6",
		user:"用户7,用户8",
		isActive:false,
		lastStepIds:[5,4]
	},{
        id:7,
        step:"步骤7",
		user:"用户7,用户8",
		isActive:true,
		lastStepIds:[6]
	}];
    
    // 流程下一步可选步骤
	var nextSteps = [{
		id:8,
        step:"可选步骤8",
		user:"用户7,用户8"
	},{
		id:9,
        step:"可选步骤9",
		user:"用户7,用户8"
	},{
		id:10,
        step:"可选步骤10",
		user:"用户7,用户8"
	},{
		id:11,
        step:"可选步骤11",
		user:"用户7,用户8"
	}]

    // 创建流程图实例
    var flowChart = new FlowChart("myCanvas");
   
    // 画流程图
    // 传入流程数据，可选步骤
    flowChart.draw(flowData, nextSteps, true);
}

