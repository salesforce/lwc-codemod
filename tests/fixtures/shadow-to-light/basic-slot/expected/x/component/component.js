import { LightningElement } from 'lwc'

export default class extends LightningElement {
  static renderMode = "light";
  onScroll() {
    console.log('scroll!')
  }
  renderedCallback() {
    console.log('slot', this.querySelector('.slot-wrapper'))
  }
}
