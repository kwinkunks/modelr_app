function gatherPlot(svg_group, offset,height, key, label,seis_menu){



    $("#frequency").on("input", function (){
	$("#frequency-label").text($("#frequency").val() + " Hz")
    }
		      );


    var tScale = d3.scale.linear()
	.range([0, height]);

    var thetaAxisScale = d3.scale.linear()
	.range([0,90]).domain([0,30]);

    var thetaScale = d3.scale.linear()
	.range([0,10]);


    var plot = svg_group.append("g")
	.attr("transform", "translate("+offset.toString()+",0)");

    var thetaGroup = svg_group.append("g")
	.attr("transform",
	      "translate("+offset.toString() + ",500)");
    var thetaAxis = d3.svg.axis().scale(thetaAxisScale).orient("top")
	.ticks(4);

    thetaGroup.call(thetaAxis);

    thetaGroup.append("text")
	.attr("class", "y-label")
	.attr("y", 15)
	.text("\u03B8");
    
  


    // Axis labels
    plot.append("text")
	.attr("class", "y-label")
	.attr("text-anchor", "middle")
	.attr("y", -height*0.05)
	.attr("x", 40)
	.text(label);



    this.update_plot = function update_plot(data, theta_in,t){
	

	// Clear the plot
	plot.selectAll("path").remove();

	// Set the time and theta scales
	tScale.domain([t[0], t[t.length-1]]);
	thetaScale.domain(theta_in);


	for(var wiggle_hack=0;wiggle_hack<2;wiggle_hack++){
	    // Plot each trace in the data
	    for(var trace_ind=theta_in.length-1; trace_ind >-1;
		trace_ind--){

		var theta = theta_in[trace_ind];
		

		// Make a scale for the trace amplitude
		var ampScale = d3.scale.linear().domain([-1,1]);
		ampScale.range([thetaScale(theta)-50, 
				thetaScale(theta) + 50]);

		// Line drawing function
		var synthFill = d3.svg.area()
		    .x0(0)
		    .x1(function(d) {
			return ampScale(d[trace_ind+1]);
		    })
		    .y(function(d) {
			return tScale(d[0]);
		    });
		var lineFunc = d3.svg.line()
		    .x(function(d) {
			return ampScale(d[trace_ind +1]);
		    })
		    .y(function(d) {
			return tScale(d[0]);
		    });
		

		if(wiggle_hack == 0){
		    // Draw the trace
		    plot.append("path")
			.attr("class", 'wiggle-fill')
			.attr("d", lineFunc(data));
		    
		    /// Rather than slapping a rect on top
		    // I think it would be better to use a clipPath
		    plot.append("rect")
	    		.attr("x", thetaScale(theta)-20)
			.attr("y", tScale(0))
			.attr("width", 20)
			.attr("height", height)
			.attr("fill", 'white')
			.attr("stroke", 'white');
		}
		if(wiggle_hack == 1){
		    plot.append("path")
			.attr("class", 'wiggle-line')
			.attr("d", lineFunc(data));
		};
	    };

	};

    };




};
