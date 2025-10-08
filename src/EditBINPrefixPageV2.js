
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

let tableName = "kswitchbinprefix";
let databaseName = "kdb";

const accessObjectName = "webapp_configuration_access";
const accessActionPrefix = "bin_prefix_management";

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

export function EditBINPrefixPageV2({ debugMode = true }) {
    const componentName = "EditBINPrefixPage";
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
    // const [step, setStep] = react.useState(1);
    const [showInstitutionDrawer, setShowInstitutionDrawer] = react.useState(false);
    const [institutionList, setInstitutionList] = react.useState([]);
    const [searchTerm, setSearchTerm] = react.useState("");
    const [selectedInstitution, setSelectedInstitution] = react.useState("");
    const maxLength = 150;
    const ref4Form = react.useRef();

    const filteredInstitutions = institutionList.filter(id =>
        id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const navigate = reactRouter.useNavigate();
    const location = reactRouter.useLocation();

    const sp = new URLSearchParams(location.search);
    
    editMode = parseInt(sp.get("editMode"));
    const initialStep = Number(sp.get("step")) || 1;

    const [step, setStep] = react.useState(initialStep);
    const fromTab = initialStep;

    // keep step in sync with query param when component mounts
    react.useEffect(() => {
    setStep(initialStep);
    }, [initialStep]);

    // const passedInstitutionList = location.state?.institutionList || [];

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);

        const sp = new URLSearchParams(location.search);
        rowId = sp.get('rowId');
        editMode = parseInt(sp.get('editMode')); // 0 = Add, 1 = Edit

        let timer = setTimeout(async () => {
            // load data list will base on edit mode to provide the input record value
            await loadDataList();
        }, 100);

        return () => {
            if (debugMode) console.log(`Unmount ${componentName}`);
            clearTimeout(timer);

            cleanUp(); // edit page can add cleanup here
        };
    }, [location.search]);

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect for build field state`);

        let obj = tBox.buildFormFieldState(ref4Form.current);
        formObject.fieldState = obj;
        formObject.valid = ref4Form.current.checkValidity();
    }, [redraw]);     // if having custom validation than need to add redraw to effect state list

    // check for route blocker 
    let shouldBlock = react.useCallback(({ currentLocation, nextLocation }) => {
        console.log("Callback for blocker ...")
        // return formState.dirty && currentLocation.pathname !== nextLocation.pathname
        return formObject.dirty && currentLocation.pathname !== nextLocation.pathname

    }, [redraw]);

    let blocker = reactRouter.useBlocker(shouldBlock);
    
    react.useEffect(() => {
        if (step === 2) {
          const fetchInstitutions = async () => {
            try {
            let result = await apiBox.getRecord(
                getSessionToken(),
                "kdb",                 
                "kswitchbinprefix",   
                "recordStatus = 'A'"
            );
              
            if (result.flag) {
                const allIds = result.data.records.map(item => {
                  if (item.recordData) {
                    return item.recordData.institutionId; 
                  }
                  return item.institutionId; 
                }).filter(Boolean);
              
                const uniqueSortedIds = [...new Set(allIds)].sort((a, b) =>
                  a.localeCompare(b)
                );
              
                console.log("Unique + Sorted Institution IDs:", uniqueSortedIds);
                setInstitutionList(uniqueSortedIds);
              }
            } catch (err) {
              console.error("Error fetching institutions:", err);
            }
          };
      
          fetchInstitutions();
        }
      }, [step]);

    if (blocker.state === "blocked") {
        if (debugMode) console.log("Show discard confirm dialog box");
        // only in this case need to wrap in other thread else react warning ...
        setTimeout(() => {
            showConfirmDialogBox(sl.m_changes_not_saved,
                callback4BlockerProceed, sl.b_discard,
                callback4BlockerReset);
        }, 100);
    }

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

    // 👉 Render Stepper (only in Add mode)
    const renderStepper = () => {
        if (editMode !== 0) return null; // hide in Edit mode
        return (
            <div className="col-3 mr-24">
                <div className="stepper-background">
                    <div className="stepper-title">
                        {sl.l_create_bin_prefix}
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
                                {sl.l_prefix_details}
                            </div>
                        </div>
                        <div className={`step-vertical ${step === 2 ? "active" : ""} d-flex`}>
                            <div className="step-vertical-icon">
                                <span className="material-symbols-outlined" style={{fontSize: "19px"}}>adjust</span>
                            </div>
                            <div className="step-vertical-content">
                                {sl.l_assign_prefix}
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

                {/* <div>
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
                </div> */}
            </div>

            <form ref={ref4Form} className={`d-flex mt-4 mb-5 ml-24 
                ${editMode === 0 ? "justify-content-left" : "justify-content-center"}`}>
                {renderStepper()}
                <div className="col-7" style={{ minHeight: "80vh" }}>
                    {step === 1 && (
                        <>
                            <div className="pb-3">
                                <div className="edit-title-font">
                                    {(editMode === 0) ? sl.l_add_timer : sl.l_edit_timer}
                                </div>
                                <div className="edit-desc-font">
                                    {sl.l_desc}
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="my-3">
                                    <div>
                                        <InputLabel label={sl.l_prefix} required />
                                        <input name="prefix"
                                            type="text"
                                            className={`form-control ${tBox.getClass4IsInvalid2('prefix', formObject)}`}
                                            placeholder={sl.p_prefix_value}
                                            value={inputData?.prefix || ""}
                                            onChange={change4Input}
                                            required
                                            disabled={editMode === 1 && fromTab === 1} />

                                        <ErrorLine message={tBox.getFieldErrorMessage2('prefix', sl, formObject)} />
                                    </div>

                                    <div>
                                        <InputLabel label={sl.l_description} />
                                        <textarea name="description"
                                            type="text" rows="4" cols="50"
                                            className={`form-control ${tBox.getClass4IsInvalid2('description', formObject)}`}
                                            placeholder={sl.p_description}
                                            value={inputData?.description || ""}
                                            onChange={change4Input} 
                                            maxLength={maxLength} />
                                        <div class="char-count d-flex justify-content-end aligns-item-center">
                                            {(inputData?.description?.length || 0)}/{maxLength}
                                            </div>

                                        <ErrorLine message={tBox.getFieldErrorMessage2('description', sl, formObject)} />
                                    </div>

                                    <div>
                                        <InputLabel label={sl.l_filename} />
                                        <input name="filename"
                                            type="text"
                                            className={`form-control ${tBox.getClass4IsInvalid2('filename', formObject)}`}
                                            placeholder={sl.p_filename}
                                            value={inputData?.filename || ""}
                                            onChange={change4Input} />

                                        <ErrorLine message={tBox.getFieldErrorMessage2('filename', sl, formObject)} />
                                    </div>

                                    <div>
                                        <InputLabel label={sl.l_product_code} />
                                        <input name="productCode"
                                            type="text"
                                            className={`form-control ${tBox.getClass4IsInvalid2('productCode', formObject)}`}
                                            placeholder={sl.p_product_code}
                                            value={inputData?.productCode || ""}
                                            onChange={change4Input} />

                                        <ErrorLine message={tBox.getFieldErrorMessage2('productCode', sl, formObject)} />
                                    </div>

                                    <div>
                                        <InputLabel label={sl.l_product_category} />
                                        <input name="productCatagory"
                                            type="text"
                                            className={`form-control ${tBox.getClass4IsInvalid2('productCatagory', formObject)}`}
                                            placeholder={sl.p_product_category}
                                            value={inputData?.productCatagory|| ""}
                                            onChange={change4Input} />

                                        <ErrorLine message={tBox.getFieldErrorMessage2('productCatagory', sl, formObject)} />
                                    </div>

                                    <div>
                                        <InputLabel label={sl.l_cvv} />
                                        <input name="cvv"
                                            type="text"
                                            className={`form-control ${tBox.getClass4IsInvalid2('cvv', formObject)}`}
                                            placeholder={sl.p_cvv}
                                            value={inputData?.cvv || ""}
                                            onChange={change4Input} />

                                        <ErrorLine message={tBox.getFieldErrorMessage2('cvv', sl, formObject)} />
                                    </div>
                                    <div className="mt-4">
                                        {editMode === 0 ? (
                                            <button type="button" className="col-7 btn btn-primary" onClick={goNext} style={{width: "100%"}}>
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
                                <div style={{ color: "#242627", "fontSize": "16px", fontWeight: "bold" }} >
                                    {(editMode === 0) ? sl.l_assign_prefix : sl.l_edit_assign_prefix}
                                </div>
                                <div style={{ color: "#76797B", fontSize: "12px" }}>
                                    {sl.l_prefix_desc}
                                </div>
                            </div>
                            <div className="mt-4">
                                <div>
                                    <InputLabel label={sl.l_institution_id} required />
                                    <input name="institutionId"
                                        type="text"
                                        readOnly
                                        className={`form-control ${tBox.getClass4IsInvalid2('institutionId', formObject)}`}
                                        placeholder={sl.p_select_inst_id}
                                        value={inputData?.institutionId || ""}
                                        onClick={() => setShowInstitutionDrawer(true)}
                                        required
                                        disabled={editMode === 1 && fromTab === 2} />
                                    <ErrorLine message={tBox.getFieldErrorMessage2('institutionId', sl, formObject)} />
                                </div>

                                {/* Drawer component */}
                                {showInstitutionDrawer && (
                                    <div className="drawer-overlay" onClick={() => setShowInstitutionDrawer(false)}>
                                        <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
                                            <div className="drawer-title">
                                                {sl.l_institution}
                                            </div>
                                            <div className="drawer-description pb-16">
                                                {sl.l_select_institution}
                                            </div>
                                            {/* <div className="input-group">
                                                <button className="btn border-0"
                                                    style={{ backgroundColor: "#f3f3f4", "--bs-btn-focus-box-shadow": "0 0 0 0.25rem rgb(97 159 203 / 25%)" }}
                                                    type="button"
                                                    onClick={click4Search}>
                                                    <span className="material-icons " style={{ color: "#494D4F" }} >search</span>
                                                </button>
                                                <input type="text" className="form-control border-0"
                                                    placeholder={sl.p_search_query}
                                                    value={searchObject.searchText || ""}
                                                    onChange={change4SearchText}
                                                    onKeyDown={keyPress4SearchText}
                                                    style={{ backgroundColor: "#F3F3F4", fontSize: "14px" }} />
                                            </div> */}
                                            <div className="">
                                                <div className="input-group">
                                                    <span className="input-group-text bg-light border-0">
                                                        <span className="material-icons" style={{ color: "#494D4F"}}>
                                                            search
                                                        </span>
                                                    </span>
                                                    <input
                                                        type="text"
                                                        className="form-control border-0"
                                                        placeholder={sl.p_search_query}
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        style={{ backgroundColor: "#F3F3F4", fontSize: "14px" }} />
                                                </div>
                                            </div>
                                            <hr></hr>
                                            <div className="institution-list">
                                                {filteredInstitutions.map((id, idx) => (
                                                    <div key={idx} className="form-check">
                                                        <input
                                                        type="radio"
                                                        id={`inst-${idx}`}
                                                        name="institution"
                                                        className="form-check-input"
                                                        checked={selectedInstitution === id}
                                                        onChange={() => setSelectedInstitution(id)}
                                                        />
                                                        <label className="form-check-label" htmlFor={`inst-${idx}`}>
                                                        {id}
                                                        </label>
                                                    </div>
                                                ))}

                                                {filteredInstitutions.length === 0 && (
                                                    <div className="text-muted">
                                                        {sl.l_no_result_found}
                                                    </div>
                                                )}
                                            </div>

                                            <button className="btn btn-primary  mb-16"
                                                disabled={!selectedInstitution}
                                                onClick={() => {
                                                    inputData.institutionId = selectedInstitution;
                                                    setShowInstitutionDrawer(false);
                                                    setRedraw(v => v + 1); }}>
                                                    {sl.b_apply}
                                            </button>
                                            <button className="btn btn-ghost-unity"
                                                onClick={() => setShowInstitutionDrawer(false)}>
                                                    {sl.b_cancel}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {editMode === 1 && (
                                    <div>
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
                                )}
                                
                                <div>
                                    <InputLabel label={sl.l_priority} required />
                                    <input name="priority"
                                        type="number"
                                        className={`form-control ${tBox.getClass4IsInvalid2('priority', formObject)}`}
                                        placeholder={sl.p_eg}
                                        value={inputData?.priority || ""}
                                        onChange={change4Input}
                                        required />

                                    <ErrorLine message={tBox.getFieldErrorMessage2('priority', sl, formObject)} />
                                </div>
                                {editMode === 0 ? (
                                    <div className="mt-4 d-flex justify-content-between" style={{paddingTop: "0px"}}>
                                        <button type="button" className="btn btn-outline-dark" onClick={goBack}>
                                            {sl.b_back}
                                        </button>
                                        <button className="btn btn-primary"
                                        type="button"
                                        onClick={click4AddRecord}
                                        disabled={!formObject?.valid || !formObject?.dirty}>
                                            {sl.b_save}
                                        </button>
                                    </div>
                                    ) : (
                                    <div className="mt-4">
                                        <button type="button" className="col-7 btn btn-primary" onClick={click4UpdateRecord} style={{width: "100%"}}>
                                            {sl.b_save}
                                        </button>
                                    </div>
                                    )
                                }
                            </div>
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