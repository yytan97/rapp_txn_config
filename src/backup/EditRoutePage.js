
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
const bootstrap = window.bootstrap;

let tableName = "kswitchroute";
let databaseName = "kdb";

const accessObjectName = "webapp_configuration_access";
const accessActionPrefix = "institution_managment.routing_information";

let dataRecord = undefined;

// parameter
let institutionId = undefined;

let routingName = undefined;
let routingKey = undefined;
let rowId = undefined;

let editMode = 0;

// input variable
let inputData = {};
let formObject = {
    dirty: false,
    valid: false,
    fieldState: {},
};

let routingFieldList = [
    { name: "routingName", label: "Name" },
    { name: "routingOrder", label: "Order" },
    { name: "linkType", label: "Type" },
    { name: "routingFlags", label: "Flags" },
    { name: "connectorType", label: "Connector Type" },
    { name: "connectorAddress", label: "Connector Address" },
    { name: "connectorPort", label: "Connector Port" },
    { name: "connectorMode", label: "Connector Mode" },
    { name: "connectorLock", label: "Connector Lock" },
    { name: "connectorHeader", label: "Connector Header" },
];

let dataContent = "";
let routingRecordList = [];
let routingFlagReferenceList = [];
let connectorModeReferenceList = [];
let connectorList = [];

let popoverList = [];

export function cleanUp() {
    dataRecord = undefined;
    institutionId = undefined;
    editMode = 0;

    inputData = {};
    formObject = {
        dirty: false,
        valid: false,
        fieldState: {},
    };
    return;
};

export function EditRoutePage({ debugMode = true }) {
    const componentName = "EditRoutePage";
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
    const ref4InputRoutingName = react.useRef();


    const navigate = reactRouter.useNavigate();
    const location = reactRouter.useLocation();

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);

        const sp = new URLSearchParams(location.search);
        rowId = sp.get('rowId');
        routingKey = sp.get('routingKey');
        routingName = sp.get('routingName');
        editMode = parseInt(sp.get('editMode'));

        console.log("Row ID", rowId);
        console.log("Routing key", routingKey);
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
        if (debugMode) console.log(`Run ${componentName} on effect for application language`);
        try {
            disposePopover();
            createPopover();
        }
        catch (e) {
            console.log(e);
        }
    }, [applicationLanguage]);

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
            let filename = config?.connectorPath || "$KL_CFG_DIR/kconnector.cfg";
            let result1 = await apiBox.readConfigurationFile(getSessionToken(), filename);
            dataContent = "";
            if (result1.flag) {
                dataContent = result1?.data?.files?.[0]?.content;
                console.log("Data content", dataContent);
            }
            else throw result1;

            connectorList = extractConnectorObject(dataContent);
            preprocessConnectorList(connectorList);

            let result2 = await apiBox.getRecord(getSessionToken(), databaseName, "kswitchroute_flag_strings");
            if (result2.flag) {
                let list2 = result2?.data?.records;
                if (list2) {
                    routingFlagReferenceList = list2;
                }
                console.log("Routing flag refrence list", routingFlagReferenceList);
            }
            else routingFlagReferenceList = [];

            connectorModeReferenceList = buildConnectorModeReferenceList();

            let result3 = await apiBox.getRecord(getSessionToken(), databaseName, "kswitchroute");
            if (result3.flag) {
                let list3 = result3.data.records;
                routingRecordList = list3;
            }
            else routingRecordList = [];

            if (editMode === 1) {
                let result4 = await apiBox.getRecord(getSessionToken(), databaseName, tableName, `rowId = '${rowId}'`);
                if (result4.flag) {
                    let list1 = result4.data.records;

                    list1 = list1.map((record) => {
                        let max = 32;
                        let obj = {};
                        for (let n = 0; n < record.routingFlags.length; n++) {
                            let s = record.routingFlags.substr(n, 1);
                            if (s == "1") obj[n + ""] = true;
                        }
                        record.routingFlagObject = obj;

                        // link to connector 
                        let connector = connectorList.find(function (record1) {
                            if (record1.name == record.routingName) return true;
                            return false;
                        });

                        if (connector)
                            record.connector = connector;
                        else
                            record.connector = {
                                modeObject: {}
                            };

                        return record
                    });

                    dataRecord = list1[0];
                    console.log("Record", dataRecord);
                    inputData = dataRecord;
                }
                else throw (result4);
            }
            else {
                dataRecord = {
                    recordStatus: 'A',
                    routingNameOption: "1",
                    routingOrder: 1,
                    routingFlagObject: {
                        "0": true,
                        "2": true,
                        "4": true,
                        "7": true
                    },
                    connector: {
                        modeObject: {
                            "readwrite": true,
                            "connect": true,
                            "packetdata": true
                        },
                        header: "KSocketHeader",
                        lock: "mutex"
                    }
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

    function preprocessConnectorList(list) {
        list.map(function (record) {

            let record2 = {};
            let a = [];
            if (record.mode) a = record.mode.split(" ");

            for (const s of a) {
                record2[s] = true;
            }
            record.modeObject = record2;
        });

        list.sort(function (a, b) {
            if (a.name == b.name) return 0;
            if (a.name < b.name) return -1;
            return 1;
        });

        return list;
    };

    function extractConnectorObject(inputString) {
        let keyString = "kconnector\\.instance";
        let regexString = `(/\\*[\\s\\S]*?\\*/)|(${keyString}\\s*\\{([\\s\\S]*?)\\})|(\\#.*)`;

        console.log("Regex string", regexString);
        let rs = new RegExp(regexString, "gd");

        // let result = inputString.match(rs);
        let matches = inputString.matchAll(rs);

        let a = [];
        for (const match of matches) {
            console.log(
                `Found ${match[2]} start=${match.index} end=${match.index + match[0].length
                }.`, match
            );

            if (match[2] != undefined && match[3] != undefined) {
                let obj = {
                    startIndex: match.index,
                    endIndex: match.index + match[0].length,
                    dataLength: match[0].length,
                    // sourceData: match[2],
                };

                let s1 = match[3];
                let lines = s1.split(/[\n]/);
                for (const line of lines) {
                    console.log(`Line [${line}]`);
                    let rs2 = /"[^"\\]*(?:\\.[^"\\]*)*"|(#.*)|([\w-\.]+[\w-\. ]*)/g;
                    let result = line.trim().match(rs2);
                    console.log(`Result [${result}]`);

                    if (result == null || result.length < 2) continue;

                    let name = result[0].trim();
                    let value = result[1].trim();

                    // let value2 = result[2];
                    // if (value == "" && value2 && value2.startsWith('"')) value = value2;

                    if (name == "" || name.startsWith("#")) continue;
                    obj[name] = value;

                }   // end of for lines
                console.log("Object dump", obj);
                a.push(obj);
            }

        }   // end of for matches

        console.log("List dump", a);
        return a;
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

    function change4InputVersion1(e) {
        if (debugMode) console.log("Change for input", e);

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
        else if (name.startsWith('modeObject.')) {
            let s = name.split(".")[1];
            inputData.connector.modeObject[s] = input.checked;
        }
        else if (name === 'connectorType') {
            inputData.connector.type = value;
        }
        else if (name === 'connectorAddress') {
            inputData.connector.address = value;
        }
        else if (name === 'connectorPort') {
            inputData.connector.port = value;
        }
        else if (name === 'connectorHeader') {
            inputData.connector.header = value;
        }
        else if (name === 'connectorHeaderLen') {
            inputData.connector.header_len = value;
        }
        else if (name === 'connectorLock') {
            inputData.connector.lock = value;
        }
        else inputData[name] = value;

        if (debugMode) console.log("Input data", inputData);

        if (name === "routingNameOption") {
            if (debugMode) console.log("Change for routing name option");
            setTimeout(() => setRedraw((v) => v + 1), 200);
        }

        console.log("Form state", formObject)
        setRedraw((v) => v + 1);
    };

    function change4Input(e) {
        if (debugMode) console.log("Change for input", e);

        formObject.dirty = true;
        formObject.valid = ref4Form.current.checkValidity();
        let obj = tBox.buildFormFieldState(ref4Form.current);
        formObject.fieldState = obj;

        // inputData[e.target.name] = e.target.value;

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

        if (name === "routingNameOption") {
            if (debugMode) console.log("Change for routing name option");
            inputData.routingName = undefined;
            inputData.routingName2 = undefined;
            inputData.connector = {
                modeObject: {
                    "readwrite": true,
                    "connect": true,
                    "packetdata": true
                },
                header: "KSocketHeader",
                lock: "mutex"
            }

            ref4InputRoutingName?.current?.setCustomValidity("");
            setTimeout(() => setRedraw((v) => v + 1), 200);
        }

        if (name === "routingName") {

            let record2 = connectorList.find(function (record1) {
                if (record1.name === inputData.routingName) return true;
                return false;
            });

            if (record2) ref4InputRoutingName?.current?.setCustomValidity("duplicate");
            else ref4InputRoutingName?.current?.setCustomValidity("");

            setTimeout(() => setRedraw((v) => v + 1), 200);
        }

        if (name === "routingName2") {
            let record2 = connectorList.find(function (record1) {
                if (record1.name == inputData.routingName2) return true;
                return false;
            });

            if (record2) {
                inputData.connector = record2;
            }

            setTimeout(() => setRedraw((v) => v + 1), 200);
        }

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

        let routingName = inputData.routingName;
        if (inputData.routingNameOption == "2")
            routingName = inputData.routingName2;

        message = message.replace("__parameter_1", routingName);
        showConfirmDialogBox(message, async function () {
            showStateDialogBox();
            try {

                let result1 = await addRouteRecord();
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

    async function addRouteRecord() {
        try {

            if (inputData.routingKey == undefined) inputData.routingKey = routingKey;

            let routingName = inputData.routingName;
            if (inputData.routingNameOption == "2")
                routingName = inputData.routingName2;

            inputData.routingFlags = buildRoutingFlags(inputData);

            let connector = inputData.connector;
            if (connector.name === undefined)
                connector.name = routingName;

            connector.mode = buildConnectorMode(connector);

            let record1 = {
                routingKey: routingKey,
                routingName: routingName,
                routingOrder: inputData?.routingOrder,
                linkType: inputData?.linkType,
                routingFlags: inputData?.routingFlags,
                recordStatus: inputData?.recordStatus || "A"
            };

            let result1 = await apiBox.addRecord(getSessionToken(), databaseName, tableName, record1);
            if (result1.flag === false) throw result1;

            // update or append cfg file here

            if (inputData.routingNameOption == 1) {
                let s1 = buildConnectorParameter(connector);
                let s2 = dataContent;
                let s3 = "";

                let dt = new Date()
                console.log("Connector parameter", s1, connector);
                if (connector.startIndex != undefined) {
                    // update

                    let s4 = "\n### Updated " + dt.toISOString() + s1;
                    console.log("Connector parameter", s4, connector);
                    s3 = s2.substring(0, connector.startIndex) + s4 + s2.substring(connector.endIndex);
                }
                else {
                    // append
                    s3 = s2 + "\n### Added " + dt.toISOString() + s1;
                }

                console.log("CFG data dump", s3);
                let filename = config?.connectorPath || "$KL_CFG_DIR/kconnector.cfg";
                let result5 = await apiBox.writeConfigurationFile(getSessionToken(), filename, s3);
                console.log("Result 5", result5)
            }

            return result1;
        }
        catch (e) {
            console.warn("Error", e);
            return e;
        }
    };

    function click4UpdateRecord(e) {
        if (debugMode) console.log("Click for update record", e);
        let message = sl.m_confirm_update_record;
        message = message.replace("__parameter_1", inputData.routingName);
        showConfirmDialogBox(message, async function () {
            showStateDialogBox();
            try {
                let result1 = await updateInstitutionRecord();
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

    async function updateInstitutionRecord() {
        try {

            let routingName = inputData.routingName;
            inputData.routingFlags = buildRoutingFlags(inputData);

            let connector = inputData.connector;
            if (connector.name === undefined)
                connector.name = routingName;

            connector.mode = buildConnectorMode(connector);

            let record1 = {
                routingKey: routingKey,
                routingName: routingName,
                routingOrder: inputData?.routingOrder,
                linkType: inputData?.linkType,
                routingFlags: inputData?.routingFlags,
                recordStatus: inputData?.recordStatus || "A"
            };

            let result1 = await apiBox.updateRecordWithId(getSessionToken(), databaseName, tableName, inputData.rowId, record1);

            if (result1.flag === false) throw result1;

            // update or append cfg file here
            let s1 = buildConnectorParameter(connector);
            let s2 = dataContent;
            let s3 = "";

            let dt = new Date()
            console.log("Connector parameter", s1, connector);
            if (connector.startIndex != undefined) {
                // update

                let s4 = "\n### Updated " + dt.toISOString() + s1;
                console.log("Connector parameter", s4, connector);
                s3 = s2.substring(0, connector.startIndex) + s4 + s2.substring(connector.endIndex);
            }
            else {
                // append
                s3 = s2 + "\n### Added " + dt.toISOString() + "\n" + s1 + "\n";
            }

            console.log("CFG data dump", s3);

            let filename = config?.connectorPath || "$KL_CFG_DIR/kconnector.cfg";
            let result5 = await apiBox.writeConfigurationFile(getSessionToken(), filename, s3);
            console.log("Result 5", result5)

            return result1;
        }
        catch (e) {
            console.warn("Error", e);
            return e;
        }
    };

    function click4Echo(e, record, index) {
        if (debugMode) console.log("Click for echo ", e, record, index);
        return;
    };

    function buildConnectorParameterVersion1(record) {
        let s = "";

        s += "\nkconnector.instance {\n";
        s += `\ttype = ${record.connectorType}\n`;
        s += `\tname = ${record.routingName}\n`;
        if (record.connectorAddress) s += `\taddress = ${record.connectorAddress}\n`;
        if (record.connectorPort) s += `\tport = ${record.connectorPort}\n`;
        if (record.connectorMode) s += `\tmode = ${record.connectorMode}\n`;
        if (record.connectorLock) s += `\tlock = ${record.connectorLock}\n`;
        if (record.connectorHeader) s += `\theader = ${record.connectorHeader}\n`;
        if (record.connectorHeaderLen) s += `\theader_len = ${record.connectorHeaderLen}\n`;
        s += "}\n";

        return s;
    };

    function buildConnectorParameter(record) {
        let s = "";

        s += "\nkconnector.instance {\n";
        for (let name in record) {
            if (name == "startIndex") continue;
            if (name == "endIndex") continue;
            if (name == "dataLength") continue;
            if (name == "modeObject") continue;
            let value = record[name];
            s += `\t${name} = ${value}\n`;
        }
        s += "}\n";
        return s;
    };

    function buildRoutingFlags(record) {
        let obj = record.routingFlagObject;
        let flags = "";
        let max = record.maxRoutingFlag || 32;
        for (let n = 0; n < max; n++) {
            let s = n + "";
            if (obj?.[s]) flags += "1";
            else flags += "0";
        }
        return flags;
    };

    function buildConnectorMode(record) {
        let obj = record.modeObject;
        let s = "";

        for (let name in obj) {
            if (obj?.[name])
                s += name + " ";
        }

        return s.trim().toLocaleLowerCase();
    };


    function createPopover() {
        try {
            let list1 = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
            let list2 = list1.map(function (element1) {
                return new bootstrap.Popover(element1, { html: true, sanitize: false });
            });
            popoverList = list2;
        }
        catch (e) {
            console.warn(e);
        }
    };

    function disposePopover() {
        popoverList = [];
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
                            {(editMode === 0) ? sl.l_add_route : sl.l_edit_route}
                        </div>

                        <div style={{ color: "#76797B", fontSize: "12px" }}>
                            {sl.l_desc}
                        </div>
                    </div>

                    <div className="px-4 mt-4">
                        <div style={{ color: "#494D4F", fontSize: "16px", fontWeight: "bold" }} >
                            {sl.l_routing_information}
                        </div>

                        <div className="my-3 px-3">

                            <div>
                                <InputLabel label={sl.l_routing_key} />
                                <input name="routingKey"
                                    type="text"
                                    className={`form-control ${tBox.getClass4IsInvalid2('routingKey', formObject)}`}
                                    placeholder={sl.p_routing_key}
                                    value={inputData?.routingKey || ""}
                                    onChange={change4Input}
                                    disabled={true}
                                    required />

                                <ErrorLine message={tBox.getFieldErrorMessage2('routingKey', sl, formObject)} />
                            </div>

                            {
                                (editMode === 1) ?
                                    <div>
                                        <InputLabel label={sl.l_routing_name} />
                                        <input name="routingName"
                                            type="text"
                                            ref={ref4InputRoutingName}
                                            className={`form-control ${tBox.getClass4IsInvalid2('routingName', formObject)}`}
                                            placeholder={sl.p_routing_name}
                                            value={inputData?.routingName || ""}
                                            onChange={change4Input}
                                            disabled={true}
                                            required />

                                        <ErrorLine message={tBox.getFieldErrorMessage2('routingName', sl, formObject)} />
                                    </div>
                                    :
                                    <>
                                        <div>
                                            <InputLabel label={sl.l_new_routing_name} required={inputData.routingNameOption === "1"} />
                                            <div className="input-group">
                                                <div className="input-group-text">
                                                    <input className="form-check-input mt-0"
                                                        type="radio"
                                                        value="1"
                                                        name="routingNameOption"
                                                        onChange={change4Input}
                                                        checked={inputData.routingNameOption === "1"}
                                                    />
                                                </div>
                                                <input name="routingName"
                                                    type="text"
                                                    ref={ref4InputRoutingName}
                                                    className={`form-control ${tBox.getClass4IsInvalid2('routingName', formObject)}`}
                                                    placeholder={sl.p_new_routing_name}
                                                    value={inputData?.routingName || ""}
                                                    onChange={change4Input}
                                                    disabled={inputData.routingNameOption === "2"}
                                                    required={inputData.routingNameOption === "1"}
                                                />
                                            </div>
                                            <ErrorLine message={tBox.getFieldErrorMessage2('routingName', sl, formObject)} />
                                        </div>

                                        <div>
                                            <InputLabel label={sl.l_existing_routing_name} required={inputData.routingNameOption === "2"} />
                                            <div className="input-group">
                                                <div className="input-group-text">
                                                    <input className="form-check-input mt-0"
                                                        type="radio"
                                                        value="2"
                                                        name="routingNameOption"
                                                        onChange={change4Input}
                                                        checked={inputData.routingNameOption === "2"}
                                                    />
                                                </div>
                                                <select name="routingName2"
                                                    className={`form-select ${tBox.getClass4IsInvalid2('routingName2', formObject)}`}
                                                    disabled={inputData.routingNameOption === "1"}
                                                    required={inputData.routingNameOption === "2"}
                                                    value={inputData?.routingName2 || ""}
                                                    onChange={change4Input}>
                                                    <option value="" >{sl.p_existing_routing_name}</option>
                                                    {
                                                        connectorList?.map((record, index) => {
                                                            return (
                                                                <option key={index} value={record.name}>{record.name}</option>
                                                            )
                                                        })
                                                    }
                                                </select>
                                            </div>

                                            <ErrorLine message={tBox.getFieldErrorMessage2('routingName2', sl, formObject)} />
                                        </div>
                                    </>
                            }

                            <div >
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
                                    onChange={change4Input} />

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

                        </div>

                        <div className="d-flex justify-content-between align-items-center" role="button"
                            onClick={() => {
                                inputData.closeConnectorParameterFlag = !(inputData?.closeConnectorParameterFlag);
                                setRedraw((v) => v + 1);
                            }}>
                            <div className="fw-bold">
                                {sl.l_connector_parameter}
                            </div>
                            <div className="mx-3">
                                {
                                    (inputData?.closeConnectorParameterFlag) ?
                                        <span>
                                            <i className="fas fa-chevron-left fa-fw"></i>
                                        </span>
                                        :
                                        <span>
                                            <i className="fas fa-chevron-down fa-fw"></i>
                                        </span>
                                    // end for if close flag
                                }
                            </div>
                        </div>
                        {
                            (inputData?.closeConnectorParameterFlag) ? null :
                                <div className="my-3 px-3">

                                    <div>
                                        <InputLabel label={sl.l_connector_type} required={inputData.routingNameOption === "1"} />
                                        <input name="connector.type"
                                            type="text"
                                            className={`form-control ${tBox.getClass4IsInvalid2('connector.type', formObject)}`}
                                            placeholder={sl.p_connector_type}
                                            value={inputData?.connector?.type || ""}
                                            onChange={change4Input}
                                            list="datalist4ConnectorType"
                                            disabled={inputData.routingNameOption === "2"}
                                            required={inputData.routingNameOption === "1"} />

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

                                        <ErrorLine message={tBox.getFieldErrorMessage2('connector.type', sl, formObject)} />
                                    </div>

                                    <div>
                                        <InputLabel label={sl.l_connector_address} />
                                        <input name="connector.address"
                                            type="text"
                                            className={`form-control ${tBox.getClass4IsInvalid2('connector.address', formObject)}`}
                                            placeholder={sl.p_connector_address}
                                            value={inputData?.connector?.address || ""}
                                            disabled={inputData.routingNameOption === "2"}
                                            onChange={change4Input} />
                                        <ErrorLine message={tBox.getFieldErrorMessage2('connector.address', sl, formObject)} />
                                    </div>

                                    <div>
                                        <InputLabel label={sl.l_connector_port} />
                                        <input name="connector.port"
                                            type="text"
                                            className={`form-control ${tBox.getClass4IsInvalid2('connector.port', formObject)}`}
                                            placeholder={sl.p_connector_port}
                                            value={inputData?.connector?.port || ""}
                                            disabled={inputData.routingNameOption === "2"}
                                            onChange={change4Input} />
                                        <ErrorLine message={tBox.getFieldErrorMessage2('connector.port', sl, formObject)} />
                                    </div>

                                    <div>
                                        <InputLabel label={sl.l_connector_header} />
                                        <input name="connector.header"
                                            type="text"
                                            className={`form-control ${tBox.getClass4IsInvalid2('connector.header', formObject)}`}
                                            placeholder={sl.p_connector_header}
                                            value={inputData?.connector?.header || ""}
                                            disabled={inputData.routingNameOption === "2"}
                                            onChange={change4Input}
                                            list="datalist4ConnectorHeader" />

                                        <datalist id="datalist4ConnectorHeader">
                                            <option value="KSocketHeader"></option>
                                        </datalist>

                                        <ErrorLine message={tBox.getFieldErrorMessage2('connector.header', sl, formObject)} />
                                    </div>

                                    <div>
                                        <InputLabel label={sl.l_connector_header_len} />
                                        <input name="connector.header_len"
                                            type="text"
                                            className={`form-control ${tBox.getClass4IsInvalid2('connector.header_len', formObject)}`}
                                            placeholder={sl.p_connector_header_len}
                                            value={inputData?.connector?.header_len || ""}
                                            disabled={inputData.routingNameOption === "2"}
                                            onChange={change4Input}
                                            list="datalist4ConnectorHeaderLen" />

                                        <datalist id="datalist4ConnectorHeaderLen">
                                            <option value="2"></option>
                                            <option value="4"></option>
                                            <option value="8"></option>
                                        </datalist>

                                        <ErrorLine message={tBox.getFieldErrorMessage2('connector.header_len', sl, formObject)} />
                                    </div>

                                    <div>
                                        <InputLabel label={sl.l_connector_lock} />
                                        <input name="connector.lock"
                                            type="text"
                                            className={`form-control ${tBox.getClass4IsInvalid2('connector.lock', formObject)}`}
                                            placeholder={sl.p_connector_lock}
                                            value={inputData?.connector?.lock || ""}
                                            disabled={inputData.routingNameOption === "2"}
                                            onChange={change4Input}
                                            list="datalist4ConnectorLock" />

                                        <datalist id="datalist4ConnectorLock">
                                            <option value="mutex"></option>
                                        </datalist>

                                        <ErrorLine message={tBox.getFieldErrorMessage2('connector.lock', sl, formObject)} />
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
                                                                name={"connector.modeObject." + record.value}
                                                                checked={inputData?.connector?.modeObject?.[record.value] || ""}
                                                                disabled={inputData.routingNameOption === "2"}
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

                                </div>  // end of connector parameter
                        }

                    </div>  {/* end of edit panel */}

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