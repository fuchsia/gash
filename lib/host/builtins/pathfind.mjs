import {delimiter,join,extname} from "node:path";
import {existsSync} from "node:fs";

// 2025_2_13:  FIXME: I wanted to write `PATHEXT=${env.PATHEXT??''}` as the default but couldn't as `env` wasn't defined.
//
// FIXME: if env.path is missing it should be CWD
export const js_hell = `IDL=1
-- Locate CMD_NAME in the current PATH.
-- (If CMD_NAME has no extension, the ones listed in PATHEXT will be tried.)
-- 
--   * \`--path\` defaults to env.PATH
-- 
--   * \`--pathext\` defaults to env.PATHEXT
-- 
pathfind [--path=TEXT] [--pathext=TEXT] CMD_NAME 
:: default( path ?? env.PATH, $1, pathext ?? env.PATHEXT ?? '' )`;


export default function
pathfind( path, filename, pathext ) {
    // FIXME: on non-WINDOWS and we should do an attrib test to check it is execuctable
    // (controllable via option);
    // but I didn't need that right now.
    const ext = extname( filename );

    // - It already has an extension - don't add another;
    //   hopefully the engine no-ops `x + ''`.
    //
    //   (Should this be done in the IDL or is more generally helpful?)  
    const extensions = ext ? [ '' ] : pathext.split( delimiter );
     
    return path.split( delimiter ).flatMap(
        dir => {
            const result = [];
            for ( const ext of extensions ) {
                const name = join( dir, filename + ext );
                if ( existsSync( name ) )
                    result.push( name );
            }
            return result;
        }
    );
}
