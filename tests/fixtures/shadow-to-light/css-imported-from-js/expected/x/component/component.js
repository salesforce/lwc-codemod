import { LightningElement } from 'lwc'

import template from './component.html';
import stylesheet from "./component.scoped.css";

export default class extends LightningElement {
  static renderMode = "light";
  static stylesheets = [stylesheet]

  render() {
    return template
  }
}
