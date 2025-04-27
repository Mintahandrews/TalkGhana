Object.defineProperty(exports, '__esModule', { value: true });

var react = require('react');

const NativeSpeechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition || window.oSpeechRecognition);
const isNative = (SpeechRecognition)=>SpeechRecognition === NativeSpeechRecognition;

var isAndroid = (()=>/(android)/i.test(typeof navigator !== "undefined" ? navigator.userAgent : ""));

const debounce = (func, wait, immediate)=>{
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        const later = function() {
            timeout = null;
        };
        const callNow = !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};
const concatTranscripts = (...transcriptParts)=>{
    return transcriptParts.map((t)=>t.trim()).join(" ").trim();
};
// The command matching code is a modified version of Backbone.Router by Jeremy Ashkenas, under the MIT license.
const optionalParam = /\s*\((.*?)\)\s*/g;
const optionalRegex = /(\(\?:[^)]+\))\?/g;
const namedParam = /(\(\?)?:\w+/g;
const splatParam = /\*/g;
const escapeRegExp = /[-{}[\]+?.,\\^$|#]/g;
const commandToRegExp = (command)=>{
    if (command instanceof RegExp) {
        return new RegExp(command.source, "i");
    }
    command = command.replace(escapeRegExp, "\\$&").replace(optionalParam, "(?:$1)?").replace(namedParam, (match, optional)=>{
        return optional ? match : "([^\\s]+)";
    }).replace(splatParam, "(.*?)").replace(optionalRegex, "\\s*$1?\\s*");
    return new RegExp("^" + command + "$", "i");
};
// this is from https://github.com/aceakash/string-similarity
const compareTwoStringsUsingDiceCoefficient = (first, second)=>{
    first = first.replace(/\s+/g, "").toLowerCase();
    second = second.replace(/\s+/g, "").toLowerCase();
    if (!first.length && !second.length) return 1; // if both are empty strings
    if (!first.length || !second.length) return 0; // if only one is empty string
    if (first === second) return 1; // identical
    if (first.length === 1 && second.length === 1) return 0; // both are 1-letter strings
    if (first.length < 2 || second.length < 2) return 0; // if either is a 1-letter string
    const firstBigrams = new Map();
    for(let i = 0; i < first.length - 1; i++){
        const bigram = first.substring(i, i + 2);
        const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) + 1 : 1;
        firstBigrams.set(bigram, count);
    }
    let intersectionSize = 0;
    for(let i = 0; i < second.length - 1; i++){
        const bigram = second.substring(i, i + 2);
        const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) : 0;
        if (count > 0) {
            firstBigrams.set(bigram, count - 1);
            intersectionSize++;
        }
    }
    return 2.0 * intersectionSize / (first.length + second.length - 2);
};
const browserSupportsPolyfills = ()=>{
    return typeof window !== "undefined" && window.navigator !== undefined && window.navigator.mediaDevices !== undefined && window.navigator.mediaDevices.getUserMedia !== undefined && (window.AudioContext !== undefined || window.webkitAudioContext !== undefined);
};

function asyncGeneratorStep$1(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _async_to_generator$1(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep$1(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep$1(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
class RecognitionManager {
    setSpeechRecognition(SpeechRecognition) {
        const browserSupportsRecogniser = !!SpeechRecognition && (isNative(SpeechRecognition) || browserSupportsPolyfills());
        if (browserSupportsRecogniser) {
            this.disableRecognition();
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.onresult = this.updateTranscript.bind(this);
            this.recognition.onend = this.onRecognitionDisconnect.bind(this);
            this.recognition.onerror = this.onError.bind(this);
        }
        this.emitBrowserSupportsSpeechRecognitionChange(browserSupportsRecogniser);
    }
    subscribe(id, callbacks) {
        this.subscribers[id] = callbacks;
    }
    unsubscribe(id) {
        delete this.subscribers[id];
    }
    emitListeningChange(listening) {
        this.listening = listening;
        Object.keys(this.subscribers).forEach((id)=>{
            const { onListeningChange } = this.subscribers[id];
            onListeningChange(listening);
        });
    }
    emitMicrophoneAvailabilityChange(isMicrophoneAvailable) {
        this.isMicrophoneAvailable = isMicrophoneAvailable;
        Object.keys(this.subscribers).forEach((id)=>{
            const { onMicrophoneAvailabilityChange } = this.subscribers[id];
            onMicrophoneAvailabilityChange(isMicrophoneAvailable);
        });
    }
    emitTranscriptChange(interimTranscript, finalTranscript) {
        Object.keys(this.subscribers).forEach((id)=>{
            const { onTranscriptChange } = this.subscribers[id];
            onTranscriptChange(interimTranscript, finalTranscript);
        });
    }
    emitClearTranscript() {
        Object.keys(this.subscribers).forEach((id)=>{
            const { onClearTranscript } = this.subscribers[id];
            onClearTranscript();
        });
    }
    emitBrowserSupportsSpeechRecognitionChange(browserSupportsSpeechRecognitionChange) {
        Object.keys(this.subscribers).forEach((id)=>{
            const { onBrowserSupportsSpeechRecognitionChange, onBrowserSupportsContinuousListeningChange } = this.subscribers[id];
            onBrowserSupportsSpeechRecognitionChange(browserSupportsSpeechRecognitionChange);
            onBrowserSupportsContinuousListeningChange(browserSupportsSpeechRecognitionChange);
        });
    }
    disconnect(disconnectType) {
        if (this.recognition && this.listening) {
            switch(disconnectType){
                case "ABORT":
                    this.pauseAfterDisconnect = true;
                    this.abort();
                    break;
                case "RESET":
                    this.pauseAfterDisconnect = false;
                    this.abort();
                    break;
                case "STOP":
                default:
                    this.pauseAfterDisconnect = true;
                    this.stop();
            }
        }
    }
    disableRecognition() {
        if (this.recognition) {
            this.recognition.onresult = ()=>{};
            this.recognition.onend = ()=>{};
            this.recognition.onerror = ()=>{};
            if (this.listening) {
                this.stopListening();
            }
        }
    }
    onError(event) {
        if (event && event.error && event.error === "not-allowed") {
            this.emitMicrophoneAvailabilityChange(false);
            this.disableRecognition();
        }
    }
    onRecognitionDisconnect() {
        this.onStopListening();
        this.listening = false;
        if (this.pauseAfterDisconnect) {
            this.emitListeningChange(false);
        } else if (this.recognition) {
            if (this.recognition.continuous) {
                this.startListening({
                    continuous: this.recognition.continuous
                });
            } else {
                this.emitListeningChange(false);
            }
        }
        this.pauseAfterDisconnect = false;
    }
    updateTranscript({ results, resultIndex }) {
        const currentIndex = resultIndex === undefined ? results.length - 1 : resultIndex;
        this.interimTranscript = "";
        this.finalTranscript = "";
        for(let i = currentIndex; i < results.length; ++i){
            if (results[i].isFinal && (!isAndroid() || results[i][0].confidence > 0)) {
                this.updateFinalTranscript(results[i][0].transcript);
            } else {
                this.interimTranscript = concatTranscripts(this.interimTranscript, results[i][0].transcript);
            }
        }
        let isDuplicateResult = false;
        if (this.interimTranscript === "" && this.finalTranscript !== "") {
            if (this.previousResultWasFinalOnly) {
                isDuplicateResult = true;
            }
            this.previousResultWasFinalOnly = true;
        } else {
            this.previousResultWasFinalOnly = false;
        }
        if (!isDuplicateResult) {
            this.emitTranscriptChange(this.interimTranscript, this.finalTranscript);
        }
    }
    updateFinalTranscript(newFinalTranscript) {
        this.finalTranscript = concatTranscripts(this.finalTranscript, newFinalTranscript);
    }
    resetTranscript() {
        this.disconnect("RESET");
    }
    startListening({ continuous = false, language } = {}) {
        var _this = this;
        return _async_to_generator$1(function*() {
            if (!_this.recognition) {
                return;
            }
            const isContinuousChanged = continuous !== _this.recognition.continuous;
            const isLanguageChanged = language && language !== _this.recognition.lang;
            if (isContinuousChanged || isLanguageChanged) {
                if (_this.listening) {
                    yield _this.stopListening();
                }
                _this.recognition.continuous = isContinuousChanged ? continuous : _this.recognition.continuous;
                _this.recognition.lang = isLanguageChanged ? language : _this.recognition.lang;
            }
            if (!_this.listening) {
                if (!_this.recognition.continuous) {
                    _this.resetTranscript();
                    _this.emitClearTranscript();
                }
                try {
                    yield _this.start();
                    _this.emitListeningChange(true);
                } catch (e) {
                    // DOMExceptions indicate a redundant microphone start - safe to swallow
                    if (!(e instanceof DOMException)) {
                        _this.emitMicrophoneAvailabilityChange(false);
                    }
                }
            }
        })();
    }
    abortListening() {
        var _this = this;
        return _async_to_generator$1(function*() {
            _this.disconnect("ABORT");
            _this.emitListeningChange(false);
            yield new Promise((resolve)=>{
                _this.onStopListening = resolve;
            });
        })();
    }
    stopListening() {
        var _this = this;
        return _async_to_generator$1(function*() {
            _this.disconnect("STOP");
            _this.emitListeningChange(false);
            yield new Promise((resolve)=>{
                _this.onStopListening = resolve;
            });
        })();
    }
    getRecognition() {
        return this.recognition;
    }
    start() {
        var _this = this;
        return _async_to_generator$1(function*() {
            if (_this.recognition && !_this.listening) {
                yield _this.recognition.start();
                _this.listening = true;
            }
        })();
    }
    stop() {
        if (this.recognition && this.listening) {
            this.recognition.stop();
            this.listening = false;
        }
    }
    abort() {
        if (this.recognition && this.listening) {
            this.recognition.abort();
            this.listening = false;
        }
    }
    constructor(SpeechRecognition){
        this.recognition = null;
        this.pauseAfterDisconnect = false;
        this.interimTranscript = "";
        this.finalTranscript = "";
        this.listening = false;
        this.isMicrophoneAvailable = true;
        this.subscribers = {};
        this.onStopListening = ()=>{};
        this.previousResultWasFinalOnly = false;
        this.resetTranscript = this.resetTranscript.bind(this);
        this.startListening = this.startListening.bind(this);
        this.stopListening = this.stopListening.bind(this);
        this.abortListening = this.abortListening.bind(this);
        this.setSpeechRecognition = this.setSpeechRecognition.bind(this);
        this.disableRecognition = this.disableRecognition.bind(this);
        this.setSpeechRecognition(SpeechRecognition);
        if (isAndroid()) {
            this.updateFinalTranscript = debounce(this.updateFinalTranscript, 250);
        }
    }
}

const CLEAR_TRANSCRIPT = "CLEAR_TRANSCRIPT";
const APPEND_TRANSCRIPT = "APPEND_TRANSCRIPT";

const clearTranscript = ()=>{
    return {
        type: CLEAR_TRANSCRIPT
    };
};
const appendTranscript = (interimTranscript, finalTranscript)=>{
    return {
        type: APPEND_TRANSCRIPT,
        payload: {
            interimTranscript,
            finalTranscript
        }
    };
};

const transcriptReducer = (state, action)=>{
    switch(action.type){
        case CLEAR_TRANSCRIPT:
            return {
                interimTranscript: "",
                finalTranscript: ""
            };
        case APPEND_TRANSCRIPT:
            return {
                interimTranscript: action.payload.interimTranscript,
                finalTranscript: concatTranscripts(state.finalTranscript, action.payload.finalTranscript)
            };
        default:
            throw new Error();
    }
};

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _async_to_generator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
let _browserSupportsSpeechRecognition = !!NativeSpeechRecognition;
let _browserSupportsContinuousListening = _browserSupportsSpeechRecognition && !isAndroid();
let recognitionManager;
const useSpeechRecognition = ({ transcribing = true, clearTranscriptOnListen = true, commands = [] } = {})=>{
    const [recognitionManager] = react.useState(SpeechRecognition.getRecognitionManager());
    const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = react.useState(_browserSupportsSpeechRecognition);
    const [browserSupportsContinuousListening, setBrowserSupportsContinuousListening] = react.useState(_browserSupportsContinuousListening);
    const [{ interimTranscript, finalTranscript }, dispatch] = react.useReducer(transcriptReducer, {
        interimTranscript: recognitionManager.interimTranscript,
        finalTranscript: ""
    });
    const [listening, setListening] = react.useState(recognitionManager.listening);
    const [isMicrophoneAvailable, setMicrophoneAvailable] = react.useState(recognitionManager.isMicrophoneAvailable);
    const commandsRef = react.useRef(commands);
    commandsRef.current = commands;
    const dispatchClearTranscript = ()=>{
        dispatch(clearTranscript());
    };
    const resetTranscript = react.useCallback(()=>{
        recognitionManager.resetTranscript();
        dispatchClearTranscript();
    }, [
        recognitionManager
    ]);
    const testFuzzyMatch = (command, input, fuzzyMatchingThreshold)=>{
        const commandToString = typeof command === "object" ? command.toString() : command;
        const commandWithoutSpecials = commandToString.replace(/[&/\\#,+()!$~%.'":*?<>{}]/g, "").replace(/  +/g, " ").trim();
        const howSimilar = compareTwoStringsUsingDiceCoefficient(commandWithoutSpecials, input);
        if (howSimilar >= fuzzyMatchingThreshold) {
            return {
                command,
                commandWithoutSpecials,
                howSimilar,
                isFuzzyMatch: true
            };
        }
        return null;
    };
    const testMatch = (command, input)=>{
        const pattern = commandToRegExp(command);
        const result = pattern.exec(input);
        if (result) {
            return {
                command,
                parameters: result.slice(1)
            };
        }
        return null;
    };
    const matchCommands = react.useCallback((newInterimTranscript, newFinalTranscript)=>{
        commandsRef.current.forEach(({ command, callback, matchInterim = false, isFuzzyMatch = false, fuzzyMatchingThreshold = 0.8, bestMatchOnly = false })=>{
            const input = !newFinalTranscript && matchInterim ? newInterimTranscript.trim() : newFinalTranscript.trim();
            const subcommands = Array.isArray(command) ? command : [
                command
            ];
            const results = subcommands.map((subcommand)=>{
                if (isFuzzyMatch) {
                    return testFuzzyMatch(subcommand, input, fuzzyMatchingThreshold);
                }
                return testMatch(subcommand, input);
            }).filter((x)=>x);
            if (isFuzzyMatch && bestMatchOnly && results.length >= 2) {
                results.sort((a, b)=>b.howSimilar - a.howSimilar);
                const { command, commandWithoutSpecials, howSimilar } = results[0];
                callback(commandWithoutSpecials, input, howSimilar, {
                    command,
                    resetTranscript
                });
            } else {
                results.forEach((result)=>{
                    if (result.isFuzzyMatch) {
                        const { command, commandWithoutSpecials, howSimilar } = result;
                        callback(commandWithoutSpecials, input, howSimilar, {
                            command,
                            resetTranscript
                        });
                    } else {
                        const { command, parameters } = result;
                        callback(...parameters, {
                            command,
                            resetTranscript
                        });
                    }
                });
            }
        });
    }, [
        resetTranscript
    ]);
    const handleTranscriptChange = react.useCallback((newInterimTranscript, newFinalTranscript)=>{
        if (transcribing) {
            dispatch(appendTranscript(newInterimTranscript, newFinalTranscript));
        }
        matchCommands(newInterimTranscript, newFinalTranscript);
    }, [
        matchCommands,
        transcribing
    ]);
    const handleClearTranscript = react.useCallback(()=>{
        if (clearTranscriptOnListen) {
            dispatchClearTranscript();
        }
    }, [
        clearTranscriptOnListen
    ]);
    react.useEffect(()=>{
        const id = SpeechRecognition.counter;
        SpeechRecognition.counter += 1;
        const callbacks = {
            onListeningChange: setListening,
            onMicrophoneAvailabilityChange: setMicrophoneAvailable,
            onTranscriptChange: handleTranscriptChange,
            onClearTranscript: handleClearTranscript,
            onBrowserSupportsSpeechRecognitionChange: setBrowserSupportsSpeechRecognition,
            onBrowserSupportsContinuousListeningChange: setBrowserSupportsContinuousListening
        };
        recognitionManager.subscribe(id, callbacks);
        return ()=>{
            recognitionManager.unsubscribe(id);
        };
    }, [
        transcribing,
        clearTranscriptOnListen,
        recognitionManager,
        handleTranscriptChange,
        handleClearTranscript
    ]);
    const transcript = concatTranscripts(finalTranscript, interimTranscript);
    return {
        transcript,
        interimTranscript,
        finalTranscript,
        listening,
        isMicrophoneAvailable,
        resetTranscript,
        browserSupportsSpeechRecognition,
        browserSupportsContinuousListening
    };
};
const SpeechRecognition = {
    counter: 0,
    applyPolyfill: (PolyfillSpeechRecognition)=>{
        if (recognitionManager) {
            recognitionManager.setSpeechRecognition(PolyfillSpeechRecognition);
        } else {
            recognitionManager = new RecognitionManager(PolyfillSpeechRecognition);
        }
        const browserSupportsPolyfill = !!PolyfillSpeechRecognition && browserSupportsPolyfills();
        _browserSupportsSpeechRecognition = browserSupportsPolyfill;
        _browserSupportsContinuousListening = browserSupportsPolyfill;
    },
    removePolyfill: ()=>{
        if (recognitionManager) {
            recognitionManager.setSpeechRecognition(NativeSpeechRecognition);
        } else {
            recognitionManager = new RecognitionManager(NativeSpeechRecognition);
        }
        _browserSupportsSpeechRecognition = !!NativeSpeechRecognition;
        _browserSupportsContinuousListening = _browserSupportsSpeechRecognition && !isAndroid();
    },
    getRecognitionManager: ()=>{
        if (!recognitionManager) {
            recognitionManager = new RecognitionManager(NativeSpeechRecognition);
        }
        return recognitionManager;
    },
    getRecognition: ()=>{
        const recognitionManager = SpeechRecognition.getRecognitionManager();
        return recognitionManager.getRecognition();
    },
    startListening: /*#__PURE__*/ _async_to_generator(function*({ continuous, language } = {}) {
        const recognitionManager = SpeechRecognition.getRecognitionManager();
        yield recognitionManager.startListening({
            continuous,
            language
        });
    }),
    stopListening: /*#__PURE__*/ _async_to_generator(function*() {
        const recognitionManager = SpeechRecognition.getRecognitionManager();
        yield recognitionManager.stopListening();
    }),
    abortListening: /*#__PURE__*/ _async_to_generator(function*() {
        const recognitionManager = SpeechRecognition.getRecognitionManager();
        yield recognitionManager.abortListening();
    }),
    browserSupportsSpeechRecognition: ()=>_browserSupportsSpeechRecognition,
    browserSupportsContinuousListening: ()=>_browserSupportsContinuousListening
};

exports.default = SpeechRecognition;
exports.useSpeechRecognition = useSpeechRecognition;
