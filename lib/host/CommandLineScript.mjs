import Scriptlet from "./Scriptlet.mjs";
import {getCurrentShellJob} from "./shellJobs.mjs";
import {EXIT_SUCCESS} from "./exit_codes.mjs";
import NEW_NAME from "./name.mjs";

let lastJobId = 0;
/// @brief This is the wrapper used for scripts in the packagetree: 
/// it presents the script as a module.  
///
/// 2025_2_16: Q: Can we not replace this with the virtual scritplet  
/// `IDL=1 ${scriptName} :: gash( ${JSON.stringify( this.#scriptText) )`?
/// (The change would happen in PackageTree's `wrapScriptIntoScriptlet()`; 
/// it would need to use the BlankScriptlet.) 
///
/// A: The blockers are the ID and the slightly dangerus startup dir. (Should/could that be a property 
/// of the scriptlet?) 
///
export default class 
CommandLineScript {
    #scriptText;
    #startupDir;
    ['default'];
    constructor( scriptText, {startupDir }={}) {
        this.#scriptText = scriptText;
        this.#startupDir = startupDir;
        // We are pretending to be a module. 
        // So 
        //    1. `default` has to be an ownProperty
        //    2. It won't get called as `this.default()` so has to be a closure. 
        this.default = () => this.exec();
    }
    
    async exec() {
        
        // FIXME: these are "subjob" ids: only the user initiatiated tasks should get a jobid.
        const jobid = ++lastJobId;
        // Q: we can't use '%' as a jobid. Is '!' everybit as bad? `&1` or `|1`
        // or `job:1`
        console.log( "[!%d] %s>%s", jobid, this.#startupDir, this.#scriptText );
        // FIXME: 
        // - We need to be able to return the output of the function. (Capture.)
        //   We also need to capture the type info. 
        // - stdio...
        const {shell} = getCurrentShellJob(); 
        const errorlevel = await shell.execJob( [ "node", NEW_NAME, this.#scriptText ], { startupDir: this.#startupDir } )
        // Q. should we prefix all the console output (and command-line output?) with the jobspec?
        // A: ShellJob's should have a prefix which we can amend.
        // Q. should we use nested ids; e.g. `[!2 !4]` to indicate !4 is a child of `!2`?
        // (`job:2.4`)
        console.log( "[!%d] exited (%d)", jobid, errorlevel );
        // Deciding what to pass back our is problematic.
        //  
        // If we are a single command it would make sense to pass it back, as is. Ditto if we are a pipehead.
        // But in both cases our type is hidden.
        //
        // Other cases get more complicated; e.g. if we had modifiers on output, if we are an iterator,
        // or are a compound statement. (Could we return an array in the latter case?)
        //
        // So, for the moment, we return booleans. But that is not the intended long term behaviour; at the 
        // very least we should return the text that would have been output if we were directly connected to
        // a tty. 
        return errorlevel === EXIT_SUCCESS;
    }

    toScriptlet( scriptName ) {
        return Scriptlet.from(
               
            `IDL=1 -- Execute the script:\n--\n-- >${ JSON.stringify(this.#scriptText).slice( 1, -1 ) }\n${scriptName} :: default()`,
            // If script begins '//' we are in trouble. (But we could add spaces.)
            // 2025_2_1: Should the protocol be `cli:`? 
            `script:${this.#scriptText}`,
            this, 
            scriptName 
        );
    }
};

/// @brief The `sh` function that is made available on blank scripts to reinvoke the shell.
/// PacakageTree builds "empty" modules to include this.
/// 
/// Should this at least make available the cwd?
///
/// This (i.e. `shell.execJob()`) should be treated like `fetch()` and return a "Response" object.
/// Command doesn't start till you call `text()` or `lines()` or `pipeTo()` etc... method. 
/// (It should realise as text.) The object should record the state and the exit code/signal/exception
/// which terminated it.
/// 
export async function 
sh( stringOrArgv ) {
    if ( typeof stringOrArgv !== 'string' && !Array.isArray( stringOrArgv ) )
        throw new TypeError( "Invalid arg argument" );
    const {shell} = getCurrentShellJob();
    if ( Array.isArray( stringOrArgv )  
        // 2025_2_5: Yes, even literal numbers can break the array stringifier - it demands strings.
        && stringOrArgv.some( element => typeof element !== 'string' ) ) { {
            // 2025_2_5:  There is a bug whereby `${number}` becomes a number.
            // Also numbers, need `toNumber().toString()` - Integer need a `toString()` feature.  

            // Should we point out where? Also stringify is slightly suspect in this context; inspect() would be better in this context.
            throw new Error( `gash(): args must all be strings ${JSON.stringify( stringOrArgv )}` );
        }
    }
    const errorlevel = await shell.execJob( [ "node", NEW_NAME, ...Array.isArray( stringOrArgv ) ? stringOrArgv : [stringOrArgv] ], {} );
    return errorlevel === EXIT_SUCCESS;
}


