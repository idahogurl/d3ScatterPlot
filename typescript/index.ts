const serviceUrl = "https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/cyclist-data.json";
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

import * as D3 from 'd3';
import {sprintf} from 'sprintf-js';

class Cyclist 
{
    place:number;
    name: string;
    year: number;
    nationality: string;
    doping: string;
    totalSeconds: number;
    time: string;
    minutesBehind: Date;

    constructor(time:string, place:number, name: string, year: number, 
        nationality: string, doping: string, seconds: number)
    {
        this.place = place;
        this.name = name;
        this.year = year;
        this.nationality = nationality;
        this.doping = doping;
        this.totalSeconds = seconds;

        this.time = time;
    }
    calcMinutesBehind(fastestTime:number)
    {
        let diff:number =  this.totalSeconds - fastestTime;
        let seconds:number = diff % 60;
        let minutes:number = Math.floor(diff / 60);
        
        let converted = new Date();
        converted.setMinutes(minutes, seconds);
        this.minutesBehind = converted;
    }
}
class Margin {
    top: number;
    right: number;
    bottom: number;
    left: number;

    constructor(top:number, right:number, bottom:number, left:number)
    {
        this.top = top;
        this.right = right;
        this.bottom = bottom;
        this.left= left;
    }    
}

class ScatterPlot
{
    height:number;
    width:number;
    xScale: D3.ScaleTime<number,number>;
    yScale: D3.ScaleLinear<number, number>;
    margin:Margin;
    chartData: Cyclist[];
    svgChart: any;

    constructor()
    {
        this.margin = new Margin(30, 60, 120, 40);
        this.height = 500 - this.margin.top - this.margin.bottom;
        this.width = 1000 - this.margin.left - this.margin.right;
        this.chartData = [];
        this.fetchData();
    }
    fetchData()
    {
        let _this = this;
        D3.json(serviceUrl, d => 
        {
            let fastestCyclistTime = d[0].Seconds;
            d.forEach(i => {
                let cyclist = new Cyclist(i.Time, i.Place, i.Name, i.Year, i.Nationality, i.Doping, i.Seconds);
                cyclist.calcMinutesBehind(fastestCyclistTime);
                
                _this.chartData.push(cyclist);
            });

            _this.createChart();
        });
    }
    createChart()
    {
        //Reference: http://bl.ocks.org/WilliamQLiu/803b712a4d6efbf7bdb4

        //when creating the svg chart, "this" is a reference to the svg object not the object instance
        //store the object data in local variables
        let width:number = this.width;
        let height:number = this.height;
        let margin:Margin = this.margin;
        let chartData:Cyclist[] = this.chartData;

        let yScale = D3.scaleLinear()
            .domain([0, D3.max(chartData, d => {
                return d.place;
            })])
            .range([0, height]);
        this.yScale = yScale;
        
        let longest = new Date(chartData[chartData.length - 1].minutesBehind);
        longest.setSeconds(longest.getSeconds() + 29);

        let xScale = D3.scaleTime()
            .domain([longest, chartData[0].minutesBehind])
            .range([0, width]);
        this.xScale = xScale;

        let self = this;
        this.svgChart = D3.select("#chart")
            .append("svg")
            .style("background", "#FFF")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + ", " + margin.top +")");

            //add circles
            this.addCircles();

            // Add Text Labels
            this.addLabels();
            
            this.addHorizontalAxis();
            this.addVerticalAxis();

            Legend.addLegendItem(this.svgChart, "Riders with doping allegations", "red", 
                new Point(700, height / 2));
            Legend.addLegendItem(this.svgChart, "No doping allegations", "black", 
                new Point(700, height / 2 + 25));
    }
    addHorizontalAxis()
    {
        let xScale:D3.ScaleTime<number,number> = this.xScale;
        let axis = D3.axisBottom(xScale)
            .ticks(D3.timeSecond, 30)
            .tickFormat(D3.timeFormat("%M:%S"));
            
            let xAxisLabel = new Label(new Point(this.width / 2, this.height + this.margin.top + 40),       "Minutes Behind Fastest Time", false);

            let xAxis = new Axis(this);
            xAxis.add(axis, new Point(this.margin.left, this.margin.top + this.height), xAxisLabel);
    }
    addVerticalAxis()
    {
        let height:number = this.height;
        let vGuideScale = D3.scaleLinear()
            .domain([1, 36])
            .range([0, height]);

        let axis = D3.axisLeft(vGuideScale)
            .ticks(8);
            
        let yAxisLabel =  new Label(new Point(this.margin.top - 80, 0 - this.margin.left + 15),             "Ranking", true)
        let xAxis = new Axis(this);
            xAxis.add(axis, new Point(this.margin.left, this.margin.top), yAxisLabel);
    }
    addLabels()
    {
        let chartData:Cyclist[] = this.chartData;
        let xScale:D3.ScaleTime<number, number> = this.xScale;
        let yScale:D3.ScaleLinear<number, number> = this.yScale;
        let margin:Margin = this.margin;

        this.svgChart.selectAll("text")
                .data(chartData)
                .enter()
                .append("text")
                .text((d:Cyclist) => {
                    return d.name;
                })
                .style("text-anchor", "middle")
                .attr("x", (d:Cyclist) => {
                    return xScale(d.minutesBehind) - 20;  // Returns scaled location of x
                })
                .attr("y", (d:Cyclist) => {
                    return yScale(d.place) + margin.top;  // Returns scaled circle y
                })
                .attr("font_family", "sans-serif")  // Font type
                .attr("font-size", "11px")  // Font size
                .attr("fill", "darkgreen");   // Font color

    }
    addCircles()
    {
        let chartData:Cyclist[] = this.chartData;
        let xScale:D3.ScaleTime<number, number> = this.xScale;
        let yScale:D3.ScaleLinear<number, number> = this.yScale;
        let margin:Margin = this.margin;
        let tooltip = Tooltip.get();
       
        this.svgChart.selectAll("circle")
                .data(chartData)
                .enter()
                .append("circle")
                .attr("transform", "translate (" + margin.left + ", " + margin.top + ")")
                .style("fill", (d:Cyclist) => {
                    if (d.doping !== "")
                        return "red";
                    return "black";
                })
                .style("stroke", "black")
                .style("stroke-width", "0")
                .attr("r", 4)  // Radius
                .attr("cx", (d:Cyclist) => {
                    return xScale(d.minutesBehind);  // Returns scaled circle x
                })
                .attr("cy", (d:Cyclist) => {
                    return yScale(d.place);  // Returns scaled circle y
                })
            .on("mouseover", (d:Cyclist) => 
            {   
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .7);
                
                tooltip.html(Tooltip.getText(d));
                
                D3.select(D3.event.currentTarget)
                    .style("cursor", "pointer")
                    .style("stroke-width", "1px");
            })
            .on("mouseout", () => 
            {   
                tooltip
                .transition()
                .duration(500)
                .style("opacity", 0);

                D3.select(D3.event.currentTarget)
                    .style("stroke-width", "0px");
            });
    }
}
class Point
{
    x:number;
    y:number;

    constructor(x:number, y:number)
    {
        this.x = x;
        this.y = y;
    }
}
class Label
{
    location:Point;
    text:string;
    vertical:boolean;

    constructor(location:Point, text:string, vertical:boolean)
    {
        this.location = location;
        this.text = text;
        this.vertical = vertical;
    }
}
class Axis
{
    chart:ScatterPlot;
    constructor(chart:ScatterPlot)
    {
        this.chart = chart;
    }
    add(axis:D3.Axis<any>, location:Point, label:Label)
    {
        let height = this.chart.height;
        let margin = this.chart.margin;

        let hGuide = chart.svgChart.append("g").style("font-size", "20px").call(axis);

        hGuide.attr("transform", "translate (" + location.x + ", " + 
            location.y + ")")
            .selectAll("path")
                .style("fill", "none")
                .style("stroke", "#000")
            .selectAll("line")
                .style("stroke", "#000");
        
        this.addLabel(label);
    }
    addLabel(label:Label)
    {
        let svgLabel = chart.svgChart.append("g").append("text")
                .attr("y", label.location.y)
                .attr("x", label.location.x)
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text(label.text); 

        if (label.vertical) 
            svgLabel.attr("transform", "rotate(-90)");
    }
}
class Legend
{
    static addLegendItem(svgChart:any, text:string, color:string, point:Point)
    {
        svgChart.append("g").append("text")
            .attr("y", point.y)
            .attr("x", point.x)
            .text(text);
        
        svgChart.append("circle")
            .attr("cy", point.y - 5)
            .attr("cx", point.x - 10)
            .attr("r", 4)
            .attr("fill", color);
    }
}
class Tooltip
{
    static get():any
    {
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
    }

    static getText(cyclist:Cyclist):string
    {
        return sprintf("%s: %s<br/>Year: %s, Time: %s%s", 
            cyclist.name, cyclist.nationality, cyclist.year, 
            cyclist.time, (cyclist.doping === "" ? "" : "<div><br/>" + cyclist.doping + "</div>"));
    }
}
let chart = new ScatterPlot();