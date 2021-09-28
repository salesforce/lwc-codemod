import { LightningElement } from 'lwc'

export default class extends LightningElement {
  static renderMode = "light";
  foo = 'foo'

  renderedCallback() {
    const template = this;
    const {
      foo
    } = this

    console.log(template.querySelector('div'), foo)
  }
}
