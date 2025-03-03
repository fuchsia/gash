export const 
EXIT_SUCCESS = 0,                 //< The scriptlet executed successfully and returned something other than false.
EXIT_FAILURE = 1,                 //< The scriptlet executed successfully and returned false. 

EXIT_SCRIPTLET_EXCEPTION = 2,     //< Dynamic exception thrown from scriptlet?
EXIT_ARGV_ERROR          = 3,     //< Error in the the argv supplied to main() (Currently unsued.)  
  
// Errors that should be prefixed `gash:`
EXIT_IDL_ERROR           = 4,     //< Invalid IDL (or couldn't resolve a file?) Possibly CLI errors in nested scripts? (Currently unused)  
EXIT_JS_HELL_EXCEPTION   = 5;     //< Internal Error?



