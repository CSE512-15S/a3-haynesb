function ProfilingAggregation (templates, connectionUrl, graph) {
    "use strict";

    var dataCache = {};
    var nanosPerUnit = 1E9;

    ProfilingAggregation.prototype.fetchData = function(fragment, range, callback) {
        var fragmentId = fragment.fragmentIndex;

        if(getCachedData('groups', graph, fragmentId, range))
            _.defer(_.bind(callback, graph,
                           getCachedData('groups', graph, fragmentId, range),
                           graph, fragment));
        else {
            var url = templates.urls.profiling({
                myria: connectionUrl,
                query: graph.queryStatus.queryId,
                subquery: graph.queryStatus.subqueryId,
                fragment: fragmentId,
                start: Math.round(range[0]*2)/2 * nanosPerUnit,
                end: Math.round(range[1]*2)/2 * nanosPerUnit,
                onlyRootOp: false,
                minLength: 0
            });

            d3.csv(url, function(d) {
                d.workerId = +d.workerId;
                d.startTime = +d.startTime;
                d.endTime = +d.endTime;
                d.numTuples = +d.numTuples;
                return d;
            }, function(error, data) {
                callback(setCachedData('groups', graph, fragmentId, range, _.groupBy(data, 'opId')),
                         graph, fragment);
            });
        }
    };

    ProfilingAggregation.prototype.aggregate = function(range, costs) {
        return _.indexBy(_.flatten(_.map(graph.nodes,
                                         _.bind(aggregateFragmentData, this,
                                                range, costs))),
                         'id');
    };

    function aggregateFragmentData(range, costs, fragment) {
        var aggregates = _.map(fragment.operators, _.bind(aggregateOperatorData, null, range, costs));
        return aggregates.concat(createAggregate('f' + fragment.fragmentIndex,
                                                 // We want the tuples actually leaving the fragment,
                                                 // but the total time spent inside
                                                 _.last(aggregates).tuples,
                                                 _.sum(_.map(aggregates, 'time')),
                                                 _.sum(_.map(aggregates, 'tuples'))));
    }

    function aggregateOperatorData(range, costs, operator) {
        return createAggregate(
                   operator.opId,
                   _.sum(_.map(costs[operator.opId] || [], _.bind(tuplesInRange, operator, range))),
                   _.sum(_.map(costs[operator.opId] || [], _.bind(timeInRange, operator, range))));
    }

    function createAggregate(id, tuples, time, totalTuples) {
        return { id: id, tuples: tuples, time: time, totalTuples: totalTuples };
    }

    function tuplesInRange(range, entry) {
        var ratio = timeInRange(range, entry) / (entry.endTime - entry.startTime);
        return Math.max(ratio * entry.numTuples, 0);
    }

    function timeInRange(range, entry) {
        var left = Math.max(range[0] * nanosPerUnit, entry.startTime);
        var right = Math.min(range[1] * nanosPerUnit, entry.endTime);
        return Math.max(right - left, 0);
    }

    function getCachedData(key, graph, fragmentId, range) {
        return dataCache[[key, graph.queryStatus.queryId, graph.queryStatus.subqueryId, fragmentId].concat(range)];
    }

    function setCachedData(key, graph, fragmentId, range, data) {
        return dataCache[[key, graph.queryStatus.queryId, graph.queryStatus.subqueryId, fragmentId].concat(range)] = data;
    }
}