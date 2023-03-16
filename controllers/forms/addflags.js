'use strict';

const addFlags = require(__dirname+'/../../models/forms/addflags.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, deleteTempFiles = require(__dirname+'/../../lib/file/deletetempfiles.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, { checkSchema, numberBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	//paramConverter: paramConverter({}),

	controller: async (req, res, next) => {

		const { globalLimits } = config.get;

		const errors = await checkSchema([
			{ result: res.locals.numFiles === 0, expected: false, blocking: true, error: 'Must provide a file' },
			{ result: numberBody(res.locals.numFiles, 0, globalLimits.flagFiles.max), expected: true, error: `Exceeded max flag uploads in one request of ${globalLimits.flagFiles.max}` },
			{ result: numberBody(Object.keys(res.locals.board.flags).length+res.locals.numFiles, 0, globalLimits.flagFiles.total), expected: true, error: `Total number of flags would exceed global limit of ${globalLimits.flagFiles.total}` },
		]);

		if (errors.length > 0) {
			await deleteTempFiles(req).catch(console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				'redirect': `/${req.params.board}/manage/assets.html`
			});
		}

		try {
			await addFlags(req, res, next);
		} catch (err) {
			await deleteTempFiles(req).catch(console.error);
			return next(err);
		}

	}

};
