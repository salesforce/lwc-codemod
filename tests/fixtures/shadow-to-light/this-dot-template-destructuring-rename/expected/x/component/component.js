import { LightningElement } from 'lwc'

export default class extends LightningElement {
  static renderMode = "light";
  renderedCallback() {
    const tmpl = this;
    const {} = this

    console.log(tmpl.querySelector('div'))
  }
}
