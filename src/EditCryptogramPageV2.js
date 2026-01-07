
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

let tableName = "kswitchcryptograms";
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

export function EditCryptogramPageV2({ debugMode = true }) {
    const componentName = "EditCryptogramPage";
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
    const [showAttachModal, setShowAttachModal] = react.useState(false);
    const [showInstitutionDrawer, setShowInstitutionDrawer] = react.useState(false);
    const [institutionList, setInstitutionList] = react.useState([]);
    const [searchInstitution, setSearchInstitution] = react.useState("");
    const [selectedInstitutionId, setSelectedInstitutionId] = react.useState("");
    const [selectedInstitutionName, setSelectedInstitutionName] = react.useState("");
    const [step, setStep] = react.useState(1); // for stepper

    const ref4Form = react.useRef();

    const navigate = reactRouter.useNavigate();
    const location = reactRouter.useLocation();

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);

        const sp = new URLSearchParams(location.search);
        rowId = sp.get('rowId');
        editMode = parseInt(sp.get('editMode'));

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

    if (blocker.state === "blocked") {
        if (debugMode) console.log("Show discard confirm dialog box");
        // only in this case need to wrap in other thread else react warning ...
        setTimeout(() => {
            showConfirmDialogBox(sl.m_changes_not_saved,
                callback4BlockerProceed, sl.b_discard,
                callback4BlockerReset);
        }, 100);
    }

    react.useEffect(() => {
        if (step !== 3) return;

        const fetchInstitutions = async () => {
            try {
                let result = await apiBox.getRecord(
                    getSessionToken(),
                    "kdb",
                    "kswitchinstitution",
                    "recordStatus = 'A'"
                );

                if (result?.flag) {
                    const list = result.data.records
                        .map(item => item.recordData || item)
                        .filter(Boolean);

                    setInstitutionList(list);
                }
            } catch (err) {
                console.error("Error fetching institutions:", err);
            }
        };
        fetchInstitutions();
    }, [step]);

    const filteredInstitutions = institutionList
        .filter(item =>
            item.institutionId?.toLowerCase().includes(searchInstitution.toLowerCase())
        )
        .sort((a, b) =>
            (a.institutionId || "").localeCompare(b.institutionId || "", undefined, { sensitivity: "base" })
    );

    // 👉 Navigation Handlers
    const goNext = () => {
        formObject.valid = ref4Form.current.checkValidity();

        if (formObject.valid) {
            setStep(2);

            setTimeout(() => {
                formObject.valid = ref4Form.current.checkValidity();
                setRedraw(v => v + 1); // trigger re-render for button state
            }, 0);
        } else {
            alert("Please fill all required fields before proceeding.");
        }
    };
    
    const goBack = () => setStep(1);

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
        message = message.replace("__parameter_1", inputData.ownerId + " (" + inputData.keyFunction + ")");
        showConfirmDialogBox(message, async function () {
            showStateDialogBox();
            try {
                let result1 = await apiBox.addRecord(getSessionToken(), databaseName, tableName, inputData);
                if (result1 && result1.flag) {
                    formObject.dirty = false;
                    // let message = sl.m_record_created;
                    // showInfoDialogBox(message, () => navigate(-1));
                    setShowAttachModal(true);
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

    // 👉 Render Stepper (only in Add mode)
    const renderStepper = () => {
        if (editMode !== 0) return null; // hide in Edit mode

        return (
            <div className="col-3 mr-24">
                <div className="stepper-background">
                    <div className="stepper-title">
                        {sl.l_create_cryptogram}
                    </div>
                    <div className="steps-vertical">
                        <div className={`step-vertical ${step >= 1 ? "active" : ""} d-flex align-items-center`}>
                            <div className="step-vertical-icon">
                                <span className={`material-symbols-outlined ${step > 1 ? "completed" : "pending"}`} style={{
                                    fontSize: "19px"}}>
                                    {step > 1 ? "check_circle" : "adjust"}
                                </span>
                            </div>
                            <div className="step-vertical-content" style={{fontWeight: step === 2 ? "400" : "600"}}>
                                {sl.l_basic_info}
                            </div>
                        </div>
                        <div className={`step-vertical ${step === 2 ? "active" : ""} d-flex`}>
                            <div className="step-vertical-icon">
                                <span className="material-symbols-outlined" style={{fontSize: "19px"}}>adjust</span>
                            </div>
                            <div className="step-vertical-content">
                                {sl.l_configuration}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="container-fluid px-0">
            <div className="border-bottom d-flex align-items-center justify-content-end sticky-top bg-white" style={{ minHeight: "50px" }}>
                <div className="close-btn" onClick={() => navigate(-1)}>
                    <span class="material-symbols-outlined">close</span>
                </div>
            </div>

            <form ref={ref4Form} className={`d-flex mt-4 mb-5 ml-24 
                ${step === 3 ? "justify-content-center" : (editMode === 0 ? "justify-content-left" : "justify-content-center")}`}>
                {step !== 3 && renderStepper()}

                <div className="col-7" style={{ minHeight: "80vh" }}>
                    {editMode === 1 ? (
                        <>
                            <div className="pb-3">
                                <div style={{ color: "#242627", "fontSize": "16px", fontWeight: "bold" }} >
                                    {(editMode === 0) ? sl.l_new_cryptogram : sl.l_edit_crypto_settings}
                                </div>
                                <div style={{ color: "#76797B", fontSize: "12px" }}>
                                    {sl.l_desc}
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="my-3">
                                    {/* <div>
                                        <InputLabel label={sl.l_cryptogram_id} required />
                                        <input name="ownerId"
                                            type="text"
                                            className={`form-control ${tBox.getClass4IsInvalid2('ownerId', formObject)}`}
                                            placeholder={sl.p_takaful}
                                            value={inputData?.ownerId || ""}
                                            onChange={change4Input}
                                            disabled={editMode === 1}
                                            required />

                                        <ErrorLine message={tBox.getFieldErrorMessage2('ownerId', sl, formObject)} />
                                    </div> */}

                                    <div className="">
                                        <div>
                                            <InputLabel label={sl.l_key_function} required />
                                            <input name="keyFunction"
                                                type="text"
                                                className={`form-control ${tBox.getClass4IsInvalid2('keyFunction', formObject)}`}
                                                placeholder={sl.p_enter_key_value}
                                                value={inputData?.keyFunction || ""}
                                                onChange={change4Input}
                                                list="datalist4KeyFunction"
                                                disabled={editMode === 1}
                                                required />

                                            <datalist id="datalist4KeyFunction">
                                                <option value="BDK"></option>
                                                <option value="BDK2"></option>
                                                <option value="BDK3"></option>
                                                <option value="CVK"></option>
                                                <option value="DEK"></option>
                                                <option value="FPE"></option>
                                                <option value="IPEK"></option>

                                                <option value="KEK"></option>
                                                <option value="LMK"></option>
                                                <option value="MKAC"></option>
                                                <option value="PVK"></option>

                                                <option value="TAK"></option>
                                                <option value="TEK"></option>
                                                <option value="TMK"></option>
                                                <option value="TPK"></option>

                                                <option value="ZAK"></option>
                                                <option value="ZEK"></option>
                                                <option value="ZPK"></option>
                                            </datalist>

                                            <ErrorLine message={tBox.getFieldErrorMessage2('keyFunction', sl, formObject)} />
                                        </div>

                                        <div >
                                            <InputLabel label={sl.l_record_status} required />
                                            <select name="recordStatus"
                                                className={`form-select ${tBox.getClass4IsInvalid2('recordStatus', formObject)}`}
                                                value={inputData?.recordStatus || ""}
                                                onChange={change4Input}
                                                required>
                                                <option value="A">{getLabel(sl, "A", "o_record_status_")}</option>
                                                <option value="D">{getLabel(sl, "D", "o_record_status_")}</option>
                                                <option value="P">{getLabel(sl, "P", "o_record_status_")}</option>
                                                <option value="I">{getLabel(sl, "I", "o_record_status_")}</option>
                                            </select>

                                            <ErrorLine message={tBox.getFieldErrorMessage2('recordStatus', sl, formObject)} />
                                        </div>

                                        <div>
                                            <InputLabel label={sl.l_key_algo} />
                                            <input name="keyAlgo"
                                                type="number"
                                                className={`form-control ${tBox.getClass4IsInvalid2('keyAlgo', formObject)}`}
                                                placeholder="1"
                                                value={inputData?.keyAlgo || "1"}
                                                onChange={change4Input} />
                                            <span className="default-font">
                                                {sl.l_default_key_algo}
                                            </span>

                                            <ErrorLine message={tBox.getFieldErrorMessage2('keyAlgo', sl, formObject)} />
                                        </div>

                                        <div>
                                            <InputLabel label={sl.l_bit_size} />
                                            <input name="bitSize"
                                                type="number"
                                                className={`form-control ${tBox.getClass4IsInvalid2('bitSize', formObject)}`}
                                                placeholder={sl.p_bit_size}
                                                value={inputData?.bitSize || "192"}
                                                onChange={change4Input} />
                                            <span className="default-font">
                                                {sl.l_default_bit_size}
                                            </span>

                                            <ErrorLine message={tBox.getFieldErrorMessage2('bitSize', sl, formObject)} />
                                        </div>

                                        <div>
                                            <InputLabel label={sl.l_initialization_vector} />
                                            <input name="iv"
                                                type="text"
                                                className={`form-control ${tBox.getClass4IsInvalid2('iv', formObject)}`}
                                                placeholder={sl.p_enter_iv}
                                                value={inputData?.iv || ""}
                                                onChange={change4Input} />

                                            <ErrorLine message={tBox.getFieldErrorMessage2('iv', sl, formObject)} />
                                        </div>

                                        <div>
                                            <InputLabel label={sl.l_cryptogram} />
                                            <input name="cryptogram"
                                                type="text"
                                                className={`form-control ${tBox.getClass4IsInvalid2('cryptogram', formObject)}`}
                                                placeholder={sl.p_enter_encrypted}
                                                value={inputData?.cryptogram || ""}
                                                onChange={change4Input} />

                                            <ErrorLine message={tBox.getFieldErrorMessage2('cryptogram', sl, formObject)} />
                                        </div>

                                        <div>
                                            <InputLabel label={sl.l_kcv} />
                                            <input name="kcv"
                                                type="text"
                                                className={`form-control ${tBox.getClass4IsInvalid2('kcv', formObject)}`}
                                                placeholder={sl.p_enter_kcv}
                                                value={inputData?.kcv || ""}
                                                onChange={change4Input} />

                                            <ErrorLine message={tBox.getFieldErrorMessage2('kcv', sl, formObject)} />
                                        </div>

                                        <div>
                                            <InputLabel label={sl.l_key_index} />
                                            <input name="keyAlgo"
                                                type="number"
                                                className={`form-control ${tBox.getClass4IsInvalid2('keyAlgo', formObject)}`}
                                                placeholder="1"
                                                value={inputData?.keyAlgo || "0"}
                                                onChange={change4Input} />
                                            <span className="default-font">
                                                {sl.l_default_key_index}
                                            </span>

                                            <ErrorLine message={tBox.getFieldErrorMessage2('keyAlgo', sl, formObject)} />
                                        </div>

                                        <div className="mt-4">
                                            <button type="button" className="col-7 btn btn-primary" onClick={click4UpdateRecord} style={{width: "100%"}}>
                                                {sl.b_save}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {step === 1 && (
                                <>
                                    <div className="pb-3">
                                        <div className="edit-title-font">
                                            {(editMode === 0) ? sl.l_new_cryptogram : sl.l_edit_crypto_settings}
                                        </div>
                                        <div className="edit-desc-font">
                                            {sl.l_desc}
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <div className="my-3">
                                            {/* {
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
                                            } */}

                                            <div>
                                                <InputLabel label={sl.l_cryptogram_id} required />
                                                <input name="ownerId"
                                                    type="text"
                                                    className={`form-control ${tBox.getClass4IsInvalid2('ownerId', formObject)}`}
                                                    placeholder={sl.p_takaful}
                                                    value={inputData?.ownerId || ""}
                                                    onChange={change4Input}
                                                    disabled={editMode === 1}
                                                    required />

                                                <ErrorLine message={tBox.getFieldErrorMessage2('ownerId', sl, formObject)} />
                                            </div>

                                            <div className="mt-4">
                                                {editMode === 0 ? (
                                                    <button type="button" className="col-7 btn btn-primary" onClick={goNext} style={{width: "100%", marginTop: "430px"}}>
                                                        {sl.b_next}
                                                    </button>
                                                    ) : (
                                                        <button type="button" className="col-7 btn btn-primary" onClick={click4UpdateRecord} style={{width: "100%"}}>
                                                            {sl.b_save}
                                                        </button>
                                                    )
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <div className="pb-3">
                                        <div className="edit-title-font">
                                            {(editMode === 0) ? sl.l_new_cryptogram : sl.l_edit_crypto_settings}
                                        </div>
                                        <div className="edit-desc-font">
                                            {sl.l_desc}
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <div >
                                            <InputLabel label={sl.l_key_function} required />
                                            <input name="keyFunction"
                                                type="text"
                                                className={`form-control ${tBox.getClass4IsInvalid2('keyFunction', formObject)}`}
                                                placeholder={sl.p_enter_key_value}
                                                value={inputData?.keyFunction || ""}
                                                onChange={change4Input}
                                                list="datalist4KeyFunction"
                                                required />

                                            <datalist id="datalist4KeyFunction">
                                                <option value="BDK"></option>
                                                <option value="BDK2"></option>
                                                <option value="BDK3"></option>
                                                <option value="CVK"></option>
                                                <option value="DEK"></option>
                                                <option value="FPE"></option>
                                                <option value="IPEK"></option>

                                                <option value="KEK"></option>
                                                <option value="LMK"></option>
                                                <option value="MKAC"></option>
                                                <option value="PVK"></option>

                                                <option value="TAK"></option>
                                                <option value="TEK"></option>
                                                <option value="TMK"></option>
                                                <option value="TPK"></option>

                                                <option value="ZAK"></option>
                                                <option value="ZEK"></option>
                                                <option value="ZPK"></option>
                                            </datalist>

                                            <ErrorLine message={tBox.getFieldErrorMessage2('keyFunction', sl, formObject)} />

                                        </div>

                                        <div>
                                            <InputLabel label={sl.l_key_algo} />
                                            <input name="keyAlgo"
                                                type="number"
                                                className={`form-control ${tBox.getClass4IsInvalid2('keyAlgo', formObject)}`}
                                                placeholder="1"
                                                value={inputData?.keyAlgo || "1"}
                                                onChange={change4Input} />
                                            <span className="default-font">
                                                {sl.l_default_key_algo}
                                            </span>

                                            <ErrorLine message={tBox.getFieldErrorMessage2('keyAlgo', sl, formObject)} />
                                        </div>

                                        <div>
                                            <InputLabel label={sl.l_bit_size} />
                                            <input name="bitSize"
                                                type="number"
                                                className={`form-control ${tBox.getClass4IsInvalid2('bitSize', formObject)}`}
                                                placeholder={sl.p_bit_size}
                                                value={inputData?.bitSize || "192"}
                                                onChange={change4Input} />
                                            <span className="default-font">
                                                {sl.l_default_bit_size}
                                            </span>

                                            <ErrorLine message={tBox.getFieldErrorMessage2('bitSize', sl, formObject)} />
                                        </div>

                                        <div>
                                            <InputLabel label={sl.l_initialization_vector} />
                                            <input name="iv"
                                                type="text"
                                                className={`form-control ${tBox.getClass4IsInvalid2('iv', formObject)}`}
                                                placeholder={sl.p_enter_iv}
                                                value={inputData?.iv || ""}
                                                onChange={change4Input} />

                                            <ErrorLine message={tBox.getFieldErrorMessage2('iv', sl, formObject)} />
                                        </div>

                                        <div>
                                            <InputLabel label={sl.l_cryptogram} />
                                            <input name="cryptogram"
                                                type="text"
                                                className={`form-control ${tBox.getClass4IsInvalid2('cryptogram', formObject)}`}
                                                placeholder={sl.p_enter_encrypted}
                                                value={inputData?.cryptogram || ""}
                                                onChange={change4Input} />

                                            <ErrorLine message={tBox.getFieldErrorMessage2('cryptogram', sl, formObject)} />
                                        </div>

                                        <div>
                                            <InputLabel label={sl.l_kcv} />
                                            <input name="kcv"
                                                type="text"
                                                className={`form-control ${tBox.getClass4IsInvalid2('kcv', formObject)}`}
                                                placeholder={sl.p_enter_kcv}
                                                value={inputData?.kcv || ""}
                                                onChange={change4Input} />

                                            <ErrorLine message={tBox.getFieldErrorMessage2('kcv', sl, formObject)} />
                                        </div>

                                        <div>
                                            <InputLabel label={sl.l_key_index} />
                                            <input name="keyAlgo"
                                                type="number"
                                                className={`form-control ${tBox.getClass4IsInvalid2('keyAlgo', formObject)}`}
                                                placeholder="1"
                                                value={inputData?.keyAlgo || "0"}
                                                onChange={change4Input} />
                                            <span className="default-font">
                                                {sl.l_default_key_index}
                                            </span>

                                            <ErrorLine message={tBox.getFieldErrorMessage2('keyAlgo', sl, formObject)} />
                                        </div>

                                        <div className="mt-4 d-flex justify-content-between" style={{paddingTop: "0px"}}>
                                            <button type="button" className="btn btn-outline-dark" onClick={goBack}>
                                                {sl.b_back}
                                            </button>
                                            <button className="btn btn-primary"
                                            type="button"
                                            onClick={click4AddRecord}
                                            disabled={!formObject?.valid || !formObject?.dirty}>
                                                {sl.b_create_cryptogram}
                                            </button>
                                        </div>

                                        {/* {editMode === 0 ? (
                                            <div className="mt-4 d-flex justify-content-between" style={{paddingTop: "0px"}}>
                                                <button type="button" className="btn btn-outline-dark" onClick={goBack}>
                                                    {sl.b_back}
                                                </button>
                                                <button className="btn btn-primary"
                                                type="button"
                                                onClick={click4AddRecord}
                                                disabled={!formObject?.valid || !formObject?.dirty}>
                                                    {sl.b_create_cryptogram}
                                                </button>
                                            </div>
                                            ) : (
                                            <div className="mt-4">
                                                <button type="button" className="col-7 btn btn-primary" onClick={click4UpdateRecord} style={{width: "100%"}}>
                                                    {sl.b_save}
                                                </button>
                                            </div>
                                            )
                                        } */}

                                        {showAttachModal && (
                                            <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
                                                <div className="modal-dialog modal-dialog-centered" role="document">
                                                    <div className="modal-content border-0 shadow rounded-3" style={{padding: "24px 32px"}}>
                                                        <div className="modal-body p-0">
                                                            <div className="d-flex align-items-center mb-3">
                                                                <span className="material-icons text-primary me-2" style={{ width: "24px", height: "24px" }}>info</span>
                                                                <div className="fw-bold mb-0 fs-unity-18">{sl.l_attach_institution}</div>
                                                            </div>
                                                            <p>
                                                                {sl.l_your} <strong>{inputData?.ownerId}</strong> {sl.l_has_been_saved} 🎉
                                                                <br />
                                                                {sl.l_would_you_like}
                                                            </p>
                                                        </div>
                                                        <div className="modal-footer p-0 border-0 d-flex justify-content-end">
                                                            <button
                                                                type="button"
                                                                className="btn btn-skip"
                                                                onClick={() => {
                                                                setShowAttachModal(false);
                                                                navigate(-1); // Skip for now
                                                                }}>
                                                                {sl.b_skip_for_now}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-primary"
                                                                onClick={() => {
                                                                setShowAttachModal(false);
                                                                setStep(3); 
                                                                setShowInstitutionDrawer(false);
                                                                }}>
                                                                {sl.b_attach_now}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {step === 3 && (
                                <>
                                    <div className="pb-3">
                                        <div className="edit-title-font">
                                            {sl.l_attach_institution}
                                        </div>
                                        <div className="edit-desc-font">
                                            {sl.l_choose_financial}
                                        </div>
                                    </div>

                                    <div>
                                        <InputLabel label={sl.l_select_institution} />
                                        <input
                                            type="text"
                                            readOnly
                                            className="form-control"
                                            placeholder={sl.p_choose_institution}
                                            value={selectedInstitutionName || ""}
                                            onClick={() => setShowInstitutionDrawer(true)} />
                                    </div>

                                    <div className="mt-4 d-flex" style={{ paddingTop: "300px" }}>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            disabled={!selectedInstitutionId}
                                            style={{width: "100%"}}
                                            // onClick={}
                                        >
                                            {sl.b_attach}
                                        </button>
                                    </div>

                                    {/* Drawer */}
                                    {showInstitutionDrawer && (
                                        <div className="drawer-overlay" onClick={() => setShowInstitutionDrawer(false)}>
                                            <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
                                                <div className="drawer-title">
                                                    {sl.l_institution}
                                                </div>
                                                <div className="drawer-description pb-16">
                                                    {sl.l_select_inst}
                                                </div>
                                                {/* Search */}
                                                <div className="">
                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light border-0">
                                                            <span className="material-icons" style={{ color: "#494D4F" }}>
                                                                search
                                                            </span>
                                                        </span>
                                                        <input
                                                            type="text"
                                                            className="form-control border-0"
                                                            placeholder={sl.p_search_query}
                                                            value={searchInstitution}
                                                            onChange={(e) => setSearchInstitution(e.target.value)}
                                                            style={{ backgroundColor: "#F3F3F4", fontSize: "14px" }} />
                                                    </div>
                                                </div>
                                                <hr />

                                                {/* Institution list */}
                                                <div className="institution-list">
                                                    {filteredInstitutions.map((item, idx) => (
                                                        <div key={idx} className="form-check">
                                                            <input
                                                                type="radio"
                                                                id={`inst-${idx}`}
                                                                name="institution"
                                                                className="form-check-input"
                                                                checked={selectedInstitutionId === item.rowId}
                                                                onChange={() => {
                                                                    setSelectedInstitutionId(item.rowId);
                                                                    setSelectedInstitutionName(item.institutionId);
                                                                }}
                                                            />
                                                            <label className="form-check-label" htmlFor={`inst-${idx}`}>
                                                                {item.institutionId}
                                                            </label>
                                                        </div>
                                                    ))}

                                                    {filteredInstitutions.length === 0 && (
                                                        <div className="text-muted">
                                                            {sl.l_no_result_found}
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    className="btn btn-primary mb-16"
                                                    disabled={!selectedInstitutionId}
                                                    onClick={() => setShowInstitutionDrawer(false)} >
                                                        {sl.b_apply}
                                                </button>
                                                <button
                                                    className="btn btn-ghost-unity"
                                                    onClick={() => setShowInstitutionDrawer(false)}>
                                                        {sl.b_cancel}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
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