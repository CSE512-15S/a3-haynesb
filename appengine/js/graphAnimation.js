function GraphAnimation (graph, scales, animationDuration, arrowSize, markerSize) {
    "use strict";

    var moving_average_skew_slots = 3;

    GraphAnimation.prototype.update = function(profiling, aggregates, fragment) {
        this.updateLinks(aggregates, fragment);
        this.updateFragments(aggregates, fragment);
        this.updateOperators(aggregates, fragment);
        this.updateSkewMarkers();
        this.updateSkewHighlight(profiling, fragment);
    };

    GraphAnimation.prototype.updateOperators = function(aggregates, fragment, path) {
        d3.selectAll(path || '.operator')
          .filter(isInCurrentFragment(fragment, 'id'))
          .selectAll('.node-rect')
          .transition()
          .duration(animationDuration)
              .style("stroke-width", function(d) {
                  return scales.timeWidth(aggregates[d.id].time); })
              .style("stroke", function(d) {
                  return scales.timeColor(aggregates[d.id].time); });
    };

    GraphAnimation.prototype.updateFragments = function(aggregates, fragment, path) {
        d3.selectAll(path || '.node.fragment')
          .filter(function(d) { return d.id == "f"+fragment.fragmentIndex; })
          .selectAll('.node-rect')
          .transition()
          .duration(animationDuration)
              .style("stroke-width", function(d) {
                  return scales.timeWidth(aggregates[d.id].time); })
              .style("stroke", function(d) {
                  return scales.timeColor(aggregates[d.id].time); });
    };

    GraphAnimation.prototype.updateLinks = function(aggregates, fragment, path) {
        var normalizer = d3.scale.log().domain([1, 10 + aggregates['f' + fragment.fragmentIndex].totalTuples]);

        d3.selectAll(path || 'g.link path.line')
          .filter(function(d) { return isInCurrentFragment(fragment, 'src')(d) ||
                                       d.src == 'f'+fragment.fragmentIndex; })
          .transition()
          .duration(animationDuration)
              .style('stroke-dasharray', function(d) {
                  return "5," + scales.strokeDash(normalizer(aggregates[d.src].tuples)); })
              .style("stroke-width", function(d) {
                  return scales.strokeWidth(normalizer(aggregates[d.src].tuples)); });
    };

    GraphAnimation.prototype.updateSkewMarkers = function(path) {
        d3.selectAll(path || 'g.link marker path:not(.skew)')
          .transition()
          .duration(animationDuration)
              .attr('fill', function(d) {
                  return scales.skewBackgroundColor(d3.mean(d.skews || [0])); })
              .attr("d", function() {
                  return "M 0,0 " +
                         "V" + (arrowSize * 2) +
                         "L" + [markerSize, arrowSize] +
                         "Z"; });
    };

    GraphAnimation.prototype.updateSkewHighlight = function(profiling, fragment, path) {
        d3.selectAll(path || 'g.link marker path.skew')
          .filter(isInCurrentFragment(fragment, 'src'))
          .transition()
          .delay(animationDuration)
          .attr('fill', function(d) { return scales.skewColor(d3.mean(d.skews || [0])); })
          .attr("d", function(d) {
              return "M 0," + scales.skewWidth(updateSkew(profiling, fragment, d)) +
                     "V" + (arrowSize * 2) +
                     "L" + [markerSize, arrowSize] +
                     "Z"; });
    };

    GraphAnimation.prototype.createSkewHighlightPaths = function(container) {
        container.selectAll('g.link marker')
                 .attr('markerUnits', 'userSpaceOnUse')
                 .attr('refY', arrowSize)
                 .each(function(d) {
                     d3.select(this)
                       .selectAll('path.skew')
                       .data([d])
                       .enter()
                       .append('path')
                       .attr('class', 'skew');
                 });
        return this;
    };

    function updateSkew(profiling, fragment, d) {
        d.skews = d.skews || _.fill(new Array(moving_average_skew_slots), 0);

        var workers = graph.nodes['f' + fragment.fragmentIndex].workers.length;
        var tuples_per_worker = _.reduce(
                profiling[d.src],
                function(a, c) {
                    a[c.workerId - 1] = (a[c.workerId - 1] || 0) + Math.max(c.numTuples, 0);
                    return a; },
                _.fill(new Array(workers), 0));

        rotate(d.skews, Math.abs(standard_skewness(_.sortBy(tuples_per_worker)) || 0));

        return d3.mean(d.skews);
    }

    function standard_skewness(values) {
        var mean = d3.mean(values);
        var variance = _.reduce(values, function(a, c) { return a + Math.pow(c - mean, 2); }, 0) / values.length;
        var skewness = _.reduce(values, function(a, c) { return a + Math.pow(c - mean, 3); }, 0) / values.length;
        var population_skewness = Math.sqrt(values.length) * skewness / (Math.pow(variance, 3/2) || 1);

        return population_skewness;
    }

    function isInCurrentFragment(fragment, attribute) {
        return function(d) { return graph.opId2fId[d[attribute]] == "f" + fragment.fragmentIndex; };
    }

    function rotate(array, value) {
        _(array).shift();
        array.push(value);
    }
}
