import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types'; //eslint-disable-line
const chartColors = ["#3366CC", "#DC3912", "#FF9900", "#109618", "#990099", "#3B3EAC", "#0099C6", "#DD4477", "#66AA00",
  "#B82E2E", "#316395", "#994499", "#22AA99", "#AAAA11", "#6633CC", "#E67300", "#8B0707", "#329262", "#5574A6", "#3B3EAC"]


export function renderChart(chatSpecs, chartConfig, fieldSpecs, cirucularChartType, records) {
  let rowLabels, groupChart, chartDatasetsValues, chatSpecsXaxisLabels;
  const selectedSummariseOption = R.filter(
    option => option.value === chartConfig.selectedSummariseOption,
    chartConfig.availableSummariseOptions
  );
  groupChart = R.groupBy(group => group[chartConfig.groupBy], records);
  chatSpecsXaxisLabels = R.map(
    record => {
      if (R.contains(chartConfig.groupBy, R.keys(record))) {
        return record[chartConfig.groupBy]
      }
      return null;
    },
    records
  );
  rowLabels = R.isNil(chatSpecsXaxisLabels) ? [] : R.keys(groupChart);
  chartDatasetsValues = R.contains(chartConfig.selectedChartType, cirucularChartType)
    ? renderCirucularChart(
      chartConfig.selectedCircularValueField, groupChart, chartConfig, rowLabels,
      fieldSpecs, selectedSummariseOption
    )
    : renderLinearChart(
      chartConfig.selectedLinearValueFields, groupChart, chartConfig, rowLabels,
      fieldSpecs, selectedSummariseOption
    );
  return {
    "type": chatSpecs.type,
    "options": chatSpecs.options,
    "labels": chartDatasetsValues.labels,
    "datasets": chartDatasetsValues.datasets
  }
}

function renderLinearChart(valueFields, groupChart, chartConfig, rowLabels,
                           fieldSpecs, selectedSummariseOption) {
  let chatSpecsYaxisValues, chartValues, groupValues, chartDatasets, filteredvalues, indexValues, labels;
  chatSpecsYaxisValues = R.map(value => getValuesForChart(value, valueFields), groupChart);
  chartValues = R.map(
    row => processValues(chatSpecsYaxisValues, row, valueFields, chartConfig.selectedSummariseOption),
    rowLabels
  );
  groupValues = R.addIndex(R.map)(
    (value, idx) => R.map(group => group[idx], chartValues),
    valueFields
  );
  chartDatasets = R.addIndex(R.map)(
    (values, idx) => processChartDataForLinear(valueFields, values, selectedSummariseOption, fieldSpecs, idx),
    groupValues
  );
  filteredvalues = R.addIndex(R.map)(
    (value, idx) => !R.isNil(value) ? idx : value,
    chartDatasets[0].data
  );
  indexValues = R.filter(
    value => !R.isNil(value),
    filteredvalues
  );
  labels = R.map(
    idx => rowLabels[idx] === "null" ? "No value" : rowLabels[idx],
    indexValues
  );
  return {
    "datasets": chartDatasets,
    "labels": labels
  };
}

function renderCirucularChart(valueField, groupChart, chartConfig, rowLabels, fieldSpecs, selectedSummariseOption) {
  let chatSpecsYaxisValues, chartValues, chartDatasets, filteredvalues, indexValues,
    labels, dataOmitedDataset, updatedValues, updatedDataset;
  chatSpecsYaxisValues = R.map(
    value => getValuesForChart(value, [valueField]),
    groupChart
  );
  chartValues = R.map(
    value => R.filter(v => v, value),
    R.map(
      row => processValues(chatSpecsYaxisValues, row, valueField, chartConfig.selectedSummariseOption),
      rowLabels
    )
  );
  chartDatasets = [processChartDataForCircular(valueField, chartValues, selectedSummariseOption, fieldSpecs)];
  filteredvalues = R.addIndex(R.map)(
    (value, idx) => !R.isNil(value) ? idx : value,
    chartDatasets[0].data
  );
  indexValues = R.filter(
    value => !R.isNil(value),
    filteredvalues
  );
  labels = R.map(
    idx => rowLabels[idx] === "null" ? "No value" : rowLabels[idx],
    indexValues
  );
  dataOmitedDataset = R.omit("data", chartDatasets[0]);
  updatedValues = R.filter(
    value => !R.isNil(value),
    chartDatasets[0].data
  );
  updatedDataset = [R.merge(dataOmitedDataset, {"data": updatedValues})];
  return {
    "datasets": updatedDataset,
    "labels": labels
  };
}

function processChartDataForCircular(valueField, values, selectedSummariseOption, fieldSpecs) {
  let valueLabel = R.map(
    i => i.label,
    R.filter(
      v => v.field === valueField,
      fieldSpecs
    )
  );
  return {
    // "label": selectedSummariseOption.length === 0
    //   ? "Sum of " + valueLabel
    //   : selectedSummariseOption[0].label + " of " + valueLabel,
    "label": valueLabel,
    "backgroundColor": chartColors,
    "data": R.map(value => value[0], values),
    "borderColor": R.map(chartColor => generateColorLuminance(chartColor, -0.3), chartColors),
    "hoverBackgroundColor": R.map(chartColor => generateColorLuminance(chartColor, 0.5), chartColors)
  };
}

function processChartDataForLinear(valueFields, value, selectedSummariseOption, fieldSpecs, idx) {
  let valueLabel = R.map(
    i => i.label,
    R.filter(
      v => v.field === valueFields[idx],
      fieldSpecs
    )
  );
  return {
    // "label": selectedSummariseOption.length === 0
    //   ? "Sum of " + valueLabel
    //   : selectedSummariseOption[0].label + " of " + valueLabel,
    "label": valueLabel,
    "backgroundColor": chartColors[idx % chartColors.length],
    "data": value,
    "minSize": 2,
    "borderColor": generateColorLuminance(chartColors[idx % chartColors.length], -0.3),
    "hoverBackgroundColor": generateColorLuminance(chartColors[idx % chartColors.length], 0.5)
  };
}

function getValuesForChart(values, valueFields) {
  let accessValueFields;
  const checkValueFields = R.isNil(valueFields) ? [] : valueFields;
  accessValueFields = R.map(
    value => R.map(
      valueField => R.isNil(value[valueField]) ? null : value[valueField],
      checkValueFields
    ),
    values
  );
  return accessValueFields;
}

function processValues(value, row, valueFields, selectedSummariseOption) {
  let values, summariseOption, summariseValues;
  summariseOption = selectedSummariseOption.toLowerCase();
  if (R.contains(summariseOption, ["sum", "average", "max", "min", "count"])) {
    summariseValues = R.addIndex(R.map)(
      (values, idx) => {
        let pairs = R.map(sumValue => sumValue[idx], value[row])
        switch (summariseOption) {
          case "sum":
            return R.sum(pairs);
          case "average":
            return R.mean(pairs);
          case "max":
            return R.reduce(R.max, -Infinity, pairs);
          case "min":
            return R.reduce(R.min, Infinity, pairs);
          case "count":
            return pairs.length;
          default:
            return R.sum(pairs);
        }
      },
      valueFields
    );
    values = summariseValues
  }
  return values;
}

function generateColorLuminance(hex, lum) {
  // validate hex string
  hex = String(hex).replace(/[^0-9a-f]/gi, '');
  if (hex.length < 6) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  lum = lum || 0;

  // convert to decimal and change luminosity
  var rgb = "#", c, i;
  for (i = 0; i < 3; i++) {
    c = parseInt(hex.substr(i * 2, 2), 16);
    c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
    rgb += ("00" + c).substr(c.length);
  }

  return rgb;
}
