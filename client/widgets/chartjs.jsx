import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import R from 'ramda';
import Chart from 'chart.js';

Chart.pluginService.register({
  beforeDraw: function beforeDraw(chart) {
    if (chart.config.options.elements.center) {
      //Get ctx from string
      var ctx = chart.chart.ctx;

      //Get options from the center object in options
      var centerConfig = chart.config.options.elements.center;
      var fontStyle = centerConfig.fontStyle || 'Arial';
      var txt = centerConfig.text;
      var color = centerConfig.color || '#000';
      var sidePadding = centerConfig.sidePadding || 20;
      var sidePaddingCalculated = (sidePadding/100) * (chart.innerRadius * 2)
      //Start with a base font of 30px
      ctx.font = "34px " + fontStyle;

      //Get the width of the string and also the width of the element minus 10 to give it 5px side padding
      var elementWidth = (chart.innerRadius * 2) - sidePaddingCalculated;
      var stringWidth = elementWidth * 2; //ctx.measureText(txt).width;

      // Find out how much the font can grow in width.
      var widthRatio = elementWidth / stringWidth;
      var newFontSize = Math.floor(34 * widthRatio);
      var elementHeight = (chart.innerRadius * 2);

      // Pick a new font size so it will not be larger than the height of label.
      var fontSizeToUse = Math.min(newFontSize, elementHeight);

      //Set font settings to draw it correctly.
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var centerX = ((chart.chartArea.left + chart.chartArea.right) / 2);
      var centerY = ((chart.chartArea.top + chart.chartArea.bottom) / 2);
      ctx.font = fontSizeToUse+"px " + fontStyle;
      ctx.fillStyle = color;

      //Draw text in center
      ctx.fillText(txt, centerX, centerY);
    }
  }
});
//Adapted from gor181/react-chartjs-2 Copyright (c) 2017 gor181

const ChartJS = createReactClass({

  propTypes: {
    data: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.func
    ]).isRequired,
    getDatasetAtEvent: PropTypes.func,
    getElementAtEvent: PropTypes.func,
    getElementsAtEvent: PropTypes.func,
    height: PropTypes.number,
    legend: PropTypes.object,
    onElementsClick: PropTypes.func,
    options: PropTypes.object,
    redraw: PropTypes.bool,
    type: PropTypes.oneOf(['doughnut', 'pie', 'line', 'bar', 'horizontalBar', 'radar', 'polarArea', 'bubble']),
    width: PropTypes.number
  },

  getDefaultProps() {
    return {
      legend: {
        display: true,
        position: 'bottom'
      },
      type: 'doughnut',
      height: 150,
      width: 300,
      redraw: true,
      options: {}
    };
  },

  UNSAFE_componentWillMount() {
    this.chart_instance = undefined;
  },

  componentDidMount() {
    this.renderChart();
  },

  componentDidUpdate() {
    if (this.props.redraw) {
      this.chart_instance.destroy();
      this.renderChart();
      return;
    }

    this.updateChart();
  },

  shouldComponentUpdate(nextProps) {
    const {
      //redraw,
      type,
      options,
      legend,
      height,
      width
    } = this.props;

    if (nextProps.redraw === true) {
      return true;
    }

    if (height !== nextProps.height || width !== nextProps.width) {
      return true;
    }

    if (type !== nextProps.type) {
      return true;
    }

    if (!R.equals(legend, nextProps.legend)) {
      return true;
    }

    if (!R.equals(options, nextProps.options)) {
      return true;
    }

    const nextData = this.transformDataProp(nextProps)
    return !R.equals(this.shadowDataProp, nextData);
  },

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.src !== this.props.src) {
      this.replace(nextProps.src);
    }
    if (nextProps.aspectRatio !== this.props.aspectRatio) {
      this.setAspectRatio(nextProps.aspectRatio);
    }
  },

  componentWillUnmount() {
    if (this.chart_instance) {
      // Destroy the chart, this makes sure events are cleaned up and do not leak
      this.chart_instance.destroy();
    }
  },

  transformDataProp(props) {
    const { data } = props;
    if (typeof(data) === "function") {
      const node = this.node;
      return data(node)
    } else {
      return data;
    }
  },

  // Chart.js directly mutates the data.dataset objects by adding _meta proprerty
  // this makes impossible to compare the current and next data changes
  // therefore we memoize the data prop while sending a fake to Chart.js for mutation.
  // see https://github.com/chartjs/Chart.js/blob/master/src/core/core.controller.js#L615-L617
  memoizeDataProps() {
    if (!this.props.data) {
      return;
    }

    const data = this.transformDataProp(this.props);

    this.shadowDataProp = {
      ...data,
      datasets: data.datasets && data.datasets.map(set => {
        return {
          ...set
        }
      })
    };

    return data;
  },

  updateChart() {
    const {options} = this.props;

    const data = this.memoizeDataProps(this.props);

    if (!this.chart_instance) return;

    if (options) {
      this.chart_instance.options = Chart.helpers.configMerge(this.chart_instance.options, options);
    }

    // Pipe datasets to chart instance datasets enabling
    // seamless transitions
    let currentDatasets = (this.chart_instance.config.data && this.chart_instance.config.data.datasets) || [];
    const nextDatasets = data.datasets || [];

    // Prevent charting of legend items that no longer exist
    while (currentDatasets.length > nextDatasets.length) {
      currentDatasets.pop();
    }

    nextDatasets.forEach((dataset, sid) => {
      if (currentDatasets[sid] && currentDatasets[sid].data) {
        currentDatasets[sid].data.splice(nextDatasets[sid].data.length);

        dataset.data.forEach((point, pid) => {
          currentDatasets[sid].data[pid] = nextDatasets[sid].data[pid];
        });

        const { data, ...otherProps } = dataset; //eslint-disable-line

        currentDatasets[sid] = {
          data: currentDatasets[sid].data,
          ...currentDatasets[sid],
          ...otherProps
        };
      } else {
        currentDatasets[sid] = nextDatasets[sid];
      }
    });

    const { datasets, ...rest } = data; //eslint-disable-line

    this.chart_instance.config.data = {
      ...this.chart_instance.config.data,
      ...rest
    };

    this.chart_instance.update();
  },

  renderChart() {
    const {options, type} = this.props;
    const node = this.node;
    const data = this.memoizeDataProps();

    this.chart_instance = new Chart(node, {
      type,
      data,
      options
    });
  },

  handleOnClick(event) {
    const instance = this.chart_instance;

    const {
      getDatasetAtEvent,
      getElementAtEvent,
      getElementsAtEvent,
      onElementsClick
    } = this.props;

    getDatasetAtEvent && getDatasetAtEvent(instance.getDatasetAtEvent(event), event);
    getElementAtEvent && getElementAtEvent(instance.getElementAtEvent(event), event);
    getElementsAtEvent && getElementsAtEvent(instance.getElementsAtEvent(event), event);
    onElementsClick && onElementsClick(instance.getElementsAtEvent(event), event); // Backward compatibility
  },

  render() {
    const {height, width} = this.props;

    return (
      <canvas
        ref={node => this.node = node}
        height={height}
        width={width}
        onClick={this.handleOnClick}
      />
    );
  }
});

export default ChartJS;
