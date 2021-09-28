/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { jscodeshift as j } from '../jscodeshift.js'
import { replaceOrInsertStaticProperty } from '../jsUtils.js'

/**
 * Returns true if this is a `this.template` expression
 */
function isThisDotTemplateExpression (node) {
  return (
    node.type === 'MemberExpression' &&
    node.computed === false &&
    node.object.type === 'ThisExpression' &&
    node.property.type === 'Identifier' &&
    node.property.name === 'template'
  )
}

function isTemplateProperty (prop) {
  return prop.key.type === 'Identifier' && prop.key.name === 'template'
}

// find all `this.template` expressions (and equivalent) and replace them with `this`
function replaceThisDotTemplate (ast) {
  ast.find(j.ThisExpression).forEach(path => {
    if (isThisDotTemplateExpression(path.parentPath.value)) {
      // input:  `const foo = this.template.querySelector('div')`
      // output: `const foo = this.querySelector('div')`
      j(path.parentPath).replaceWith(j.thisExpression())
    } else if (path.parentPath.value.type === 'VariableDeclarator' &&
      path.parentPath.value.id.type === 'ObjectPattern' &&
      path.parentPath.value.init === path.value) {
      const { properties } = path.parentPath.value.id
      const idx = properties.findIndex(isTemplateProperty)
      if (idx !== -1) { // destructuring `template` from `this`
        if (properties[idx].value.type === 'ObjectPattern') {
          // input:  `const { template: { firstChild: foo }} = this`
          // output: `const { firstChild: foo } = this`
          const subProperties = properties[idx].value.properties
          const { kind } = path.parentPath.parentPath.parentPath.value // const, let, etc.
          properties.splice(idx, 1) // remove the property
          // insert a new one in the nearest scope
          j(path)
            .closest(j.VariableDeclaration)
            .insertBefore(j.variableDeclaration(kind, [
              j.variableDeclarator(
                j.objectPattern(subProperties),
                j.thisExpression()
              )
            ]))
        } else if (properties[idx].value.type === 'Identifier' && !properties[idx].value.computed) {
          // input:  `const { template } = this`
          // output: `const template = this`
          const { name } = properties[idx].value // e.g. `const { template: tmpl } = this`, the name is `tmpl`
          const { kind } = path.parentPath.parentPath.parentPath.value // const, let, etc.
          properties.splice(idx, 1) // remove the property
          // insert a new one in the nearest scope
          j(path)
            .closest(j.VariableDeclaration)
            .insertBefore(j.variableDeclaration(kind, [
              j.variableDeclarator(j.identifier(name), j.thisExpression())
            ]
            ))
        }
      }
    }
  })
}

export function modifyComponentJavaScript (jsFile, source, ast, result) {
  const modified = replaceOrInsertStaticProperty(ast, 'renderMode', 'light')
  if (modified) { // not already a light DOM component
    replaceThisDotTemplate(ast)
    let newSource = ast.toSource()
    // simple search and replace for this.template.querySelector('slot'), probably don't need a full AST parse for this
    newSource = newSource.replace(
      /querySelector(?:All)?\(['"](slot)['"]\)/g,
      (match, p1) => match.replace(p1, '.slot-wrapper')
    )
    result.overwrite[jsFile] = newSource
  }
  return modified
}
