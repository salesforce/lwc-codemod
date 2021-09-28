import { LightningElement } from 'lwc'

export default class extends LightningElement {
  onScroll() {
    console.log('scroll!')
  }
  renderedCallback() {
    console.log('slot', this.template.querySelector('slot'))
  }
}
