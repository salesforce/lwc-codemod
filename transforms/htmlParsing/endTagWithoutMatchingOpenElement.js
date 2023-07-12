import { serializeParse5Ast } from '../parse5Utils'

export const endTagWithoutMatchingOpenElement = async ({ templates }) => {
    const result = {
        overwrite: {},
        delete: []
    }

    templates.forEach(({ ast, file, parse5Errors }) => {
        const hasEndTagWithoutMatchingOpenElement = parse5Errors.some(({ code }) => code === 'end-tag-without-matching-open-element')
        if (hasEndTagWithoutMatchingOpenElement) {
            // parse5 eliminates the invalid end tags when it produces the AST.
            result.overwrite[file] = serializeParse5Ast(ast)
        }
    })

    return result
}
