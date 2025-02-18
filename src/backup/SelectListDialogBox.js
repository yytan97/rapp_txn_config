import * as react from "react";
// import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import * as apiBox from "./apiBox.js";

import { globalContext } from "./globalContext.js";

import { ErrorLine } from "./ErrorLine.js";
import { showStateDialogBox, closeStateDialogBox } from "./StateDialogBox.js";
import { showInfoDialogBox } from "./InfoDialogBox.js";



// Map loaded lib here ...
const uuidv4 = window.uuidv4;
// const moment = window.moment;
const bootstrap = window.bootstrap;

let modal = undefined;
let action = 0;

let data = {};
let title = "";
let callback4OK = undefined;
let callback4Cancel = undefined;

let label4OK = undefined;
let label4Cancel = undefined;

let dataList = [];

// input variable
let inputData = {};
let formObject = {
    dirty: false,
    valid: false,
    fieldState: {},
};

export function cleanUp() {
    inputData = {};
    formObject = {
        dirty: false,
        valid: false,
        fieldState: {},
    };
    return;
};

export function SelectListDialogBox({ debugMode = true }) {
    const componentName = "SelectListDialogBox";

    if (debugMode) console.log(`${componentName} component start ...`);
    const { gsl, getSessionToken } = react.useContext(globalContext);
    let sl = tBox.getStringLabel(gsl, componentName);

    const ref4Div = react.useRef();
    const ref4Form = react.useRef();
    const ref4Input = react.useRef();

    const [redraw, setRedraw] = react.useState(0);

    react.useEffect(() => {
        if (debugMode) console.log(`Effect on ${componentName} component`);

        if (modal === undefined) {
            modal = new bootstrap.Modal(ref4Div.current, { backdrop: "static" });
            if (debugMode) console.log("Create modal instance");

            ref4Div.current.addEventListener('hidden.bs.modal', callback4Hide);
            window.addEventListener("showSelectListDialogBox", callback4Show);
        }

        // clean up
        return () => {
            console.log(`Unmount ${componentName}`);
            if (modal !== undefined) {
                console.log(`Clean up for ${componentName}`);
                window.removeEventListener("showSelectListDialogBox", callback4Show);
                ref4Div?.current?.removeEventListener('hidden.bs.modal', callback4Hide);

                modal.dispose();
                modal = undefined;
            }
        };

    }, []);

    // set the inital form status
    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect for build field state`);
        let obj = tBox.buildFormFieldState(ref4Form.current);
        formObject.fieldState = obj;

        formObject.valid = ref4Form.current.checkValidity();
    }, [redraw]);

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
        console.log("Receive event 'showSelectListDialogBox'", e.detail);
        let detail = e.detail;

        // title = detail.title;
        title = detail.data?.title;
        dataList = detail.data?.dataList || [];
        data = detail.data;
        callback4OK = detail.callback4OK;
        callback4Cancel = detail.callback4Cancel;

        label4OK = detail.label4OK;
        label4Cancel = detail.label4Cancel;

        action = 0;

        if (data !== undefined) inputData = { ...data };

        // reset form before start show
        formObject = {
            dirty: false,
            valid: false,
            fieldState: {},
        };

        setRedraw((v) => v + 1);

        setTimeout(showModal, 100);
        return;
    };

    function change4Input(e) {
        if (debugMode) console.log("Form", ref4Form.current.checkValidity());

        formObject.dirty = true;
        formObject.valid = ref4Form.current.checkValidity();
        let obj = tBox.buildFormFieldState(ref4Form.current);
        formObject.fieldState = obj;

        inputData[e.target.name] = e.target.value;
        if (debugMode) console.log("Input data", inputData);

        // add custom validation
   
        console.log("Form state", formObject)
        setRedraw((v) => v + 1);
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

                        <div className="modal-body">
                            <div className="fs-1 text-primary text-center">
                                <span className="material-icons fs-1">help</span>
                            </div>
                            <div className="fw-bold text-center mb-3">{title}</div>

                            <form className="col-12 mt-2" ref={ref4Form} autoComplete="off" noValidate>

                                <select name="selectValue"
                                    className={`form-select ${tBox.getClass4IsInvalid2('selectValue', formObject)}`}
                                    value={inputData?.selectValue || ""}
                                    onChange={change4Input}
                                    disabled={false}
                                    required={true} >
                                    <option value="">{sl.l_select_from_list}</option>
                                    {
                                        dataList?.map((record, index) => {
                                            return (
                                                <option key={index} value={record.value} >
                                                    {record.label}
                                                </option>
                                            );
                                        })
                                    }

                                </select>

                            </form>
                        </div>

                        <div className="modal-footer justify-content-center text-center border-top-0">
                            <button className="btn btn-unity "
                                onClick={click4OK}
                                disabled={!formObject?.valid || !formObject?.dirty}>
                                {label4OK || sl.b_confirm}
                            </button>
                            <button className="btn btn-outline-unity " onClick={click4Cancel} >
                                {label4Cancel || sl.b_dismiss}
                            </button>
                        </div>
                    </div>
                </div >
            </div >

        </>
    );
};

export function showSelectListDialogBox(data, callback4OK, label4OK, callback4Cancel, label4Cancel) {
    console.log("Show select list dialog box");

    let detail = {
        data: { ...data },
        callback4OK: callback4OK,
        callback4Cancel: callback4Cancel,
        label4OK: label4OK,
        label4Cancel: label4Cancel
    };

    let e = new CustomEvent("showSelectListDialogBox", {
        detail: detail
    });
    window.dispatchEvent(e);
    return;
};
