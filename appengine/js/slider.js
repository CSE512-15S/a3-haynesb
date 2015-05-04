function BrushSlider (domain, interval, onInterval, onValueChanged) {
    "use strict";

    var margin = {top: 5, left: 120, right: 10, bottom: 5},
        height = 40  - margin.top  - margin.bottom,
        brush  = d3.svg.brush(),
        handle,
        value  = 0,
        playing = true;

    onInterval = onInterval || function() {};
    onValueChanged = onInterval || function() {};

    var scale = d3.scale.linear()
        .domain(domain || [-1, 1])
        .clamp(true);

    function slider(container) {
        scale.range([0, container.node().getBoundingClientRect().width - margin.left - margin.right]);
        renderControls(container);
        renderSlider(container);
    }

    function renderControls(container) {
        var controls = container.append('g')
                            .attr('class', 'controls')
                            .attr('transform', 'translate(25, 5)');

        var playButton = controls.append('g').attr('class', 'play');
        playButton.append('rect')
                  .attr("width", 30)
                  .attr("height", 30)
                  .attr("rx", 5)
                  .attr("ry", 5)
                  .attr('fill', '#eee')
                  .attr('stroke', '#000')
                  .attr('stroke-opacity', 0.3)
                  .attr('stroke-width', 3)
                  .on("click", play)
                  .on("mouseover", function() { d3.select('.play polygon').transition().attr('opacity', 0.6); })
                  .on("mouseout", function() { d3.select('.play polygon').transition().attr('opacity', 0.3); });
        playButton.append('polygon')
                  .attr('points', '0,0 0,20 20,10')
                  .attr('transform', 'translate(6, 5)')
                  .attr('opacity', 0.3)
                  .attr('fill', '#000')
                  .on("click", play)
                  .on("mouseover", function() { d3.select('.play polygon').transition().attr('opacity', 0.6); })
                  .on("mouseout", function() { d3.select('.play polygon').transition().attr('opacity', 0.3); });

        var pauseButton = controls.append('g').attr('class', 'pause').attr('transform', 'translate(40, 0)');
        pauseButton.append('rect')
                   .attr("width", 30)
                   .attr("height", 30)
                   .attr("rx", 5)
                   .attr("ry", 5)
                   .attr('fill', '#eee')
                   .attr('stroke', '#000')
                   .attr('stroke-opacity', 0.3)
                   .attr('stroke-width', 3)
                   .on("click", pause)
                   .on("mouseover", function() { d3.select('.pause path').transition().attr('opacity', 0.6); })
                   .on("mouseout", function() { d3.select('.pause path').transition().attr('opacity', 0.3); });
        pauseButton.append('path')
                .attr('d', 'M0,0 L0,20 L5,20 L5,0 L0,0 M10,0 L10,20 L15,20 L15,0, L10,0')
                .attr('transform', 'translate(7, 5)')
                .attr('opacity', 0.3)
                .attr('fill', '#000')
                .on("click", pause)
                .on("mouseover", function() { d3.select('.pause path').transition().attr('opacity', 0.6); })
                .on("mouseout", function() { d3.select('.pause path').transition().attr('opacity', 0.3); });
    }

    function renderSlider(container) {
        brush.x(scale)
             .extent([0, 0])
             .on("brush", function() {
                 if (d3.event.sourceEvent)
                    value = scale.invert(d3.mouse(this)[0]);
                 setValue(value); })
              .on("brushend", function() {
                 if (d3.event.sourceEvent)
                    value = scale.invert(d3.mouse(this)[0]);
                 setValue(value);
                 d3.event.target.clear();
                 d3.select(this).call(d3.event.target); });

        var group = container.attr("width", container.node().getBoundingClientRect().width)
                             .attr("height", height + margin.top  + margin.bottom)
                             .append("g")
                             .attr("transform","translate(" + [margin.left, margin.top] + ")");

        group.append("g")
             .attr("class","x axis")
             .attr("transform", "translate(0," + height / 2 + ")")
             .call(d3.svg.axis()
                         .scale(scale)
                         .orient("bottom")
                         .tickSize(0)
                         .tickPadding(12));

        var brushGroup = group.append("g")
                              .attr("class","slider")
                              .call(brush);

        brushGroup.selectAll(".extent, .resize").remove();
        brushGroup.select(".background").attr("height", height);

        handle = brushGroup.append("circle")
                           .attr("class", "handle")
                           .attr("transform", "translate(0," + height/2 + ")")
                           .attr("cx", scale(value))
                           .attr("r", 9);
    }

    function setValue(value) {
        brush.extent([value, value]);
        handle.attr("cx", scale(value));
        onValueChanged(slider);
    }

    function timer() {
        if(playing) {
            onInterval(slider);

            if(+handle.attr('cx') > scale.range()[1])
                setValue(0);

            d3.select(".handle")
              .transition()
              .duration(interval * 1000)
              .ease(d3.ease('linear'))
              .attr("cx", +handle.attr('cx') + scale(interval));
        }

        d3.timer(timer, interval * 1000);
        return true; // Terminate timer
    }

    function play() {
        playing = true;
        onInterval(slider);
    }

    function pause() {
        playing = false;
        d3.select(".handle").transition().duration(0);
    }

    slider.playing = function() { return playing; };
    slider.value = function(v) {
        if (!arguments.length)
            return scale.invert(handle.attr('cx'));
        setValue(v);
        return slider;
    };
    slider.interval = function(v) {
        if (!arguments.length)
            return interval;
        interval = v;
        return slider;
    };

    d3.timer(timer, 0);

    return slider;
}