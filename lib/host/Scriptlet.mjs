import {basename,extname} from "node:path/posix";
import {statSync} from "node:fs";
import Idl,{WILDCARD_NAME} from "../Idl.mjs";
import Array_accumulate from "../utils/Array_accumulate.mjs";
import json_q from "../utils/json_q.mjs";
import NEW_NAME from "./name.mjs";

// 2025_1_14: The great name change; all my code still uses js-hell/js_hell
// so this has to be supported for a while. 
export const
LEGACY_MODULE_KEY = 'js_hell', 
MODULE_KEY = NEW_NAME; // ecmash east  
                      
export const
PACKAGE_KEY_JS_HELL_LEGACY = LEGACY_MODULE_KEY,
PACKAGE_KEY_JS_HELL = 'js-hell',
PACKAGE_KEY = MODULE_KEY;

export const
IDL_IMPORT = '*';

export const
ERROR_INVALID_IDL = "Invalid IDL",
ERROR_NAME_MISMATCH = "Name mismatch";

function 
importIdlFromModule( idlText )
{
    return idlText === IDL_IMPORT;
}

function
getFileVersion( url ) {
    if ( typeof url !== 'string' && ( typeof url !== 'object' || !url ) )
        return;
    // Should we do any type validation here?
    const u = new URL( url );
    // Q: should we inherit a package version.
    if ( u.protocol !== 'file:' )
        return;
    const s = statSync( u, { throwIfNewEntry: false } );
    if ( !s )
        return;
    
    const d = new Date( s.mtimeMs );
    if ( "as date" ) {
        return d.toISOString();
    } else {
        // 2024_9_27: This is a convenient way to read a date; but it obscures the fact
        // it's a date and not a (potentially semver adhering) version. So we stick
        // with the above. You can see you are getting a date. 
        return `${d.getUTCFullYear( )}.${( d.getUTCMonth()+1 ) * 100 + d.getUTCDate() }.${
            d.getUTCHours() * 100 + d.getUTCMinutes()  
        }`;
    }
}

export function
IdlText_fromModule( module ) {
    if ( Object.hasOwn( module, MODULE_KEY)  ) {
        if ( typeof module[MODULE_KEY] === 'string' ) 
            return module[MODULE_KEY];
        // console.error( "invalid module (numeric js_hell key)", url );
    } else if ( Object.hasOwn( module, LEGACY_MODULE_KEY)  ) {
        if ( typeof module[LEGACY_MODULE_KEY] === 'string' ) {
            return module[LEGACY_MODULE_KEY];
        }
    }
}

/// js-hell needs two things to run a command - an javascript function
/// and an idl fragment that describes how to invoke it from the command line.
///
/// In practice we use an object (probably an ecmascript module) instead of a 
/// function and let the idl determine which function to call. (This may enable
/// us to use constants or other functions, eventually.) The object may be
/// lazily, asynchronously generated (i.e. imported).
///
/// We also like additional information to control the IDL (`version`) and
/// better describe it to the user (`summary`, `details`).
///
/// There are lots of terms (manifest, packages, commands, scripts, modules)
/// so we call them a scriptlet.
///
/// @issue: `Name` The Idl probbaly has a name. We probably want this to agree with
/// what the user typed or the package id or something. Do we need to track that -
/// the `package` name from which it was loaded?
export default class
Scriptlet {
    #moduleUrl;       ///< The url the module was resolved from/will be resolved from. This is generally an URL object, but not enforced. (Should be.)
    #module;          ///< The actual module - if it has been resolved.
    
    #idlText;         ///< The text of the idl or `'*'` for import the exported `MODULE_KEY`/`LEGACY_MODULE_KEY`.
    #idl;             ///< The actual `IDL()` object created from the above.

    #xname;           ///< The "external" name, provided by the script. This should match the "internal" name in the IDL.
    
    #version;
        
            
    // 2024_4_16: Should be the same signature as `from()`. The difference is historic and can be deleted. In fact, `from()` can 
    // probably be deleted.  
    constructor( idlText, { module, moduleUrl, name, version  = getFileVersion( moduleUrl ) } )
        {
            this.#moduleUrl = moduleUrl;
            // If this is a promise (typeof module.then === 'function') should we wrap an obvious
            // deferred asign? Would that be handy.
            this.#module = module;

            // This means the idl is an array - legal for multiline.
            // 2025_2_15: Should we be handling this? Or should the caller? It's not needed for modules
            // where ``` `` ``` can be used. So only for package.json, etc... 
            if ( Array.isArray( idlText ) ) {
                // FIXME: should we verify thy are
                 idlText = Array_accumulate( idlText, arrayElement => {
                    if ( typeof arrayElement !== 'string'  )
                        throw new TypeError( ERROR_INVALID_IDL );
                    return arrayElement;
                }, '\n' );
            }
            if ( typeof idlText === 'string' ) {
                this.#idlText = idlText;
            } else {
                throw new TypeError( ERROR_INVALID_IDL );
            }
            if ( typeof name === 'undefined' ) { 
                const url = new URL( this.#moduleUrl );
                if ( url.hash ) {
                    this.#xname = url.hash.slice( 1 );
                } else {
                    const path = url.pathname; 
                    this.#xname = basename( path, extname( path ) );
                }
            } else if ( typeof name === 'string' ) {
                this.#xname = name;
            } else {
                throw new TypeError( "Invalid `name`" );
            }
            this.#version = version; 
        }

    
    
    get moduleUrl() { return this.#moduleUrl }
    // Historic trash:
    get api() { throw new TypeError("Not implemented" ) }
    get summary() { throw new TypeError("Not implemented" ) }
    get details() { throw new TypeError("Not implemented" ) }
    get defaults() { throw new TypeError("Not implemented" ) }
    
    
    get idlText() {
        const idlText = this.#idlText;
        if ( !importIdlFromModule( idlText  ) )
            return idlText;
        // This is lazy load of IDL when the passed IDL is '*':
        const module = this.#module;
        if ( typeof module === 'undefined' )
            throw new TypeError( "module not loaded" );
        if ( typeof module !== 'object' || !this.#module )
            throw new TypeError( "invalid module (not an object)" );
        const embeddedIdlText = IdlText_fromModule( module );
        // We are supposed to be text, so any joining etc... should be
        // done by `IdlText_fromModule`: it should return `undefined`
        // or a string. (There seesm to be no need for arrays in modules, anyway;
        // you can use template strings.) 
        if ( typeof embeddedIdlText === 'string' )
            return embeddedIdlText;
        throw new Error( `invalid module (missing \`export ${MODULE_KEY}\`)` );  
    }

    get idl() {
        if ( typeof this.#idl !== 'undefined' )
            return this.#idl;
        // @note The use of `this.idlText` is correct - we want to invoke the getter.
        const {idlText} = this;
        this.#idl = new Idl( idlText, undefined, this.#moduleUrl );
        // Q: Should this check happen here. Should it be (a) during assignment
        // or (b), for imported IDL, during import().
        //
        // A: Well it means passing the IDL. The above scenario would mean
        // idl passing happens much earlier.  
        if ( this.#idl.name !== this.#xname && this.#idl.name !== WILDCARD_NAME )
            throw new TypeError( ERROR_NAME_MISMATCH + json_q`: expected the module name (${this.#xname}) to match the IDL name (${this.#idl.name})` );
        return this.#idl;
    }
    get name() { return this.#xname; }
    get version() { return this.#version }

    async importModule()
        {
            if ( !this.#module ) {
                const url = new URL( this.#moduleUrl );
                // See https://github.com/whatwg/html/issues/6911 for the blankjs proposal. It makes sense.
                // 2025_1_7: FIXME: this should share consts with PackageTree.mjs as we need to agree on the blank
                // module url. (It also makes it hard to identify use cases.) Especially see `isBlankModuleUrl()`
                // may need to be factored so we can share, or moved here.
                //
                // 2025_2_1: PackageTree is now providing a module. So maybe we shouldn't even bother checking
                // any more and should let PacakgeTree handle it?
                if ( url.protocol === 'about:' && url.pathname === "blankjs" ) {
                    // Q: Would it make sense to  have a genuine empty module for here?
                    // (Or, when the module expressons exist, to replace the url with
                    // `module {}`? )
                    // 2025_2_1: We now want to break this. 
                    this.#module = Object.create( null );
                } else {
                    // 2024_4_16: The `hash` can be used to provide the module name.
                    // That should never matter to the server, so we strip that. This is
                    // vital for importing things from `node:`
                    url.hash = '';
                    // FIXME: we should probably load everything in a VM. But for now.
                    this.#module = await import( url );
                }
            }
            return this.#module;
        }
        
    // 2024_3_18: The approved way to create a scriptlet.
    // 2024_9_27: Now the unapproved way. Replace with `new Scriptlet()` and then
    // maybe provide `Scriplet.from()` with same signature for those who hate new...
    static from( idlText, moduleUrl, module = undefined, xname )
        {
            return new Scriptlet( idlText, { module, moduleUrl, name: xname } );
        }
    
    static async fromModuleUrl( moduleUrl, baseUrl, xname = undefined ) {
        // 2024_9_27: Is this even used?
        const url = new URL( moduleUrl, baseUrl );
        const urlString = url.toString();
        // Q: Why do we have to import here?
        const module = await import( urlString );
        return Scriptlet.from( IDL_IMPORT, urlString, module, xname );
    }
    
    
};



