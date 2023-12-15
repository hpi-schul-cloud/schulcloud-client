// In the api/v3 response the IDs are named "id" and not "_id" like in api/v1.
// They are renamed for compatibility, because it is hard to find all places where they are used.
const renameIdsInSchool = (school) => {
	school._id = school.id;
	delete school.id;

	school.federalState._id = school.federalState.id;
	delete school.federalState.id;

	// counties were returned with id and _id from api/v1, so id is not deleted.
	school.federalState.counties = school.federalState.counties
		.map((county) => ({ ...county, _id: county.id }));
	if (school.county) {
		school.county._id = school.county.id;
	}

	if (school.currentYear) {
		school.currentYear._id = school.currentYear.id;
		delete school.currentYear.id;
	}

	school.years.schoolYears = school.years.schoolYears
		.map((year) => {
			const result = { ...year, _id: year.id };
			delete result.id;

			return result;
		});

	school.years.activeYear._id = school.years.activeYear.id;
	delete school.years.activeYear.id;

	school.years.lastYear._id = school.years.lastYear.id;
	delete school.years.lastYear.id;

	school.years.nextYear._id = school.years.nextYear.id;
	delete school.years.nextYear.id;

	return school;
};

module.exports = renameIdsInSchool;
