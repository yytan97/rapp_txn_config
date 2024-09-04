
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

let cryptogramRecord = undefined;
let rowId = undefined;
let editMode = 0;

export function cleanUp() {
    cryptogramRecord = undefined;
    rowId = undefined;
    editMode = 0;
    return;
};


export function EditCryptogramPage({ debugMode = true }) {
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
    // let [refresh, setRefresh] = react.useState(true);
    // let [reset, setReset] = react.useState(true);

    const [inputData, setInputData] = react.useState({});
    const [fieldState, setFieldState] = react.useState({});
    const [formState, setFormState] = react.useState({ dirty: false, valid: false });
    const ref4Form = react.useRef();

    const navigate = reactRouter.useNavigate();
    const location = reactRouter.useLocation();
    console.log("Location", location);

    let shouldBlock = react.useCallback(({ currentLocation, nextLocation }) => {
        console.log("Callback for blocker ...")
        return formState.dirty && currentLocation.pathname !== nextLocation.pathname
    }, [formState]);

    let blocker = reactRouter.useBlocker(shouldBlock);
    console.log("Blocker", blocker);

    if (blocker.state === "blocked") {
        if (debugMode) console.log("Show discard confirm dialog box");

        showConfirmDialogBox(sl.m_changes_not_saved,
            callback4BlockerProceed, sl.b_discard,
            callback4BlockerReset);
    }

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);

        let timer = setTimeout(async () => {

            const sp = new URLSearchParams(location.search);
            rowId = sp.get('rowId');
            editMode = parseInt(sp.get('editMode'));

            console.log("Row ID", rowId);
            console.log("Edit mode", editMode);

            if (editMode === 1) {
                await loadDataList();
                setInputData(cryptogramRecord);
            }
            else {
                cryptogramRecord = {
                    recordStatus: 'A'
                };
                setInputData(cryptogramRecord);
            }

        }, 100);

        return () => {
            if (debugMode) console.log(`Unmount ${componentName}`);
            clearTimeout(timer)
            // cleanUp();
        };
    }, []);

    react.useEffect(() => {
        // need some delay for set input data to take effect
        let obj = tBox.buildFormFieldState(ref4Form.current);
        setFieldState(obj);
    }, [inputData]);

    // event handling function here ...

    async function loadDataList() {
        showStateDialogBox();

        try {
            // await tBox.sleep(1000 * 1);
            cryptogramRecord = undefined;

            // check for user access right
            if (!check4Right(accessObjectName, `${accessActionPrefix}.access`)) {
                throw ({ errorCode: "permission_denied" });
            }

            // fetch data 
            let result4 = await apiBox.getRecord(getSessionToken(), databaseName, tableName, `rowId = ${rowId}`);

            if (result4.flag) {
                let list1 = result4.data.records;
                /* preprocess 
                list1 = list1.map((item) => {
                    return item
                });
                */

                cryptogramRecord = list1[0];
                console.log("Record", cryptogramRecord);
                setRedraw((v) => v + 1);
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
        if (v == undefined) return s;
        if (v == "A") return s + "bg-success";
        if (v == "P") return s + "bg-warning";
        return s + "bg-danger";
    };

    function change4Record(e) {
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

    /*
    function toggle4Panel(name) {
        if (debugMode) console.log("Toggle for panel ", name);
        if (closePanel[name] === undefined)
            closePanel[name] = false;

        if (closePanel[name] === true) closePanel[name] = false;
        else closePanel[name] = true;

        setRedraw((v) => v + 1);

        return;
    };

    function callback4TogglePanel(name, flag) {
        if (debugMode) console.log("Callback for toggle panel", name, flag);

        closePanel[name] = !flag;
        setRedraw((v) => v + 1);
        return;
    };
    */

    function click4AddRecord(e) {
        if (debugMode) console.log("Click for add record", e);
        let message = sl.m_confirm_create_record;
        message = message.replace("__parameter_1", inputData.ownerId + " (" + inputData.keyFunction + ")");
        showConfirmDialogBox(message, async function () {
            showStateDialogBox();
            try {
                // await tBox.sleep(1000 * 1);

                let result1 = await apiBox.addRecord(getSessionToken(), databaseName, tableName, inputData);
                if (result1 && result1.flag) {
                    let obj1 = {
                        dirty: false,
                        valid: ref4Form.current.checkValidity(),
                    };
                    setFormState(obj1);

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
                // await tBox.sleep(1000 * 1);

                let result1 = await apiBox.updateRecordWithId(getSessionToken(), databaseName, tableName, inputData.rowId, inputData);
                if (result1 && result1.flag) {
                    let obj1 = {
                        dirty: false,
                        valid: ref4Form.current.checkValidity(),
                    };
                    setFormState(obj1);

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

                <div >
                    {
                        editMode === 0 ? (
                            <button className="ms-1 btn btn-ghost-unity "
                                type="button"
                                onClick={click4AddRecord}
                                title={sl.t_add}
                                disabled={!formState.valid || !formState.dirty} >
                                <span class="material-icons-outlined fs-24-unity">add</span>
                            </button>

                        ) : (
                            <button className="ms-1 btn btn-ghost-unity "
                                type="button"
                                onClick={click4UpdateRecord}
                                title={sl.t_update}
                                disabled={!formState.valid || !formState.dirty} >
                                <span className="material-icons-outlined fs-24-unity">upload_file</span>
                            </button>
                        )
                    }

                </div>

            </div>

            <form name="form4EditCryptogram" ref={ref4Form} className="d-flex justify-content-center mt-4 mb-5">
                <div className="col-8" style={{ minHeight: "50vh" }}>

                    <div className="pb-3 border-bottom">
                        {
                            (editMode === 1 && check4Right(accessObjectName, `${accessActionPrefix}.edit`)) ? (
                                <div style={{ color: "#242627", "fontSize": "16px", fontWeight: "bold" }} >
                                    {sl.l_edit_cryptogram}
                                </div>
                            ) : null
                        }

                        {
                            (editMode === 0 && check4Right(accessObjectName, `${accessActionPrefix}.add`)) ? (
                                <div style={{ color: "#242627", "fontSize": "16px", fontWeight: "bold" }}>
                                    {sl.l_add_cryptogram}
                                </div>
                            ) : null
                        }

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
                                            className={`form-control ${tBox.getClass4IsInvalid(fieldState['rowId']?.valid, formState.dirty, true)}`}
                                            placeholder={sl.p_row_id}
                                            value={inputData?.rowId || ""}
                                            onChange={change4Record}
                                            disabled={true} />
                                        <ErrorLine message={tBox.getFieldErrorMessage('rowId', sl, fieldState, formState)} />
                                    </div>
                                ) : null
                            }

                            <div>
                                <InputLabel label={sl.l_owner_id} required />
                                <input name="ownerId"
                                    type="text"
                                    className={`form-control ${tBox.getClass4IsInvalid(fieldState['ownerId']?.valid, formState.dirty, true)}`}
                                    placeholder={sl.p_owner_id}
                                    value={inputData?.ownerId || ""}
                                    onChange={change4Record}
                                    disabled={editMode === 1}
                                    required />

                                <ErrorLine message={tBox.getFieldErrorMessage('ownerId', sl, fieldState, formState)} />
                            </div>

                            <div >
                                <InputLabel label={sl.l_record_status} required />
                                <select name="recordStatus"
                                    className={`form-select ${tBox.getClass4IsInvalid(fieldState['recordStatus']?.valid, formState.dirty, true)}`}
                                    value={inputData?.recordStatus || ""}
                                    onChange={change4Record}
                                    required>
                                    <option value="A">{getLabel(sl, "A", "o_record_status_")}</option>
                                    <option value="D">{getLabel(sl, "D", "o_record_status_")}</option>
                                    <option value="P">{getLabel(sl, "P", "o_record_status_")}</option>
                                    <option value="I">{getLabel(sl, "I", "o_record_status_")}</option>
                                </select>

                                <ErrorLine message={tBox.getFieldErrorMessage('recordStatus', sl, fieldState, formState)} />
                            </div>

                            <div >
                                <InputLabel label={sl.l_key_function} required />
                                <input name="keyFunction"
                                    type="text"
                                    className={`form-control ${tBox.getClass4IsInvalid(fieldState['keyFunction']?.valid, formState.dirty, true)}`}
                                    placeholder={sl.p_key_function}
                                    value={inputData?.keyFunction || ""}
                                    onChange={change4Record}
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

                                <ErrorLine message={tBox.getFieldErrorMessage('keyFunction', sl, fieldState, formState)} />

                            </div>

                            <div>
                                <InputLabel label={sl.l_key_algo} />
                                <input name="keyAlgo"
                                    type="number"
                                    className={`form-control ${tBox.getClass4IsInvalid(fieldState['keyAlgo']?.valid, formState.dirty, true)}`}
                                    placeholder={sl.p_key_algo}
                                    value={inputData?.keyAlgo || ""}
                                    onChange={change4Record} />

                                <ErrorLine message={tBox.getFieldErrorMessage('keyAlgo', sl, fieldState, formState)} />
                            </div>

                            <div>
                                <InputLabel label={sl.l_bit_size} />
                                <input name="bitSize"
                                    type="number"
                                    className={`form-control ${tBox.getClass4IsInvalid(fieldState['bitSize']?.valid, formState.dirty, true)}`}
                                    placeholder={sl.p_bit_size}
                                    value={inputData?.bitSize || ""}
                                    onChange={change4Record} />

                                <ErrorLine message={tBox.getFieldErrorMessage('bitSize', sl, fieldState, formState)} />
                            </div>

                            <div>
                                <InputLabel label={sl.l_iv} />
                                <input name="iv"
                                    type="text"
                                    className={`form-control ${tBox.getClass4IsInvalid(fieldState['iv']?.valid, formState.dirty, true)}`}
                                    placeholder={sl.p_iv}
                                    value={inputData?.iv || ""}
                                    onChange={change4Record} />

                                <ErrorLine message={tBox.getFieldErrorMessage('iv', sl, fieldState, formState)} />
                            </div>

                            <div>
                                <InputLabel label={sl.l_cryptogram} />
                                <input name="cryptogram"
                                    type="text"
                                    className={`form-control ${tBox.getClass4IsInvalid(fieldState['cryptogram']?.valid, formState.dirty, true)}`}
                                    placeholder={sl.p_cryptogram}
                                    value={inputData?.cryptogram || ""}
                                    onChange={change4Record} />

                                <ErrorLine message={tBox.getFieldErrorMessage('cryptogram', sl, fieldState, formState)} />
                            </div>

                            <div>
                                <InputLabel label={sl.l_kcv} />
                                <input name="kcv"
                                    type="text"
                                    className={`form-control ${tBox.getClass4IsInvalid(fieldState['kcv']?.valid, formState.dirty, true)}`}
                                    placeholder={sl.p_kcv}
                                    value={inputData?.kcv || ""}
                                    onChange={change4Record} />

                                <ErrorLine message={tBox.getFieldErrorMessage('kcv', sl, fieldState, formState)} />
                            </div>

                        </div>

                    </div>

                </div >
            </form >

            <DumpPanel dataList={[
                { name: "inputData", data: inputData },
                { name: "formState", data: formState },
                { name: "fieldState", data: fieldState },
                { name: "sl", data: sl },
            ]} debugMode={debugMode} />
        </div >
    );
}