import { walkParse5Ast, serializeParse5Ast } from '../parse5Utils'

const closeElement = (node, errorsMap) => {
    const { endOffset, startTag } = node.sourceCodeLocation ?? {}

    if (endOffset && errorsMap.has(endOffset) && startTag) {
        const tagLength = startTag.endOffset - startTag.startOffset
        const errorLocation = errorsMap.get(endOffset)
        // Create an end tag using the error location to close the element
        node.sourceCodeLocation.endTag = {
            ...errorLocation,
            endOffset: errorLocation.startOffset + tagLength,
        }
    }
}

export const eofInElementThatCanContainOnlyText = async ({ templates }) => {
    const result = {
        overwrite: {},
        delete: [],
    }

    templates.forEach(({ ast, file, parse5Errors }) => {
        const filteredErrors = parse5Errors
            .filter(({ code }) => code === 'eof-in-element-that-can-contain-only-text')
            .map(({ code, ...location }) => [location.endOffset, location])

        const errorsMap = new Map(filteredErrors)
        if (errorsMap.size) {
            walkParse5Ast(ast, closeElement, errorsMap)
            result.overwrite[file] = serializeParse5Ast(ast)
        }
    })

    return result
}
