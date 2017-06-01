# D3 Time Logarithmic Scale Chart

Using d3.v4.js

[![Demo](https://raw.githubusercontent.com/antonfisher/d3-time-logarithmic-scale-chart/docs/images/demo-v1.gif)](https://antonfisher.com/d3-time-logarithmic-scale-chart/)

[Live demo](https://antonfisher.com/d3-time-logarithmic-scale-chart/)

## Usage

Add the library script on the page:

```html
<script src="https://d3js.org/d3.v4.min.js"></script>
<script src="d3-time-logarithmic-scale-chart.js"></script>
```

Add chart container:
```html
<section id="chart" style="width: 500px; height: 250px"></section>
```

Render the chart:
```html
const chartEl = document.getElementById('chart');
new TimeLogarithmicScaleChart(chartEl, data);
```

## API

```js
// parent DOM Element
const chartEl = document.getElementById('chart');

// an array of objects {time: <Date>, value: <Number>}
const data = [
  {time: Date().now() - 60 * 1000, value: 0},
  {time: Date().now(), value: 10}
];

// config object
const config = {
  animation: true,
  curve: d3.curveCardinal.tension(0.75),
  debug: false,
  margin: 40,
  minInterval: '1h',
  stroke: 'lightblue',
  strokeWidth: 2,
  yTickFormat: '.0%'
};

// render chart
const chart = new TimeLogarithmicScaleChart(chartEl, data, config);

// update chart
chart.update(newData);
```

