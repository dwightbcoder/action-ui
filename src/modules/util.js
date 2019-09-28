'use strict'

/**
 * Utilities
 */
class Util
{
    static deepAssign(target, source)
    {
        for (let i in source)
        {
            if (source.hasOwnProperty(i))
            {
                if (target.hasOwnProperty(i))
                {
                    if (source[i] instanceof Object)
                    {
                        Util.deepAssign(target[i], source[i])
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

    static requestFromElement(element)
    {
        return new Request(
            element.action || options.href || null,
            {
                method: element.method || null
            }
        )
    }

    static form(element)
    {
        return element.tagName == 'FORM' ? element : element.form
    }

    static capitalize(str)
    {
        return str[0].toUpperCase() + str.substr(1).toLowerCase()
    }

    static camelCase(str)
    {
        return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase())
    }
}

export { Util }
