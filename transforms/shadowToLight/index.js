/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { modifyComponentJavaScript } from './modifyComponentJavaScript.js'
import { modifyTemplateHtml } from './modifyTemplateHtml.js'
import { modifyCssDirectly, modifyTemplateCss } from './modifyTemplateCss.js'
import path from 'path'

// via https://github.com/sveltejs/svelte/blob/dafbdc/src/compiler/compile/utils/hash.ts
function hash (str) {
  str = str.replace(/\r/g, '')
  let hash = 5381
  let i = str.length

  while (i--) hash = ((hash << 5) - hash) ^ str.charCodeAt(i)
  return (hash >>> 0).toString(36)
}

const createDomManualClass = (htmlFile, htmlSource) => {
  // short name is e.g. "x/component/component.html"
  const shortHtmlFileName = htmlFile.split(path.sep).slice(-3).join(path.sep)
  // generate a unique class name for this dom:manual in this component
  return `lwc-dom-manual-${hash(shortHtmlFileName + ' ' + htmlSource)}`
}

export const shadowToLight = async ({ component, templates, stylesheets }) => {
  const result = {
    overwrite: {},
    delete: []
  }

  const modifiedJs = modifyComponentJavaScript(component.file, component.source, component.ast, result)

  // if we didn't modify the JS then this is already a light DOM component, so skip
  if (modifiedJs) {
    // these are stylesheets associated with templates associated with the component
    const templateStylesheetModifications = templates.map(async ({ file, source, ast, stylesheets }) => {
      // We only need a special dom manual class if there is a stylesheet
      const associatedCssContent = stylesheets.find(_ => !_.scoped)?.source
      const domManualClass = associatedCssContent && createDomManualClass(file, source)
      const hasDomManual = modifyTemplateHtml(file, source, ast, associatedCssContent, domManualClass, result)
      if (stylesheets.length) {
        const fileName = file.replace(/\.html$/, '')
        await modifyTemplateCss(fileName, stylesheets, hasDomManual, domManualClass, result)
      }
    })

    // these are stylesheets directly associated with the component, e.g. a direct `import sheet from './sheet.css'`
    const directStylesheetModifications = stylesheets.map(async stylesheet => {
      if (!stylesheet.scoped) { // if it's already scoped, skip it
        await modifyCssDirectly(
          stylesheet.file,
          stylesheet.source,
          // TODO [#28]: support lwc:dom=manual for stylesheets directly imported into JS
          /* hasDomManual */ false,
          /* domManualClass */ undefined,
          result
        )
      }
    })

    await Promise.all([...templateStylesheetModifications, ...directStylesheetModifications])
  }

  return result
}
