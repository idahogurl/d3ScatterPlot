"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var serviceUrl = "https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/cyclist-data.json";
/*
    "Time": "36:50",
    "Place": 1,
    "Seconds": 2210,
    "Name": "Marco Pantani",
    "Year": 1995,
    "Nationality": "ITA",
    "Doping": "Alleged drug use during 1995 due to high hematocrit levels",
    "URL": "https://en.wikipedia.org/wiki/Marco_Pantani#Alleged_drug_use"
    */
require("./sass/styles.scss");
var D3 = require("d3");
var sprintf_js_1 = require("sprintf-js");
var Cyclist = (function () {
    function Cyclist(time, place, name, year, nationality, doping, seconds) {
        this.place = place;
        this.name = name;
        this.year = year;
        this.nationality = nationality;
        this.doping = doping;
        this.totalSeconds = seconds;
        this.time = time;
    }
    Cyclist.prototype.calcMinutesBehind = function (fastestTime) {
        var diff = this.totalSeconds - fastestTime;
        var seconds = diff % 60;
        var minutes = Math.floor(diff / 60);
        var converted = new Date();
        converted.setMinutes(minutes, seconds);
        this.minutesBehind = converted;
    };
    return Cyclist;
}());
var Margin = (function () {
    function Margin(top, right, bottom, left) {
        this.top = top;
        this.right = right;
        this.bottom = bottom;
        this.left = left;
    }
    return Margin;
}());
var ScatterPlot = (function () {
    function ScatterPlot() {
        this.margin = new Margin(30, 60, 120, 40);
        this.height = 500 - this.margin.top - this.margin.bottom;
        this.width = 1000 - this.margin.left - this.margin.right;
        this.chartData = [];
        this.fetchData();
    }
    ScatterPlot.prototype.fetchData = function () {
        var _this = this;
        D3.json(serviceUrl, function (d) {
            var fastestCyclistTime = d[0].Seconds;
            d.forEach(function (i) {
                var cyclist = new Cyclist(i.Time, i.Place, i.Name, i.Year, i.Nationality, i.Doping, i.Seconds);
                cyclist.calcMinutesBehind(fastestCyclistTime);
                _this.chartData.push(cyclist);
            });
            _this.createChart();
        });
    };
    ScatterPlot.prototype.createChart = function () {
        //Reference: http://bl.ocks.org/WilliamQLiu/803b712a4d6efbf7bdb4
        //when creating the svg chart, "this" is a reference to the svg object not the object instance
        //store the object data in local variables
        var width = this.width;
        var height = this.height;
        var margin = this.margin;
        var chartData = this.chartData;
        var yScale = D3.scaleLinear()
            .domain([0, D3.max(chartData, function (d) {
                return d.place;
            })])
            .range([0, height]);
        this.yScale = yScale;
        var longest = new Date(chartData[chartData.length - 1].minutesBehind);
        longest.setSeconds(longest.getSeconds() + 29);
        var xScale = D3.scaleTime()
            .domain([longest, chartData[0].minutesBehind])
            .range([0, width]);
        this.xScale = xScale;
        var self = this;
        this.svgChart = D3.select("#chart")
            .append("svg")
            .style("background", "#FFF")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
        //add circles
        this.addCircles();
        // Add Text Labels
        this.addLabels();
        this.addHorizontalAxis();
        this.addVerticalAxis();
        Legend.addLegendItem(this.svgChart, "Riders with doping allegations", "red", new Point(700, height / 2));
        Legend.addLegendItem(this.svgChart, "No doping allegations", "black", new Point(700, height / 2 + 25));
    };
    ScatterPlot.prototype.addHorizontalAxis = function () {
        var xScale = this.xScale;
        var axis = D3.axisBottom(xScale)
            .ticks(D3.timeSecond, 30)
            .tickFormat(D3.timeFormat("%M:%S"));
        var xAxisLabel = new Label(new Point(this.width / 2, this.height + this.margin.top + 40), "Minutes Behind Fastest Time", false);
        var xAxis = new Axis(this);
        xAxis.add(axis, new Point(this.margin.left, this.margin.top + this.height), xAxisLabel);
    };
    ScatterPlot.prototype.addVerticalAxis = function () {
        var height = this.height;
        var vGuideScale = D3.scaleLinear()
            .domain([1, 36])
            .range([0, height]);
        var axis = D3.axisLeft(vGuideScale)
            .ticks(8);
        var yAxisLabel = new Label(new Point(this.margin.top - 80, 0 - this.margin.left + 15), "Ranking", true);
        var xAxis = new Axis(this);
        xAxis.add(axis, new Point(this.margin.left, this.margin.top), yAxisLabel);
    };
    ScatterPlot.prototype.addLabels = function () {
        var chartData = this.chartData;
        var xScale = this.xScale;
        var yScale = this.yScale;
        var margin = this.margin;
        this.svgChart.selectAll("text")
            .data(chartData)
            .enter()
            .append("text")
            .text(function (d) {
            return d.name;
        })
            .style("text-anchor", "middle")
            .attr("x", function (d) {
            return xScale(d.minutesBehind) - 20; // Returns scaled location of x
        })
            .attr("y", function (d) {
            return yScale(d.place) + margin.top; // Returns scaled circle y
        })
            .attr("font_family", "sans-serif") // Font type
            .attr("font-size", "11px") // Font size
            .attr("fill", "darkgreen"); // Font color
    };
    ScatterPlot.prototype.addCircles = function () {
        var chartData = this.chartData;
        var xScale = this.xScale;
        var yScale = this.yScale;
        var margin = this.margin;
        var tooltip = Tooltip.get();
        this.svgChart.selectAll("circle")
            .data(chartData)
            .enter()
            .append("circle")
            .attr("transform", "translate (" + margin.left + ", " + margin.top + ")")
            .style("fill", function (d) {
            if (d.doping !== "")
                return "red";
            return "black";
        })
            .style("stroke", "black")
            .style("stroke-width", "0")
            .attr("r", 4) // Radius
            .attr("cx", function (d) {
            return xScale(d.minutesBehind); // Returns scaled circle x
        })
            .attr("cy", function (d) {
            return yScale(d.place); // Returns scaled circle y
        })
            .on("mouseover", function (d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .7);
            tooltip.html(Tooltip.getText(d));
            D3.select(D3.event.currentTarget)
                .style("cursor", "pointer")
                .style("stroke-width", "1px");
        })
            .on("mouseout", function () {
            tooltip
                .transition()
                .duration(500)
                .style("opacity", 0);
            D3.select(D3.event.currentTarget)
                .style("stroke-width", "0px");
        });
    };
    return ScatterPlot;
}());
var Point = (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    return Point;
}());
var Label = (function () {
    function Label(location, text, vertical) {
        this.location = location;
        this.text = text;
        this.vertical = vertical;
    }
    return Label;
}());
var Axis = (function () {
    function Axis(chart) {
        this.chart = chart;
    }
    Axis.prototype.add = function (axis, location, label) {
        var height = this.chart.height;
        var margin = this.chart.margin;
        var hGuide = chart.svgChart.append("g").style("font-size", "20px").call(axis);
        hGuide.attr("transform", "translate (" + location.x + ", " +
            location.y + ")")
            .selectAll("path")
            .style("fill", "none")
            .style("stroke", "#000")
            .selectAll("line")
            .style("stroke", "#000");
        this.addLabel(label);
    };
    Axis.prototype.addLabel = function (label) {
        var svgLabel = chart.svgChart.append("g").append("text")
            .attr("y", label.location.y)
            .attr("x", label.location.x)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text(label.text);
        if (label.vertical)
            svgLabel.attr("transform", "rotate(-90)");
    };
    return Axis;
}());
var Legend = (function () {
    function Legend() {
    }
    Legend.addLegendItem = function (svgChart, text, color, point) {
        svgChart.append("g").append("text")
            .attr("y", point.y)
            .attr("x", point.x)
            .text(text);
        svgChart.append("circle")
            .attr("cy", point.y - 5)
            .attr("cx", point.x - 10)
            .attr("r", 4)
            .attr("fill", color);
    };
    return Legend;
}());
var Tooltip = (function () {
    function Tooltip() {
    }
    Tooltip.get = function () {
        return D3.select("#tooltip")
            .append("div")
            .style("top", "30px")
            .style("left", "1000px")
            .style("pointer-events", "none")
            .style("position", "absolute")
            .style("padding", "10px")
            .style("background", "black")
            .style("color", "white")
            .style("width", "250px")
            .style("opacity", 0);
    };
    Tooltip.getText = function (cyclist) {
        return sprintf_js_1.sprintf("%s: %s<br/>Year: %s, Time: %s%s", cyclist.name, cyclist.nationality, cyclist.year, cyclist.time, (cyclist.doping === "" ? "" : "<div><br/>" + cyclist.doping + "</div>"));
    };
    return Tooltip;
}());
var chart = new ScatterPlot();
