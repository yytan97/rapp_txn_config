import * as react from "react";
// import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import { globalContext } from "./globalContext.js";


// Map loaded lib here ...
const uuidv4 = window.uuidv4;
// const moment = window.moment;
const bootstrap = window.bootstrap;

let modal = undefined;
let action = 0;

let data = "";
let title = "";
let callback4OK = undefined;
let callback4Cancel = undefined;

let label4OK = undefined;
let label4Cancel = undefined;

let languageList = [
    { language: 'English', label: 'English' },
    { language: 'Chinese', label: '中文' },
    // { language: 'Malay', label: 'Melayu' },
];


export function LanguageDialogBox({ debugMode = true }) {
    const componentName = "LanguageDialogBox";

    if (debugMode) console.log(`${componentName} component start ...`);
    const { config, localData, gsl, updateApplicationLanguage } = react.useContext(globalContext);
    let sl = tBox.getStringLabel(gsl, componentName);

    const ref4Div = react.useRef();
    const [sequence, setSequence] = react.useState(0);

    const [inputData, setInputData] = react.useState({});
    const [fieldState, setFieldState] = react.useState({});
    const [formState, setFormState] = react.useState({ dirty: false, valid: false });
    const ref4Form = react.useRef();

    react.useEffect(() => {
        if (debugMode) console.log(`Effect on ${componentName} component`);

        if (modal === undefined) {
            modal = new bootstrap.Modal(ref4Div.current, { backdrop: "static" });
            if (debugMode) console.log("Create modal instance");

            ref4Div.current.addEventListener('hidden.bs.modal', callback4Hide);
            window.addEventListener("showLanguageDialogBox", callback4Show);
        }

        // clean up
        return () => {
            console.log(`Unmount ${componentName}`);
            if (modal !== undefined) {
                console.log(`Clean up for ${componentName}`);
                window.removeEventListener("showLanguageDialogBox", callback4Show);
                ref4Div.current.removeEventListener('hidden.bs.modal', callback4Hide);

                modal.dispose();
                modal = undefined;
            }
        };

    }, []);

    // set the inital form status
    react.useEffect(() => {
        let obj = tBox.buildFormFieldState(ref4Form.current);
        setFieldState(obj);
    }, []);

    function callback4Hide(e) {
        // 0 and 2 for cancel, only 1 for ok
        if (action !== 1) {
            if (callback4Cancel !== undefined)
                callback4Cancel(data);
        }
        else {
            if (callback4OK !== undefined)
                callback4OK(data);
        }
    };

    function callback4Show(e) {
        console.log("Receive event 'showLanguageDialogBox'", e.detail);
        let detail = e.detail;

        title = detail.title;
        // setMessage(detail.message);
        data = detail.data;
        callback4OK = detail.callback4OK;
        callback4Cancel = detail.callback4Cancel;

        label4OK = detail.label4OK;
        label4Cancel = detail.label4Cancel;

        action = 0;

        if (data !== undefined) setInputData({ ...data });

        // setSequence(uuidv4());
        setTimeout(showModal, 100);
        return;
    };

    function change4InputData(e) {
        if (debugMode) console.log("Form", ref4Form.current.checkValidity());
        let obj1 = {
            dirty: true,
            valid: ref4Form.current.checkValidity(),
        };
        setFormState(obj1);

        let obj2 = tBox.buildFieldState(e.target);
        setFieldState({
            ...fieldState,
            [e.target.name]: obj2
        });

        setInputData({
            ...inputData,
            [e.target.name]: e.target.value
        });
    };

    function showModal() {
        if (debugMode) console.log("Show modal");
        modal.show();
        return;
    };

    function click4Cancel(e) {
        if (debugMode) console.log("Click for cancel", e);
        action = 2;
        modal.hide();
        return;
    };

    function click4OK(e) {
        if (debugMode) console.log("Click for ok ", e);
        action = 1;
        data = inputData;

        modal.hide();
        return;
    };

    return (
        <>
            <div className="modal" ref={ref4Div} tabIndex="-1" role="dialog" >
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content ">

                        <div className="modal-body justify-content-center text-center">

                            <form className="row mt-3" ref={ref4Form} autoComplete="off" noValidate>
                                <div className="col-12" >
                                    <label className="form-label mb-1">{sl.l_application_language}</label>
                                    <select className="form-select" name="applicationLanguage"
                                        value={inputData.applicationLanguage || ""}
                                        onChange={change4InputData} >
                                        {
                                            languageList.map((record, index) => {
                                                return (
                                                    <option key={index} value={record.language} >{record.label}</option>
                                                );
                                            })
                                        }
                                    </select>
                                </div>
                            </form>
                        </div>

                        <div className="modal-footer justify-content-center text-center border-top-0">
                            <button className="btn btn-unity " onClick={click4OK} >
                                {label4OK || sl.b_confirm}
                            </button>
                            <button className="btn btn-outline-unity " onClick={click4Cancel} >
                                {label4Cancel || sl.b_dismiss}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
};

export function showLanguageDialogBox(language, callback4OK, label4OK, callback4Cancel, label4Cancel) {
    console.log("Show language dialog box");

    let detail = {
        data: { applicationLanguage: language },
        callback4OK: callback4OK,
        callback4Cancel: callback4Cancel,
        label4OK: label4OK,
        label4Cancel: label4Cancel
    };

    let e = new CustomEvent("showLanguageDialogBox", {
        detail: detail
    });
    window.dispatchEvent(e);
    return;
};
