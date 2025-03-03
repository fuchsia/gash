import { EXIT_JS_HELL_EXCEPTION, EXIT_SUCCESS} from "./exit_codes.mjs";
import main from "./main.mjs";
import {Console} from "node:console";
import {Writable} from "node:stream";

const startupDir = process.cwd();
const inspect = false;

export async function 
fullstack( argv, { cwd = startupDir } = {} ) {
    const savedCwd = process.cwd();
    console.assert( savedCwd === startupDir, "expected to be in startupDir" );
    if ( cwd ) {
        process.chdir( cwd );
    }
    let result = '';
    // This is normally enough...
    const stdout = {
        write( text ) { result += text; }
    };
    let log = '';
    // ...but Console was too fussy.
    const stderr = new Writable( {
        write(chunk, encoding, callback) {
           // 1. Encoding is typically "buffer".
           // 2. node 22.2, no matter what I do, console.error() etc... insert color.
           // Probably ought to report it.
           log += chunk.toString().replaceAll( /\x1b\[3\dm/g, '' );
           callback?.();
        }
    });
    try {
        // Console shennanigans: this will give us a custom console. I think we're only
        // doing this to disable colorMode.
        //
        // (And given everything we do to console....) 
        const console = new Console( { stdout: stderr, stderr, colorMode: false  } );
        if ( inspect ) {
            const {default:inspector} = await import( "node:inspector" );
            inspector.open(undefined,undefined,true);
            debugger;
        }
        const errorlevel = await main( { 
                platform: process.platform,
                argv: [ "node", "js-hell", ...Array.isArray(argv)? argv:[argv]], 
                startupDir: process.cwd(),
                cwd:  process.cwd, 
                chdir: process.chdir, 
                stdout,
                stderr,
                console,
                EOL: '\n' 
            } );
        return {result,errorlevel,log:log.trimEnd()}; // remove the trailing NL
    } finally {
        // this could and should be `chdir( startupDir )`
        process.chdir( savedCwd );
    }
}

export async function 
fullStackSuccess( argv, options ) {
    const {result,errorlevel,log} = await fullstack( argv, options );
    expect( {errorlevel,log} ).toEqual( {   
        errorlevel:EXIT_SUCCESS,
        log:''
    } );
    return result;
}

export async function 
fullStackException( argv, options ) {
    const {result,errorlevel,log} = await fullstack( argv, options );
    expect( errorlevel ).toEqual( EXIT_JS_HELL_EXCEPTION);
    expect( result ).toEqual( '' );
    return log;
}



