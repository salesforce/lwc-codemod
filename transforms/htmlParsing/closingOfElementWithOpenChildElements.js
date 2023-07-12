import { walkParse5Ast, serializeParse5Ast } from '../parse5Utils'

const closeChildElements = (node, errorsMap) => {
    const { endOffset, startTag } = node.sourceCodeLocation ?? {}
    if (errorsMap.has(endOffset) && startTag) {
        // Create an end tag using the error location to close the element
        node.sourceCodeLocation.endTag = errorsMap.get(endOffset)
    }
}

export const closingOfElementWithOpenChildElements = async ({ templates }) => {
    const result = {
        overwrite: {},
        delete: [],
    }

    templates.forEach(({ ast, file, parse5Errors }) => {
        const filteredErrors = parse5Errors
            .filter(({ code }) => code === 'closing-of-element-with-open-child-elements')
            .map(({ code, ...location }) => [location.startOffset, location])
        
        const errorsMap = new Map(filteredErrors)
        if (errorsMap.size) {
            walkParse5Ast(ast, closeChildElements, errorsMap)
            result.overwrite[file] = serializeParse5Ast(ast)
        }
    })

    return result
}
