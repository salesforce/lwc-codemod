import { LightningElement } from 'lwc'

import stylesheet1 from "./yolo.scoped.css";
import stylesheet2 from "./yolo.scoped.css";

export default class extends LightningElement {
  static renderMode = "light";
  static stylesheets = [stylesheet1, stylesheet2]
}
