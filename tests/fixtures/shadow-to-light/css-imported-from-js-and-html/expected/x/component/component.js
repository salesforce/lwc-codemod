import { LightningElement } from 'lwc'

import yolo from "./component.scoped.css";

export default class extends LightningElement {
  static renderMode = "light";
  static stylesheets = [yolo]
}
