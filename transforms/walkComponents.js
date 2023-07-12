/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs/promises'
import { getAllFilesInDir, isFile } from './fsUtils.js'
import { jscodeshift as j } from './jscodeshift.js'
import { parse5 } from './parse5.js'
import path from 'path'

export async function * walkComponents ({ dir, include, exclude }) {
  const scriptFiles = await getAllFilesInDir(dir, include, exclude)

  async function walkComponent (scriptFile) {
    const source = await fs.readFile(scriptFile, 'utf8')
    const fileExtension = path.extname(scriptFile)
    const ast = fileExtension === '.ts' ? j.withParser('ts')(source) : j(source)

    const htmlImports = []
    ast.find(j.ImportDeclaration).forEach(importDecl => {
      const { value: { source } } = importDecl
      if (source.type === 'Literal') {
        const { value } = source
        if (((value.startsWith('.') || value.startsWith('/')) && value.endsWith('.html'))) {
          // relative HTML import
          htmlImports.push(path.resolve(path.dirname(scriptFile), value))
        }
      }
    })

    const implicitHtmlFile = scriptFile.replace(/\.(?:js|ts)$/, '.html')
    if (await isFile(implicitHtmlFile)) {
      htmlImports.push(implicitHtmlFile)
    }

    const templates = await Promise.all(htmlImports.map(async htmlFile => {
      const source = await fs.readFile(htmlFile, 'utf8')
      const parse5Errors = []
      const ast = parse5.parseFragment(source, { sourceCodeLocationInfo: true, onParseError: (error) => parse5Errors.push(error) })

      const fileName = htmlFile.replace(/\.html$/, '')
      const isScssFile = await isFile(fileName + '.scss')
      const fileEnding = isScssFile ? '.scss' : '.css'

      const cssFile = fileName + fileEnding
      const scopedCssFile = `${fileName}.scoped${fileEnding}`

      const stylesheets = (await Promise.all([cssFile, scopedCssFile].map(async file => {
        if (await isFile(file)) {
          const source = await fs.readFile(file, 'utf8')
          return {
            file,
            source,
            scoped: file === scopedCssFile
          }
        }
      }))).filter(Boolean)

      return {
        file: htmlFile,
        source,
        ast,
        parse5Errors,
        stylesheets
      }
    }))

    return {
      component: {
        file: scriptFile,
        source,
        ast
      },
      templates
    }
  }

  const promises = scriptFiles.map(async file => {
    try {
      return (await walkComponent(file))
    } catch (error) {
      return { error, file }
    }
  }) // run the promises immediately

  for (const promise of promises) {
    yield promise
  }
}
