module.exports = config => {
	config.set({
		frameworks: ['mocha', 'chai'],
		files: [
			// { pattern: 'test/*_test.js', watched: false },
			'./test.js'
		],
		browsers: ['ChromiumHeadless'],
		preprocessors: {
			// 'src/**/*.js': ['coverage'],
			'test.js': ['webpack']
		},
		webpack: {
			mode: 'development'
		},
		plugins: [
			'karma-mocha',
			'karma-chai',
			// 'karma-phantomjs-launcher',
			'karma-chrome-launcher',
			// 'karma-coverage',
			'karma-webpack'
		]
	});
};
