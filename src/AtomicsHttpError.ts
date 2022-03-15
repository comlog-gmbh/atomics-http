class AtomicsHttpError extends Error {
	code: any = undefined;

	constructor(message?: string) {
		super(message);
	}
}

export default AtomicsHttpError;