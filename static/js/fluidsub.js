function FluidSub(image_div, image_height, image_width,
		  rocks, fluids, rock_cmap, fluid_cmap,
		  onchange){


    var max_depth = 10000.0;
    var total_depth = max_depth * .10;
    
    var plot_height = .9*image_height;
    var y_offset = .05 * image_height;

    var x_offset = .3 * image_width; // space for axis

    var intervals = [];
    
    var rock_width = .2 * image_width ;
    var fluid_width = .2 * image_width;

    // Make the y scales
    var scale = d3.scale.linear()
        .domain([0,total_depth]) 
        .range([y_offset, plot_height]);

    // For adjusting the maximum depth of the scale
    var max_scale = d3.scale.linear()
        .domain([0, max_depth])
        .range([y_offset, plot_height]);


    // Initialize the image canvas
    var canvas = d3.select(image_div)
	.append("svg")
	.attr("width", image_width)
	.attr("height", image_height);

    var drag = d3.behavior.drag().on("drag", dragResize)
	.on("dragend", onchange);

    var fluidtop_drag = d3.behavior.drag().on("drag", fluidDrag)
	.on("dragend", onchange);

    //------ Main canvas -------------------------//    
    canvas.append("text")
        .attr("class", "y-label")
        .attr("text-anchor", "end")
        .attr("y", .2*image_width)
        .attr("x", -50)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("depth [m]");

	


    // scaling circle
    var circle = canvas.append("g");
    

    //-------------------Rock Graphics-------------------

    // Make the rock element grouping
    var y_offset = y_offset;
    var rgroup = canvas.append("g")
	.attr("transform", "translate(" + 
	      x_offset.toString() + ",30)");

    // Title/plot label
    rgroup.append("text")
        .attr("class", "menu-label")
	.attr("style", "color:blue")
        .attr("text-anchor", "beginning")
        .attr("y", 0) 
        .attr("x", 40)
        .text("Rocks")
	.attr("cursor", "pointer");
    rgroup.append("text")
        .attr("class", "menu-label")
	.attr("style", "color:blue")
        .attr("text-anchor", "beginning")
        .attr("y", 0) 
        .attr("x", 90)
        .text("F0")
	.attr("cursor", "pointer");
    rgroup.append("text")
        .attr("class", "menu-label")
	.attr("style", "color:blue")
        .attr("text-anchor", "beginning")
        .attr("y", 0) 
        .attr("x", 110)
        .text("Fsub")
	.attr("cursor", "pointer");

    var yAxis = d3.svg.axis()
        .scale(scale)
        .orient("right")
        .ticks(5);
	rgroup.call(yAxis);

    // These groups are made in this order for specifically for 
    // layering order
    var rock_offset = .3 * image_width;
    var rock_intervals = rgroup.append("g")
	.attr("transform", "translate("+rock_offset.toString() +",0)");
    var rock_tops = rgroup.append("g")
	.attr("transform", "translate("+rock_offset.toString() +",0)"); 
  
    // Load up to intervals
    add_interval(0,0,total_depth);
    add_interval(1, total_depth/2,total_depth/2);

    // --------------- end of init --------------------------- //

    function add_interval(i, depth, thickness){
	// adds an interval with depth and thickness at the ith layer
	
	// Initialize with a rock
	var rock_ind = Math.floor(Math.random()*50.0) % rocks.length;
	
	var interval = {depth: depth,
			rock: rocks[rock_ind]};
	interval.colour = rock_cmap[interval.rock.name];

	// Check that thickness is defined
	if(typeof thickness !== 'undefined'){
            interval.thickness = thickness;
	};
	
	if(interval.rock.fluid != ""){
	    interval.fluid_colour = fluid_cmap[interval.rock.fluid];

	    var fluid_ind = i % fluids.length;
	    var subfluid = {depth: depth,
			      fluid: fluids[fluid_ind],
			      thickness: interval.thickness}
	    subfluid.colour = 
		fluid_cmap[subfluid.fluid.name];
	    interval.subfluids = [subfluid];
	} else{
	    interval.subfluids = [];
	};

	// Add to the interval data list
	intervals.splice(i+1,0, interval);
	
	// update the interval thickness
	calculate_thickness();
	
	// update the core plot
	draw();

    };

    function calculate_thickness(){
	// updates the thickness values in each layer

	// Depth of model
	var end_point = intervals[intervals.length-1].depth +
            intervals[intervals.length-1].thickness;

	// calculation thickness based on depths of tops
	for (var i=0; i<intervals.length-1; i++) {    
            intervals[i].thickness = 
		intervals[i+1].depth - intervals[i].depth;

	    if (intervals[i].subfluids.length > 0){

		for (var j=0; j< intervals[i].subfluids.length-1; j++){
		    intervals[i].subfluids[j].thickness = 
			intervals[i].subfluids[j+1].depth - 
			intervals[i].subfluids[j].depth;
		}

		intervals[i]
		    .subfluids[intervals[i]
			       .subfluids.length-1].thickness = 
		    intervals[i].depth + intervals[i].thickness -
		    intervals[i].subfluids[intervals[i].subfluids.length-1].depth;
	    };
	};
	
	// Update the last layer
	intervals[intervals.length-1].thickness = end_point - 
            intervals[intervals.length-1].depth;

	var last_interval = intervals[intervals.length-1]
	if (last_interval.subfluids.length > 0){
	    for( var j=0; j<last_interval.subfluids.length-1; j++){
		last_interval.subfluids[j].thickness = 
		    last_interval.subfluids[j+1].depth - 
		    last_interval.subfluids[j].depth;
	    };
	    last_interval
		.subfluids[last_interval.subfluids.length-1]
		.thickness = end_point - 
		last_interval
		.subfluids[last_interval.subfluids.length-1].depth;
		
	};

    };


    function draw(){
	// Updates the d3 associations and redraws the plot

	// -------------------- Rock Graphics --------------//

	var interval = rock_intervals.selectAll("g")
	    .data(intervals);

	// update the existing graphic blocks
	interval.selectAll("#rock")
	    .data(function(d)
		  {return([d])})
	    .attr("fill", function(d)
		  {return d.colour})
	    .attr("y", update_depth)
            .attr("height",update_thickness);

	var rock_fluid = interval.selectAll("#rock_fluid")
	    .data(function(d){
		if (d.rock.fluid){
		    return [d]} else return []})

	rock_fluid.attr("y", update_depth)
            .attr("fill", function(d)
		  {return d.fluid_colour})
            .attr("height",update_thickness);

	rock_fluid.enter().append("rect")
	    .attr("id","rock_fluid")
	    .attr("y", update_depth)
	    .attr("x", "45")
            .attr("width", "10")
            .attr("fill", function(d)
		  {return d.fluid_colour})
            .attr("height",update_thickness)

	rock_fluid.exit().remove()
	    
	var fluidsub = interval.selectAll("#subfluid")
	    .data(function(d){ if(d.subfluids){
		return d.subfluids} else{return []}})

	fluidsub.attr("fill", function(d)
		  {return d.colour})
	    .attr("y", update_depth)
            .attr("height",update_thickness);
	
	fluidsub.enter().append("rect")
	    .attr("id", "subfluid")
	    .attr("fill", function(d)
		  {return d.colour})
	    .attr("y", update_depth)
            .attr("height",update_thickness)
	    .attr("x", "60")
            .attr("width", "10")
            .attr("cursor","crosshair")
	    .on("click", add_fluidsub_top)
	    .on("contextmenu", delete_subfluid);


	
	fluidsub.exit().remove();

	// fluid sub tops
	var fluid_tops = interval.selectAll("#fluidtop")
	    .data(function(d)
		  {return d.subfluids.slice(1,d.subfluids.length)})
	fluid_tops.attr("y1", update_depth)
	    .attr("y2", update_depth);

	fluid_tops.enter()
	    .append("line")
	    .attr("x1",60).attr("x2", 70)
            .attr("y1", update_depth)
            .attr("y2", update_depth)
	    .attr("id", "fluidtop")
            .attr("cursor", "ns-resize")
	    .attr("style","stroke:rgb(0,0,0);stroke-width:2")
	    .call(fluidtop_drag);

	fluid_tops.exit().remove()


	// New Arrivals
	var new_interval = interval.enter().append("g");

	new_interval.append("rect")
            .attr("width", rock_width)
            .attr("cursor","crosshair")
	    .attr("id", "rock")
	    .attr("fill", function(d)
		  {return d.colour})
	    .attr("y", update_depth)
            .attr("height",update_thickness)
	    .on("click", add_top)
            .on("contextmenu", delete_interval);
	

	new_interval.selectAll("#rock_fluid")
	    .data(function(d){ if(d.rock.fluid){
		return [d]} else{return []}})
	    .enter().append("rect")
	    .attr("id", "rock_fluid")
	    .attr("y", update_depth)
            .attr("fill", function(d)
		  {return d.fluid_colour})
            .attr("height",update_thickness)
	    .attr("x", "45")
            .attr("width", "10")
	
	new_interval.selectAll("#subfluid")
	    .data(function(d){return d.subfluids})
	    .enter().append("rect")
	    .attr("id", "subfluid")
	    .attr("y", update_depth)
            .attr("fill", function(d)
		  {return d.colour})
            .attr("height",update_thickness)
	    .attr("x", "60")
            .attr("width", "10")
            .attr("cursor","crosshair")
	    .on("click", add_fluidsub_top)
	    .on("contextmenu", delete_subfluid);

	new_interval.selectAll("#fluidtop")
	    .data(function(d)
		  {return d.subfluids.slice(1,d.subfluids.length)})
	    .enter()
	    .append("line")
	    .attr("x1",60).attr("x2", 70)
            .attr("y1", update_depth)
            .attr("y2", update_depth)
	    .attr("id", "fluidtop")
            .attr("cursor", "ns-resize")
	    .attr("style","stroke:rgb(0,0,0);stroke-width:2")
	    .call(fluidtop_drag);


	interval.exit().remove();


	// Rock Tops
	var top = rock_tops.selectAll("line")
            .data(intervals.slice(1, intervals.length));
	
	// existing
	top.attr("y1", update_depth)
            .attr("y2",update_depth);
	
	//for the new elements
	top.enter()
            .append("line")
            .attr("x1", 0).attr("x2", rock_width + 30)
            .attr("y1", update_depth)
            .attr("y2", update_depth)
            .attr("style","stroke:rgb(0,0,0);stroke-width:2")
            .attr("cursor", "ns-resize")
	    .call(drag);
	
	top.exit().remove();

	interval.exit().remove()

    };

    // Functions for D3 callbacks
    function update_thickness(d){
	return scale(d.thickness) - y_offset;
    };

    function update_depth(d){
	return scale(d.depth);
    };

    function update_bottom(d) {
	return scale(d.depth + d.thickness);
    };


    function fluidDrag(d,i){
	
	var event = d3.event;
	var end_point = d.depth + d.thickness;

	d.depth = scale.invert(event.y);
	if(d.depth > end_point){
	    d.depth=end_point
	}

	var subfluids = this.parentNode.__data__.subfluids

	var start_point = subfluids[i].depth;
	if(d.depth < start_point){
	    d.depth = start_point;
	}
	if(i < subfluids.length-2){
	    subfluids[i+2].depth = end_point;
	} else{
	    d.thickness = end_point - d.depth;
	}

	calculate_thickness();
	draw();
    };

  // Resize call back
    function dragResize(d,i){
	var event = d3.event;

	var thickness0 = d.thickness;
	var end_point = d.depth + d.thickness;

	d.depth = scale.invert(event.y);
	if(d.depth >= end_point){
	    d.depth=end_point-1
	}
	var start_point = intervals[i].depth;
	if(d.depth <= start_point){
	    d.depth = start_point +1;
	}
	if(i < intervals.length-2){
	    intervals[i+2].depth = end_point;
	} else{
	    d.thickness = end_point - d.depth;
	}


	// current interval
	var squish = (end_point - d.depth)/thickness0;

	if(d.subfluids.length > 0){
	    d.subfluids[0].depth = d.depth;
	    rescale_subfluids(d, squish);
	};
	
	if(intervals[i].subfluids.length > 0){
	    squish = (d.depth -intervals[i].depth) / intervals[i].thickness;
	    rescale_subfluids(intervals[i], squish);
	};
	calculate_thickness();
	draw();

    } // end of dragResize


    function rescale_subfluids(interval, squish){

	if((interval.subfluids.length > 0)){

	    var upper_fluids = interval.subfluids;
	    upper_fluids[0].thickness = 
		upper_fluids[0].thickness * squish;

	    for(var j=1; j<upper_fluids.length; j++){
		upper_fluids[j].depth = upper_fluids[j-1].depth + 
		    upper_fluids[j-1].thickness;
		upper_fluids[j].thickness = 
		    upper_fluids[j].thickness * squish;
	    };
	};
    };

    function add_fluidsub_top(d,i){

	var bottom = d.depth + d.thickness;

	// update current fluid
	d.thickness = scale.invert(d3.mouse(this)[1]) - d.depth;
	
	// adda new fluid
	var depth = d.depth + d.thickness;
	var thickness = bottom - depth;

	var subfluids = this.parentNode.__data__.subfluids;
	var fluid_ind = i % fluids.length;
	var subfluid = {depth: depth,
			fluid: fluids[fluid_ind],
			thickness: thickness}
	subfluid.colour = 
		fluid_cmap[subfluid.fluid.name];
	
	subfluids.splice(i+1,0, subfluid);

	// redraw
	draw();

	onchange();
    };

   
    function add_top(d,i,j){
	/*
	  adds a top to the core at the ith interval
	  param d: core rock attached to the ith interval
	  param i: interval to place top
	*/

	var bottom = d.depth + d.thickness;
	thickness0 = d.thickness;
	d.thickness = scale.invert(d3.mouse(this)[1]) - d.depth;
	
	var depth = d.depth + d.thickness;
	var thickness = bottom - depth;

	var squish = (thickness0 - thickness) / thickness0;

	rescale_subfluids(d, squish);
	add_interval(i, depth, thickness);

	onchange();

    };

    function delete_interval(d,i){
	// deletes interval d from the ith layer
	
	d3.event.preventDefault();
	// always keep 2 layers
	if (intervals.length > 2 & (i > 0)) {
	    if (i == (intervals.length-1)) {
		var thickness0 = intervals[i-1].thickness;
		
		intervals[i-1].thickness = 
		    d.thickness + d.depth - intervals[i-1].depth;
		var squish = intervals[i-1].thickness/ thickness0;
		rescale_subfluids(intervals[i-1],squish);

	    } else{
		var thickness0 = intervals[i-1].thickness;
		var new_thickness = d.depth + d.thickness - 
		    intervals[i-1].depth;
		var squish = new_thickness / thickness0;

		rescale_subfluids(intervals[i-1], squish);
	    };
 
	    intervals.splice(i,1);
	    calculate_thickness();
	    draw();

	    onchange();
	} // end of outer if
    } // end of function delete_intercall

    function delete_subfluid(d,i){

	d3.event.preventDefault();
    
	// always keep one layer
	if(i > 0){
	
	    interval = this.parentNode.__data__
	    interval.subfluids.splice(i,1);
	    calculate_thickness();
	    draw();

	    onchange();
	};
    };

    return {intervals:intervals}
};

