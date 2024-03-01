import { LightningElement } from 'lwc'

import stylesheet from './component.css'

// just use it so that ESLint doesn't complain
console.log(stylesheet)

export default class extends LightningElement {
  static renderMode = "light";
}
