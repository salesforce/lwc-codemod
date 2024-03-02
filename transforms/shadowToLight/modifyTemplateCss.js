/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import postcss from 'postcss'
import { postcssSelectorParser as parser } from '../postcssSelectorParser.js'
import { isFile } from '../fsUtils.js'

const isHostSelector = node => node.type === 'pseudo' && [':host', ':host-context'].includes(node.value)
const containsHostSelector = node => node.nodes && node.nodes.some(isHostSelector)
const isSlotSelector = node => node.type === 'tag' && node.value === 'slot'
const containsSlotSelector = node => node.nodes && node.nodes.some(isSlotSelector)

// Adds a ".lwc-codemod-dom-manual" class as an ancestor selector to every selector that needs
// to be scoped to migrate lwc:dom="manual"
const addDomManualAncestorSelector = ({ className }) => {
  return {
    postcssPlugin: 'add-dom-manual-ancestor',
    Once (root) {
      root.walkRules(rule => {
        const transform = selectors => {
          selectors.walk(selector => {
            if (selector.parent.type !== 'root') { // only walk top-level selectors
              return
            }
            if (containsHostSelector(selector)) { // skip :host selectors
              return
            }
            if (containsSlotSelector(selector)) { // skip slot selectors
              return
            }
            selector.prepend(parser.combinator({ value: ' ' }))
            selector.prepend(parser.className({ value: className }))
          })
        }
        const processor = parser(transform)
        const newSelector = processor.processSync(rule.selector)
        rule.selector = newSelector
      })
    }
  }
}
addDomManualAncestorSelector.postcss = true

const migrateSlotsSelector = () => {
  return {
    postcssPlugin: 'migrate-slots-selector',
    Once (root) {
      root.walkRules(rule => {
        const transform = selectors => {
          selectors.walk(selector => {
            if (selector.parent.type !== 'root') { // only walk top-level selectors
              return
            }
            if (containsSlotSelector(selector)) {
              const slotSelector = selector.nodes.find(isSlotSelector)
              selector.insertAfter(slotSelector, parser.className({ value: 'lwc-slot-wrapper ' }))
              selector.removeChild(slotSelector)
            }
          })
        }
        const processor = parser(transform)
        const newSelector = processor.processSync(rule.selector)
        rule.selector = newSelector
      })
    }
  }
}
migrateSlotsSelector.postcss = true

export async function modifyCssDirectly (cssFileName, source, hasDomManual, domManualClass, result) {
  const scopedCssFilename = cssFileName.replace(/\.(css|scss)$/, '.scoped.$1')

  const { css: newScopedCss } = await postcss([
    migrateSlotsSelector()
  ]).process(source, { from: cssFileName, to: cssFileName })

  result.overwrite[scopedCssFilename] = newScopedCss

  if (hasDomManual) {
    // Need to add an extra global CSS to handle lwc:dom=manual, scoping everything
    // using a class ancestor selector. This ensures everything inside of lwc:dom=manual
    // is scoped properly, which is not handled in light DOM scoped styles.
    const { css: newGlobalCss } = await postcss([
      addDomManualAncestorSelector({ className: domManualClass })
    ]).process(source, { from: cssFileName, to: cssFileName })
    result.overwrite[cssFileName] = newGlobalCss
  } else { // if there's no lwc:dom=manual then we can just delete the global .css file
    result.delete.push(cssFileName)
  }
}

export async function modifyTemplateCss (fileName, stylesheets, hasDomManual, domManualClass, result) {
  // Just concatenate the scoped and unscoped CSS from a shadow DOM stylesheet.
  // For light DOM, it's closer to just call all of it "scoped."
  const source = stylesheets.map(_ => _.source).join('\n')
  const isScssFile = await isFile(fileName + '.scss')
  const fileEnding = isScssFile ? '.scss' : '.css'

  const cssFileName = fileName + fileEnding
  await modifyCssDirectly(cssFileName, source, hasDomManual, domManualClass, result)
}
