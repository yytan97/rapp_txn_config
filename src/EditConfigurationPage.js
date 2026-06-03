
import * as react from "react";
import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import * as apiBox from "./apiBox.js";
import { globalContext } from "./globalContext.js";

// import { ErrorLine } from "./ErrorLine.js";
// import { InputLabel } from "./InputLabel.js";

import { DumpPanel } from "./DumpPanel.js";

// import { SideBar } from "./SideBar.js";
// import { TitlePanel } from "./TitlePanel.js";
// import { FooterPanel } from "./FooterPanel.js";
// import { ClosablePanel } from "./ClosablePanel.js";

import { showInfoDialogBox } from "./InfoDialogBox.js";
import { showConfirmDialogBox } from "./ConfirmDialogBox.js";
import { showStateDialogBox, closeStateDialogBox } from "./StateDialogBox.js";

import loader from '@monaco-editor/loader';

// Map loaded lib here ...
const uuidv4 = window.uuidv4;
const moment = window.moment;

const accessObjectName = "webapp_configuration_access";
const accessActionPrefix = "configuration";

let monaco = undefined;
let editor = undefined;
let dirty = false;

let dataContent = undefined;
let editMode = 0;
let filename = undefined;

export function cleanUp() {
    filename = undefined;

    dataContent = undefined;
    editMode = 0;
    dirty = false;
    return;
};

export function EditConfigurationPage({ debugMode = true }) {
    const componentName = "EditConfigurationPage";
    if (debugMode) console.log(`${componentName} component start ...`);

    const {
        config, localData, gsl, dataset, user,
        applicationDebugMode, applicationLanguage,
        updateUser,
        getSessionToken, getUsername,
        check4Right
    } = react.useContext(globalContext);

    // check from context
    if (applicationDebugMode !== undefined) debugMode = applicationDebugMode;
    let sl = tBox.getStringLabel(gsl, componentName);

    let [redraw, setRedraw] = react.useState(0);

    // const ref4Form = react.useRef();

    const navigate = reactRouter.useNavigate();
    const location = reactRouter.useLocation();

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);

        const sp = new URLSearchParams(location.search);
        editMode = parseInt(sp.get('editMode'));
        filename = sp.get('filename');

        console.log("Edit mode", editMode);
        console.log("Filename", filename);

        let timer = setTimeout(async () => {

            if (editMode === 1) {
                await loadDataList();
            }
            else {
                dataContent = "";
            }

            let fileInfo = tBox.parseFilePath(filename);
            let lang = undefined
            if (fileInfo.extension == ".xml") lang = "xml";
            await setupEditor(lang);

            setRedraw((v) => v + 1);

        }, 100);

        return () => {
            if (debugMode) console.log(`Unmount ${componentName}`);
            clearTimeout(timer);

            // edit page can add cleanup here
            cleanUp();
        };
    }, [location.search]);


    // check for route blocker 
    console.log("Location", location);
    let shouldBlock = react.useCallback(({ currentLocation, nextLocation }) => {
        console.log("Callback for blocker ...")
        return dirty && currentLocation.pathname !== nextLocation.pathname

    }, [redraw]);

    let blocker = reactRouter.useBlocker(shouldBlock);
    console.log("Blocker", blocker);

    if (blocker.state === "blocked") {
        if (debugMode) console.log("Show discard confirm dialog box");
        // only in this case need to wrap in other thread else react warning ...
        setTimeout(() => {
            showConfirmDialogBox(sl.m_changes_not_saved,
                callback4BlockerProceed, sl.b_discard,
                callback4BlockerReset);

        }, 100);
    }

    // event handling function here ...

    async function setupEditor(language) {
        try {

            if (monaco === undefined) {
                monaco = await loader.init();
                monaco.languages.register({ id: "myLang" });

                // Register a tokens provider for the language
                monaco.languages.setMonarchTokensProvider("myLang", myLangDefine);

                monaco.editor.onDidCreateEditor(function (e) {
                    console.log("Monaco editor did create editor", e);
                });
            }

            editor = monaco.editor.create(document.getElementById('monaco'), {
                value: dataContent,
                language: language || "myLang",
                theme: 'vs-dark',
                automaticLayout: true
            });

            dirty = false;
            editor.onDidChangeModelContent(function (e) {
                console.log("My editor instance did change model content", e);
                if (!dirty) {
                    dirty = true;
                    setRedraw((v) => v + 1);
                }
            });

        }
        catch (e) {
            console.log(e);
        }
    };

    async function loadDataList() {
        showStateDialogBox();

        try {
            dataContent = "";

            // check for user access right
            if (!check4Right(accessObjectName, `${accessActionPrefix}.access`)) {
                throw { errorCode: "permission_denied" };
            }

            // fetch data 
            let result4 = await apiBox.readConfigurationFile(getSessionToken(), filename);

            if (result4.flag) {
                dataContent = result4?.data?.files?.[0]?.content;

                console.log("Data content", dataContent);
            }
            else throw (result4);

        }
        catch (e) {
            console.warn("Error", e);
            let message = tBox.getErrorMessage(e, sl);
            showInfoDialogBox(message);
            if (tBox.isBlockErrorCode(e)) updateUser(undefined);
        }
        finally {
            closeStateDialogBox();
            window.scrollTo(0, 0);
        }

    };

    function getLabel(sl, value, prefix = "") {
        if (debugMode) console.log("Get label ", value, prefix);
        let key = prefix + value;
        let s = sl[key];
        return s;
    };

    function getStatusLabelClass(v) {
        if (debugMode) console.log("Get status label class", v);

        let s = "rounded-3 text-center fw-light text-capitalize text-white ";
        if (v === undefined) return s;
        if (v === "A") return s + "bg-success";
        if (v === "P") return s + "bg-warning";
        return s + "bg-danger";
    };

    function callback4BlockerProceed() {
        if (debugMode) console.log("Callback for blocker proceed", blocker);
        blocker?.proceed();
        return;
    };

    function callback4BlockerReset() {
        if (debugMode) console.log("Callback for blocker reset", blocker);
        blocker?.reset();
        return;
    };

    function click4UpdateFile(e) {
        if (debugMode) console.log("Click for update file", e);

        let fileInfo = tBox.parseFilePath(filename);
        let message = sl.m_confirm_save;
        message = message?.replace("__parameter_1", fileInfo.filename);

        showConfirmDialogBox(message, async function () {
            showStateDialogBox();
            try {
                dataContent = editor.getModel().getValue();
                console.warn("Data content", dataContent);
                let result1 = await apiBox.writeConfigurationFile(getSessionToken(), filename, dataContent);
                if (result1 && result1.flag) {
                    dirty = false;
                    let message = sl.m_updated;
                    showInfoDialogBox(message, () => navigate(-1));
                }
                else throw result1;
            }
            catch (e) {
                console.warn("Error", e);
                let message = tBox.getErrorMessage(e, sl);
                showInfoDialogBox(message);
                if (tBox.isBlockErrorCode(e)) updateUser(undefined);
            }
            finally {
                closeStateDialogBox();
            }
        });

        return;
    };

    function click4EditorMenu() {
        console.log("Click for editor menu");
        editor.focus(); 										// Editor needs focus to be able to trigger command
        editor.trigger("", "editor.action.quickCommand", ""); 	// Opens the quickcommand	
    };

    function click4FoldBlock() {
        console.log("Click for fold block");
        editor.focus(); 							// Editor needs focus to be able to trigger command
        editor.trigger("", "editor.foldAll", ""); 	// Opens the quickcommand	
    };

    function click4UnfoldBlock() {
        console.log("Click for unfold block");
        editor.focus(); 							// Editor needs focus to be able to trigger command
        editor.trigger("", "editor.unfoldAll", ""); // Opens the quickcommand	
    };

    return (
        <div className="container " >

            <div className="border-bottom d-flex align-items-center justify-content-between sticky-top bg-white"
                style={{ minHeight: "60px" }}>

                <div style={{ color: "#494D4F", fontSize: "16px", cursor: "pointer" }}
                    onClick={() => navigate(-1)}>
                    <i className="fas fa-arrow-left fa-fw me-2 ms-1"></i> {sl.l_previous_page}
                </div>

                <div >

                    {
                        (editMode === 1 && check4Right(accessObjectName, `${accessActionPrefix}.edit`)) ? (
                            <button className="ms-1 btn btn-ghost-unity "
                                type="button"
                                onClick={click4UpdateFile}
                                title={sl.t_save}
                                disabled={!dirty} >
                                <span className="material-icons-outlined fs-24-unity">upload_file</span>
                            </button>
                        ) : null
                    }

                    <button className="ms-1 btn btn-ghost-unity " type="button"
                        onClick={click4EditorMenu}
                        title="Editor shortcut menu">
                        <span className="material-icons-outlined fs-24-unity">menu_open</span>
                    </button>
                    <button className="ms-1 btn btn-ghost-unity " type="button"
                        onClick={click4FoldBlock}
                        title="Fold block">
                        <span className="material-icons-outlined fs-24-unity">unfold_less</span>
                    </button>
                    <button className="ms-1 btn btn-ghost-unity " type="button"
                        onClick={click4UnfoldBlock}
                        title="Unfold block">
                        <span className="material-icons-outlined fs-24-unity">unfold_more</span>
                    </button>

                </div>

            </div>

            <div style={{ fontSize: "12px" }}>{filename}</div>
            <div className="mb-3 ">
                <div id="monaco" className="" style={{ width: "100%", height: "calc(100vh - 100px)" }}></div>
            </div>

            <DumpPanel dataList={[
                { name: "sl", data: sl },
            ]} debugMode={debugMode} />
        </div >
    );
};


let myLangDefine = {
    // Set defaultToken to invalid to see what you do not tokenize yet
    // defaultToken: 'invalid',

    keywords: [
        'abstract', 'continue', 'for', 'new', 'switch', 'assert', 'goto', 'do',
        'if', 'private', 'this', 'break', 'protected', 'throw', 'else', 'public',
        'enum', 'return', 'catch', 'try', 'interface', 'static', 'class',
        'finally', 'const', 'super', 'while', 'true', 'false',
        'case', 'default', 'extern'
    ],

    typeKeywords: [
        'boolean', 'double', 'byte', 'int', 'short', 'char', 'void', 'long', 'float'
    ],

    operators: [
        '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
        '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
        '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
        '%=', '<<=', '>>=', '>>>='
    ],

    // we include these common regular expressions
    symbols: /[=><!~?:&|+\-*\/\^%]+/,

    // C# style strings
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

    // The main tokenizer for our languages
    tokenizer: {
        root: [
            // identifiers and keywords
            [/[a-z_$][\w$]*/, {
                cases: {
                    '@typeKeywords': 'keyword',
                    '@keywords': 'keyword',
                    '@default': 'identifier'
                }
            }],
            [/[A-Z][\w\$]*/, 'type.identifier'],  // to show class names nicely

            // whitespace
            { include: '@whitespace' },

            // delimiters and operators
            [/[{}()\[\]]/, '@brackets'],
            [/[<>](?!@symbols)/, '@brackets'],
            [/@symbols/, {
                cases: {
                    '@operators': 'operator',
                    '@default': ''
                }
            }],

            // @ annotations.
            // As an example, we emit a debugging log message on these tokens.
            // Note: message are supressed during the first load -- change some lines to see them.
            [/@\s*[a-zA-Z_\$][\w\$]*/, { token: 'annotation', log: 'annotation token: $0' }],

            // numbers
            [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
            [/0[xX][0-9a-fA-F]+/, 'number.hex'],
            [/\d+/, 'number'],

            // delimiter: after number because of .\d floats
            [/[;,.]/, 'delimiter'],

            // strings
            [/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
            [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],

            // characters
            [/'[^\\']'/, 'string'],
            [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
            [/'/, 'string.invalid']
        ],

        comment: [
            [/[^\/*]+/, 'comment'],
            [/\/\*/, 'comment', '@push'],    // nested comment
            ["\\*/", 'comment', '@pop'],
            [/[\/*]/, 'comment']
        ],

        string: [
            [/[^\\"]+/, 'string'],
            [/@escapes/, 'string.escape'],
            [/\\./, 'string.escape.invalid'],
            [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
        ],

        whitespace: [
            [/[ \t\r\n]+/, 'white'],
            [/\/\*/, 'comment', '@comment'],
            [/\/\/.*$/, 'comment'],
            [/#.*$/, 'comment']
        ],
    },
};
