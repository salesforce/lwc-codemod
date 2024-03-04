/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { jscodeshift as j } from './jscodeshift.js'

// Replace or insert a static property in a class body
// Return true if modified
export function replaceOrInsertStaticProperty (ast, name, value, typeAnnotation = false) {
  let found = false
  let modified = false
  ast.find(j.ClassBody).forEach(path => {
    j(path.value.body)
      .filter(node => {
        return node.value.type === 'ClassProperty' &&
        node.value.static &&
        node.value.key.name === name &&
        node.value.key.type === 'Identifier' &&
        node.value.value.type === 'Literal'
      })
      .forEach(path => {
        found = true
        if (path.value.value.value !== value) {
          path.value.value.value = value
          modified = true
        }
      })
    if (!found) { // property not found, insert it
      path.value.body.unshift(j.classProperty(
        /* key */ j.identifier(name),
        /* value */ j.stringLiteral(value),
        /* typeAnnotation */ null,
        /* static */ true
      ))
      modified = true
    }
  })
  return modified
}

// Make an array unique via some function that returns the unique key for a given array item
export function uniqBy (array, keyGenerator) {
  const set = new Set()
  const result = []
  for (const item of array) {
    const key = keyGenerator(item)
    if (!set.has(key)) {
      set.add(key)
      result.push(item)
    }
  }
  return result
}
