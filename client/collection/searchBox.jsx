"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class'
import R from 'ramda';
import themeable from 'react-themeable';
import TextBox from '../forms/textBox.jsx';
import Button from '../forms/button.jsx';
import {createSyntheticEvent} from '../utils/domDriverUtils';
import {eventHandler} from '../utils/viewUtils';
import {$} from '../globals';

/**
 * Based on search component module react-search - https://github.com/StevenIseki/react-search
 */
module.exports = createReactClass({
  "displayName": "SearchBox",
  "propTypes": {
    "onRenderResetJustClickedOnSuggestion": PropTypes.bool, //Flag if justClickedOnSuggestion is reset on rerender
    "name": PropTypes.string,                 // Name to reference this control (defaults to this.props.label)
    "label": PropTypes.string.isRequired,
    "searchStore": PropTypes.object,          // Search store has a search object with configuration and records
    "actions": PropTypes.object,              // Required if search store provided
    "placeholder": PropTypes.string,
    "records": PropTypes.array,
    "unfocussedValue": PropTypes.string,      //the value to display if the control is unfocussed
    "selectTextOnFocus": PropTypes.bool,      //flag to select the text on focus
    "triggerSearchOnFocus": PropTypes.bool,
    "selectSuggestionOnFocus": PropTypes.bool,
    "loading": PropTypes.bool,
    "onChange": PropTypes.func,
    "onFocus": PropTypes.func.isRequired,
    "onBlur": PropTypes.func.isRequired,
    "showDropdownButton": PropTypes.bool,
    "showAsDropdown": PropTypes.bool,
    "alwaysExpanded": PropTypes.bool,
    "showResults": PropTypes.bool,
    "suggestionHref": PropTypes.func,      // Function that creates href on suggestion link item
    "value": PropTypes.string,             // Controlled value of the selected suggestion
    "addonBefore": PropTypes.object,       // Element to add before the input box e.g. magnify icon
    "addonAfter": PropTypes.object,        // Element to add before the input box e.g. magnify icon
    "suggestionRenderer": PropTypes.func,  // Function that renders a given suggestion (must be implemented when
    // suggestions are objects)
    "suggestionValue": PropTypes.func,     // Function that maps suggestion object to input value (must be
    // implemented when suggestions are objects)
    "showWhen": PropTypes.func,            // Function that determines whether to show suggestions or not
    "onSuggestionSelected": PropTypes.func,// This function is called when suggestion is selected via mouse click
    // or Enter
    "onSuggestionFocused": PropTypes.func, // This function is called when suggestion is focused via mouse hover
    // or Up/Down keys
    "onSuggestionUnfocused": PropTypes.func,  // This function is called when suggestion is unfocused via mouse
    // hover or Up/Down keys
    "onReset": PropTypes.func,                // This function is called when clear button pressed
    "id": PropTypes.string,                   // Used in aria-* attributes. If multiple Autosuggest's are rendered
    // on a page, they must have unique ids.
    "scrollBar": PropTypes.bool,           // Set it to true when the suggestions container can have a scroll bar
    "theme": PropTypes.object              // Custom theme. See: https://github.com/markdalgleish/react-themeable
  },
  "getDefaultProps": function getDefaultProps() {
    return {
      "onRenderResetJustClickedOnSuggestion": true,
      "resetSuggestionStateOnSelect": true,
      "setUnfocussedOnSelect": false,
      "showWhen": input => (R.is(Number, input) ? !R.isNil(input) : input && input.trim().length > 0),
      "showDropdownButton": false,
      "showAsDropdown": true,
      "alwaysExpanded": false,
      "onSuggestionSelected": () => {},
      "onSuggestionFocused": () => {},
      "onSuggestionUnfocused": () => {},
      "onChange": () => {},
      "onFocus": () => {},
      "onBlur": () => {},
      "records": [],
      "selectSuggestionOnFocus": false,
      "showResults": true,
      "selectTextOnFocus": false,
      "triggerSearchOnFocus": false,
      "id": '1',
      "scrollBar": false,
      "theme": {
        "root": 'react-autosuggest',
        "rootExpanded": 'react-autosuggest',
        "suggestions": 'react-autosuggest__suggestions',
        "suggestion": 'react-autosuggest__suggestion',
        "suggestionIsFocused": 'react-autosuggest__suggestion--focused',
        "suggestionIsDisabled": 'react-autosuggest__suggestion--disabled',
        "suggestionIsSelected": 'react-autosuggest__suggestion--selected',
        "suggestionIsSelectedFocussed": 'react-autosuggest__suggestion--selectedFocused',
        "scrollable": 'react-autosuggest-scroll'
      },
      "addonBefore": (<span className="glyphicon mdi-magnify mdi-lg"/>)
    };
  },
  "mouseOutsideDiv": false,
  "lastSuggestionsInputValue": null, // Helps to deal with delayed requests
  "justUnfocused": false, // Helps to avoid calling onSuggestionUnfocused twice when mouse is moving between suggestions
  "justClickedOnSuggestion": false, // Helps not to call inputAttributes.onBlur
  // and showSuggestions() when suggestion is clicked.
  // Also helps not to call handleValueChange() in
  // componentWillReceiveProps() when suggestion is clicked.
  "justPressedUpDown": false, // Helps not to call handleValueChange() in
  // componentWillReceiveProps() when Up or Down is pressed.
  "justPressedEsc": false, // Helps not to call handleValueChange() in
  // componentWillReceiveProps() when ESC is pressed.
  "getInitialState": function getInitialState() {
    return {
      "value": this.props.value || '',
      "inputFocussed": false,
      "suggestions": null,
      "focusedSuggestionIndex": null, // Index
      "valueBeforeUpDown": null       // When user interacts using the Up and Down keys,
      // this field remembers input's value prior to interaction in order to revert back if ESC hit.
      // See: http://www.w3.org/TR/wai-aria-practices/#autocomplete
    };
  },
  UNSAFE_componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    if ((nextProps.records !== this.props.records)
      && this.state.inputFocussed
      && !this.justUnfocused
      && !this.justClickedOnSuggestion
      && !this.justPressedUpDown
      && !this.justPressedEsc) {
      this.setSuggestionsState(nextProps.records, this.props.resetSuggestionStateOnSelect);
    }
    //if (nextProps.value !== inputValue &&
    if (nextProps.value !== this.props.value
      && (this.state.inputFocussed || !nextProps.unfocussedValue)
      //&& !this.justClickedOnSuggestion
      && !this.justPressedUpDown
      && !this.justPressedEsc) {
      this.handleValueChange(nextProps.value);
    }
    if (!this.state.inputFocussed && nextProps.unfocussedValue) {
      this.handleValueChange(nextProps.unfocussedValue);
    }
  },
  "setSuggestionsState": function setSuggestionsState(suggestions, reset) {
    const _reset = R.defaultTo(true, reset);
    if (_reset) {
      this.setState({
        "suggestions": suggestions,
        "focusedSuggestionIndex": null,
        "valueBeforeUpDown": null
      });
    } else {
      this.setState({
        "suggestions": suggestions
      });
    }
  },
  "suggestionsExist": function suggestionsExist(suggestions) {
    return suggestions !== null && suggestions.length > 0;
  },
  "showSuggestions": function showSuggestions(input) {
    this.lastSuggestionsInputValue = input || "";

    if (!this.props.showWhen(input)) {
      this.setSuggestionsState(null);
    } else if (!this.state.value || this.state.value.length === 0) {
      this.setSuggestionsState(null);
    } else if (!this.suggestionsFn) {
      this.setSuggestionsState(this.props.records);
    } else {
      this.suggestionsFn(input, (error, suggestions) => {
        // If input value changed, suggestions are not relevant anymore.
        if (this.lastSuggestionsInputValue !== input) {
          return;
        }

        if (error) {
          throw error;
        } else {
          if (!this.suggestionsExist(suggestions)) {
            suggestions = null;
          }

          this.setSuggestionsState(suggestions);
        }
      });
    }
  },
  "suggestionIsFocused": function suggestionIsFocused() {
    return this.state.focusedSuggestionIndex !== null;
  },
  "getSuggestion": function getSuggestion(suggestionIndex) {
    return this.props.records[suggestionIndex];
  },
  "getFocusedSuggestion": function getFocusedSuggestion() {
    if (this.suggestionIsFocused()) {
      return this.getSuggestion(this.state.focusedSuggestionIndex);
    }
    return null;
  },
  "getSuggestionValue": function getSuggestionValue(suggestionIndex) {
    const suggestion = this.getSuggestion(suggestionIndex);

    if (typeof suggestion === 'object') {
      if (this.props.suggestionValue) {
        return this.props.suggestionValue(suggestion);
      }
      throw new Error('When <suggestion> is an object, you must implement the suggestionValue() function to ' +
        'specify how to set input\'s value when suggestion selected.');
    } else {
      return suggestion.toString();
    }
  },
  "onSuggestionUnfocused": function onSuggestionUnfocused() {
    const focusedSuggestion = this.getFocusedSuggestion();
    if (focusedSuggestion !== null && !this.justUnfocused) {
      this.props.onSuggestionUnfocused(focusedSuggestion);
      this.justUnfocused = true;
    }
  },
  "onSuggestionFocused": function onSuggestionFocused(suggestionIndex) {
    this.onSuggestionUnfocused();
    const suggestion = this.getSuggestion(suggestionIndex);
    this.props.onSuggestionFocused(suggestion);
    this.justUnfocused = false;
    if (this.props.selectSuggestionOnFocus === true) {
      this.props.onSuggestionSelected(suggestion);
    }
  },
  "scrollToElement": function scrollToElement(container, element, alignTo) {
    if (alignTo === 'bottom') {
      const scrollDelta = element.offsetTop +
        element.offsetHeight -
        container.scrollTop -
        container.offsetHeight;

      if (scrollDelta > 0) {
        container.scrollTop += scrollDelta;
      }
    } else {
      const scrollDelta = container.scrollTop -
        element.offsetTop;

      if (scrollDelta > 0) {
        container.scrollTop -= scrollDelta;
      }
    }
  },
  "scrollToSuggestion": function scrollToSuggestion(direction, suggestionIndex) {
    let alignTo = (direction === 'down' ? 'bottom' : 'top');
    const suggestions = this.nodeSuggestions;
    const suggestionRef = this.getSuggestionRef(suggestionIndex);
    const suggestion = this[suggestionRef];
    this.scrollToElement(suggestions, suggestion, alignTo);
  },
  "focusOnSuggestionUsingKeyboard": function focusOnSuggestionUsingKeyboard(direction, suggestionIndex) {
    const newState = {
      "focusedSuggestionIndex": suggestionIndex,
      "value": suggestionIndex === null
        ? this.state.valueBeforeUpDown
        : this.getSuggestionValue(suggestionIndex)
    };

    this.justPressedUpDown = true;

    // When users starts to interact with Up/Down keys, remember input's value.
    if (this.state.valueBeforeUpDown === null) {
      newState.valueBeforeUpDown = this.state.value;
    }

    if (suggestionIndex === null) {
      this.onSuggestionUnfocused();
    } else {
      this.onSuggestionFocused(suggestionIndex);
    }

    if (this.props.scrollBar) {
      this.scrollToSuggestion(direction, suggestionIndex);
    }

    this.setState(newState);

    setTimeout(() => {
      this.justPressedUpDown = false;
    });
  },
  "onSuggestionSelected": function onSuggestionSelected(event) {
    event.stopPropagation();
    event.preventDefault();
    let focusedSuggestion = this.getFocusedSuggestion(); // Required when Enter is pressed

    if (focusedSuggestion === null) {
      // We are on a mobile device
      const touchedSuggestionIndex = event.currentTarget.getAttribute('data-suggestion-index');
      focusedSuggestion = this.getSuggestion(touchedSuggestionIndex);
    }

    this.props.onSuggestionUnfocused(focusedSuggestion);
    this.props.onSuggestionSelected(focusedSuggestion, event);
    if (this.props.setUnfocussedOnSelect === true) {
      this.setState({
        "inputFocussed": false
      });
    }
  },
  "onInputChange": function onInputChange(event) {
    const newValue = event.currentTarget.value;

    this.onSuggestionUnfocused();
    this.handleValueChange(newValue);
    this.onChange(event);
    this.showSuggestions(newValue);
  },
  "handleValueChange": function handleValueChange(newValue) {
    if (newValue !== this.state.value) {
      this.setState({
        "value": newValue
      });
    }
  },
  "onInputKeyDown": function onInputKeyDown(event) {
    let newState;
    const records = this.props.records;
    const focusedSuggestionIndex = R.defaultTo(-1, this.state.focusedSuggestionIndex);

    switch (event.keyCode) {
      case 13: // Enter
        if (this.state.valueBeforeUpDown !== null && this.suggestionIsFocused()) {
          this.onSuggestionSelected(event);
        }
        if (this.props.resetSuggestionStateOnSelect === true) {
          this.setSuggestionsState(null);
        }
        break;

      case 27: // ESC
        newState = {
          "suggestions": null,
          "focusedSuggestionIndex": null,
          "valueBeforeUpDown": null
        };

        if (this.state.valueBeforeUpDown !== null) {
          newState.value = this.state.valueBeforeUpDown;
        } else if (this.props.records === null) {
          newState.value = '';
        }

        this.onSuggestionUnfocused();
        this.justPressedEsc = true;

        this.setState(newState);

        setTimeout(() => this.justPressedEsc = false);
        break;

      case 38: // Up
        if (this.props.records === null) {
          this.showSuggestions(this.state.value);
        } else {
          this.focusOnSuggestionUsingKeyboard(
            'up',
            this.getPrevSelectionIndex(records, focusedSuggestionIndex)
          );
        }

        event.preventDefault(); // Prevent the cursor from jumping to input's start
        break;

      case 40: // Down
        if (this.props.records === null) {
          this.showSuggestions(this.state.value);
        } else {
          this.focusOnSuggestionUsingKeyboard(
            'down',
            this.getNextSelectionIndex(records, focusedSuggestionIndex)
          );
        }

        break;
      default:
        break;
    }
  },
  "getPrevSelectionIndex": function getPrevSelectionIndex(records, focusedSuggestionIndex) {
    if (records.length === 0) {
      return null;
    } else if (focusedSuggestionIndex - 1 < 0) {
      return records.length - 1;
    }
    return focusedSuggestionIndex - 1;
  },
  "getNextSelectionIndex": function getNextSelectionIndex(records, focusedSuggestionIndex) {
    if (records.length === 0) {
      return null;
    } else if (focusedSuggestionIndex + 1 >= records.length) {
      return 0;
    }
    return focusedSuggestionIndex + 1;
  },
  //called by onInputChange and onInputFocus
  "onChange": function onChange(event) {
    if (this.props.searchStore && this.props.actions) {
      eventHandler(this.props.actions, this.props.searchStore, 'onSearchPropChange', event);
    } else {
      this.props.onChange(event);
    }
  },
  "onInputFocus": function onInputFocus(event) {
    if (this.props.selectTextOnFocus && event.currentTarget.setSelectionRange) {
      event.currentTarget.setSelectionRange(0, event.currentTarget.value.length);
    }
    if (!this.justClickedOnSuggestion) {
      if (this.props.triggerSearchOnFocus) {
        if (this.props.onSearch) {
          this.props.onSearch(event);
        } else {
          this.onChange(event);
        }
        this.showSuggestions(this.state.value);
      } else {
        this.showSuggestions(this.state.value);
      }
    } else if (this.props.onRenderResetJustClickedOnSuggestion === false) {
      this.justClickedOnSuggestion = false;
    }
    this.setState({
      "inputFocussed": true
    });

    this.props.onFocus(event);
  },
  "onInputBlur": function onInputBlur(event) {
    if (this.props.selectSuggestionOnFocus === true && this.mouseOutsideDiv === false) {
      return;
    }
    this.setState({
      "inputFocussed": false
    });
    this.onSuggestionUnfocused();

    if (!this.justClickedOnSuggestion) {
      this.props.onBlur(event, this.props.records, this.state.value);
    } else if (this.props.onRenderResetJustClickedOnSuggestion === false) {
      this.justClickedOnSuggestion = false;
    }

    this.setSuggestionsState(null);
  },
  "isSuggestionFocused": function isSuggestionFocused(suggestionIndex) {
    return suggestionIndex === this.state.focusedSuggestionIndex;
  },
  "onSearchboxDivMouseEnter": function onSearchboxDivMouseEnter() {
    this.mouseOutsideDiv = false;
  },
  "onSearchboxDivMouseLeave": function onSearchboxDivMouseLeave() {
    this.mouseOutsideDiv = true;
  },
  "onSuggestionMouseEnter": function onSuggestionMouseEnter(suggestionIndex) {
    if (!this.isSuggestionFocused(suggestionIndex)) {
      this.onSuggestionFocused(suggestionIndex);
    }

    this.setState({
      "focusedSuggestionIndex": suggestionIndex
    });
  },
  "onSuggestionMouseLeave": function onSuggestionMouseLeave(suggestionIndex) {
    if (this.isSuggestionFocused(suggestionIndex)) {
      this.onSuggestionUnfocused();
    }

    this.setState({
      "focusedSuggestionIndex": null
    });
  },
  "onSuggestionClick": function onSuggestionClick(suggestionIndex, event) {
    const suggestionValue = this.getSuggestionValue(suggestionIndex);

    this.justClickedOnSuggestion = true;

    this.onSuggestionSelected(event);

    this.setState({
      "value": suggestionValue,
      "suggestions": null,
      "focusedSuggestionIndex": null,
      "valueBeforeUpDown": null
    }, () => {
      if (this.props.onRenderResetJustClickedOnSuggestion === true) {
        // This code executes after the component is re-rendered
        setTimeout(() => {
          //$("#" + this.props.id).focus();
          this.justClickedOnSuggestion = false;
        });
      }
    });
  },
  "getSuggestionId": function getSuggestionId(suggestionIndex) {
    return 'react-autosuggest-' + this.props.id + '-' + this.getSuggestionRef(suggestionIndex);
  },
  "getSuggestionRef": function getSuggestionRef(suggestionIndex) {
    return 'suggestion-' + suggestionIndex;
  },
  "renderSuggestionContent": function renderSuggestionContent(suggestion) {
    if (this.props.suggestionRenderer) {
      return this.props.suggestionRenderer(
        suggestion,
        this.state.valueBeforeUpDown || this.state.value
      );
    }
    if (typeof suggestion === 'object') {
      throw new Error('When <suggestion> is an object, you must implement the suggestionRenderer() ' +
        'function to specify how to render it.');
    } else {
      return suggestion.toString();
    }
  },
  "renderSuggestionsList": function renderSuggestionsList(theme, suggestions) {
    return R.addIndex(R.map)((suggestion, suggestionIndex) => {
      const suggestionId = this.getSuggestionId(suggestionIndex);
      const styles = theme(suggestionIndex, 'suggestion',
        suggestionIndex === this.state.focusedSuggestionIndex && suggestion.__selected !== true
          ? 'suggestionIsFocused'
          : null,
        suggestion.__disabled === true
          ? 'suggestionIsDisabled'
          : null,
        suggestionIndex !== this.state.focusedSuggestionIndex && suggestion.__selected === true
          ? 'suggestionIsSelected'
          : null,
        suggestionIndex === this.state.focusedSuggestionIndex && suggestion.__selected === true
          ? 'suggestionIsSelectedFocussed'
          : null
      );
      const suggestionRef = this.getSuggestionRef(suggestionIndex);
      const onSuggestionClick = event => this.onSuggestionClick(suggestionIndex, event);

      return (
        <li id={suggestionId}
            {...styles}
            role="option"
            ref={node => this[suggestionRef] = node}
            key={suggestionRef}
            data-suggestion-index={suggestionIndex}
            onMouseEnter={() => this.onSuggestionMouseEnter(suggestionIndex)}
            onMouseLeave={() => this.onSuggestionMouseLeave(suggestionIndex)}
            onMouseDown={onSuggestionClick}
        >
          {this.renderSuggestionContent(suggestion)}
        </li>
      );
    }, suggestions || []);
  },
  "renderSuggestions": function renderSuggestions(theme, records, id, isExpanded) {
    //Show ul with any suggestions with display none set if the showResults flag is false
    //Assist with testing to see ul in document flow
    return (
      <ul id={'react-autosuggest-' + id}
          {...theme('suggestions', 'suggestions', this.props.scrollBar ? "scrollable": null)}
          style={isExpanded ? null : {"display": "none"}}
          ref={node => this.nodeSuggestions = node}
          role="listbox">
        {this.renderSuggestionsList(theme, records, null)}
      </ul>
    );
  },
  /**
   * React render
   * @return {React.Element} react element
   */
  "render": function render() {
    const props = this.props;
    const {
      id, label, showResults, theme, unfocussedValue, showApplyButton,
      showDropdownButton, showAsDropdown, alwaysExpanded,
      //Start properties to be excluded from passing down to inputProps
      suggestionHref, suggestionRenderer, suggestionValue, showWhen, validation, //eslint-disable-line
      onSuggestionSelected, onSuggestionFocused, onSuggestionUnfocused, scrollBar, width, //eslint-disable-line
      onCommit, clearValueOnDropdown,
      //End properties to be excluded from passing down to inputProps
      ...otherProps
    } = props;

    //searchStore props - also excluded from passing down to inputProps
    let {
      searchStore, idFieldName, displayFieldName, refreshCounter, term, selectedRecord, //eslint-disable-line
      records, loading, name, onChange, actions, ...inputProps //eslint-disable-line
    } = otherProps; //eslint-disable-line
    const searchStoreSearch = searchStore ? searchStore.get('search') : null;
    if (searchStoreSearch) {
      idFieldName = searchStoreSearch.get('idFieldName');
      displayFieldName = searchStoreSearch.get('displayFieldName');
      refreshCounter = searchStoreSearch.get('refreshCounter');
      term = searchStoreSearch.get('term');
      selectedRecord = searchStoreSearch.get('selectedRecord');
      records = searchStoreSearch.get('records');
      loading = searchStoreSearch.get('loading');
      name = "term";
    }

    const {value} = this.state;
    // const {value, focusedSuggestionIndex} = this.state;
    const _theme = themeable(theme);
    // const ariaActivedescendant = this.getSuggestionId(focusedSuggestionIndex);
    let isExpanded = !R.isNil(records) && showResults && this.state.inputFocussed;
    let showButton = null, displayValue = value;

    if (this.props.onRenderResetJustClickedOnSuggestion === false && this.justClickedOnSuggestion) {
      isExpanded = false;
    }
    if (showAsDropdown === false || alwaysExpanded === true) {
      isExpanded = true;
    }

    //override displayValue with the value of the
    if (!R.isNil(unfocussedValue) && this.state.inputFocussed === false) {
      displayValue = unfocussedValue;
    }
    if (showDropdownButton && !inputProps.disabled && !inputProps.readOnly) {
      showButton = (
        <Button
          className="btn-primary btn-search"
          title="Toggle dropdown"
          aria-controls={id}
          label={<span className="glyphicon mdi-menu-down mdi-lg"/>}
          onClick={() => {
            let event = createSyntheticEvent(name || label, null, props.embeddedPath);
            this.justClickedOnSuggestion = false;
            if (this.state.inputFocussed) {
              this.mouseOutsideDiv = true;
              this.onInputBlur(event);
            } else {
              if ($("#" + id) && R.is(Function, $("#" + id).focus)) {
                $("#" + id).focus();
                if (clearValueOnDropdown === true) {
                  this.onInputFocus(event);
                }
              }
            }
          }}></Button>
      );
    }
    if (showApplyButton && !R.isNil(onCommit)
      // && this.state.inputFocussed
      && !R.isNil(inputProps.origTempValue)
      && (inputProps.origTempValue !== inputProps.origValue)
      && !inputProps.disabled && !inputProps.readOnly) {
      showButton = (
        <span>
          <Button
            className="btn-primary btn-search"
            title="Apply change"
            aria-controls={id}
            label={<span className="glyphicon mdi-check mdi-lg"/>}
            onClick={() => {
              let event = createSyntheticEvent(name || label, displayValue, props.embeddedPath);
              this.justClickedOnSuggestion = false;
              this.onInputBlur(event);
              onCommit(event);
            }}></Button>
          <Button
            className="btn-primary btn-search"
            title="Cancel change"
            aria-controls={id}
            label={<span className="glyphicon mdi-close mdi-lg"/>}
            onClick={() => {
              let event = createSyntheticEvent(name || label, inputProps.origValue, props.embeddedPath);
              this.justClickedOnSuggestion = false;
              this.onChange(event);
            }}></Button>
        </span>
      );
    }

    return (
      <div
        {..._theme('root', 'root')}
        onMouseEnter={() => this.onSearchboxDivMouseEnter()}
        onMouseLeave={() => this.onSearchboxDivMouseLeave()}
      >
        {!showAsDropdown ? null :
          <div
            style={R.isNil(width) ? null : {"width": width}}
          >
            <TextBox
              label={label}
              {...inputProps}
              key="autosuggest"
              id={id}
              name={name || label}
              value={displayValue}
              addonAfter={showButton}
              type="string"
              validation={validation ? validation : {"type": "string"}}
              showValidating={this.state.inputFocussed && loading}
              onChange={this.onInputChange}
              onKeyDown={this.onInputKeyDown}
              onFocus={this.onInputFocus}
              onBlur={this.onInputBlur}
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-owns={'react-autosuggest-' + id}
              aria-expanded={isExpanded}
              aria-haspopup={true}
            />
          </div>
        }
        {showResults || !showAsDropdown ? this.renderSuggestions(_theme, records, id, isExpanded) : null}
      </div>
    );
  }
});
