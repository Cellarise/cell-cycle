# cell-cycle
[![view on npm](http://img.shields.io/npm/v/cell-cycle.svg?style=flat)](https://www.npmjs.org/package/cell-cycle)
[![npm module downloads per month](http://img.shields.io/npm/dm/cell-cycle.svg?style=flat)](https://www.npmjs.org/package/cell-cycle)
[![Dependency status](https://david-dm.org/Cellarise/cell-cycle.svg?style=flat)](https://david-dm.org/Cellarise/cell-cycle)
[![Build Status](https://travis-ci.org/Cellarise/cell-cycle.svg?branch=master)](https://travis-ci.org/Cellarise/cell-cycle)
[![Test Coverage](https://img.shields.io/badge/coverage -75%25_skipped:0%25-yellow.svg?style=flat)](https://www.npmjs.org/package/cell-cycle)

> The Cellarise Cycle framework.


## Installation

````sh
npm install cell-cycle --save
````

## Configuration




## API
### Modules
<dl>
<dt><a href="#module_cell-cycle">cell-cycle</a> ⇒ <code>Object</code></dt>
<dd><p>The Cellarise Cycle framework.</p>
</dd>
<dt><a href="#module_utils/coverageStats">utils/coverageStats</a> ⇒ <code>Object</code></dt>
<dd><p>Coverage statistic utilities</p>
</dd>
<dt><a href="#module_tasks/codeAnalysisTasks">tasks/codeAnalysisTasks</a></dt>
<dd><p>A module to add gulp tasks which execute static code analysis.</p>
</dd>
<dt><a href="#module_tasks/coverageStatsTasks">tasks/coverageStatsTasks</a></dt>
<dd><p>A module to add a gulp task which calculates coverage stats from the Istanbul reporter json-summary.</p>
</dd>
<dt><a href="#module_tasks/defaultTasks">tasks/defaultTasks</a></dt>
<dd><p>A module to add a gulp task which executes the default task.</p>
</dd>
<dt><a href="#module_tasks/testTasks">tasks/testTasks</a></dt>
<dd><p>A module to add gulp tasks which run test steps.</p>
</dd>
</dl>
<a name="module_cell-cycle"></a>
### cell-cycle ⇒ <code>Object</code>
The Cellarise Cycle framework.
**Returns**: <code>Object</code> - - return description  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| opts | <code>Object</code> |  | optional options |
| [opts.modulePrefix] | <code>Object</code> | <code>&#x27;gulp-&#x27;</code> | load dependencies that start with this prefix in package.json. |

**Example**  
```none
Usage:
```
var cell-cycle = require('cell-cycle');
```

```

-

<a name="module_utils/coverageStats"></a>
### utils/coverageStats ⇒ <code>Object</code>
Coverage statistic utilities

**Returns**: <code>Object</code> - coverage statistics utility functions  

| Param | Type | Description |
| --- | --- | --- |
| logger | <code>bunyan</code> | A logger matching the bunyan API |


* [utils/coverageStats](#module_utils/coverageStats) ⇒ <code>Object</code>
  * [`.addStats(collection, pkg)`](#module_utils/coverageStats.addStats)
  * [`.deleteStats(collection)`](#module_utils/coverageStats.deleteStats)
  * [`.badgeColour(collection, stat, watermarks)`](#module_utils/coverageStats.badgeColour)
  * [`.calculateCoverageStats(coverageReport, packageJSON)`](#module_utils/coverageStats.calculateCoverageStats) ⇒ <code>Object</code>


-

<a name="module_utils/coverageStats.addStats"></a>
#### `utils/coverageStats.addStats(collection, pkg)`
Helper function to append statistic properties from the provided collection to the provided package.json

**Kind**: static method of <code>[utils/coverageStats](#module_utils/coverageStats)</code>  

| Param | Type | Description |
| --- | --- | --- |
| collection | <code>Object</code> | a collection of statistic properties |
| pkg | <code>Object</code> | package.json object |


-

<a name="module_utils/coverageStats.deleteStats"></a>
#### `utils/coverageStats.deleteStats(collection)`
Helper function to delete total, covered and skipped statistic properties from a collection

**Kind**: static method of <code>[utils/coverageStats](#module_utils/coverageStats)</code>  

| Param | Type | Description |
| --- | --- | --- |
| collection | <code>Object</code> | a collection of statistic properties |


-

<a name="module_utils/coverageStats.badgeColour"></a>
#### `utils/coverageStats.badgeColour(collection, stat, watermarks)`
Helper function to determine badge colour

**Kind**: static method of <code>[utils/coverageStats](#module_utils/coverageStats)</code>  

| Param | Type | Description |
| --- | --- | --- |
| collection | <code>Object</code> | a collection of statistic properties |
| stat | <code>Object</code> | a statistic from the collection to calculate the badge for |
| watermarks | <code>Object</code> | the high and low watermarks for each statistic in collection |


-

<a name="module_utils/coverageStats.calculateCoverageStats"></a>
#### `utils/coverageStats.calculateCoverageStats(coverageReport, packageJSON)` ⇒ <code>Object</code>
Calculate coverage stats from an istanbul coverage.json reportand append to provided package.json config.coverage.stats property.The coverage stats include an overall coverage percentage and badge colour.

**Kind**: static method of <code>[utils/coverageStats](#module_utils/coverageStats)</code>  
**Returns**: <code>Object</code> - updated package.json object  

| Param | Type | Description |
| --- | --- | --- |
| coverageReport | <code>Object</code> | the istanbul generated coverage.json report object |
| packageJSON | <code>Object</code> | the package.json object |


-

<a name="module_tasks/codeAnalysisTasks"></a>
### tasks/codeAnalysisTasks
A module to add gulp tasks which execute static code analysis.


| Param | Type | Description |
| --- | --- | --- |
| gulp | <code>Gulp</code> | The gulp module |
| context | <code>Object</code> | An object containing the following properties: |
| context.cwd | <code>String</code> | The current working directory |
| context.package | <code>Object</code> | The package.json for the module |
| context.argv | <code>Array</code> | The arguments past to the gulp task |
| context.logger | <code>bunyan</code> | A logger matching the bunyan API |


-

<a name="module_tasks/codeAnalysisTasks..code_analysis"></a>
#### `tasks/codeAnalysisTasks~code_analysis` ⇒ <code>through2</code>
A gulp build task to execute static code analysis on the files at `package.json:directories.lib`.
The report results are saved to `package.json:directories.reports`

**Kind**: inner property of <code>[tasks/codeAnalysisTasks](#module_tasks/codeAnalysisTasks)</code>  
**Returns**: <code>through2</code> - stream  

-

<a name="module_tasks/coverageStatsTasks"></a>
### tasks/coverageStatsTasks
A module to add a gulp task which calculates coverage stats from the Istanbul reporter json-summary.


| Param | Type | Description |
| --- | --- | --- |
| gulp | <code>Gulp</code> | The gulp module |
| context | <code>Object</code> | An object containing the following properties: |
| context.cwd | <code>String</code> | The current working directory |
| context.package | <code>json</code> | The package.json for the module |
| context.argv | <code>Array</code> | The arguments past to the gulp task |
| context.logger | <code>bunyan</code> | A logger matching the bunyan API |


-

<a name="module_tasks/coverageStatsTasks..coverage_stats"></a>
#### `tasks/coverageStatsTasks~coverage_stats` ⇒ <code>through2</code>
A gulp build task to calculate coverage stats from the Istanbul reporter json-summary.
Coverage stats are appended to package.json config.coverage.stats property.
The coverage stats include an overall coverage percentage and badge colour.

**Kind**: inner property of <code>[tasks/coverageStatsTasks](#module_tasks/coverageStatsTasks)</code>  
**Returns**: <code>through2</code> - stream  

-

<a name="module_tasks/defaultTasks"></a>
### tasks/defaultTasks
A module to add a gulp task which executes the default task.


| Param | Type | Description |
| --- | --- | --- |
| gulp | <code>Gulp</code> | The gulp module |


-

<a name="module_tasks/defaultTasks..default"></a>
#### `tasks/defaultTasks~default` : <code>Gulp</code>
A gulp build task to run the default tasks.
The following tasks are executed in sequence: ["test"]
The sequence works by piping each task to the next.

**Kind**: inner property of <code>[tasks/defaultTasks](#module_tasks/defaultTasks)</code>  

| Param | Type | Description |
| --- | --- | --- |
| cb | <code>function</code> | callback |


-

<a name="module_tasks/testTasks"></a>
### tasks/testTasks
A module to add gulp tasks which run test steps.


| Param | Type | Description |
| --- | --- | --- |
| gulp | <code>Gulp</code> | The gulp module |
| context | <code>Object</code> | An object containing the following properties: |
| context.cwd | <code>String</code> | The current working directory |
| context.package | <code>Object</code> | The package.json for the module |
| context.argv | <code>Array</code> | The arguments past to the gulp task |
| context.logger | <code>bunyan</code> | A logger matching the bunyan API |


* [tasks/testTasks](#module_tasks/testTasks)
  * [`~instrument`](#module_tasks/testTasks..instrument) ⇒ <code>through2</code>
  * [`~test_cover`](#module_tasks/testTasks..test_cover) ⇒ <code>through2</code>
  * [`~test_cover`](#module_tasks/testTasks..test_cover) ⇒ <code>through2</code>
  * [`~test_cover`](#module_tasks/testTasks..test_cover) ⇒ <code>through2</code>
  * [`~write_coverage`](#module_tasks/testTasks..write_coverage) ⇒ <code>through2</code>
  * [`~test`](#module_tasks/testTasks..test) ⇒ <code>through2</code>


-

<a name="module_tasks/testTasks..instrument"></a>
#### `tasks/testTasks~instrument` ⇒ <code>through2</code>
A gulp build task to instrument files.
Istanbul will override the node require() function to redirect to the instrumented files.

**Kind**: inner property of <code>[tasks/testTasks](#module_tasks/testTasks)</code>  
**Returns**: <code>through2</code> - stream  

-

<a name="module_tasks/testTasks..test_cover"></a>
#### `tasks/testTasks~test_cover` ⇒ <code>through2</code>
A gulp build task to run test steps and calculate test coverage.
Test steps results will be output using mocha-bamboo-reporter-bgo reporter.
This task executes the Instrument task as a prerequisite.

**Kind**: inner property of <code>[tasks/testTasks](#module_tasks/testTasks)</code>  
**Returns**: <code>through2</code> - stream  

-

<a name="module_tasks/testTasks..test_cover"></a>
#### `tasks/testTasks~test_cover` ⇒ <code>through2</code>
A gulp build task to run test steps and calculate test coverage (but not output test coverage to prevent
gulp-istanbul issues with webdriverIO).
Test steps results will be output using mocha-bamboo-reporter-bgo reporter.
This task executes the Instrument task as a prerequisite.

**Kind**: inner property of <code>[tasks/testTasks](#module_tasks/testTasks)</code>  
**Returns**: <code>through2</code> - stream  

-

<a name="module_tasks/testTasks..test_cover"></a>
#### `tasks/testTasks~test_cover` ⇒ <code>through2</code>
A gulp build task to run test steps and calculate test coverage (but not output test coverage to prevent
gulp-istanbul issues with webdriverIO).
Test steps results will be output using mocha-bamboo-reporter-bgo reporter.
This task executes the Instrument task as a prerequisite.

**Kind**: inner property of <code>[tasks/testTasks](#module_tasks/testTasks)</code>  
**Returns**: <code>through2</code> - stream  

-

<a name="module_tasks/testTasks..write_coverage"></a>
#### `tasks/testTasks~write_coverage` ⇒ <code>through2</code>
A gulp build task to write coverage.

**Kind**: inner property of <code>[tasks/testTasks](#module_tasks/testTasks)</code>  
**Returns**: <code>through2</code> - stream  

-

<a name="module_tasks/testTasks..test"></a>
#### `tasks/testTasks~test` ⇒ <code>through2</code>
A gulp build task to run test steps and calculate test coverage.
Test steps results will be output using spec reporter.

**Kind**: inner property of <code>[tasks/testTasks](#module_tasks/testTasks)</code>  
**Returns**: <code>through2</code> - stream  

-

*documented by [jsdoc-to-markdown](https://github.com/75lb/jsdoc-to-markdown)*.


# Changelog

<table style="width:100%;border-spacing:0px;border-collapse:collapse;margin:0px;padding:0px;border-width:0px;">
  <tr>
    <th style="width:20px;text-align:center;"></th>
    <th style="width:80px;text-align:center;">Type</th>
    <th style="width:80px;text-align:left;">ID</th>
    <th style="text-align:left;">Summary</th>
  </tr>
    
<tr>
        <td colspan=4><strong>Version: 0.0.1 - released 2016-08-12</strong></td>
      </tr>
        
<tr>
            <td style="width:20px;padding:0;margin:0;text-align:center;"><img src="https://jira.nhvr.net:80/secure/viewavatar?size=xsmall&amp;avatarId=10418&amp;avatarType=issuetype"/></td>
            <td style="width:80px;text-align:left;">Non-functional</td>
            <td style="width:80px;text-align:left;">CYCLE-2</td>
            <td><p>Package: Update package dependencies</p><p></p></td>
          </tr>
        
    
</table>



# License

MIT License (MIT). All rights not explicitly granted in the license are reserved.

Copyright (c) 2015 John Barry
## Dependencies
[asap@2.0.4](&quot;git+https://github.com/kriskowal/asap&quot;) - &quot;MIT&quot;, [bowser@1.4.4](&quot;git+https://github.com/ded/bowser&quot;) - &quot;MIT&quot;, [cell-cycle@0.0.0](&quot;https://github.com/Cellarise/cell-cycle&quot;) - &quot;MIT License (MIT)&quot;, [classnames@2.2.5](&quot;git+https://github.com/JedWatson/classnames&quot;) - &quot;MIT&quot;, [core-js@1.2.7](&quot;git+https://github.com/zloirock/core-js&quot;) - &quot;MIT&quot;, [encoding@0.1.12](&quot;git+https://github.com/andris9/encoding&quot;) - &quot;MIT&quot;, [fbjs@0.8.3](&quot;git+https://github.com/facebook/fbjs&quot;) - &quot;BSD-3-Clause&quot;, [iconv-lite@0.4.13](&quot;https://github.com/ashtuchkin/iconv-lite&quot;) - &quot;MIT&quot;, [immutable@3.8.1](&quot;https://github.com/facebook/immutable-js&quot;) - &quot;BSD-3-Clause&quot;, [is-stream@1.1.0](&quot;git+https://github.com/sindresorhus/is-stream&quot;) - &quot;MIT&quot;, [isomorphic-fetch@2.2.1](&quot;git+https://github.com/matthew-andrews/isomorphic-fetch&quot;) - &quot;MIT&quot;, [js-tokens@1.0.3](&quot;git+https://github.com/lydell/js-tokens&quot;) - &quot;MIT&quot;, [loose-envify@1.2.0](&quot;https://github.com/zertosh/loose-envify&quot;) - &quot;MIT&quot;, [moment@2.14.1](&quot;git+https://github.com/moment/moment&quot;) - &quot;MIT&quot;, [node-fetch@1.6.0](&quot;git+https://github.com/bitinn/node-fetch&quot;) - &quot;MIT&quot;, [object-assign@4.1.0](&quot;git+https://github.com/sindresorhus/object-assign&quot;) - &quot;MIT&quot;, [promise@7.1.1](&quot;git+https://github.com/then/promise&quot;) - &quot;MIT&quot;, [ramda@0.22.1](&quot;https://github.com/ramda/ramda&quot;) - &quot;MIT&quot;, [react@15.3.0](&quot;git+https://github.com/facebook/react&quot;) - &quot;BSD-3-Clause&quot;, [ua-parser-js@0.7.10](&quot;git+https://github.com/faisalman/ua-parser-js&quot;) - [&quot;GPLv2&quot;,&quot;MIT&quot;], [whatwg-fetch@1.0.0](&quot;git+https://github.com/github/fetch&quot;) - &quot;MIT&quot;, 
*documented by [npm-licenses](http://github.com/AceMetrix/npm-license.git)*.

