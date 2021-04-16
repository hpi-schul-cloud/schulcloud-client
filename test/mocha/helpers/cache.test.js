const { expect } = require('chai');

const Cache = require('../../../helpers/cache/Cache');

describe('Cache helper class', () => {
	it('should return a promise', () => {
		const callback = () => 'text';
		const cache = new Cache(callback, { updateIntervalSecounds: 60 });

		const resultPromise = cache.get();
		expect(resultPromise, 'when input is not a promise').to.be.a('promise');
	});

	it('should return the result first from callback and after it from cache', async () => {
		const initialData = 'initial';
		const changedData = 'changed';

		let returnData = initialData;
		const callback = async () => returnData;

		const cache = new Cache(callback, { updateIntervalSecounds: 60 });

		const result1 = await cache.get();
		expect(result1, 'that data called directly.').eql(initialData);
		returnData = changedData;

		const result2 = await cache.get();
		expect(result2, 'that data retrieved from cache.').eql(initialData);
	});

	it('should recall resources if update interval time is expired', async () => {
		const initialData = 'initial';
		const changedData = 'changed';

		let returnData = initialData;
		const callback = async () => returnData;

		// -1 as time force is for test case
		const cache = new Cache(callback, { updateIntervalSecounds: -1 });

		const result1 = await cache.get();
		expect(result1, 'that data called directly.').eql(initialData);
		returnData = changedData;

		const result2 = await cache.get();
		expect(result2, 'that data called directly after cache interval is expired.').eql(changedData);
	});

	it('should pass 3 parameters to the callback', async () => {
		let passed1;
		let passed2;
		let passed3;
		let passed4;

		const input1 = 'param1';
		const input2 = 'param2';
		const input3 = 'param3';
		const input4 = 'param3';

		const callback = (a, b, c, d) => {
			passed1 = a;
			passed2 = b;
			passed3 = c;
			passed4 = d;
		};
		const cache = new Cache(callback, { updateIntervalSecounds: 60 });

		await cache.get(input1, input2, input3, input4);
		expect(passed1).equal(input1);
		expect(passed2).equal(input2);
		expect(passed3).equal(input3);
		expect(passed4).equal(undefined);
	});
});
