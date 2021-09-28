import { LightningElement, api } from 'lwc'

import a from './a.html'
import b from './b.html'

export default class extends LightningElement {

  @api a = false

  render() {
    return this.a ? a : b
  }
}
