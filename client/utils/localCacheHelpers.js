
export function getQueryTableDatabaseAccountCache(model) {
  return model.getIn([
    "stores",
    "databaseCacheAccountUI",
    "props",
    "dataSets"
  ]);
}

export function getQueryTableLocalCache(model) {
  return {
    "DatabaseAccountCache": model.getIn([
      "stores",
      "databaseCacheAccountUI",
      "props",
      "dataSets"
    ]),
    "PermitApplicationWorkflow": model.getIn([
      "stores",
      "permitApplicationWorkflowUI",
      "collection",
      "records"
    ]),
    "VehicleComponentSet": model.getIn([
      "stores",
      "vehicleComponentSetUI",
      "collection",
      "records"
    ]),
    "VehicleComponentSetType": model.getIn([
      "stores",
      "vehicleComponentSetTypeUI",
      "collection",
      "records"
    ]),
    "VehicleComponent": model.getIn([
      "stores",
      "vehicleComponentUI",
      "collection",
      "records"
    ]),
    "VehicleComponentType": model.getIn([
      "stores",
      "vehicleComponentTypeUI",
      "collection",
      "records"
    ])
  };
}
