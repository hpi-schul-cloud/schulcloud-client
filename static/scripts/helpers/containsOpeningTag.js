export default function containsOpeningTagFollowedByString(input) {
	const regex = /<\S+(?<!<)/;
	const result = regex.test(input);

	return result;
};
