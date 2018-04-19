/* global d3 */

// configure display settings
const margin = { top: 1, right: 1, bottom: 6, left: 1 };
const width = 1000 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;
const formatNumber = d3.format(',.0f'); // convert values to type float
const format = d => `${formatNumber(d)} TJ`; // append unit of measurements to end of node and link values
const color = d3.scaleOrdinal(d3.schemeCategory20);

// create svg and append the graph
let svg = d3.select('#flow').append("svg")
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g');

var connect_to_server = false;
var start_animation = false;
// create the sankey graph with display settings
var sankey = d3.sankey()
    .nodeWidth(15)
    .nodePadding(10)
    .size([width, height]);

const path = sankey.link();

const freqCounter = 1;
var energy = {};


var timer = null;

var first_data = false;
//https://api.myjson.com/bins/dpp2b

function read_data() {

        d3.json('energy_flows.json', (blah_energy) => {

            connect_to_server = true;

            energy = blah_energy;

            //update_dropdown(energy.nodes);
            var list = document.getElementById("dropFuel");
            for (var x in energy.nodes) {
                var fuel_name = energy.nodes[x].name;
                var link = document.createElement("a");
                link.className = 'dropdown-item';
                var text = document.createTextNode(fuel_name);
                link.appendChild(text);
                link.href = "#";
                link.onclick = filterEvent;
                list.appendChild(link);

            }
            //create_graph(energy.nodes, energy.links);

            create_graph(energy.nodes, energy.links);


        });


}
read_data();

function animation() {
    svg.selectAll('g').remove();
    if (start_animation == true) {
        start_animation = false;

        create_graph(energy.nodes, energy.links);

    }
    else {
        console.log('hi');
        start_animation = true;
        create_graph(energy.nodes, energy.links);
    }


}

function filterEvent() {
    //svg.selectAll('g').remove();
    var newnodes = [];
    var newlinks = [];
    var table_title = "";
    for (var x in energy.nodes) {
        if (energy.nodes[x].name === this.childNodes[0].data) {
            if (energy.nodes[x].sourceLinks.length !== 0) {
                table_title = energy.nodes[x].name;
                for (var y in energy.nodes[x].sourceLinks) {
                    newnodes.push(energy.nodes[x].sourceLinks[y].target);
                    //newnodes.push({
                      // "name": energy.nodes[x].sourceLinks[y].target.name
                    //});
                }
            }


            if (energy.nodes[x].targetLinks.length !== 0) {
                for (var y in energy.nodes[x].targetLinks) {
                    newnodes.push(energy.nodes[x].targetLinks[y].source);
                    //newnodes.push({
                      //  "name": energy.nodes[x].targetLinks[y].source.name
                    //});
                }
            }

            newnodes.push(energy.nodes[x]);
            //newnodes.push({
              //  "name": energy.nodes[x].name
            //});
            if (energy.nodes[x].sourceLinks.length != 0 && energy.nodes[x].targetLinks.length !=0)
                newlinks = energy.nodes[x].sourceLinks.concat(energy.nodes[x].targetLinks);
            else {
                if (energy.nodes[x].sourceLinks.length == 0)
                    newlinks = energy.nodes[x].targetLinks;
                else
                    newlinks = energy.nodes[x].sourceLinks
            }
            console.log(newlinks);

            break;

        }
    }

    //create_graph(newnodes, newlinks);
    addTable(table_title, newlinks);
}

function noFilter() {
    //svg.selectAll('g').remove();
    //read_data();
    //create_graph(energy.nodes, energy.links);
    var list = document.getElementById("metric_results");   // Get the <ul> element with id="myList"
    list.removeChild(list.childNodes[0]);
}

function create_graph(nodes, links) {
    if (connect_to_server) {
        if (timer != null)
            timer.stop();
        particles = [];
        sankey
            .nodes(nodes)
            .links(links)
            .layout(32);

        const link = svg.append('g').selectAll('.link')
            .data(energy.links)
            .enter().append('path')
            .attr('class', 'link')
            .attr('d', path)
            .style('stroke-width', d => Math.max(1, d.dy))
            .sort((a, b) => b.dy - a.dy);
        link.append('title')
            .text(d => `${d.source.name} → ${d.target.name}\n${format(d.value)}`);

        const node = svg.append('g').selectAll('.node')
            .data(energy.nodes)
            .enter().append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x},${d.y})`)
            .call(d3.drag()
                .subject(d => d)
                .on('start', function () {
                    this.parentNode.appendChild(this);
                })
                .on('drag', dragmove));

        node.append('rect')
            .attr('height', d => d.dy)
            .attr('width', sankey.nodeWidth())
            .style('fill', (d) => {
                d.color = color(d.name.replace(/ .*/, ''));
                return d.color;
            })
            .style('stroke', 'none')
            .append('title')
            .text(d => `${d.name}\n${format(d.value)}`);

        node.append('text')
            .attr('x', -6)
            .attr('y', d => d.dy / 2)
            .attr('dy', '.35em')
            .attr('text-anchor', 'end')
            .attr('transform', null)
            .text(d => d.name)
            .filter(d => d.x < width / 2)
            .attr('x', 6 + sankey.nodeWidth())
            .attr('text-anchor', 'start');

        function dragmove(d) {
            d3.select(this).attr('transform', `translate(${d.x = Math.max(0, Math.min(width - d.dx, d3.event.x))},${d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))})`);
            sankey.relayout();
            link.attr('d', path);
        }

        const linkExtent = d3.extent(energy.links, d => d.value);
        const frequencyScale = d3.scaleLinear().domain(linkExtent).range([0.05, 1]);
        const particleSize = d3.scaleLinear().domain(linkExtent).range([1, 5]);


        energy.links.forEach((link) => {
            link.freq = frequencyScale(link.value);
            link.particleSize = 2;
            link.particleColor = d3.scaleLinear().domain([0, 1])
                .range([link.source.color, link.target.color]);
        });

        if (start_animation)
            timer = d3.timer(tick, 1000);



    }
}

function tick(elapsed) {
    particles = particles.filter(d => d.current < d.path.getTotalLength());

    d3.selectAll('path.link')
        .each(
            function (d) {
                // if (d.freq < 1) {
                for (let x = 0; x < 2; x += 1) {
                    const offset = (Math.random() - 0.5) * (d.dy - 4);
                    if (Math.random() < d.freq) {
                        const length = this.getTotalLength();
                        particles.push({
                            link: d,
                            time: elapsed,
                            offset,
                            path: this,
                            length,
                            animateTime: length,
                            speed: 0.5 + (Math.random())
                        });
                    }
                }
            });

    particleEdgeCanvasPath(elapsed, particles);
}

function particleEdgeCanvasPath(elapsed, particles) {
    const context = d3.select('canvas').node().getContext('2d');

    context.clearRect(0, 0, 1000, 1000);

    context.fillStyle = 'gray';
    context.lineWidth = '1px';
    for (const x in particles) {
        if ({}.hasOwnProperty.call(particles, x)) {
            const currentTime = elapsed - particles[x].time;
            // var currentPercent = currentTime / 1000 * particles[x].path.getTotalLength();
            particles[x].current = currentTime * 0.15 * particles[x].speed;
            const currentPos = particles[x].path.getPointAtLength(particles[x].current);
            context.beginPath();
            context.fillStyle = particles[x].link.particleColor(0);
            context.arc(currentPos.x, currentPos.y + particles[x].offset, particles[x].link.particleSize, 0, 2 * Math.PI);
            context.fill();
        }
    }
}

function d3sankey() {
    var sankey = {},
        nodeWidth = 20,
        nodePadding = 8,
        size = [1, 1],
        nodes = [],
        links = [];

    sankey.nodeWidth = function (_) {
        if (!arguments.length) return nodeWidth;
        nodeWidth = +_;
        return sankey;
    };

    sankey.nodePadding = function (_) {
        if (!arguments.length) return nodePadding;
        nodePadding = +_;
        return sankey;
    };

    sankey.nodes = function (_) {
        if (!arguments.length) return nodes;
        nodes = _;
        return sankey;
    };

    sankey.links = function (_) {
        if (!arguments.length) return links;
        links = _;
        return sankey;
    };

    sankey.size = function (_) {
        if (!arguments.length) return size;
        size = _;
        return sankey;
    };

    sankey.layout = function (iterations) {
        computeNodeLinks();
        computeNodeValues();
        computeNodeBreadths();
        computeNodeDepths(iterations);
        computeLinkDepths();
        return sankey;
    };

    sankey.relayout = function () {
        computeLinkDepths();
        return sankey;
    };

    sankey.link = function () {
        var curvature = .5;

        function link(d) {
            var x0 = d.source.x + d.source.dx,
                x1 = d.target.x,
                xi = d3.interpolateNumber(x0, x1),
                x2 = xi(curvature),
                x3 = xi(1 - curvature),
                y0 = d.source.y + d.sy + d.dy / 2,
                y1 = d.target.y + d.ty + d.dy / 2;
            return "M" + x0 + "," + y0 + "C" + x2 + "," + y0 + " " + x3 + "," + y1 + " " + x1 + "," + y1;
        }

        link.curvature = function (_) {
            if (!arguments.length) return curvature;
            curvature = +_;
            return link;
        };

        return link;
    };

    // Populate the sourceLinks and targetLinks for each node.
    // Also, if the source and target are not objects, assume they are indices.
    function computeNodeLinks() {
        nodes.forEach(function (node) {
            node.sourceLinks = [];
            node.targetLinks = [];
        });
        links.forEach(function (link) {
            var source = link.source,
                target = link.target;
            if (typeof source === "number") source = link.source = nodes[link.source];
            if (typeof target === "number") target = link.target = nodes[link.target];
            source.sourceLinks.push(link);
            target.targetLinks.push(link);
        });
    }

    // Compute the value (size) of each node by summing the associated links.
    function computeNodeValues() {
        nodes.forEach(function (node) {
            node.value = Math.max(
                d3.sum(node.sourceLinks, value),
                d3.sum(node.targetLinks, value));
        });
    }

    // Iteratively assign the breadth (x-position) for each node.
    // Nodes are assigned the maximum breadth of incoming neighbors plus one;
    // nodes with no incoming links are assigned breadth zero, while
    // nodes with no outgoing links are assigned the maximum breadth.
    function computeNodeBreadths() {
        var remainingNodes = nodes,
            nextNodes,
            x = 0;

        while (remainingNodes.length) {
            nextNodes = [];
            remainingNodes.forEach(function (node) {
                node.x = x;
                node.dx = nodeWidth;
                node.sourceLinks.forEach(function (link) {
                    nextNodes.push(link.target);
                });
            });
            remainingNodes = nextNodes;
            ++x;
        }

        //
        moveSinksRight(x);
        scaleNodeBreadths((size[0] - nodeWidth) / (x - 1));
    }

    function moveSourcesRight() {
        nodes.forEach(function (node) {
            if (!node.targetLinks.length) {
                node.x = d3.min(node.sourceLinks, function (d) {
                    return d.target.x;
                }) - 1;
            }
        });
    }

    function moveSinksRight(x) {
        nodes.forEach(function (node) {
            if (!node.sourceLinks.length) {
                node.x = x - 1;
            }
        });
    }

    function scaleNodeBreadths(kx) {
        nodes.forEach(function (node) {
            node.x *= kx;
        });
    }

    function computeNodeDepths(iterations) {
        var nodesByBreadth = d3.nest()
            .key(function (d) {
                return d.x;
            })
            .sortKeys(d3.ascending)
            .entries(nodes)
            .map(function (d) {
                return d.values;
            });

        //
        initializeNodeDepth();
        resolveCollisions();
        for (var alpha = 1; iterations > 0; --iterations) {
            relaxRightToLeft(alpha *= .99);
            resolveCollisions();
            relaxLeftToRight(alpha);
            resolveCollisions();
        }

        function initializeNodeDepth() {
            var ky = d3.min(nodesByBreadth, function (nodes) {
                return (size[1] - (nodes.length - 1) * nodePadding) / d3.sum(nodes, value);
            });

            nodesByBreadth.forEach(function (nodes) {
                nodes.forEach(function (node, i) {
                    node.y = i;
                    node.dy = node.value * ky;
                });
            });

            links.forEach(function (link) {
                link.dy = link.value * ky;
            });
        }

        function relaxLeftToRight(alpha) {
            nodesByBreadth.forEach(function (nodes, breadth) {
                nodes.forEach(function (node) {
                    if (node.targetLinks.length) {
                        var y = d3.sum(node.targetLinks, weightedSource) / d3.sum(node.targetLinks, value);
                        node.y += (y - center(node)) * alpha;
                    }
                });
            });

            function weightedSource(link) {
                return center(link.source) * link.value;
            }
        }

        function relaxRightToLeft(alpha) {
            nodesByBreadth.slice().reverse().forEach(function (nodes) {
                nodes.forEach(function (node) {
                    if (node.sourceLinks.length) {
                        var y = d3.sum(node.sourceLinks, weightedTarget) / d3.sum(node.sourceLinks, value);
                        node.y += (y - center(node)) * alpha;
                    }
                });
            });

            function weightedTarget(link) {
                return center(link.target) * link.value;
            }
        }

        function resolveCollisions() {
            nodesByBreadth.forEach(function (nodes) {
                var node,
                    dy,
                    y0 = 0,
                    n = nodes.length,
                    i;

                // Push any overlapping nodes down.
                nodes.sort(ascendingDepth);
                for (i = 0; i < n; ++i) {
                    node = nodes[i];
                    dy = y0 - node.y;
                    if (dy > 0) node.y += dy;
                    y0 = node.y + node.dy + nodePadding;
                }

                // If the bottommost node goes outside the bounds, push it back up.
                dy = y0 - nodePadding - size[1];
                if (dy > 0) {
                    y0 = node.y -= dy;

                    // Push any overlapping nodes back up.
                    for (i = n - 2; i >= 0; --i) {
                        node = nodes[i];
                        dy = node.y + node.dy + nodePadding - y0;
                        if (dy > 0) node.y -= dy;
                        y0 = node.y;
                    }
                }
            });
        }

        function ascendingDepth(a, b) {
            return a.y - b.y;
        }
    }

    function computeLinkDepths() {
        nodes.forEach(function (node) {
            node.sourceLinks.sort(ascendingTargetDepth);
            node.targetLinks.sort(ascendingSourceDepth);
        });
        nodes.forEach(function (node) {
            var sy = 0,
                ty = 0;
            node.sourceLinks.forEach(function (link) {
                link.sy = sy;
                sy += link.dy;
            });
            node.targetLinks.forEach(function (link) {
                link.ty = ty;
                ty += link.dy;
            });
        });

        function ascendingSourceDepth(a, b) {
            return a.source.y - b.source.y;
        }

        function ascendingTargetDepth(a, b) {
            return a.target.y - b.target.y;
        }
    }

    function center(node) {
        return node.y + node.dy / 2;
    }

    function value(link) {
        return link.value;
    }

    return sankey;
};

function getData() {
    return {
        "links": [{
            "source": 0,
            "target": 2,
            "value": 25
        }, {
            "source": 1,
            "target": 2,
            "value": 5
        }, {
            "source": 1,
            "target": 3,
            "value": 20
        }, {
            "source": 2,
            "target": 4,
            "value": 29
        }, {
            "source": 2,
            "target": 5,
            "value": 1
        }, {
            "source": 3,
            "target": 4,
            "value": 10
        }, {
            "source": 3,
            "target": 5,
            "value": 2
        }, {
            "source": 3,
            "target": 6,
            "value": 8
        }, {
            "source": 4,
            "target": 7,
            "value": 39
        }, {
            "source": 5,
            "target": 7,
            "value": 3
        }, {
            "source": 6,
            "target": 7,
            "value": 8
        }],
        "nodes": [{
            "name": "node0"
        }, {
            "name": "node1"
        }, {
            "name": "node2"
        }, {
            "name": "node3"
        }, {
            "name": "node4"
        }, {
            "name": "node5"
        }, {
            "name": "node6"
        }, {
            "name": "node7"
        }]};
}

function addTable(title, new_links) {
    var myTableDiv = document.getElementById("metric_results")
    var prev_table = myTableDiv.childNodes[0]
    var table = document.createElement('TABLE')
    var tableBody = document.createElement('TBODY')
    //var header = table.createTHead();
    //var title_row = header.insertRow(0);
    //var cell = title_row.insertCell(0);
    //cell.innerHTML = title.bold();
    table.border = '1'
    table.appendChild(tableBody);

    var heading = new Array();
    heading[0] = "Source"
    heading[1] = "Target"
    heading[2] = "Value (TJ)"

    var stock = new Array()

    for (var x in new_links) {
        var row_array = new Array()
        row_array.push(new_links[x].source.name);
        row_array.push(new_links[x].target.name);
        row_array.push(new_links[x].value.toString());
        stock.push(row_array);
    }

    //TABLE COLUMNS
    var tr = document.createElement('TR');
    tableBody.appendChild(tr);
    for (i = 0; i < heading.length; i++) {
        var th = document.createElement('TH')
        th.width = '75';
        th.appendChild(document.createTextNode(heading[i]));
        tr.appendChild(th);
    }

    //TABLE ROWS
    for (i = 0; i < stock.length; i++) {
        var tr = document.createElement('TR');
        for (j = 0; j < stock[i].length; j++) {
            var td = document.createElement('TD')
            td.appendChild(document.createTextNode(stock[i][j]));
            tr.appendChild(td)
        }
        tableBody.appendChild(tr);
    }
    if (prev_table != null) {
        myTableDiv.replaceChild(table, prev_table)
    }
    else
        myTableDiv.appendChild(table)
}


