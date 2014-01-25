// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// Concerto
//
// Copyright Taehoon Moon 2014

/** @constructor */
function Concerto() {}

Concerto.Debug = true;

/**
 * Logging levels available to this application.
 * @enum {number}
 */
Concerto.LogLevels = {
    DEBUG: 5,
    INFO: 4,
    WARN: 3,
    ERROR: 2,
    FATAL: 1
};

/**
 * Set the debuglevel for this application.
 *
 * @define {number}
 */
Concerto.LogLevel = Concerto.LogLevels.DEBUG;

/**
 * Logs a message to the console.
 *
 * @param {Concerto.LogLevels} level A logging level.
 * @param {string|number|!Object} A log message (or object to dump).
 */
Concerto.logMessage = function(level, message) {
    if ((level <= Concerto.LogLevel) && window.console) {
        var log_message = message;

        if (typeof(message) == 'object') {
            log_message = {
                level: level,
                message: message
            };
        } else {
            log_message = "ConcertoLog: [" + level + "] " + log_message;
        }

        window.console.log(log_message);
    }
};

/**
 * Logging shortcuts.
 */
Concerto.logDebug = function(message) {
    Concerto.logMessage(Concerto.LogLevels.DEBUG, message); 
};
Concerto.logInfo = function(message) {
    Concerto.logMessage(Concerto.LogLevels.INFO, message);
};
Concerto.logWarn = function(message) {
    Concerto.logMessage(Concerto.LogLevels.WARN, message); 
};
Concerto.logError = function(message) {
    Concerto.logMessage(Concerto.LogLevels.ERROR, message);
};
Concerto.logFatal = function(message, exception) {
    Concerto.logMessage(Concerto.LogLevels.FATAL, message);
    if (exception) throw exception; else throw "ConcertoFatalError";
};