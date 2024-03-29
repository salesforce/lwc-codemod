import { LightningElement } from 'lwc'

import template from './component.html';
import stylesheet from './component.css'

export default class extends LightningElement {
  static stylesheets = [stylesheet]

  render() {
    return template
  }
}
