import { LightningElement } from 'lwc'

export default class extends LightningElement {
  foo = 'foo'

  renderedCallback() {
    const { template, foo } = this

    console.log(template.querySelector('div'), foo)
  }
}
