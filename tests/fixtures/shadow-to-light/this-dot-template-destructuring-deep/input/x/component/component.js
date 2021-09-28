import { LightningElement } from 'lwc'

export default class extends LightningElement {
  foo = 'foo'

  renderedCallback() {
    const { template: { firstChild: child }, foo } = this
    console.log(child, foo)
  }
}
