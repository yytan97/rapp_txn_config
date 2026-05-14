import * as react from "react";
import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import * as apiBox from "./apiBox.js";
import { globalContext } from "./globalContext.js";

import { ErrorLine } from "./ErrorLine.js";
import { InputLabel } from "./InputLabel.js";
import { DumpPanel } from "./DumpPanel.js";

import { SideBar } from "./SideBar.js";
import { TitlePanel } from "./TitlePanel.js";
import { FooterPanel } from "./FooterPanel.js";
import { PaginationPanel } from "./PaginationPanel.js";

import { showConfirmDialogBox } from "./ConfirmDialogBox.js";
import { showStateDialogBox, closeStateDialogBox } from "./StateDialogBox.js";
import { showInfoDialogBox } from "./InfoDialogBox.js";

// Map loaded lib here ...
const uuidv4 = window.uuidv4;
const moment = window.moment;

let dataList = [];
let fieldList = [];

let tableName = "kswitch_fin_log";
let databaseName = "kdb";

const accessObjectName = "webapp_configuration_access";
const accessActionPrefix = "transaction_history";

// parameter
let rowId = undefined;
let editMode = 0;
let dataRecord = undefined;

// input variable
const defaultInputData = {
    shortPan: "",
    trace: "",
    retrievalRefnum: "",
    switchTxnId: "",
    acceptorTerminalId: "",
    acceptorIdCode: "",
    recordDate: "1h",
    dateFrom: "",
    dateTo: "",
};

let inputData = { ...defaultInputData };

let formObject = {
    dirty: false,
    valid: false,
    fieldState: {},
};

export function cleanUp() {
    dataRecord = undefined;
    rowId = undefined;
    editMode = 0;

    inputData = { ...defaultInputData };

    formObject = {
        dirty: false,
        valid: false,
        fieldState: {},
    };

    return;
};

export let searchObject = {
    searchText: ""
};

export function SearchBox({ debugMode = true }) {
    const componentName = "SearchBox";
    if (debugMode) console.log(`${componentName} component start ...`);

    // let data = reactRouter.useLoaderData();
    const {
        config, localData, gsl, dataset, user,
        applicationDebugMode, applicationLanguage,
        updateUser,
        getSessionToken, getUsername,
        check4Right,
        getCurrencyList
    } = react.useContext(globalContext);

    // check from context
    if (applicationDebugMode !== undefined) debugMode = applicationDebugMode;
    let sl = tBox.getStringLabel(gsl, componentName);

    // const inputFileRef = react.useRef();
    let [redraw, setRedraw] = react.useState(0);
    let [refresh, setRefresh] = react.useState(true);
    let [reset, setReset] = react.useState(true);

    let [initialFilterData, setInitialFilterData] = react.useState({ ...defaultInputData });
    let [hasChanged, setHasChanged] = react.useState(false);

    const navigate = reactRouter.useNavigate();
    const location = reactRouter.useLocation();

    const ref4Form = react.useRef();

    react.useEffect(() => {
        if (!ref4Form.current) return;
        if (debugMode) console.log(`Run ${componentName} on effect for build field state`);
        let obj = tBox.buildFormFieldState(ref4Form.current);
        formObject.fieldState = obj;
        formObject.valid = ref4Form.current.checkValidity();

    }, [redraw]);     // if having custom validation than need to add redraw to effect state list

    react.useEffect(() => {
        const hasIncomingFilterData = !!location?.state?.filterData;
        const originalFilter = normalizeFilterData(location?.state?.filterData);

        inputData = { ...originalFilter };
        setInitialFilterData(originalFilter);
        setHasChanged(!hasIncomingFilterData);

        formObject = {
            dirty: false,
            valid: false,
            fieldState: {},
        };

        setRedraw((v) => v + 1);
    }, [location.state]);

    function normalizeFilterData(data = {}) {
        return {
            shortPan: data.shortPan || "",
            trace: data.trace || "",
            retrievalRefnum: data.retrievalRefnum || "",
            switchTxnId: data.switchTxnId || "",
            acceptorTerminalId: data.acceptorTerminalId || "",
            acceptorIdCode: data.acceptorIdCode || "",
            recordDate: data.recordDate || "1h",
            dateFrom: data.recordDate === "custom" ? data.dateFrom || "" : "",
            dateTo: data.recordDate === "custom" ? data.dateTo || "" : "",
        };
    }

    // compare filter data with initial filter data to determine if there is any change
    function isSameFilterData(a = {}, b = {}) {
        return JSON.stringify(a) === JSON.stringify(b);
    }

    function change4Input(e) {
        if (debugMode) console.log("Change for input", e);

        formObject.dirty = true;
        if (ref4Form.current) {

        };
        formObject.valid = ref4Form.current.checkValidity();
        let obj = tBox.buildFormFieldState(ref4Form.current);
        formObject.fieldState = obj;

        // add custom validation
        let name = e.target.name;
        let input = e.target;
        let value = e.target.value;
        let type = e.target.type;

        if (name === "shortPan") {
            value = String(value).replace(/\D/g, "").slice(0, 4);
        }

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
        else if (type === 'radio') {
            if (debugMode) console.log("Change for radio input", name, value);
            inputData[name] = value;
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

        if (name === "recordDate" && value !== "custom") {
            inputData.dateFrom = "";
            inputData.dateTo = "";
        }

        console.log("Input data", inputData);
        console.log("Form state", formObject)

        const currentFilter = normalizeFilterData(inputData);
        setHasChanged(!isSameFilterData(currentFilter, initialFilterData));

        setRedraw((v) => v + 1);
    };

    function click4Search() {
        let path = {
            pathname: "/transactionHistoryV2",
        };

        navigate(path, {
            state: {
                filterData: {
                    shortPan: inputData.shortPan || "",
                    trace: inputData.trace || "",
                    retrievalRefnum: inputData.retrievalRefnum || "",
                    switchTxnId: inputData.switchTxnId || inputData.switchOrigTxnId || "",
                    acceptorTerminalId: inputData.acceptorTerminalId || "",
                    acceptorIdCode: inputData.acceptorIdCode || "",
                    recordDate: inputData.recordDate || "",
                    dateFrom: inputData.recordDate === "custom" ? inputData.dateFrom || "" : "",
                    dateTo: inputData.recordDate === "custom" ? inputData.dateTo || "" : "",
                }
            }
        });

        return;
    }

    function click4Clear() {
        inputData = { ...defaultInputData };

        formObject = {
            dirty: false,
            valid: false,
            fieldState: {},
        };

        const currentFilter = normalizeFilterData(inputData);
        setHasChanged(!isSameFilterData(currentFilter, initialFilterData));

        setRedraw((v) => v + 1);
    }

    function click4Cancel() {
        navigate("/transactionHistoryV2", {
            state: {
                filterData: initialFilterData
            }
        });

        return;
    }

    return (
            <div className="container-fluid px-0 bg-unity-1">
                <TitlePanel />
                <div className="d-flex ">
                    <div style={{ ...(dataset?.sideBarWidth) }}>
                        <SideBar />
                    </div>
    
                    <div className="flex-fill" style={{ ...(dataset?.mainPanelWidth) }}>
                        <div className="pl-24 pr-24" style={{ minHeight: "100vh", }}>
                            <div className="col-12 pt-12 pb-16">
                                <div className="title-font fw-bold">
                                    {sl.l_title}
                                </div>
                            </div>
                            <div>
                                <div className="d-flex justify-content-center">
                                    <div className="col-6 d-flex no_result_display_box">
                                        <span className="material-icons alert-icon pr-8">
                                        info
                                        </span>
                                        <div>
                                            <div className="fw-semibold fs-14-unity pb-4px">
                                                {sl.l_no_results}
                                            </div>
                                            <div className="grey-font fs-14-unity">
                                                {sl.l_no_results_desc}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <form className="d-flex justify-content-center mt-4 mb-5" ref={ref4Form}>
                                    <div className="col-6">
                                        <div>
                                            <div>
                                                <InputLabel label={sl.l_record_date} />
                                                <select
                                                        name="recordDate"
                                                        className={`form-select ${tBox.getClass4IsInvalid2("recordDate", formObject)}`}
                                                        value={inputData?.recordDate || "1h"}
                                                        onChange={change4Input}
                                                    >
                                                        <option value="1h">{sl.o_last_1_hour}</option>
                                                        <option value="12h">{sl.o_last_12_hours}</option>
                                                        <option value="24h">{sl.o_last_24_hours}</option>
                                                        <option value="7d">{sl.o_last_7_days}</option>
                                                        <option value="custom">{sl.o_custom_date}</option>
                                                    </select>

                                                    <ErrorLine message={tBox.getFieldErrorMessage2("recordDate", sl, formObject)} />
                                            </div>
                                            {inputData?.recordDate === "custom" && (
                                                <div className="mt-3">
                                                    <div className="row g-3">
                                                        <div className="col-6">
                                                            <InputLabel label={sl.l_date_from} />
                                                            <input
                                                                name="dateFrom"
                                                                type="date"
                                                                className={`form-control custom-date-input ${tBox.getClass4IsInvalid2("dateFrom", formObject)}`}
                                                                value={inputData?.dateFrom || ""}
                                                                max={inputData?.dateTo || undefined}
                                                                onChange={change4Input}
                                                            />
                                                            {/* <span className="material-symbols-outlined custom-date-icon">
                                                                calendar_month
                                                            </span> */}

                                                            <ErrorLine message={tBox.getFieldErrorMessage2("dateFrom", sl, formObject)} />
                                                        </div>
                                                        <div className="col-6">
                                                            <InputLabel label={sl.l_date_to} />
                                                            <input
                                                                name="dateTo"
                                                                type="date"
                                                                className={`form-control custom-date-input ${tBox.getClass4IsInvalid2("dateTo", formObject)}`}
                                                                value={inputData?.dateTo || ""}
                                                                min={inputData?.dateFrom || undefined}
                                                                onChange={change4Input}
                                                            />
                                                            <ErrorLine message={tBox.getFieldErrorMessage2("dateTo", sl, formObject)} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <InputLabel label={sl.l_short_pan} />
                                                <input name="shortPan"
                                                    type="text"
                                                    className={`form-control ${tBox.getClass4IsInvalid2('shortPan', formObject)}`}
                                                    placeholder={sl.p_last_4_digits_maskpan}
                                                    value={inputData?.shortPan || ""}
                                                    onChange={change4Input}
                                                    maxLength={4}
                                                    inputMode="numeric"
                                                    pattern="[0-9]*" />

                                                <ErrorLine message={tBox.getFieldErrorMessage2('shortPan', sl, formObject)} />
                                            </div>
                                            <div>
                                                <InputLabel label={sl.l_trace} />
                                                <input name="trace"
                                                    type="text"
                                                    className={`form-control ${tBox.getClass4IsInvalid2('trace', formObject)}`}
                                                    placeholder={sl.p_trace}
                                                    value={inputData?.trace || ""}
                                                    onChange={change4Input} />

                                                <ErrorLine message={tBox.getFieldErrorMessage2('trace', sl, formObject)} />
                                            </div>
                                            <div>
                                                <InputLabel label={sl.l_ref_code} />
                                                <input name="retrievalRefnum"
                                                    type="text"
                                                    className={`form-control ${tBox.getClass4IsInvalid2('retrievalRefnum', formObject)}`}
                                                    placeholder={sl.p_ref_code}
                                                    value={inputData?.retrievalRefnum || ""}
                                                    onChange={change4Input} />

                                                <ErrorLine message={tBox.getFieldErrorMessage2('retrievalRefnum', sl, formObject)} />
                                            </div>
                                            <div>
                                                <InputLabel label={sl.l_switch_txn_id} />
                                                <input name="switchTxnId"
                                                    type="text"
                                                    className={`form-control ${tBox.getClass4IsInvalid2('switchTxnId', formObject)}`}
                                                    placeholder={sl.p_switch_txn_id}
                                                    value={inputData?.switchTxnId || inputData.switchOrigTxnId || ""}
                                                    onChange={change4Input} />

                                                <ErrorLine message={tBox.getFieldErrorMessage2('switchTxnId', sl, formObject)} />
                                            </div>
                                            <div>
                                                <InputLabel label={sl.l_acceptor_terminal_id} />
                                                <input name="acceptorTerminalId"
                                                    type="text"
                                                    className={`form-control ${tBox.getClass4IsInvalid2('acceptorTerminalId', formObject)}`}
                                                    placeholder={sl.p_acceptor_terminal_id}
                                                    value={inputData?.acceptorTerminalId || ""}
                                                    onChange={change4Input} />

                                                <ErrorLine message={tBox.getFieldErrorMessage2('acceptorTerminalId', sl, formObject)} />
                                            </div>
                                            <div>
                                                <InputLabel label={sl.l_acceptor_id_code} />
                                                <input name="acceptorIdCode"
                                                    type="text"
                                                    className={`form-control ${tBox.getClass4IsInvalid2('acceptorIdCode', formObject)}`}
                                                    placeholder={sl.p_acceptor_id_code}
                                                    value={inputData?.acceptorIdCode || ""}
                                                    onChange={change4Input} />

                                                <ErrorLine message={tBox.getFieldErrorMessage2('acceptorIdCode', sl, formObject)} />
                                            </div>
                                            <div className="mt-4 d-flex justify-content-between align-items-center">
                                                <button type="button" className="btn btn-light" onClick={click4Clear}>
                                                    {sl.b_reset_default}
                                                </button>
                                                <div className="d-flex gap-2">
                                                    <button type="button" className="btn btn-outline-secondary" onClick={click4Cancel} disabled={hasChanged}>
                                                        {sl.b_close}
                                                    </button>
                                                    <button type="button" className="btn btn-primary" onClick={click4Search} disabled={!hasChanged}>
                                                        {sl.b_apply}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>  

                        {/* end of content panel */}
    
                        <DumpPanel dataList={[
                            { name: "searchObject", data: searchObject },
                            { name: "dataList", data: dataList },
                            { name: "sl", data: sl },
                        ]} debugMode={debugMode} />
    
                    </div> 
                    {/* end of right panel */}
                </div> 
                {/* end of top part */}
    
                <FooterPanel />
            </div>     
        );
}
