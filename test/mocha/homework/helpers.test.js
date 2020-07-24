const chai = require('chai');

const { expect } = chai;

const { isGraded, getGradingFileName, getGradingFileDownloadPath } = require('../../../helpers/homework');

describe('Homework helpers', () => {
	describe('isGraded', () => {
		const basicSubmission = { createdAt: 'just now', comment: 'See file', fileIds: ['ObjectId(123abc)'] };

		it('is falsy for new submissions', () => {
			expect(isGraded(basicSubmission)).to.equal(false);
		});

		it('is true once a grade has been assigned', () => {
			expect(isGraded({ ...basicSubmission, grade: 0 })).to.equal(true);
		});

		it('is true once a teacher has commented', () => {
			expect(isGraded({ ...basicSubmission, gradeComment: 'Well done!' })).to.equal(true);
		});

		it('is true once a teacher has uploaded some graded files', () => {
			expect(isGraded({ ...basicSubmission, gradeFileIds: ['ObjectId(123abc)'] })).to.equal(true);
		});
	});

	describe('getGradingFileName', () => {
		const basicFile = {
			_id: '123abc',
			createdAt: '2019-01-02T15:12:05Z',
			name: 'screenshot v1.2.png',
			type: 'image/png',
		};

		it('prepends the creation date', () => {
			const fileName = getGradingFileName({ ...basicFile, createdAt: '2020-04-03T08:24:13Z' });
			expect(fileName.slice(0, 11)).to.equal('2020-04-03_');
		});

		// in order to be able to assign any future uploads back to the specific homework submission
		it('injects the file id', () => {
			const id = '0000d224816abba584714c9c';
			const fileName = getGradingFileName({ ...basicFile, _id: id, name: 'image 2.png' });

			expect(fileName).to.match(new RegExp(`_${id}\\.png$`));
		});
	});

	describe('getGradingFileDownloadPath', () => {
		it('calls files/file with id and name', () => {
			const file = {
				_id: '0123a123456bdef123456a1a',
				createdAt: '2019-01-02T15:12:05Z',
				name: 'screenshot v1.2.png',
				type: 'image/png',
			};

			expect(getGradingFileDownloadPath(file)).to.equal(
				`/files/file?download=true&file=${file._id}&name=${encodeURIComponent(getGradingFileName(file))}`,
			);
		});
	});
});
