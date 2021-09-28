import { LightningElement } from 'lwc'

export default class extends LightningElement {
  static renderMode = "light";
  foo = 'foo'

  renderedCallback() {
    const {
      firstChild: child
    } = this;

    const {
      foo
    } = this
    console.log(child, foo)
  }
}
