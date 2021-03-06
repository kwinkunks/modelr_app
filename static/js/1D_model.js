
setup1D = function(
  rock_div,
  rocks, fluids, rock_colour_map, max_depth,
  rock_menu_div,plot_div, ref_menu_div, 
  seismic_menu_div, server){

  var rock_title = "Rock core";
  var fluid_title = "Fluid core";

  
  // total canvas dimensions
  var width = 900;
  var height = 600;
  // Make height and width scales for convenient placement
  var heightScale = d3.scale.linear()
      .range([0, height])
      .domain([0,1]);
  var widthScale = d3.scale.linear()
      .range([0, width])
      .domain([0,1]);
 
  // Rock core
  var core_width = widthScale(0.15);
  var core_height = heightScale(0.8);
  var core_x = widthScale(0);
  var core_y = heightScale(0.1);

  var axisPlot = g3.plot('.plot')
    .height(core_height)
    .width(5)
    .yTitle("depth [m]")
    .y2Orient("left")
    .toggleYAxis(false)
    .toggleXAxis(false)
    .y2Domain([0, 1000])
    .margin(core_y,30,30,widthScale(.18))
    .draw();

  var canvas = d3.select(axisPlot.svg().node().parentNode);
  var core_group = canvas.append("g")
    .attr("transform", "translate(" + core_x.toString() +"," + core_y.toString()+ ")");

  var rock_core = new FluidSub(
    core_group, core_width, 
    core_height, rocks, fluids,
    rock_colour_map,rock_colour_map,
    rock_menu_div, onchange=update_data);

  var offset = 10;

  // set slider behaviour
  $("#frequency").on("input change", function(){
    $("#frequency-label").text($("#frequency").val().toString() + " Hz");
  });
  var frequency = $("#frequency").val();


  var seismic = {
    frequency: frequency,
    wavelet: "ricker",
    theta: [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30],
    dt: 0.001
  };
  
  var earth_model = rock_core.intervals();
  var vpPlot, tPlot, rhoPlot, vPPlot, VPPlot, vpLog, vsLog, rhoLog, zPLog, vpSubLog, SynthLog;

  $.ajax(server + "/data.json?type=seismic&script=fluid_sub.py",
     {type: "GET", data: {payload: JSON.stringify({seismic: seismic, earth_model: earth_model})},
      success: function success(data){
        console.log(data);
        var width = 120;
        //Create VP Plot
        vpPlot = g3.plot('.plot')
          .xTicks(4)
          .height(core_height)
          .width(width)
          .xTitle("Vp")
          .xTickFormat(function(d){
            return d / 1000;
          })
          .y2TickFormat("")
          .x2TickFormat("")
          .yTickFormat("")
          .margin(core_y,10,30,10)
          .yDomain(data["z_lim"])
          .xDomain(data["vp_lim"])
          .draw();

        // Creat VPsub Log
        vpSubLog = g3.log(vpPlot, data["vp_sub"])
          .color("red")
          .draw();

        // Create VP Log 
        vpLog = g3.log(vpPlot, data["vp"])
        .color("black")
        .draw();

        // Create VS Plot
        vsPlot = g3.plot('.plot')
          .xTicks(4)
          .height(core_height)
          .width(width)
          .xTitle("Vs")
          .xTickFormat(function(d){
            return d / 1000;
          })
          .y2TickFormat("")
          .x2TickFormat("")
          .yTickFormat("")
          .margin(core_y,10,30,10)
          .yDomain(data["z_lim"])
          .xDomain(data["vs_lim"])
          .draw();

        // Create VS Sub Log
        vsSubLog = g3.log(vsPlot, data["vs_sub"])
          .color("blue")
          .duration(500)
          .draw();

        // Create VS Log
        vsLog = g3.log(vsPlot, data["vs"])
          .color("black")
          .duration(500)
          .draw();

        // Create Rho Plot
        rhoPlot = g3.plot('.plot')
          .xTicks(4)
          .height(core_height)
          .width(width)
          .margin(core_y,10,30,10)
          .xTitle("\u03C1")
          .xTickFormat(function(d){
            return d / 1000;
          })
          .y2TickFormat("")
          .x2TickFormat("")
          .yTickFormat("")
          .yDomain(data["z_lim"])
          .xDomain(data["rho_lim"])
          .draw();

        // Create Rho Sub
        rhoSubLog = g3.log(rhoPlot, data["rho_sub"])
          .color("green")
          .duration(500)
          .draw();

        // Create Rho Log
        rhoLog = g3.log(rhoPlot, data["rho"])
          .color("black")
          .duration(500)
          .draw();

        // Create T Plot
        tPlot = g3.plot('.plot')
          .margin(core_y,30,30,30)
          .height(core_height)
          .width(5)
          .yTitle("time [s]")
          .yTickFormat("")
          .toggleYAxis(false)
          .toggleY2Axis(true)
          .y2Domain(data["t_lim"])
          .draw();

        // Create Zp Plot
        zPPlot = g3.plot('.plot')
          .xTicks(3)
          .height(core_height)
          .margin(core_y,10,30,10)
          .width(width)
          .xTitle("Zp")
          .y2TickFormat("")
          .x2TickFormat("")
          .yTickFormat("")
          .xDomain(data["rpp_lim"])
          .yDomain(data["t_lim"])
          .draw();

        // Create Zp Sub
        zPSubLog = g3.log(zPPlot, data["rpp_sub"])
          .yMult(data["dt"])
          .color("orange")
          .duration(500)
          .draw();

        // Create Zp Log
        zPLog = g3.log(zPPlot, data["rpp"])
          .yMult(data["dt"])
          .color("black")
          .duration(500)
          .draw();

        // Create Synth Plot
        var synthLim = [d3.min(data["theta"]) - 10, d3.max(data["theta"]) + 10];
        var sub = 0;
        var synthPlot = g3.plot('.plot')
          .xTicks(3)
          .height(core_height)
          .margin(core_y,10,30,10)
          .width(width)
          .xTitle("F\u2080 synthetic")
          .y2TickFormat("")
          .x2TickFormat("")
          .yTickFormat("")
          .xDomain(synthLim)
          .yDomain(data["t_lim"])
          .draw();

        // Create Synth Sub Plot
        var synthSubPlot = g3.plot('.plot')
          .xTicks(3)
          .height(core_height)
          .margin(core_y,10,30,10)
          .width(width)
          .xTitle("Fs synthetic")
          .y2TickFormat("")
          .x2TickFormat("")
          .yTickFormat("")
          .xDomain(synthLim)
          .yDomain(data["t_lim"])
          .draw();

        // Create Synth Sub Log
        synthSubLog = g3.wiggle(synthSubPlot, data["synth_sub"])
          .yMult(data["dt"])
          .xTrans(0)
          .duration(500)
          .sampleRate(3)
          .xMult(50)
          .draw();

        // Create Synth Log
        synthLog = g3.wiggle(synthPlot, data["synth"])
          .yMult(data["dt"])
          .xTrans(0)
          .duration(500)
          .sampleRate(3)
          .xMult(50)
          .draw();
      }
  });


    //update_data();

    function update_data(){
        var offset = 10;
        var frequency = $("#frequency").val();

        var seismic = {frequency: frequency,
                       wavelet: "ricker",
                       theta: [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30],
                       dt: 0.001};
        
        var earth_model = rock_core.intervals();

        $.ajax(server + "/data.json?type=seismic&script=fluid_sub.py",
          {type: "GET", data: {payload: JSON.stringify({seismic: seismic, earth_model: earth_model})},
          success: function success(data){

            vpPlot.reDraw(data["vp_lim"], data["z_lim"]);
            vpLog.reDraw(data["vp"]);
            vpSubLog.reDraw(data["vp_sub"]);
            
            vsPlot.reDraw(data["vs_lim"], data["z_lim"]);
            vsLog.reDraw(data["vs"]);
            vsSubLog.reDraw(data["vs_sub"]);
            
            rhoPlot.reDraw(data["rho_lim"], data["z_lim"]);
            rhoLog.reDraw(data["rho"]);
            rhoSubLog.reDraw(data["rho_sub"]);
            
            tPlot.reDraw(undefined, undefined, undefined, data["t_lim"]);
            
            zPPlot.reDraw(data["rpp_lim"], data["t_lim"]);
            zPLog.reDraw(data["rpp"]);
            zPSubLog.reDraw(data["rpp_sub"]);
            
            var delay=600;
            var synthLim = [d3.min(data["theta"]) - 10, d3.max(data["theta"]) + 10];
            // Put a delay on the more complex operation so it doesn't affect the animation too bad
            setTimeout(function(){
              synthLog.reDraw(data["synth"], synthLim, data["t_lim"]);
              synthSubLog.reDraw(data["synth_sub"], synthLim, data["t_lim"]);
            }, delay); 
          }
        }
      );
    }; // end of function update_data
};
