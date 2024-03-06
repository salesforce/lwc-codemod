import { LightningElement } from 'lwc'

import yolo from "./yolo.scoped.css";

export default class extends LightningElement {
  static renderMode = "light";
  static stylesheets = [yolo]
}
