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
import { uniqBy } from './jsUtils.js'

const cssFilenameToStylesheet = async filename => {
  if (await isFile(filename)) {
    const source = await fs.readFile(filename, 'utf8')
    return {
      file: path.resolve(filename),
      source,
      scoped: filename.endsWith('.scoped.css')
    }
  }
  // return undefined if does not exist
}

export async function * walkComponents ({ dir, include, exclude }) {
  const scriptFiles = await getAllFilesInDir(dir, include, exclude)

  async function walkComponent (scriptFile) {
    const source = await fs.readFile(scriptFile, 'utf8')
    const fileExtension = path.extname(scriptFile)
    const ast = fileExtension === '.ts' ? j.withParser('ts')(source) : j(source)

    const htmlImports = []
    const cssImports = []
    ast.find(j.ImportDeclaration).forEach(importDecl => {
      const { value: { source } } = importDecl
      if (source.type === 'Literal') {
        const { value } = source
        const isRelativeImport = value.startsWith('.') || value.startsWith('/')
        if (isRelativeImport && value.endsWith('.html')) {
          // relative HTML import
          htmlImports.push(path.resolve(path.dirname(scriptFile), value))
        } else if (isRelativeImport && value.endsWith('.css')) {
          // relative CSS import
          cssImports.push(path.resolve(path.dirname(scriptFile), value))
        }
      }
    })

    const implicitHtmlFile = scriptFile.replace(/\.(?:js|ts)$/, '.html')
    if (await isFile(implicitHtmlFile)) {
      htmlImports.push(implicitHtmlFile)
    }

    const rawTemplates = await Promise.all(htmlImports.map(async htmlFile => {
      const source = await fs.readFile(htmlFile, 'utf8')
      const parse5Errors = []
      const ast = parse5.parseFragment(source, { sourceCodeLocationInfo: true, onParseError: (error) => parse5Errors.push(error) })

      const fileName = htmlFile.replace(/\.html$/, '')
      const isScssFile = await isFile(fileName + '.scss')
      const fileEnding = isScssFile ? '.scss' : '.css'

      const cssFile = fileName + fileEnding
      const scopedCssFile = `${fileName}.scoped${fileEnding}`

      const stylesheets = (await Promise.all([cssFile, scopedCssFile].map(cssFilenameToStylesheet))).filter(Boolean)

      return {
        file: path.resolve(htmlFile),
        source,
        ast,
        parse5Errors,
        stylesheets
      }
    }))

    // Ensure we return a unique array of templates. Do not return the same template twice, which
    // can happen if e.g. 1) it's imported by the component JS file plus 2) it's an implicit import,
    // e.g. component.html implicitly imported by component.js
    const uniqueTemplates = uniqBy(rawTemplates, template => template.file)

    const rawStylesheets = (await Promise.all(cssImports.map(cssFilenameToStylesheet))).filter(Boolean)

    // Make sure we only consider unique stylesheets, and ignore any stylesheets that will already
    // be processed as part of templates that implicitly import them
    const uniqueStylesheets = uniqBy(rawStylesheets, stylesheet => stylesheet.file).filter(stylesheet => {
      return !uniqueTemplates.some(template => {
        return template.stylesheets && template.stylesheets.some(otherStylesheet => otherStylesheet.file === stylesheet.file)
      })
    })

    return {
      component: {
        file: path.resolve(scriptFile),
        source,
        ast
      },
      templates: uniqueTemplates,
      stylesheets: uniqueStylesheets
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
