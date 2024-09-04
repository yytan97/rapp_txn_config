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

let data = "";
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

export function InputCryptoIdDialogBox({ debugMode = true }) {
    const componentName = "InputCryptoIdDialogBox";

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
            window.addEventListener("showInputCryptoIdDialogBox", callback4Show);
        }

        // clean up
        return () => {
            console.log(`Unmount ${componentName}`);
            if (modal !== undefined) {
                console.log(`Clean up for ${componentName}`);
                window.removeEventListener("showInputCryptoIdDialogBox", callback4Show);
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

    async function loadDataList() {
        showStateDialogBox();
        try {
            dataList = [];

            let tableName = "kswitchcryptograms";
            let databaseName = "kdb";
            // fetch data 
            let result4 = await apiBox.getRecord(getSessionToken(), databaseName, tableName);

            if (result4.flag) {
                let list1 = result4?.data?.records;

                if (list1) {
                    list1 = list1.filter((element1, index) => list1.findIndex((element2) => element2.ownerId === element1.ownerId) === index);

                    list1.sort(function (a, b) {
                        if (a.ownerId === b.ownerId) return 0;
                        if (a.ownerId < b.ownerId) return -1;
                        return 1;
                    });

                    dataList = list1;
                }

                console.log("Data list", dataList);
            }
            else throw (result4);

        }
        catch (e) {
            console.warn("Error", e);
            let message = tBox.getErrorMessage(e, sl);
            showInfoDialogBox(message);
            // if (tBox.isBlockErrorCode(e)) updateUser(undefined);
        }
        finally {
            closeStateDialogBox();
            // window.scrollTo(0, 0);
            setRedraw((v) => v + 1);
        }
    };

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
        console.log("Receive event 'showCryptoIdDialogBox'", e.detail);
        let detail = e.detail;

        title = detail.title;
        // setMessage(detail.message);
        data = detail.data;
        callback4OK = detail.callback4OK;
        callback4Cancel = detail.callback4Cancel;

        label4OK = detail.label4OK;
        label4Cancel = detail.label4Cancel;

        action = 0;

        if (data !== undefined) inputData = { ...data };

        if (inputData.optionValue === "3") inputData.cryptoId3 = inputData.cryptoId;
        if (inputData.optionValue === "4") inputData.cryptoId4 = inputData.cryptoId;

        loadDataList();

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
        let name = e.target.name;
        let input = e.target;
       
        if (name === 'cryptoId3') {
            let list = dataList;
            if (list.find(rec => rec.ownerId === inputData.cryptoId3)) {
                input.setCustomValidity("error2");
            }
            else {
                input.setCustomValidity("");
            }
            // need to wait for dom update on input attribute (required and disabled)
            // than only get the html 5 input status on effect run 
            setTimeout(() => setRedraw((v) => v + 1), 200);
        }

        if (name === 'optionValue') {
            if (inputData.optionValue !== '3' && !formObject.fieldState?.['cryptoId3'].valid) {
                inputData['cryptoId3'] = "";
                ref4Input?.current?.setCustomValidity("");
            }      
            setTimeout(() => setRedraw((v) => v + 1), 200);
        }

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
                            <div className="fw-bold text-center mb-3">{ sl.l_title }</div>

                            <form className="col-12 mt-2" ref={ref4Form} autoComplete="off" noValidate>

                                <div className="form-check">
                                    <input className="form-check-input"
                                        type="radio"
                                        name="optionValue"
                                        id="cryptoId_optionValue1"
                                        value="1"
                                        checked={inputData?.optionValue === "1"}
                                        onChange={change4Input}
                                    />
                                    <label className="form-check-label" htmlFor="cryptoId_optionValue1" >
                                        {sl.l_option1}
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input className="form-check-input"
                                        type="radio"
                                        name="optionValue"
                                        id="cryptoId_optionValue2"
                                        value="2"
                                        checked={inputData?.optionValue === "2"}
                                        onChange={change4Input}
                                    />
                                    <label className="form-check-label" htmlFor="cryptoId_optionValue2" >
                                        {sl.l_option2}
                                    </label>
                                </div>

                                <div className="form-check">
                                    <input className="form-check-input"
                                        type="radio"
                                        name="optionValue"
                                        id="cryptoId_optionValue3"
                                        value="3"
                                        checked={inputData?.optionValue === "3"}
                                        onChange={change4Input}
                                    />
                                    <label className="form-check-label" htmlFor="cryptoId_optionValue3">
                                        {sl.l_option3}
                                    </label>

                                    <div className="p-3">
                                        <div className="col-12">

                                            <input name="cryptoId3"
                                                ref={ref4Input}
                                                type="text"
                                                className={`form-control ${tBox.getClass4IsInvalid2('cryptoId3', formObject)}`}
                                                placeholder={sl.p_new_crypto_id}
                                                value={inputData?.cryptoId3 || ""}
                                                onChange={change4Input}
                                                disabled={inputData?.optionValue !== '3'}
                                                required={inputData?.optionValue === '3'}
                                                pattern="^[a-zA-Z0-9\\.-_@]+$"
                                            />

                                            <ErrorLine message={tBox.getFieldErrorMessage2('cryptoId3', sl, formObject)} />

                                        </div>
                                    </div>
                                </div>
                                <div className="form-check">
                                    <input className="form-check-input"
                                        type="radio"
                                        name="optionValue"
                                        id="cryptoId_optionValue4"
                                        value="4"
                                        checked={inputData?.optionValue === "4"}
                                        onChange={change4Input}
                                    />
                                    <label className="form-check-label" htmlFor="cryptoId_optionValue4">
                                        {sl.l_option4}
                                    </label>

                                    <div className="p-3">
                                        <div className="col-12">
                                            <select name="cryptoId4"
                                                className={`form-select ${tBox.getClass4IsInvalid2('cryptoId4', formObject)}`}
                                                value={inputData?.cryptoId4 || ""}
                                                onChange={change4Input}
                                                disabled={inputData?.optionValue !== '4'}
                                                required={inputData?.optionValue === '4'} >
                                                <option value="">{sl.o_select_record_id}</option>
                                                {
                                                    dataList?.map((record, index) => {
                                                        return (
                                                            <option key={index} value={record.ownerId} >
                                                                {record.ownerId}
                                                            </option>
                                                        );
                                                    })
                                                }

                                            </select>
                                        </div>
                                    </div>
                                </div>


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

export function showInputCryptoIdDialogBox(data, callback4OK, label4OK, callback4Cancel, label4Cancel) {
    console.log("Show Input crypto ID dialog box");

    let detail = {
        data: { ...data },
        callback4OK: callback4OK,
        callback4Cancel: callback4Cancel,
        label4OK: label4OK,
        label4Cancel: label4Cancel
    };

    let e = new CustomEvent("showInputCryptoIdDialogBox", {
        detail: detail
    });
    window.dispatchEvent(e);
    return;
};
