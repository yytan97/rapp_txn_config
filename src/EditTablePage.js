
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

import { showTableSchemaDialogBox, TableSchemaDialogBox } from "./TableSchemaDialogBox.js";


// Map loaded lib here ...
const uuidv4 = window.uuidv4;
const moment = window.moment;

let tableName = undefined;
let databaseName = "kdb";

const accessObjectName = "webapp_configuration_access";
const accessActionPrefix = "cryptogram_management";

let dataRecord = undefined;
export let fieldList = [];

// parameter
let rowId = undefined;
let key = undefined;
let value = undefined;

let editMode = 0;

// input variable
let inputData = {};
let formObject = {
    dirty: false,
    valid: false,
    fieldState: {},
};

export function cleanUp() {
    tableName = undefined;
    databaseName = "kdb";

    fieldList = [];
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

export function EditTablePage({ debugMode = true }) {
    const componentName = "EditTablePage";
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
        tableName = sp.get('tableName');
        databaseName = sp.get('databaseName');
        key = sp.getAll('key');
        value = sp.getAll('value');

        console.log("Row ID", rowId);
        console.log("Key", key);
        console.log("Value", value);
        console.log("Edit mode", editMode);

        let timer = setTimeout(async () => {
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
    }, [redraw]);

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

            let result1 = await apiBox.describeTable(getSessionToken(), databaseName, tableName);
            if (result1.flag && result1.data) {
                fieldList = result1.data?.fields;
            }
            else throw (result1);

            // fetch data 
            if (editMode === 1) {
                let selector = `rowId = ${rowId}`;;
                if (rowId === undefined || rowId === null) {
                    selector = buildSelector(key, value);
                }
                console.log("Selector", selector);
                let result4 = await apiBox.getRecord(getSessionToken(), databaseName, tableName, selector);

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
            }
            else {
                dataRecord = {};
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

    function buildSelector(key, value) {

        let s = "";

        if (Array.isArray(key)) {
            for (let n = 0; n < key.length; n++) {
                let k1 = key[n];
                let v1 = value[n];

                if (s != "") s += " and ";
                s += `${k1} = '${v1}'`;
            }
            return s;
        }

        if (key.indexOf(',') >= 0) {
            let a = key.split(',');
            let v = value.split(',');
            for (let n = 0; n < a.length; n++) {
                let k1 = a[n];
                let v1 = v[n];

                if (s != "") s += " and ";
                s += `${k1} = '${v1}'`;
            }
            return s;
        }

        s += `${key} = '${value}'`;
        return s;

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
        let message = sl.m_add_current_record;

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
        let message = sl.m_update_current_record;
        let selector = "";
        let data = { ...inputData, rowId: undefined };  // fix the bug on host update error, remove row Id

        if (rowId === undefined || rowId === null) {
            selector = buildSelector(key, value);
        }
        else {
            message = sl.m_confirm_update_record;
            message = message.replace("__parameter_1", rowId);
            selector = `rowId = ${rowId}`;
        }

        showConfirmDialogBox(message, async function () {
            showStateDialogBox();
            try {
                console.warn("Data", inputData);

                let result1 = await apiBox.updateRecord(getSessionToken(), databaseName, tableName, selector, data);
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

    function click4DeleteRecord(e) {
        if (debugMode) console.log("Click for delete record", e);

        let message = sl.m_delete_current_record;
        let selector = "";
        if (rowId === undefined || rowId === null) {
            selector = buildSelector(key, value);
        }
        else {
            message = sl.m_confirm_delete_record;
            message = message.replace("__parameter_1", rowId);
            selector = `rowId = ${rowId}`;
        }

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.deleteRecord(getSessionToken(), databaseName, tableName, selector);
                if (result1 && result1.flag) {
                    formObject.dirty = false;
                    let message = sl.m_record_deleted;
                    showInfoDialogBox(message, () => {
                        navigate(-1);
                    });
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

    function click4ShowSchema(e) {
        if (debugMode) console.log("Click for show schema ", e);

        showTableSchemaDialogBox(fieldList);
        console.log("schema fieldlist:",fieldList)
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
                        (editMode === 0 && check4Right(accessObjectName, `${accessActionPrefix}.add`)) ? (
                            <button className="ms-1 btn btn-ghost-unity "
                                type="button"
                                onClick={click4AddRecord}
                                title={sl.t_add_record}
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
                                title={sl.t_update_record}
                                disabled={!formObject?.valid || !formObject?.dirty} >
                                <span className="material-icons-outlined fs-24-unity">upload_file</span>
                            </button>
                        ) : null
                    }

                    {
                        (editMode === 1 && check4Right(accessObjectName, `${accessActionPrefix}.delete`)) ? (
                            <button className="ms-1 btn btn-ghost-unity "
                                type="button"
                                onClick={click4DeleteRecord}
                                title={sl.t_delete_record}>
                                <span className="material-icons-outlined fs-24-unity">delete</span>
                            </button>
                        ) : null
                    }

                    <button className="ms-1 btn btn-ghost-unity "
                        type="button"
                        title={sl.t_show_schema}
                        onClick={click4ShowSchema}>
                        <span className="material-icons-outlined fs-24-unity">fact_check</span>
                    </button>

                </div>

            </div>

            <form ref={ref4Form} className="d-flex justify-content-center mt-4 mb-5">
                <div className="col-8" style={{ minHeight: "50vh" }}>

                    <div className="pb-3 border-bottom">

                        <div style={{ color: "#242627", "fontSize": "16px", fontWeight: "bold" }} >
                            {sl.l_table} {tableName || ' '}
                        </div>

                        <div style={{ color: "#76797B", fontSize: "12px" }}>
                            {(editMode === 0) ? sl.l_add_desc : sl.l_update_desc}
                        </div>

                    </div>

                    <div className="px-4 mt-4">
                        <div style={{ color: "#494D4F", fontSize: "16px", fontWeight: "bold" }} >
                            {sl.l_record_detail}
                        </div>

                        <div className="my-3 px-3">

                            {
                                fieldList.map((fieldRecord, fieldIndex) => {

                                    return (
                                        <div key={fieldIndex}>
                                            <InputLabel label={fieldRecord.name} />
                                            <input name={fieldRecord.name}
                                                type="text"
                                                className={`form-control ${tBox.getClass4IsInvalid2(fieldRecord.name, formObject)}`}
                                                placeholder=""
                                                value={inputData?.[fieldRecord.name] || ""}
                                                onChange={change4Input}
                                                disabled={(fieldRecord.name === 'rowId' ||
                                                    fieldRecord.name === 'recordDate' ||
                                                    fieldRecord.name === 'createDate') ? true : false} />

                                            <ErrorLine message={tBox.getFieldErrorMessage2(fieldRecord.name, sl, formObject)} />
                                        </div>
                                    );
                                })
                            }

                        </div>

                    </div>

                </div >
            </form >

            <TableSchemaDialogBox debugMode={debugMode} />

            <DumpPanel dataList={[
                { name: "inputData", data: inputData },
                { name: "formObject", data: formObject },
                { name: "fieldList", data: fieldList },
                { name: "sl", data: sl },
            ]} debugMode={debugMode} />
        </div >
    );
}