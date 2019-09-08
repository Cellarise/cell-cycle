import {getTourProgress} from './tourUtils';


export function appendPageLabel(model, action, drivers, label) {
  let nextModel = model;
  let pageLabels = nextModel.getIn(["stores", "routerUI", "props", "pageLabels"]);
  const pageSpec = nextModel.getIn(["stores", "routerUI", "props", "pageSpec"]);
  const findIndex = pageLabels.findIndex((pageLabel) => (pageLabel === label));
  if (findIndex === -1) {
    pageLabels = pageLabels.push(label);
    nextModel = nextModel
      .setIn(["stores", "routerUI", "props", "pageLabels"], pageLabels);
    nextModel = nextModel
      .setIn(["stores", "routerUI", "props", "tourProgress"], getTourProgress(nextModel, pageSpec));
  }
  return nextModel;
}

export function removePageLabel(model, action, drivers, label) {
  let nextModel = model;
  let pageLabels = nextModel.getIn(["stores", "routerUI", "props", "pageLabels"]);
  const pageSpec = nextModel.getIn(["stores", "routerUI", "props", "pageSpec"]);
  const findIndex = pageLabels.findIndex((pageLabel) => (pageLabel === label));
  if (findIndex > -1) {
    pageLabels = pageLabels.remove(findIndex);
    nextModel = nextModel
      .setIn(["stores", "routerUI", "props", "pageLabels"], pageLabels);
    nextModel = nextModel
      .setIn(["stores", "routerUI", "props", "tourProgress"], getTourProgress(nextModel, pageSpec));
  }
  return nextModel;
}
