/**
 * Time Logarithmic Scale Chart
 *
 * Using: d3.v4.js
 *
 * @author Anton Fisher <a.fschr@gmail.com>
 * @link https://github.com/antonfisher/d3-time-logarithmic-scale-chart
 * @licence MIT
 */

(function (window) {
  const DEFAULT_CONFIG = {
    animation: true,
    curve: d3.curveCardinal.tension(0.75),
    debug: false,
    margin: 40,
    minInterval: '1h',
    stroke: 'lightblue',
    strokeWidth: 2,
    yTickFormat: '.0%'
  };

  function createTickFn(period, offset) {
    return ((value) => d3[`time${period}`].offset(value, offset));
  }

  const INTERVALS = [
    {key: '1y', tick: createTickFn('Year', -1), smallTick: createTickFn('Month', -1)},
    {key: '3m', tick: createTickFn('Month', -3), smallTick: createTickFn('Month', -1)},
    {key: '1m', tick: createTickFn('Month', -1), smallTick: createTickFn('Day', -1)},
    {key: '1w', tick: createTickFn('Week', -1), smallTick: createTickFn('Day', -1)},
    {key: '3d', tick: createTickFn('Day', -3), smallTick: createTickFn('Day', -1)},
    {key: '1d', tick: createTickFn('Day', -1), smallTick: createTickFn('Day', -1)},
    {key: '12h', tick: createTickFn('Hour', -12), smallTick: createTickFn('Hour', -1)},
    {key: '6h', tick: createTickFn('Hour', -6), smallTick: createTickFn('Hour', -1)},
    {key: '3h', tick: createTickFn('Hour', -3), smallTick: createTickFn('Hour', -1)},
    {key: '1h', tick: createTickFn('Hour', -1), smallTick: createTickFn('Hour', -1)},
    {key: '15min', tick: createTickFn('Minute', -15), smallTick: createTickFn('Minute', -15)},
    {key: '5min', tick: createTickFn('Minute', -5), smallTick: createTickFn('Minute', -5)},
    {key: '1min', tick: createTickFn('Minute', -1), smallTick: createTickFn('Minute', -1)},
    {key: '20sec', tick: createTickFn('Second', -20), smallTick: createTickFn('Second', -20)}
  ];

  class TimeLogarithmicScaleChart {
    /**
     * @param {HTMLElement} el
     * @param {Array}       data    [{time: <Date>, value: <Number>}, ...]
     * @param {Object}      config
     */
    constructor(el, data, config) {
      this.el = el;
      this.data = data;
      this.config = Object.assign({}, DEFAULT_CONFIG, config || {});

      this._render();
      this.update(data);
    }

    _render() {
      const margin = this.config.margin;
      const {width: chartLayoutWidth, height: chartLayoutHeight} = this.el.getBoundingClientRect();

      this.width = (chartLayoutWidth - margin * 2);
      this.height = (chartLayoutHeight - margin * 2);

      this._renderChartLayout(chartLayoutWidth, chartLayoutHeight, margin);
    }

    update(sourceData) {
      const scaleXIntervals = this._generateScaleXIntervals(sourceData);

      const data = sourceData.filter(({time}) => +time >= +scaleXIntervals[0].value);

      const dataScaleX = this._getDataScaleX(scaleXIntervals);
      const dataScaleY = this._getDataScaleY(data);

      this._renderPath(data, dataScaleX, dataScaleY);
      this._renderXAxis(dataScaleX, scaleXIntervals);
      this._renderYAxis(dataScaleY);

      if (this.config.debug) {
        this._renderPoints(data, dataScaleX, dataScaleY);
      }
    }

    _generateScaleXIntervals(data) {
      const minTime = d3.min(data, ({time}) => time);
      const maxTime = d3.max(data, ({time}) => time);

      const intervals = [];

      for (let i = 0; i < INTERVALS.length; i++) {
        const interval = INTERVALS[i];
        const value = interval.tick(maxTime);
        if (+value > +minTime) {
          intervals.push(Object.assign({value}, interval));
        }
        if (interval.key === this.config.minInterval) {
          break;
        }
      }

      if (intervals.length === 0) {
        intervals.push({key: 'min', value: minTime});
      }

      intervals.push({key: 'max', value: maxTime});

      return intervals;
    }

    _getDataScaleXRange(domain) {
      return domain.map((v, i) => {
        if (i === 0) {
          return 0;
        } else if (i === (domain.length - 1)) {
          return this.width;
        } else {
          return Math.pow(this.width, Math.pow((i / domain.length), (1 / domain.length)));
        }
      });
    }

    _getDataScaleX(scaleXIntervals) {
      const domain = scaleXIntervals.map(({value}) => value);
      const range = this._getDataScaleXRange(domain);

      return d3.scaleTime()
        .domain(domain)
        .range(range);
    }

    _getDataScaleY(data) {
      return d3.scaleLinear()
        .domain([0, d3.max(data, ({value}) => value)])
        .range([this.height, 0]).nice();
    }

    _renderChartLayout(width, height, margin) {
      if (!this.chartLayout) {
        this.chartLayout = d3.select(this.el)
          .append('svg')
          .attr('width', width)
          .attr('height', height)
          .append('g')
          .attr('transform', `translate(${margin}, ${margin})`);
      }
    }

    _renderPath(data, dataScaleX, dataScaleY) {
      const firstRender = !this.path;
      const lineFn = d3.line()
        .curve(this.config.curve)
        .x((d) => dataScaleX(d.time))
        .y((d) => dataScaleY(d.value));

      if (firstRender) {
        this.path = this.chartLayout.append('path')
          .attr('stroke', this.config.stroke)
          .attr('stroke-width', this.config.strokeWidth)
          .attr('fill', 'none');

        const lineFn0 = d3.line()
          .curve(d3.curveCardinal.tension(0))
          .x(() => this.width)
          .y(() => this.height / 2);

        const lineFn1 = d3.line()
          .curve(d3.curveCardinal.tension(0))
          .x((d) => +dataScaleX(d.time))
          .y(() => this.height / 2);

        if (this.config.animation) {
          this.path
            .attr('d', lineFn0(data))
            .transition()
            .duration(500)
            .attr('d', lineFn1(data))
            .transition()
            .duration(500)
            .attr('d', lineFn(data));
        } else {
          this.path.attr('d', lineFn(data));
        }
      } else if (this.config.animation) {
        this.path
          .transition()
          .attr('d', lineFn(data));
      } else {
        this.path.attr('d', lineFn(data));
      }
    }

    _renderPoints(data, dataScaleX, dataScaleY) {
      const circles = this.chartLayout.selectAll('circle').data(data);

      circles.exit().remove();

      circles
        .enter()
        .append('circle')
        .merge(circles)
        .attr('fill', 'red')
        .attr('cx', ({time}) => dataScaleX(time))
        .attr('cy', ({value}) => dataScaleY(value))
        .attr('r', 1);
    }

    _renderXAxis(dataScaleX, xAxisIntervals) {
      // x axis
      if (!this._xAxisGroup) {
        this._xAxisGroup = this.chartLayout.append('g')
          .attr('transform', `translate(0,${this.height})`);
      }

      // x axis small ticks
      if (!this._xAxisSmallTicksGroup) {
        this._xAxisSmallTicksGroup = this.chartLayout.append('g')
          .attr('transform', `translate(0,${this.height})`)
      }

      // x axis grid
      if (!this._xAxisGridGroup) {
        this._xAxisGridGroup = this.chartLayout.append('g')
          .attr('transform', `translate(0,${this.height})`)
          .attr('stroke-opacity', 0.075)
          .attr('strocke', 'lightgrey')
          .attr('stroke-dasharray', '4,2');
      }

      const tickValues = [];
      const smallTickValues = [];

      xAxisIntervals.forEach(({value, smallTick}, index) => {
        tickValues.push(value);
        if (smallTick) {
          let tick = smallTick(value);
          while (xAxisIntervals[index - 1] && +tick > +xAxisIntervals[index - 1].value) {
            smallTickValues.push(tick);
            tick = smallTick(tick);
          }
        }
      });

      const xAxisTicks = d3.axisBottom(dataScaleX)
        .tickValues(tickValues)
        .tickFormat((value, index) => {
          const key = xAxisIntervals[index].key;
          switch (key) {
            case 'min':
              return d3.timeFormat('%Y-%m-%d')(value);
            case 'max':
              return d3.timeFormat('%H:%M:%S')(value);
            default :
              return (`-${key}`);
          }
        });

      const xAxisSmallTicks = d3.axisBottom(dataScaleX)
        .tickValues(smallTickValues)
        .tickSize(4)
        .tickFormat('');

      this._xAxisGroup.call(xAxisTicks);
      this._xAxisSmallTicksGroup.call(xAxisSmallTicks);
      this._xAxisGridGroup.call(xAxisTicks.tickSize(-this.height).tickFormat(''));
    }

    _renderYAxis(dataScaleY) {
      // y axis
      if (!this._yAxisGroup) {
        this._yAxisGroup = this.chartLayout.append('g');
      }

      // y axis grid
      if (!this._yAxisGridGroup) {
        this._yAxisGridGroup = this.chartLayout.append('g')
          .attr('stroke-opacity', 0.075)
          .attr('strocke', 'lightgrey')
          .attr('stroke-dasharray', '4,2');
      }

      const yAxisTicks = d3.axisLeft(dataScaleY);

      this._yAxisGroup.call(yAxisTicks.tickFormat(d3.format(this.config.yTickFormat)));
      this._yAxisGridGroup.call(yAxisTicks.tickSize(-this.width).tickFormat(''));
    }
  }

  //export
  window.TimeLogarithmicScaleChart = TimeLogarithmicScaleChart;
})(window);
