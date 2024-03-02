import { LightningElement } from 'lwc'

// Import it twice (who knows why someone would do this, but we should handle it)
import stylesheet1 from './yolo.css'
import stylesheet2 from './yolo.css'

export default class extends LightningElement {
  static stylesheets = [stylesheet1, stylesheet2]
}
