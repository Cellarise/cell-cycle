import React from 'react'; //eslint-disable-line
import R from 'ramda';
import {appendToWindowLocationHashPageStr, setWindowLocationHash} from "../libraries/router";
import DropdownBox from '../collection/dropdownBox.jsx';


function ActionPanel({actionPanelConfig, disabled, authorised, tooltip}) {
  let _disabled = disabled;
  let _tooltip = tooltip;
  if (authorised === false) {
    _disabled = true;
    _tooltip = "You are not authorised to create new applications";
  }
  return (
    <div className="row margin-left-0">
      <div className="col-xs-12">
        {R.addIndex(R.map)((applicationType, idx) => {
          const dropdownRecords = [
            {
              "label": applicationType.buttonLabel,
              "action": () => {
                setWindowLocationHash({
                  "page": appendToWindowLocationHashPageStr(applicationType.pagePartial)
                });
              }
            }
          ];
          return (
            <div key={idx} className={applicationType.columnClass}
                 aria-disabled={_disabled}
                 onClick={() => {
                   _disabled ? null :
                     setWindowLocationHash({
                       "page": appendToWindowLocationHashPageStr(applicationType.pagePartial)
                     });
                 }}>
              <div className="panel panel-menu-card card-hover"
                   title={_disabled && _tooltip ? _tooltip : null}
                   data-toggle={_disabled && _tooltip ? "tooltip" : null}
                   data-placement={"bottom"}
                   style={{
                     "cursor": _disabled ? "not-allowed" : "pointer",
                     "minHeight": R.defaultTo(175, applicationType.minHeight)
                   }}>
                <div className="panel-heading">
                  <div className="row">
                    <div className="col-xs-2" style={{"marginTop": "2%"}}>
                      <div style={{"height": "3em", "width": "3em", "color": "#03BCF4"}}
                           className={applicationType.icon}/>
                    </div>
                    <div className="col-xs-8">
                      <div className="h4 text-lg"
                           style={_disabled ? {"color": "#969a9c"} : null}>{applicationType.title}</div>
                      <span style={_disabled ? {"color": "#969a9c"} : null}>{applicationType.description}</span>
                    </div>
                    <div className="col-xs-2" style={{"marginTop": "10%"}}>
                        <span style={_disabled ? {"color": "#969a9c"} : {"color": "#03BCF4"}}
                              className="glyphicon mdi-3x mdi-chevron-right"/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }, actionPanelConfig)}
      </div>
    </div>
  );

}

module.exports = ActionPanel;
