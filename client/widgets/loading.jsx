"use strict";
import React from 'react'; //eslint-disable-line  no-unused-vars
import Card from '../page/card.jsx';

function Loading(props) {
  return (
    <section>
      <Card
        name={"loading"}
        header={props.title}
        actionBar={false}
      ></Card>
    </section>
  );
}
Loading.displayName = "Loading";
Loading.defaultProps = {
  'title': 'Loading'
}
/**
 * @ignore
 */
module.exports = Loading;
