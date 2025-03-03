export default class 
VersionError extends Error {
    constructor( ...args ) {
        super( ...args );
    }
    static name = "VersionError";
    get name() {
        return VersionError.name;
    }
};




