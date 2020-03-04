module.exports = config => {
	config.set({
		failOnEmptyTestSuite: false,	// see https://github.com/karma-runner/karma/issues/2528#issuecomment-519589053
		frameworks: ['mocha', 'chai'],
		files: [
			'./tests/*.js'
		],
		browsers: ['ChromiumHeadless'],
		preprocessors: {
			// 'src/**/*.js': ['coverage'],
			'./tests/*.js': ['webpack']
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
