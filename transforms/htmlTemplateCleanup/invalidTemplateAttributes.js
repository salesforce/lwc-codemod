/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { walkParse5Ast, serializeParse5Ast, deleteNode } from '../parse5Utils.js'
import { TemplateDirectiveName, RootDirectiveName } from '@lwc/template-compiler'

const rootTemplateDirectives = new Set(Object.values(RootDirectiveName))
// TODO: @lwc/template-compiler doesn't include 'if:false in it's type definition
// replace the 'if:false' once the type definition is updated
const nonRootTemplateDirectives = new Set([...Object.values(TemplateDirectiveName), 'if:false'])

const isValidRootTemplateDirective = (attr) => rootTemplateDirectives.has(attr.name)
const isValidNonRootTemplateDirective = (attr) =>
// Note @lwc/template-compiler does not expose an iterator type but rather refers to it as 'forof'
  nonRootTemplateDirectives.has(attr.name) || attr.name.startsWith('iterator:')

export const fixInvalidTemplateAttributes = ({ ast, file }, result) => {
  let modifiedSource = false

  walkParse5Ast(ast, (node) => {
    const isRootTemplate = node.tagName === 'template' && node.parentNode === ast
    // Remove erroneous attributes on template elements
    if (node.tagName === 'template') {
      const isValidTemplateDirective = isRootTemplate
        ? isValidRootTemplateDirective
        : isValidNonRootTemplateDirective

      const validTemplateAttrs = node.attrs.filter(isValidTemplateDirective)
      if (validTemplateAttrs.length !== node.attrs.length) {
        if (!validTemplateAttrs.length && !isRootTemplate) {
          // Note that LWC does not render the content of non-root templates.
          // As such, we remove the template entirely when there are no valid template directives associated with it.
          deleteNode(node)
        } else {
          node.attrs = validTemplateAttrs
        }

        modifiedSource = true
      }
    }
  })

  if (modifiedSource) {
    result.overwrite[file] = serializeParse5Ast(ast).replace(/(?<=lwc:else)=""/g, '')
  }

  return result
}
