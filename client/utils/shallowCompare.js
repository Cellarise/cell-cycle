import {shallowEqual} from '../utils';

export default function shouldComponentUpdate(component, nextProps, nextState) {
  return shallowEqual(component.props, nextProps) && shallowEqual(component.state, nextState);
}
