"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import R from 'ramda';
import SelectBox from '../forms/selectBox.jsx';
import SelectBoxV2 from '../collection/selectBox.jsx';
import {$} from '../globals';
import Button from '../forms/button.jsx';
import {renderChart} from '../utils/chartUtils';
import Chart from '../widgets/chartjs.jsx';
import {createSyntheticEvent, getValue} from '../utils/domDriverUtils';


/**
 * ViewChart component
 * @param {object} props - component properties
 * @return {React.Element} react element
 */
function ViewChart(props) {
  const {collection, onCollectionPropChange} = props;
  const selectedQuerySpec = collection.get('selectedQuerySpec');
  const fieldSpecs = collection.get('fieldSpecs');
  const chartSpecs = selectedQuerySpec.chart;
  const chartConfig = chartSpecs.chartConfig;
  const cirucularChartType = ["pie","polarArea","doughnut"];
  const chatTypeGroupList =  R.filter(fieldSpec => fieldSpec.chartFieldType === "group", fieldSpecs);
  const chatTypeValueList =  R.filter(fieldSpec => fieldSpec.chartFieldType === "value", fieldSpecs)
  const records = collection.get('records');
  const chart = renderChart(chartSpecs, chartConfig, fieldSpecs, cirucularChartType, records);
  const chartType = R.contains(chartConfig.selectedChartType, ["stackedBar", "stackedHorizontalBar"])
    ? chartConfig.selectedChartType === "stackedBar" ? "bar" : "horizontalBar"
    : chartConfig.selectedChartType;
  return (
    <div className="row" style={{marginBottom: "2%", width: "100%"}}>
      <div className={$(window).width() > 1280 ? "container": "container-fluid"}>
        <div className="col-md-12">
          <div className="form">
            <div className="col-md-3">
              <SelectBox
                id={"id" + "-chartType"}
                name="chartType"
                label="Chart type"
                value={chartConfig.selectedChartType}
                items={chartConfig.availableChartTypes}
                valueField="value"
                displayField="label"
                onChange={(event) => {
                  onCollectionPropChange(createSyntheticEvent("selectedChartType", getValue(event)));
                }}
                standalone={true}
              />
            </div>
            <div className="col-md-2">
              <SelectBox
                id={"id" + "-groupBy"}
                name="groupBy"
                label="Group by"
                value={chartConfig.groupBy}
                items={R.map(list =>
                    ({"value": list.field, "label": list.label}),
                  chatTypeGroupList
                )}
                valueField="value"
                displayField="label"
                onChange={(event) => {
                  onCollectionPropChange(createSyntheticEvent("groupBy", getValue(event)));
                }}
                standalone={true}
              />
            </div>
            <div className="col-md-3">
              {R.contains(chartConfig.selectedChartType, cirucularChartType) ?
                <SelectBox
                  id={"id" + "-filterChartBy"}
                  name="filterChartBy"
                  label="Value column"
                  value={chartConfig.selectedCircularValueField}
                  items={R.map(list =>
                      ({"value": list.field, "label": list.label}),
                    chatTypeValueList
                  )}
                  valueField="value"
                  displayField="label"
                  onChange={(event) => {
                    onCollectionPropChange(createSyntheticEvent("selectedCircularValueField", getValue(event)));
                  }}
                  standalone={true}
                />
                :
                <SelectBoxV2
                  name="filterChartBy"
                  label="Value columns"
                  value={chartConfig.selectedLinearValueFields}
                  onChange={(event) => {
                    onCollectionPropChange(createSyntheticEvent("selectedLinearValueFields", getValue(event)));
                  }}
                  onBlur={() => (null)}
                  records={R.map(list =>
                      ({"value": list.field, "label": list.label}),
                    chatTypeValueList
                  )}
                  idFieldName="value"
                  displayFieldName="label"
                  boxType="multiSelect"
                />
              }
            </div>
            <div className="col-md-2">
              <SelectBox
                id={"id" + "-summerize"}
                name="summerize"
                label="Value function"
                value={chartConfig.selectedSummariseOption}
                items={chartConfig.availableSummariseOptions}
                valueField="value"
                displayField="label"
                onChange={(event) => {
                  onCollectionPropChange(createSyntheticEvent("selectedSummariseOption", getValue(event)));
                }}
              />
            </div>
            <div className="col-md-2">
              <Button
                name="saveChart"
                label="Save"
                style={{marginTop: "2em", bottom: "1em"}}
                className={"btn-sm btn-primary"}
                onClick={onCollectionPropChange}
              />
            </div>
          </div>
        </div>
        <div className="col-xs-12">
            <Chart
              type={chartType}
              options={chart.options}
              data={{
                labels: chart.labels,
                datasets: chart.datasets
              }}
            />
        </div>
      </div>
    </div>
  );
}




ViewChart.displayName = "ViewChart";
ViewChart.propTypes = {
  "collection": PropTypes.object.isRequired,
  "onCollectionPropChange": PropTypes.func,
  "modal": PropTypes.string,
  "onClick": PropTypes.func,
  "onCustomLabel": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ])
};
/**
 * @ignore
 */
module.exports = ViewChart;
