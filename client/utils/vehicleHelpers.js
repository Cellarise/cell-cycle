import R from 'ramda';

// Returns true if vehicleComponentSetTypeId is a descendant of rootName
export function inVehicleHierarchyByName(vehicleComponentSetTypeId, rootName, vehicleComponentSetTypes) {
  if (!vehicleComponentSetTypeId || !rootName) {
    return false;
  }
  const type = R.find(t => t.name === rootName, vehicleComponentSetTypes);
  if (R.isNil(type)) {
    return false;
  }
  return inVehicleHierarchyById(vehicleComponentSetTypeId, type.id, vehicleComponentSetTypes);
}

// Returns true if vehicleComponentSetTypeId is a descendant of rootId
export function inVehicleHierarchyById(vehicleComponentSetTypeId, rootId, vehicleComponentSetTypes) {
  if (vehicleComponentSetTypeId === rootId) {
    return true;
  }
  const child = R.find(t => t.id === vehicleComponentSetTypeId, vehicleComponentSetTypes);
  if (R.isNil(child)) {
    return false;
  }
  const parent = R.find(t => t.id === child.parent, vehicleComponentSetTypes);
  if (parent) {
    const isDescendant = inVehicleHierarchyById(parent.id, rootId, vehicleComponentSetTypes);
    if (isDescendant) {
      return true;
    }
  }
  return false;
}

export function hasVINOrRegistration(VIN, registration, state) {
  return (!R.isNil(VIN) && VIN.length > 16) || (!R.isNil(registration) && registration.length > 2
    && !R.isNil(state) && R.contains(state.toUpperCase(), ["QLD","NSW","ACT","VIC","TAS","SA","WA"]));
}
