import { LightningElement } from 'lwc'

export default class extends LightningElement {
  renderedCallback() {
    const { template: tmpl } = this

    console.log(tmpl.querySelector('div'))
  }
}
