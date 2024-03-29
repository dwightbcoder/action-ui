import { View, ViewEventRender } from './view.js'
import { deepAssign } from './util.js'

/**
 * ViewFile
 * @version 20231116
 * @description View that fetches html from a file
 */
class ViewFile extends View
{
	constructor(name, file, model)
	{
		if (arguments.length == 2)
		{
			model = file
			file = undefined
		}

		if (!file)
		{
			file = name
		}

		super(name, null, model)

		this.file = file
	}

	clear()
	{
		this.html = null
		return super.clear()
	}

	render(parent)
	{
		var _promise = this._html == null ? this.fetch() : Promise.resolve()
		return _promise.then(() => super.render(parent))
	}

	fetch()
	{
		if (this.constructor.options.verbose) console.info(this.constructor.name + '.fetch()', this.name, { view: this })

		this.fetchBefore()

		return fetch(this.fullPath)
			.then(response => { if (response.ok) { return response.text() } else { throw new Error(response.statusText) } })
			.then(html =>
			{
				this._html = html
				this.fetchAfter(true)
				return this._html
			})
			.catch(e =>
			{
				this.fetchAfter(false);
				throw new Error('File not found: ' + this.fileName)
			})
	}

	fetchBefore()
	{

		if (this.constructor.options.verbose) console.info(this.constructor.name + '.fetchBefore()', this.name, { view: this })

		document
			.querySelectorAll('[ui-view="' + this._name + '"]')
			.forEach(target =>
			{
				this.constructor.setCssClass(target, _options.cssClass.loading)
			})

		if (this.constructor.options.eventFetch)
		{
			const eventFetch = new this.constructor.options.eventFetch({
				view: this,
				success: null
			})

			document.dispatchEvent(eventFetch)
		}

		return true
	}

	fetchAfter(success)
	{
		if (this.constructor.options.verbose) console.info(this.constructor.name + '.fetchAfter()', this.name, { view: this })

		document
			.querySelectorAll('[ui-view="' + this._name + '"]')
			.forEach(target =>
			{
				this.constructor.setCssClass(target, success ? _options.cssClass.success : _options.cssClass.fail)
			})

		if (this.constructor.options.eventFetch)
		{
			const eventFetch = new this.constructor.options.eventFetch({
				view: this,
				success: success
			})

			document.dispatchEvent(eventFetch)
		}

		return success
	}

	get fileName() { return this.file + '.' + this.constructor.options.extension }
	get fullPath() { return this.constructor.options.basePath + this.fileName }

	get file() { return this._file }
	set file(file)
	{
		if (file != this._file)
		{
			this._html = null
		}
		this._file = file
	}

	// #region Static methods

	// View factory
	static create(options, fromCache = true)
	{
		if (this.options.verbose) console.info(this.name + ':create()', { options, fromCache })

		if (!options.file)
		{
			options.file = options.name
		}

        return (fromCache && options.name)
			? (this.cache(options.name) || new this(options.name, options.file, options.model))
			: new this(options.name, options.file, options.model)
	}

	static setCssClass(target, cssClass)
	{
		for (var i in _options.cssClass) target.classList.remove(_options.cssClass[i])
		target.classList.add(cssClass)
	}

	static get options() { return _options }
	static set options(value) { deepAssign(_options, value) }

	// #endregion
}

class ViewFileEventFetch extends Event
{
	constructor(detail)
	{
		super('view.fetch', { bubbles: true })
		this.detail = { type: 'fetch', view: null, success: null }
		Object.assign(this.detail, detail)
	}
}

let _options = {
	basePath: 'view/',
	extension: 'html',
	cssClass: { 'loading': 'loading', 'success': 'success', 'fail': 'fail' },
	eventFetch: ViewFileEventFetch,
	eventRender: ViewEventRender
}
ViewFile.options = View.options

export { ViewFile, ViewFileEventFetch }
