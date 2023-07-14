/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { walkParse5Ast, serializeParse5Ast } from '../parse5Utils.js'

const isConditionalAttr = (attr) => attr.name === 'if:true' || attr.name === 'if:false'

export const fixMultipleIfTrueIfFalseAttributes = ({ ast, file }, result) => {
  let modifiedSource = false

  walkParse5Ast(ast, (node) => {
    // Remove duplicate if:true/if:false attributes
    const conditionalAttrs = node.attrs?.filter(isConditionalAttr)
    if (conditionalAttrs?.length > 1) {
      // In LWC only the first if:true/if:false is processed
      // Keep the first occurrence and discard the rest
      node.attrs = node.attrs.filter(
        (attr) => !isConditionalAttr(attr) || attr === conditionalAttrs[0]
      )

      modifiedSource = true
    }
  })

  if (modifiedSource) {
    result.overwrite[file] = serializeParse5Ast(ast)
  }

  return result
}
