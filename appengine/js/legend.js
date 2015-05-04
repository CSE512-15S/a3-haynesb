function Legend (scales, arrowSize, markerSize, width, height, offset) {
  "use strict";

  width = width || 520;
  height = height || 95;
  offset = offset || 14;

  Legend.prototype.render = function(svg) {
      var boundingRect = svg.node().getBoundingClientRect();
      var position = [Math.max(boundingRect.width - width - offset, offset),
                      Math.max(boundingRect.height - height - offset, offset)];

      var root = svg.data([{}])
                    .append('g')
                    .attr('class', 'legend')
                    .attr('transform', 'translate(' + position + ')')
                    .call(d3.behavior.drag()
                                     .on("dragstart", function (d) {
                                         d.offset = d3.mouse(this);
                                         d3.event.sourceEvent.stopPropagation(); })
                                     .on("drag", function (d) {
                                         d3.select(this)
                                           .attr('transform', 'translate(' + [d3.event.x - d.offset[0], d3.event.y - d.offset[1]] + ')');
                                     }));
      root.append('rect')
          .attr("class", 'surround')
          .attr("width", width)
          .attr("height", height)
          .attr("rx", 10)
          .attr("ry", 10)
          .attr('fill', '#eee')
          .attr('opacity', 0)
          .attr('stroke', '#000')
          .attr('stroke-width', 1)
          .on("mouseover", function () { if(d3.select(this).attr('opacity') != 0) d3.select(this).transition().attr('opacity', 1); })
          .on("mouseout", function () { if(d3.select(this).attr('opacity') != 0) d3.select(this).transition().attr('opacity', 0.85); });

      root.append('circle')
          .tooltip("click to<br/>expand/collapse<br/>legend")
          .attr('id', 'toggle')
          .attr("class", "expand-circle")
          .attr("r", 20)
          .attr('fill', 'lightgreen')
          .attr('stroke', 'green')
          .attr('stroke-width', 2)
          .attr('transform', 'translate(' + [width - 10, height - 10] + ')')
          .on("click", _.bind(toggleLegend, root.node(), root, height, width));
      root.append('text')
          .on("click", _.bind(toggleLegend, root.node(), root, height, width))
          .attr('transform', 'translate(' + [width - 18, height - 1] + ')')
          .style('font-size', 30)
          .style('cursor', 'default')
          .text('?');

      //todo tooltips?
      root.append('g').attr('transform', 'translate(12, 20)')
                      .attr('opacity', 0)
                      .call(_.bind(tuplesEmittedLegend, this, scales));
      root.append('g').attr('transform', 'translate(12, 50)')
                      .attr('opacity', 0)
                      .call(_.bind(operatorTimeLegend, this, scales));
      root.append('g').attr('transform', 'translate(12, 79)')
                      .attr('opacity', 0)
                      .call(_.bind(workerSkewLegend, this, scales));
  };

  function tuplesEmittedLegend(scales, legend) {
      legend.append('text').attr('transform', 'translate(0, 4)').text('< 10% tuples emitted');

      var margin = 11;
      var offset = _.reduce(scales.strokeWidth.ticks(15), function (offset, strokeWidth) {
          var width = 22 + 1.5 * scales.strokeDash(strokeWidth);

          legend.append("path")
                .attr("d", "M " + offset + ",0 L " + (offset + width) + ",0")
                .attr("stroke", 'black')
                .attr("stroke-dasharray", scales.strokeDash(strokeWidth))
                .attr("stroke-width", scales.strokeWidth(strokeWidth));

          return offset + width;
      }, legend.select('text').node().getBoundingClientRect().width + margin + 6);

      legend.append('text').attr('transform', 'translate(' + (offset + margin) + ', 4)').text('> 90% tuples emitted');
  }

  function operatorTimeLegend(scales, legend) {
      legend.append('text').text('< 10% time in operator');

      var margin = 10;
      var offset = _.reduce(_.zip(scales.timeColor.ticks(9), scales.timeWidth.ticks(9)),
                            function (offset, values) {
                               var width = 22.9;

                                legend.append("rect")
                                      .attr("fill", scales.timeColor(values[0]))
                                      .attr('width', width)
                                      .attr('height', scales.timeWidth(values[1]))
                                      .attr('transform', 'translate(' + offset + ', ' + (-4 - scales.timeWidth(values[1])/2) + ')');

                                return offset + width;
                            },
                            legend.select('text').node().getBoundingClientRect().width + margin);

      legend.append('text').attr('transform', 'translate(' + (offset + margin) + ')').text('> 90% time in operator');
  }

  function workerSkewLegend(scales, legend) {
      //todo var everything
      var margin = 32;
      var separation = 60;

      legend.append('text').text('< 0.1 worker skew');

      var offset = _.reduce([0, 0.25, 0.5, 0.75, 1],
                            function (offset, skew) {
                                legend.append("path")
                                      .attr('transform', 'translate(' + offset + ', -12)')
                                      .attr('fill', scales.skewBackgroundColor(skew))
                                      .attr("d", "M 0,0 V " + (arrowSize * 2) + " L " + [markerSize, arrowSize] + " Z");

                                legend.append('path')
                                      .attr('transform', 'translate(' + offset + ', -12)')
                                      .attr('fill', scales.skewColor(skew))
                                      .attr("d", function () {
                                        return "M 0," + scales.skewWidth(skew) + " V " + (arrowSize * 2) + " L " + [markerSize, arrowSize] + " Z";
                                        });

                                return offset + separation;
                            },
                            legend.select('text').node().getBoundingClientRect().width + margin);

      legend.append('text').attr('transform', 'translate(' + (offset - separation + margin - 10) + ')').text('> 0.9 worker skew');
  }

  function toggleLegend(legend, height, width) {
      var index = legend.select('#toggle').attr('class') === 'collapse-circle' ? 0 : 1;
      var nextClass = ['expand-circle', 'collapse-circle'][index];
      var nextOpacity = [0, 1][index];
      var nextWidth = [0, width][index];
      var nextHeight = [0, height][index];
      var nextRadius = [20, 6][index];
      var nextRadius = [20, 6][index];
      var nextTranslate = [[width - 10, height - 10], [0, 0]][index];

      var transition = legend.transition();
      transition.selectAll('.legend rect.surround, .legend g')
            .attr('opacity', nextOpacity)
            .attr('width', nextWidth)
            .attr('height', nextHeight);
      transition.select('#toggle')
            .duration(500)
            .attr('class', nextClass)
            .attr('r', nextRadius)
            .transition()
            .attr('transform', 'translate(' + nextTranslate + ')');
      transition.select('.tooltip').remove();
      transition.select('.legend text').transition()
                                       .duration(nextOpacity ? 0 : 2000)
                                       .attr('opacity', 1 - nextOpacity);
  }

  return this.render;
}
