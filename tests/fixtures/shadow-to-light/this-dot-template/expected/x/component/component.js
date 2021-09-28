import { LightningElement } from 'lwc'

export default class extends LightningElement {
  static renderMode = "light";
  renderedCallback() {
    console.log(this.querySelector('div'))
  }
}
