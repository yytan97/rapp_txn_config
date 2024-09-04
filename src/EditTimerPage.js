
import * as react from "react";
import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import * as apiBox from "./apiBox.js";
import { globalContext } from "./globalContext.js";

import { ErrorLine } from "./ErrorLine.js";
import { InputLabel } from "./InputLabel.js";

import { DumpPanel } from "./DumpPanel.js";

// import { SideBar } from "./SideBar.js";
// import { TitlePanel } from "./TitlePanel.js";
// import { FooterPanel } from "./FooterPanel.js";
// import { ClosablePanel } from "./ClosablePanel.js";

import { showInfoDialogBox } from "./InfoDialogBox.js";
import { showConfirmDialogBox } from "./ConfirmDialogBox.js";
import { showStateDialogBox, closeStateDialogBox } from "./StateDialogBox.js";

// Map loaded lib here ...
const uuidv4 = window.uuidv4;
const moment = window.moment;

let tableName = "kswitchinstitution_timers";
let databaseName = "kdb";

const accessObjectName = "webapp_configuration_access";
const accessActionPrefix = "cryptogram_management";

let dataRecord = undefined;

// parameter
let rowId = undefined;
let editMode = 0;

// input variable
let inputData = {};
let formObject = {
    dirty: false,
    valid: false,
    fieldState: {},
};

export function cleanUp() {
    dataRecord = undefined;
    rowId = undefined;
    editMode = 0;

    inputData = {};
    formObject = {
        dirty: false,
        valid: false,
        fieldState: {},
    };
    return;
};

export function EditTimerPage({ debugMode = true }) {
    const componentName = "EditTimerPage";
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

    const ref4Form = react.useRef();

    const navigate = reactRouter.useNavigate();
    const location = reactRouter.useLocation();

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);

        const sp = new URLSearchParams(location.search);
        rowId = sp.get('rowId');
        editMode = parseInt(sp.get('editMode'));

        console.log("Row ID", rowId);
        console.log("Edit mode", editMode);

        let timer = setTimeout(async () => {
            // load data list will base on edit mode to provide the input record value
            await loadDataList();
        }, 100);

        return () => {
            if (debugMode) console.log(`Unmount ${componentName}`);
            clearTimeout(timer);

            // edit page can add cleanup here
            cleanUp();
        };
    }, [location.search]);

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect for build field state`);
        let obj = tBox.buildFormFieldState(ref4Form.current);
        formObject.fieldState = obj;
        formObject.valid = ref4Form.current.checkValidity();
    }, [redraw]);     // if having custom validation than need to add redraw to effect state list

    // check for route blocker 
    console.log("Location", location);
    let shouldBlock = react.useCallback(({ currentLocation, nextLocation }) => {
        console.log("Callback for blocker ...")
        // return formState.dirty && currentLocation.pathname !== nextLocation.pathname
        return formObject.dirty && currentLocation.pathname !== nextLocation.pathname

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

    async function loadDataList() {
        showStateDialogBox();

        try {
            dataRecord = undefined;

            // check for user access right
            if (!check4Right(accessObjectName, `${accessActionPrefix}.access`)) {
                throw { errorCode: "permission_denied" };
            }

            // fetch data 

            // other reference data can be load on this section

            if (editMode === 1) {
                let result4 = await apiBox.getRecord(getSessionToken(), databaseName, tableName, `rowId = ${rowId}`);

                if (result4.flag) {
                    let list1 = result4.data.records;
                    /* preprocess 
                    list1 = list1.map((item) => {
                        return item
                    });
                    */

                    dataRecord = list1[0];
                    console.log("Record", dataRecord);
                    inputData = dataRecord;
                }
                else throw (result4);

            } else {
                // provide default value for add mode
                dataRecord = {
                    recordStatus: 'A'
                };
                inputData = dataRecord;
            }

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
            setRedraw((v) => v + 1);
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

    function change4Input(e) {
        if (debugMode) console.log("Change for input", e);

        formObject.dirty = true;
        formObject.valid = ref4Form.current.checkValidity();
        let obj = tBox.buildFormFieldState(ref4Form.current);
        formObject.fieldState = obj;

        // add custom validation
        let name = e.target.name;
        let input = e.target;
        let value = e.target.value;
        let type = e.target.type;

        if (type === 'checkbox' && name.indexOf(".") >= 0) {
            if (debugMode) console.log("Change for input checkbox with dot name", name);
            let a = name.split(".");
            let b = a.reduce((s, item) => {
                if (s === null) return `["${item}"]`;
                else return s + `["${item}"]`;
            }, null);
            let s = `inputData${b} = ${input.checked}`;
            console.log(s);
            eval(s);
        }
        else if (type === 'checkbox') {
            if (debugMode) console.log("Change for input checkbox ", name);
            inputData[name] = input.checked;
        }
        else if (name.indexOf(".") >= 0) {
            if (debugMode) console.log("Change for input checkbox with dot name", name);
            let a = name.split(".");
            let b = a.reduce((s, item) => {
                if (s === null) return `["${item}"]`;
                else return s + `["${item}"]`;
            }, null);
            let s = `inputData${b} = "${value}"`;
            console.log(s);
            eval(s);
        }
        else {
            if (debugMode) console.log("Change for input", name);
            inputData[name] = value;
        }

        console.log("Input data", inputData);
        console.log("Form state", formObject)
        setRedraw((v) => v + 1);
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

    function click4AddRecord(e) {
        if (debugMode) console.log("Click for add record", e);
        let message = sl.m_confirm_create_record;
        message = message.replace("__parameter_1", inputData.institutionId);
        showConfirmDialogBox(message, async function () {
            showStateDialogBox();
            try {

                let result1 = await apiBox.addRecord(getSessionToken(), databaseName, tableName, inputData);
                if (result1 && result1.flag) {
                    formObject.dirty = false;

                    let message = sl.m_record_created;
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

    function click4UpdateRecord(e) {
        if (debugMode) console.log("Click for update record", e);
        let message = sl.m_confirm_update_record;
        message = message.replace("__parameter_1", inputData.rowId);
        showConfirmDialogBox(message, async function () {
            showStateDialogBox();
            try {

                let result1 = await apiBox.updateRecordWithId(getSessionToken(), databaseName, tableName, inputData.rowId, inputData);
                if (result1 && result1.flag) {
                    formObject.dirty = false;

                    let message = sl.m_record_updated;
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

    function click4Echo(e, record, index) {
        if (debugMode) console.log("Click for echo ", e, record, index);
        return;
    };

    return (
        <div className="container " >

            <div className="border-bottom d-flex align-items-center justify-content-between sticky-top bg-white"
                style={{ minHeight: "60px" }}>

                <div style={{ color: "#494D4F", fontSize: "16px", cursor: "pointer" }}
                    onClick={() => navigate(-1)}>
                    <i className="fas fa-arrow-left fa-fw me-2 ms-1"></i> {sl.l_previous_page}
                </div>

                <div>
                    {
                        (editMode === 0 && check4Right(accessObjectName, `${accessActionPrefix}.add`)) ? (
                            <button className="ms-1 btn btn-ghost-unity "
                                type="button"
                                onClick={click4AddRecord}
                                title={sl.t_add}
                                disabled={!formObject?.valid || !formObject?.dirty} >
                                <span className="material-icons-outlined fs-24-unity">add</span>
                            </button>

                        ) : null
                    }

                    {
                        (editMode === 1 && check4Right(accessObjectName, `${accessActionPrefix}.edit`)) ? (
                            <button className="ms-1 btn btn-ghost-unity "
                                type="button"
                                onClick={click4UpdateRecord}
                                title={sl.t_update}
                                disabled={!formObject?.valid || !formObject?.dirty} >
                                <span className="material-icons-outlined fs-24-unity">upload_file</span>
                            </button>
                        ) : null
                    }

                </div>

            </div>

            <form ref={ref4Form} className="d-flex justify-content-center mt-4 mb-5">
                <div className="col-8" style={{ minHeight: "50vh" }}>

                    <div className="pb-3 border-bottom">
                        <div style={{ color: "#242627", "fontSize": "16px", fontWeight: "bold" }} >
                            {(editMode === 0) ? sl.l_add_cryptogram : sl.l_edit_cryptogram}
                        </div>

                        <div style={{ color: "#76797B", fontSize: "12px" }}>
                            {sl.l_desc}
                        </div>
                    </div>

                    <div className="px-4 mt-4">
                        <div style={{ color: "#494D4F", fontSize: "16px", fontWeight: "bold" }} >
                            {sl.l_cryptogram_information}
                        </div>

                        <div className="my-3 px-3">

                            {
                                (editMode === 1) ? (
                                    <div>
                                        <InputLabel label={sl.l_row_id} />
                                        <input name="rowId"
                                            type="text"
                                            className={`form-control ${tBox.getClass4IsInvalid2('rowId', formObject)}`}
                                            placeholder={sl.p_row_id}
                                            value={inputData?.rowId || ""}
                                            onChange={change4Input}
                                            disabled={true} />

                                        <ErrorLine message={tBox.getFieldErrorMessage2('rowId', sl, formObject)} />
                                    </div>
                                ) : null
                            }

                            <div>
                                <InputLabel label={sl.l_institution_id} required />
                                <input name="institutionId"
                                    type="text"
                                    className={`form-control ${tBox.getClass4IsInvalid2('institutionId', formObject)}`}
                                    placeholder={sl.p_institution_id}
                                    value={inputData?.institutionId || ""}
                                    onChange={change4Input}
                                    disabled={editMode === 1}
                                    required />

                                <ErrorLine message={tBox.getFieldErrorMessage2('institutionId', sl, formObject)} />
                            </div>

                            <div >
                                <InputLabel label={sl.l_record_status} required />
                                <select name="recordStatus"
                                    className={`form-select ${tBox.getClass4IsInvalid2('recordStatus', formObject)}`}
                                    value={inputData?.recordStatus || ""}
                                    onChange={change4Input}
                                    required >
                                    <option value="A">{getLabel(sl, "A", "o_record_status_")}</option>
                                    <option value="D">{getLabel(sl, "D", "o_record_status_")}</option>
                                    <option value="P">{getLabel(sl, "P", "o_record_status_")}</option>
                                    <option value="I">{getLabel(sl, "I", "o_record_status_")}</option>
                                </select>

                                <ErrorLine message={tBox.getFieldErrorMessage2('recordStatus', sl, formObject)} />
                            </div>

                            <div >
                                <InputLabel label={sl.l_chrono_unit} required />
                                <input name="chronoUnit"
                                    type="text"
                                    className={`form-control ${tBox.getClass4IsInvalid2('chronoUnit', formObject)}`}
                                    placeholder={sl.p_chrono_unit}
                                    value={inputData?.chronoUnit || ""}
                                    onChange={change4Input} />

                                <ErrorLine message={tBox.getFieldErrorMessage2('chronoUnit', sl, formObject)} />

                            </div>

                            <div>
                                <InputLabel label={sl.l_timer_0} />
                                <input name="timer0"
                                    type="number"
                                    className={`form-control ${tBox.getClass4IsInvalid2('timer0', formObject)}`}
                                    placeholder={sl.p_timer_0}
                                    value={inputData?.timer0 || ""}
                                    onChange={change4Input} />

                                <ErrorLine message={tBox.getFieldErrorMessage2('timer0', sl, formObject)} />
                            </div>

                            <div>
                                <InputLabel label={sl.l_timer_A} />
                                <input name="timerA"
                                    type="number"
                                    className={`form-control ${tBox.getClass4IsInvalid2('timerA', formObject)}`}
                                    placeholder={sl.p_timer_A}
                                    value={inputData?.timerA || ""}
                                    onChange={change4Input} />

                                <ErrorLine message={tBox.getFieldErrorMessage2('timerA', sl, formObject)} />
                            </div>

                            <div>
                                <InputLabel label={sl.l_timer_K} />
                                <input name="timerK"
                                    type="number"
                                    className={`form-control ${tBox.getClass4IsInvalid2('timerK', formObject)}`}
                                    placeholder={sl.p_timer_K}
                                    value={inputData?.timerK || ""}
                                    onChange={change4Input} />

                                <ErrorLine message={tBox.getFieldErrorMessage2('timerK', sl, formObject)} />
                            </div>

                            <div>
                                <InputLabel label={sl.l_timer_1} />
                                <input name="timer1"
                                    type="number"
                                    className={`form-control ${tBox.getClass4IsInvalid2('timer1', formObject)}`}
                                    placeholder={sl.p_timer_1}
                                    value={inputData?.timer1 || ""}
                                    onChange={change4Input} />

                                <ErrorLine message={tBox.getFieldErrorMessage2('timer1', sl, formObject)} />
                            </div>

                            <div>
                                <InputLabel label={sl.l_timer_1220} />
                                <input name="timer1220"
                                    type="number"
                                    className={`form-control ${tBox.getClass4IsInvalid2('timer1220', formObject)}`}
                                    placeholder={sl.p_timer_1220}
                                    value={inputData?.timer1220 || ""}
                                    onChange={change4Input} />

                                <ErrorLine message={tBox.getFieldErrorMessage2('timer1220', sl, formObject)} />
                            </div>

                            <div>
                                <InputLabel label={sl.l_timer_2} />
                                <input name="timer2"
                                    type="number"
                                    className={`form-control ${tBox.getClass4IsInvalid2('timer2', formObject)}`}
                                    placeholder={sl.p_timer_2}
                                    value={inputData?.timer2 || ""}
                                    onChange={change4Input} />

                                <ErrorLine message={tBox.getFieldErrorMessage2('timer2', sl, formObject)} />
                            </div>

                            <div>
                                <InputLabel label={sl.l_timer_3} />
                                <input name="timer3"
                                    type="number"
                                    className={`form-control ${tBox.getClass4IsInvalid2('timer3', formObject)}`}
                                    placeholder={sl.p_timer_3}
                                    value={inputData?.timer3 || ""}
                                    onChange={change4Input} />

                                <ErrorLine message={tBox.getFieldErrorMessage2('timer3', sl, formObject)} />
                            </div>

                            <div>
                                <InputLabel label={sl.l_timer_4} />
                                <input name="timer4"
                                    type="number"
                                    className={`form-control ${tBox.getClass4IsInvalid2('timer4', formObject)}`}
                                    placeholder={sl.p_timer_4}
                                    value={inputData?.timer4 || ""}
                                    onChange={change4Input} />

                                <ErrorLine message={tBox.getFieldErrorMessage2('timer4', sl, formObject)} />
                            </div>

                            <div>
                                <InputLabel label={sl.l_timer_5} />
                                <input name="timer5"
                                    type="number"
                                    className={`form-control ${tBox.getClass4IsInvalid2('timer5', formObject)}`}
                                    placeholder={sl.p_timer_5}
                                    value={inputData?.timer5 || ""}
                                    onChange={change4Input} />

                                <ErrorLine message={tBox.getFieldErrorMessage2('timer5', sl, formObject)} />
                            </div>

                            <div>
                                <InputLabel label={sl.l_timer_6} />
                                <input name="timer6"
                                    type="number"
                                    className={`form-control ${tBox.getClass4IsInvalid2('timer6', formObject)}`}
                                    placeholder={sl.p_timer_6}
                                    value={inputData?.timer6 || ""}
                                    onChange={change4Input} />

                                <ErrorLine message={tBox.getFieldErrorMessage2('timer6', sl, formObject)} />
                            </div>

                            <div>
                                <InputLabel label={sl.l_timer_7} />
                                <input name="timer7"
                                    type="number"
                                    className={`form-control ${tBox.getClass4IsInvalid2('timer7', formObject)}`}
                                    placeholder={sl.p_timer_7}
                                    value={inputData?.timer7 || ""}
                                    onChange={change4Input} />

                                <ErrorLine message={tBox.getFieldErrorMessage2('timer7', sl, formObject)} />
                            </div>

                            <div>
                                <InputLabel label={sl.l_timer_8} />
                                <input name="timer8"
                                    type="number"
                                    className={`form-control ${tBox.getClass4IsInvalid2('timer8', formObject)}`}
                                    placeholder={sl.p_timer_8}
                                    value={inputData?.timer8 || ""}
                                    onChange={change4Input} />

                                <ErrorLine message={tBox.getFieldErrorMessage2('timer8', sl, formObject)} />
                            </div>

                            <div>
                                <InputLabel label={sl.l_timer_9} />
                                <input name="timer9"
                                    type="number"
                                    className={`form-control ${tBox.getClass4IsInvalid2('timer9', formObject)}`}
                                    placeholder={sl.p_timer_9}
                                    value={inputData?.timer9 || ""}
                                    onChange={change4Input} />

                                <ErrorLine message={tBox.getFieldErrorMessage2('timer9', sl, formObject)} />
                            </div>

                            <div>
                                <InputLabel label={sl.l_timer_10} />
                                <input name="timer10"
                                    type="number"
                                    className={`form-control ${tBox.getClass4IsInvalid2('timer10', formObject)}`}
                                    placeholder={sl.p_timer_10}
                                    value={inputData?.timer10 || ""}
                                    onChange={change4Input} />

                                <ErrorLine message={tBox.getFieldErrorMessage2('timer10', sl, formObject)} />
                            </div>

                            <div>
                                <InputLabel label={sl.l_timer_11} />
                                <input name="timer11"
                                    type="number"
                                    className={`form-control ${tBox.getClass4IsInvalid2('timer11', formObject)}`}
                                    placeholder={sl.p_timer_11}
                                    value={inputData?.timer11 || ""}
                                    onChange={change4Input} />

                                <ErrorLine message={tBox.getFieldErrorMessage2('timer11', sl, formObject)} />
                            </div>

                        </div>  {/* end of field inner panel */}

                    </div>

                </div >
            </form >

            <DumpPanel dataList={[
                { name: "inputData", data: inputData },
                { name: "formObject", data: formObject },
                { name: "sl", data: sl },
            ]} debugMode={debugMode} />
        </div >
    );
}