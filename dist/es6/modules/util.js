/**
 * Utilities
 */
function deepAssign(target, source)
{
    for (let i in source)
    {
        if (source.hasOwnProperty(i))
        {
            if (target.hasOwnProperty(i))
            {
                if (target[i] instanceof Object && source[i] instanceof Object)
                {
                    deepAssign(target[i], source[i])
                }
                else if (target[i] != source[i])
                {
                    target[i] = source[i]
                }
            }
            else
            {
                target[i] = source[i]
            }
        }
    }
}

function requestFromElement(element)
{
    return new Request(
        element.action || options.href || null,
        {
            method: element.method || null
        }
    )
}

function form(element)
{
    return element.tagName == 'FORM' ? element : element.form
}

function capitalize(str)
{
    return str[0].toUpperCase() + str.substr(1).toLowerCase()
}

function camelCase(str)
{
    return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_match, chr) => chr.toUpperCase())
}

function firstMatchingParentElement( element, selector )
{
    if ( element == null || element.matches(selector) )
    {
        return element
    }

    return firstMatchingParentElement(element.parentElement, selector)
}

export { deepAssign, requestFromElement, form, capitalize, camelCase, firstMatchingParentElement }