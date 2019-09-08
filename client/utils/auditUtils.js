import R from 'ramda';
import React from 'react';
import {formattedDateTime} from '../utils';


const HIDDEN_FIELDS = [
  'created',
  'createdBy',
  'modified',
  'modifiedBy',
  'userModelCreatedBy',
  'userModelModifiedBy',
  'validTo'
];

export function omitHiddenFields(changes) {
  return R.omit(HIDDEN_FIELDS, changes);
}

export function formattedEvent(event) {
  let labelClassName;
  switch (event) {
    case "create":
      labelClassName = "label-success";
      break;
    case "update":
      labelClassName = "label-info";
      break;
    case "delete":
      labelClassName = "label-danger";
      break;
    case "login":
      labelClassName = "label-warning";
      break;
    case "logout":
      labelClassName = "label-info";
      break;
    default:
      labelClassName = "label-info";
  }
  return (
    <label className={"label " + labelClassName}>
      {event.toUpperCase()}
    </label>
  );
}

export function formattedChanges(model, event, changes) {
  let changedFields = Object.keys(changes);
  if (!changedFields.length) {
    return <em>No changes found</em>;
  }

  changedFields = changedFields.map(field => {
    // Check if the field is a relationship rather than a property
    const relations = model.relations || {};
    let foreignKey;
    for (let relation in relations) {
      if (relation === field) {
        const relationConfig = relations[relation];
        // Loopback's convention is to append Id to the field name
        foreignKey = relationConfig.foreignKey || relation + "Id";
      }
    }
    const properyName = foreignKey || field;
    return {
      'name': field,
      'type': foreignKey ? 'relation' : 'property',
      'label': R.defaultTo(properyName, model.properties[properyName] && model.properties[properyName].label)
    };
  });
  changedFields = R.sortBy(R.compose(R.toLower, R.prop('label')), changedFields);

  // If both a relation and property exist, only keep the relation as their value will have the id as well
  // as other fields
  changedFields = R.filter(field => {
    if (field.type === 'property') {
      return !R.find(f => (f.label === field.label && f.type === 'relation'), changedFields);
    }
    return true;
  }, changedFields);

  return (
    <div>
      {
        changedFields.map(field =>
          (<div key={field.name} className="row audit-field">
            <div className="col-sm-3 text-bold">{field.label}</div>
            <div className="col-sm-9">
              {formattedChange(event, changes[field.name][0], changes[field.name][1])}
            </div>
          </div>)
        )
      }
    </div>
  );
}

function formattedChange(event, value1, value2) {
  const formattedValue1 = formattedValue(value1);
  const formattedValue2 = formattedValue(value2);
  if (event === 'create') {
    return formattedValue2;
  } else if (event === 'update') {
    if (value2 instanceof Object && !(value2 instanceof Date)) {
      return (
        <div className="row">
          <div className="col-sm-6">{formattedValue1}</div>
          <div className="col-sm-6">{formattedValue2}</div>
        </div>
      );
    }
    return <span>{formattedValue1} ⇒ {formattedValue2}</span>;
  }
}

function formattedValue(value) {
  let newValue = value;
  if (value === null) {
    newValue = <em>null</em>;
  } else if (value === '') {
    newValue = <em>blank</em>;
  } else if (typeof value === 'boolean') {
    newValue = value.toString();
  } else if (value instanceof Date) {
    newValue = formattedDateTime(value);
  } else if (value instanceof Object) {
    newValue = JSON.stringify(value, null, 2);
  }
  return newValue;
}
