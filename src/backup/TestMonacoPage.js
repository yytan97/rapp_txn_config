import * as react from "react";
import * as reactRouter from "react-router-dom";

import * as apiBox from "./apiBox.js";
import * as tBox from "./tBox.js";

import { globalContext } from "./globalContext.js";

import { ErrorLine } from "./ErrorLine.js";
import { DumpPanel } from "./DumpPanel.js";
import { showInfoDialogBox } from "./InfoDialogBox.js";
import { showConfirmDialogBox } from "./ConfirmDialogBox.js";
import { showStateDialogBox, closeStateDialogBox } from "./StateDialogBox.js";

import loader from '@monaco-editor/loader';

// Map loaded lib here ...
// const uuidv4 = window.uuidv4;
// const moment = window.moment;

let monaco = undefined;
let editor = undefined;
// let lang = undefined;
let data = undefined;
let dirty = false;

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
            value: data,
            language: language || "myLang",
            theme: 'vs-dark',
            automaticLayout: true
        });

        dirty = false;
        editor.onDidChangeModelContent(function (e) {
            console.log("My editor instance did change model content", e);
            dirty = true;
        });

    }
    catch (e) {
        console.log(e);
    }
};

export function TestMonacoPage({ debugMode = true }) {
    const componentName = "TestMonacoPage";
    if (debugMode) console.log(`${componentName} component start ...`);

    const { config, localData, gsl, applicationLanguage,
        updateApplicationLanguage, updateUser,
    } = react.useContext(globalContext);

    let sl = tBox.getStringLabel(gsl, componentName);

    const navigate = reactRouter.useNavigate();

    react.useEffect(() => {
        if (debugMode) console.log("Run on effect");
        let timer = setTimeout(async () => {
            await loadDataList();
        }, 100);

        return () => {
            if (debugMode) console.log(`Unmount ${componentName}`);
            clearTimeout(timer)
            editor?.dispose();
            editor = undefined;
            data = undefined;
        };
    }, []);

    async function loadDataList() {
        showStateDialogBox();

        try {
            await tBox.sleep(1000 * 1);

            let list = await apiBox.getCountryList();
            data = JSON.stringify(list, null, 4);
            // editor.getModel().setValue(data);
            setupEditor();            
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

    function toggle4Language(e) {
        if (debugMode) console.log("Toggle for Language ", e);

        let lang = applicationLanguage;
        if (lang == "English") lang = "Chinese";
        else lang = "English";

        console.log("Toggle for Language ", lang);
        updateApplicationLanguage(lang);

        return;
    };

    function click4Back(e) {
        if (debugMode) console.log("Click for back ", e);
        navigate(-1);
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
        <>

            <div className="d-flex justify-content-between align-items-center" style={{ height: "60px" }}>
                <div className="ms-3" >
                    <span className="p-2" role="button" onClick={click4Back} >
                        <i className="fas fa-arrow-left fa-fw"></i>
                    </span>
                </div>

                <div className="me-3">
                    <button className="ms-1 btn btn-ghost-unity " type="button" title="Save">
                        <span className="material-icons-outlined fs-24-unity">upload_file</span>
                    </button>
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

            <div className="px-3 mb-3 ">
                <div id="monaco" className="" style={{ width: "100%", height: "calc(100vh - 100px)" }}></div>
            </div>

            <DumpPanel dataList={[
                { name: "sl", data: sl },
            ]} debugMode={debugMode} />
        </>
    );
}

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

