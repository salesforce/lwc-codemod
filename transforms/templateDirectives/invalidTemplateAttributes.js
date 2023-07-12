/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { walkParse5Ast, serializeParse5Ast } from '../parse5Utils'

const rootTemplateDirectives = new Set(['lwc:preserve-comments', 'lwc:render-mode'])
const nonRootTemplateDirectives = new Set([
  'for:each',
  'for:index',
  'if:true',
  'if:false',
  'lwc:if',
  'lwc:elseif',
  'lwc:else'
])

const isValidRootTemplateDirective = (attrName) => rootTemplateDirectives.has(attrName)

const isValidNonRootTemplateDirective = (attrName) =>
  nonRootTemplateDirectives.has(attrName) || attrName.startsWith('iterator:')

const removeInvalidAttributes = (node, ctx) => {
  if (node.tagName === 'template') {
    const isValidTemplateDirective = ctx.isRoot
      ? isValidRootTemplateDirective
      : isValidNonRootTemplateDirective
    node.attrs = node.attrs.filter((attr) => isValidTemplateDirective(attr.name))
    ctx.isRoot = false
    ctx.modified = true
  }
}

export const invalidTemplateAttributes = async ({ templates }) => {
  const result = {
    overwrite: {},
    delete: []
  }

  templates.forEach(({ ast, file }) => {
    const ctx = { isRoot: true, modified: false }
    walkParse5Ast(ast, removeInvalidAttributes, ctx)
    if (ctx.modified) {
      // parse5 serializes lwc:else as lwc:else="", remove extraneous empty assignment
      result.overwrite[file] = serializeParse5Ast(ast).replace(/(?<=lwc:else)=\"\"/g, '')
    }
  })

  return result
}
