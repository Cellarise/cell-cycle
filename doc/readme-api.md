## API
### Modules
<dl>
<dt><a href="#module_cell-cycle">cell-cycle</a> ⇒ <code>Object</code></dt>
<dd><p>The Cellarise Cycle framework.</p>
</dd>
<dt><a href="#module_utils/coverageStats">utils/coverageStats</a> ⇒ <code>Object</code></dt>
<dd><p>Coverage statistic utilities</p>
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

<a name="module_tasks/testTasks..test"></a>
#### `tasks/testTasks~test` ⇒ <code>through2</code>
A gulp build task to run test steps and calculate test coverage.
Test steps results will be output using spec reporter.

**Kind**: inner property of <code>[tasks/testTasks](#module_tasks/testTasks)</code>  
**Returns**: <code>through2</code> - stream  

-

*documented by [jsdoc-to-markdown](https://github.com/75lb/jsdoc-to-markdown)*.