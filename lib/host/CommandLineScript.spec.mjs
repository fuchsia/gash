import {fullStackSuccess,fullStackException} from "./fullstack.spec.mjs";

describe( "the gash() builtin function", () => {    
    it( "should support a string argument [SH-STR]", async () => {    
        const result = await fullStackSuccess( ["c1"], { cwd: "./test-data/dummy-package-with-sh" } );
        expect( result ).toEqual( 'Vanity! Vanity! All is vanity!' );
    } );
    it( "should support an array of strings, defaulting a switch [SH-ARRAY-DEFAULT]", async () => {    
        const result = await fullStackSuccess( ["shuf", "1"], { cwd: "./test-data/dummy-package-with-sh" } );
        expect( result ).toEqual( '0\n2\n1' );
    } );
    it( "should support an array of strings, specifying a switch [SH-ARRAY-EXPLICIT]", async () => {    
        const result0 = await fullStackSuccess( ["shuf", "1", "--seed", "0"], { cwd: "./test-data/dummy-package-with-sh" } );
        expect( result0 ).toEqual( '2\n1\n0' );
        const result1 = await fullStackSuccess( ["shuf", "1", "--seed", "1"], { cwd: "./test-data/dummy-package-with-sh" } );
        expect( result1 ).toEqual( '1\n0\n2' );
        const result4 = await fullStackSuccess( ["shuf", "1", "--seed", "4"], { cwd: "./test-data/dummy-package-with-sh" } );
        expect( result4 ).toEqual( '0\n2\n1' );
    } );
    it( "should not be supported on with() declarations [SH-NO-WITH]", async () => {    
        const result = await fullStackException( "e1", { cwd: "./test-data/dummy-package-with-sh" } );
        expect( result ).toEqual( 'gash: `gash()` cannot be used in a `with()` statement' );
    } );
    describe( "should be a straight call [SH-CALL]", () => {
        it( "without casting", async () => {    
            const result2 = await fullStackException( "e2", { cwd: "./test-data/dummy-package-with-sh" } );
            expect( result2 ).toEqual( 'gash: `gash()` cannot be used in a `with()` statement' );
        } );
        
        it( "without arrow-assignment", async () => {
            const result4 = await fullStackException( "e4", { cwd: "./test-data/dummy-package-with-sh" } );
            expect( result4 ).toEqual( 'gash: `gash()` cannot be used in a `with()` statement' );
        } );
        
        it( "without the result being used", async () => {
            // This should really have the same error as above; there's no reason we can't allow what happens here.
            // 
            const result3 = await fullStackException( "e3", { cwd: "./test-data/dummy-package-with-sh" } );
            expect( result3 ).toEqual( 
`processing:  :: gash( 'echo1 hello' ).thing
processing: _________________________^
gash: Expected eof. at 25`             
             );
        } );
        
    } );
    
} );