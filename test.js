import { expect } from 'chai';
import t, { emit } from './dist/index';

describe('on and emit', () => {
	it('custom click event', async () => {
		const div = document.createElement('div');
		t(div, 'click', (e) => {
			expect(e.foo).eq('bar');
		});
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				emit(div, 'click', true, true, { foo: 'bar' })
				resolve();
			}, 0);
		});
	});
});
