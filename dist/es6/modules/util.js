/**
 * Utilities
 */

// Recursively copy source properties to target (Warning: Classes are treated as Objects)
function deepAssign(target, source, dereference = false)
{
	if (dereference)
	{
		source = Object.assign(Array.isArray(source) ? [] : {}, source)
	}

	for (let i in source)
	{
		if (source.hasOwnProperty(i))
		{
			if (dereference && source[i] instanceof Object)
			{
				source[i] = Object.assign(Array.isArray(source[i]) ? [] : {}, source[i])
			}

			if (target.hasOwnProperty(i))
			{
				if (dereference && target[i] instanceof Object)
				{
					target[i] = Object.assign(Array.isArray(target[i]) ? [] : {}, target[i])
				}

				if (target[i] instanceof Object && source[i] instanceof Object && !(target[i] instanceof Function || source[i] instanceof Function))
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

			if (Array.isArray(target[i]) && Array.isArray(source[i]) && source[i].length == 0 && target[i].length != 0)
			{
				target[i] = []
			}
		}
	}

	return target // For simpler dereference usage
}

function deepCopy(target, source)
{
	return deepAssign(target, source, true)
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

function firstMatchingParentElement(element, selector)
{
	if (element == null || element.matches(selector))
	{
		return element
	}

	return firstMatchingParentElement(element.parentElement, selector)
}

function formToObject(form, data = {})
{
	data = Object.assign(Object.fromEntries((new FormData(form))), data)

	Object.entries(data).map(entry =>
	{
		const keys = entry[0].split('[').map(key => key.replace(/]/g, ''))

		if (keys.length > 1)
		{
			const obj = remapObjectKeys(keys, entry[1])
			deepAssign(data, obj)
			delete data[entry[0]]
		}

		return entry
	})

	return data
}

function remapObjectKeys(keys, val, obj)
{
	const key = keys.pop()

	if (!key)
	{
		return obj
	}

	let newObj = {}

	if (!obj)
	{
		newObj[key] = val
	}
	else
	{
		newObj[key] = obj
	}

	return remapObjectKeys(keys, val, newObj)
}

export { deepAssign, deepCopy, requestFromElement, form, capitalize, camelCase, firstMatchingParentElement, formToObject }
