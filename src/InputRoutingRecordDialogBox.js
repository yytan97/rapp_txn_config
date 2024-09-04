import * as react from "react";
// import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import * as apiBox from "./apiBox.js";

import { globalContext } from "./globalContext.js";

import { ErrorLine } from "./ErrorLine.js";
import { InputLabel } from "./InputLabel.js";

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

let routingFlagReferenceList = [];
let routingList = [];
let connectorModeReferenceList = [];
let referenceList = [];

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

export function InputRoutingRecordDialogBox({ debugMode = true }) {
    const componentName = "InputRoutingRecordDialogBox";

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
            window.addEventListener("showInputRoutingRecordDialogBox", callback4Show);
        }

        // clean up
        return () => {
            console.log(`Unmount ${componentName}`);
            if (modal !== undefined) {
                console.log(`Clean up for ${componentName}`);
                window.removeEventListener("showInputRoutingRecordDialogBox", callback4Show);
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
            routingFlagReferenceList = [];
            routingList = [];

            connectorModeReferenceList = buildConnectorModeReferenceList();

            let tableName = "kswitchroute";
            let databaseName = "kdb";
            // fetch data 
            let result4 = await apiBox.getRecord(getSessionToken(), databaseName, tableName);

            if (result4.flag) {
                let list1 = result4?.data?.records;

                if (list1) {
                    routingList = list1;
                }
                console.log("Routing list", routingList);
            }
            else throw (result4);

            let result5 = await apiBox.getRecord(getSessionToken(), databaseName, "kswitchroute_flag_strings");

            if (result5.flag) {
                let list2 = result5?.data?.records;
                if (list2) {
                    routingFlagReferenceList = list2;
                }
                console.log("Routing flag refrence list", routingFlagReferenceList);
            }
            else throw (result5);

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

    function buildConnectorModeReferenceList() {
        let list = [
            { value: "read", description: "Enable reading" },
            { value: "write", description: "Enable writing" },
            { value: "readwrite", description: "Enable both reading and writing" },
            { value: "append", description: "Open the connector in append mode. If supported, all writes go to the end of the file" },
            { value: "truncate", description: "Truncate the connector to zero size if supported when opening" },
            { value: "create", description: "If the connector does not exist, create it" },
            { value: "exclusive", description: "If the connector does exist and create is set, then fail to open and create" },
            { value: "sync", description: "All writes to the connector are flushed before the write returns (if supported)" },
            { value: "async", description: "All I/O is async on the connector. This is not supported by all connectors" },
            { value: "nonblocking", description: "Non-blocking I/O. If an I/O operation would block, fail and return an error" },
            { value: "listen", description: "When using open(), translate that into a listen() call" },
            { value: "connect", description: "When using open(), translate that into a connect() call" },
            { value: "packetdata", description: "Packet data" },
        ];

        return list;
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
        console.log("Receive event 'showRoutingRecordDialogBox'", e.detail);
        let detail = e.detail;

        title = detail.title;
        // setMessage(detail.message);
        data = detail.data;
        callback4OK = detail.callback4OK;
        callback4Cancel = detail.callback4Cancel;

        label4OK = detail.label4OK;
        label4Cancel = detail.label4Cancel;

        referenceList = [];
        if (detail.referenceList) referenceList = detail.referenceList;

        action = 0;

        if (data !== undefined) inputData = { ...data };
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

    function check4RoutingName(input, value) {
        if (debugMode) console.log("Check for routing name");

        if (routingList == undefined) return;

        let record = routingList.find(function (element1, index1, array1) {
            if (element1.routingName == value) return true;
            return false;
        });

        input.setCustomValidity("");
        if (record) input.setCustomValidity("duplicate");


        if (referenceList == undefined) return;
        let record2 = referenceList.find(function (element1, index1, array1) {
            if (element1.routingName == value) return true;
            return false;
        });
        if (record2) input.setCustomValidity("duplicate");

        return;
    };

    function change4Input(e) {
        if (debugMode) console.log("Form", ref4Form.current.checkValidity());

        formObject.dirty = true;
        formObject.valid = ref4Form.current.checkValidity();
        let obj = tBox.buildFormFieldState(ref4Form.current);
        formObject.fieldState = obj;

        // inputData[e.target.name] = e.target.value;

        // add custom validation
        let name = e.target.name;
        let input = e.target;
        let value = e.target.value;

        if (name.startsWith('routingFlagObject.')) {
            if (inputData.routingFlagObject === undefined) inputData.routingFlagObject = {};
            let s = name.split(".")[1];
            inputData.routingFlagObject[s] = input.checked;
        }
        else if (name.startsWith('connectorModeObject.')) {
            if (inputData.connectorModeObject === undefined) inputData.connectorModeObject = {};
            let s = name.split(".")[1];
            inputData.connectorModeObject[s] = input.checked;
        }
        else inputData[name] = value;

        if (debugMode) console.log("Input data", inputData);

        if (name === 'routingName') {
            check4RoutingName(input, value);
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
                <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg" role="document">
                    <div className="modal-content ">

                        <div className="modal-body">
                            <div className="fs-1 text-primary text-center">
                                <span className="material-icons fs-1">help</span>
                            </div>
                            <div className="fw-bold text-center mb-3">{sl.l_title}</div>

                            <form className="col-12 mt-2" ref={ref4Form} autoComplete="off" noValidate>

                                <div>
                                    <InputLabel label={sl.l_routing_name} required />
                                    <input name="routingName"
                                        type="text"
                                        className={`form-control ${tBox.getClass4IsInvalid2('routingName', formObject)}`}
                                        placeholder={sl.p_routing_name}
                                        value={inputData?.routingName || ""}
                                        onChange={change4Input}
                                        required />

                                    <ErrorLine message={tBox.getFieldErrorMessage2('routingName', sl, formObject)} />
                                </div>

                                <div>
                                    <InputLabel label={sl.l_routing_order} required />
                                    <input name="routingOrder"
                                        type="number"
                                        className={`form-control ${tBox.getClass4IsInvalid2('routingOrder', formObject)}`}
                                        placeholder={sl.p_routing_order}
                                        value={inputData?.routingOrder || ""}
                                        onChange={change4Input}
                                        required />

                                    <ErrorLine message={tBox.getFieldErrorMessage2('routingOrder', sl, formObject)} />
                                </div>

                                <div>
                                    <InputLabel label={sl.l_link_type} />
                                    <input name="linkType"
                                        type="text"
                                        className={`form-control ${tBox.getClass4IsInvalid2('linkType', formObject)}`}
                                        placeholder={sl.p_link_type}
                                        value={inputData?.linkType || ""}
                                        onChange={change4Input}
                                    />

                                    <ErrorLine message={tBox.getFieldErrorMessage2('linkType', sl, formObject)} />
                                </div>

                                <div>
                                    <InputLabel label={sl.l_routing_flags} />
                                    <div className="px-3">
                                        {
                                            routingFlagReferenceList.map((record, index) => {
                                                return (
                                                    <div key={index} className="form-check " >
                                                        <input className="form-check-input"
                                                            type="checkbox"
                                                            id={"routingFlag" + record.flagValue}
                                                            name={"routingFlagObject." + record.flagValue}
                                                            checked={inputData?.routingFlagObject?.[record.flagValue] || false}
                                                            onChange={change4Input} />
                                                        <label className="form-check-label" htmlFor={"routingFlag" + record.flagValue}>
                                                            {tBox.getLabel(sl, record.flagValue, "o_routing_flag_") || record.flagDescription} ({record.flagString})
                                                        </label>
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>

                                </div>

                                <div className="mt-2" style={{ color: "#494D4F", fontSize: "16px", fontWeight: "bold" }}>
                                    {sl.l_connector_parameter}
                                </div>
                                <div className="my-3 px-3">

                                    <div>
                                        <InputLabel label={sl.l_connector_type} required />
                                        <input name="connectorType"
                                            type="text"
                                            className={`form-control ${tBox.getClass4IsInvalid2('connectorType', formObject)}`}
                                            placeholder={sl.p_connector_type}
                                            value={inputData?.connectorType || ""}
                                            onChange={change4Input}
                                            list="datalist4ConnectorType"
                                            required />

                                        <datalist id="datalist4ConnectorType">
                                            <option value="socket"></option>
                                            <option value="fastsocket"></option>
                                            <option value="unixsocket"></option>
                                            <option value="tcp"></option>
                                            <option value="tcpsocket"></option>
                                            <option value="file"></option>
                                            <option value="queue"></option>
                                            <option value="ssl"></option>
                                        </datalist>

                                        <ErrorLine message={tBox.getFieldErrorMessage2('connectorType', sl, formObject)} />
                                    </div>

                                    <div>
                                        <InputLabel label={sl.l_connector_address} />
                                        <input name="connectorAddress"
                                            type="text"
                                            className={`form-control ${tBox.getClass4IsInvalid2('connectorAddress', formObject)}`}
                                            placeholder={sl.p_connector_address}
                                            value={inputData?.connectorAddress || ""}
                                            onChange={change4Input} />
                                        <ErrorLine message={tBox.getFieldErrorMessage2('connectorAddress', sl, formObject)} />
                                    </div>

                                    <div>
                                        <InputLabel label={sl.l_connector_port} />
                                        <input name="connectorPort"
                                            type="text"
                                            className={`form-control ${tBox.getClass4IsInvalid2('connectorPort', formObject)}`}
                                            placeholder={sl.p_connector_port}
                                            value={inputData?.connectorPort || ""}
                                            onChange={change4Input} />
                                        <ErrorLine message={tBox.getFieldErrorMessage2('connectorPort', sl, formObject)} />
                                    </div>

                                    <div>
                                        <InputLabel label={sl.l_connector_header} />
                                        <input name="connectorHeader"
                                            type="text"
                                            className={`form-control ${tBox.getClass4IsInvalid2('connectorHeader', formObject)}`}
                                            placeholder={sl.p_connector_header}
                                            value={inputData?.connectorHeader || ""}
                                            onChange={change4Input}
                                            list="datalist4ConnectorHeader" />

                                        <datalist id="datalist4ConnectorHeader">
                                            <option value="KSocketHeader"></option>
                                        </datalist>

                                        <ErrorLine message={tBox.getFieldErrorMessage2('connectorHeader', sl, formObject)} />
                                    </div>

                                    <div>
                                        <InputLabel label={sl.l_connector_header_len} />
                                        <input name="connectorHeaderLen"
                                            type="text"
                                            className={`form-control ${tBox.getClass4IsInvalid2('connectorHeaderLen', formObject)}`}
                                            placeholder={sl.p_connector_header_len}
                                            value={inputData?.connectorHeaderLen || ""}
                                            onChange={change4Input}
                                            list="datalist4ConnectorHeaderLen" />

                                        <datalist id="datalist4ConnectorHeaderLen">
                                            <option value="2"></option>
                                            <option value="4"></option>
                                            <option value="8"></option>
                                        </datalist>

                                        <ErrorLine message={tBox.getFieldErrorMessage2('connectorHeaderLen', sl, formObject)} />
                                    </div>

                                    <div>
                                        <InputLabel label={sl.l_connector_lock} />
                                        <input name="connectorLock"
                                            type="text"
                                            className={`form-control ${tBox.getClass4IsInvalid2('connectorLock', formObject)}`}
                                            placeholder={sl.p_connector_lock}
                                            value={inputData?.connectorLock || ""}
                                            onChange={change4Input}
                                            list="datalist4ConnectorLock" />

                                        <datalist id="datalist4ConnectorLock">
                                            <option value="mutex"></option>
                                        </datalist>

                                        <ErrorLine message={tBox.getFieldErrorMessage2('connectorLock', sl, formObject)} />
                                    </div>

                                    <div>
                                        <InputLabel label={sl.l_connector_mode} />
                                        <div className="px-3">
                                            {
                                                connectorModeReferenceList.map((record, index) => {
                                                    return (
                                                        <div key={index} className="form-check " >
                                                            <input className="form-check-input"
                                                                type="checkbox"
                                                                id={"connectorMode" + record.value}
                                                                name={"connectorModeObject." + record.value}
                                                                checked={inputData?.connectorModeObject?.[record.value] || ""}
                                                                onChange={change4Input} />
                                                            <label className="form-check-label" htmlFor={"connectorMode" + record.value}>
                                                                {tBox.getLabel(sl, record.value, "o_connector_mode_") || record.description} ({record.value})
                                                            </label>
                                                        </div>
                                                    );
                                                })
                                            }
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

export function showInputRoutingRecordDialogBox(data, referenceList, callback4OK, label4OK, callback4Cancel, label4Cancel) {
    console.log("Show Input routing record dialog box");

    let detail = {
        data: { ...data },
        callback4OK: callback4OK,
        callback4Cancel: callback4Cancel,
        label4OK: label4OK,
        label4Cancel: label4Cancel,
        referenceList: referenceList
    };

    let e = new CustomEvent("showInputRoutingRecordDialogBox", {
        detail: detail
    });
    window.dispatchEvent(e);
    return;
};
