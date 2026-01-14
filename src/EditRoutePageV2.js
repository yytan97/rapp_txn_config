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

// parameter\
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

// export async function updateBINPrefixStatus(api, sessionToken, rowId, newStatus) {
//     const payload = {
//         recordStatus: newStatus
//     };

//     let result = await apiBox.updateRecordWithId(
//         sessionToken,
//         "kdb",
//         "kswitchroute",
//         rowId,
//         payload
//     );

//     return result;
// }

export function EditRoutePageV2({ debugMode = true }) {
    const componentName = "EditRoutePageV2";
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
    const [showLinkDrawer, setShowLinkDrawer] = react.useState(false);
    // const [institutionList, setInstitutionList] = react.useState([]);
    const [searchLinkName, setSearchLinkName] = react.useState("");
    // const [selectedInstitutionId, setSelectedInstitutionId] = react.useState("");
    const [selectedLinkName, setSelectedLinkName] = react.useState("");

    const ref4Form = react.useRef();
    const ref4InputRoutingName = react.useRef();

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

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);

        const sp = new URLSearchParams(location.search);
        rowId = sp.get('rowId');
        routingKey = sp.get('routingKey');
        routingName = sp.get('routingName');
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

    // react.useEffect(() => {
    //     if (step !== 3) return;

    //     const fetchInstitutions = async () => {
    //         try {
    //             let result = await apiBox.getRecord(
    //                 getSessionToken(),
    //                 "kdb",
    //                 "kswitchinstitution",
    //                 "recordStatus = 'A'"
    //             );

    //             if (result?.flag) {
    //                 const list = result.data.records
    //                     .map(item => item.recordData || item)
    //                     .filter(Boolean);

    //                 setInstitutionList(list);
    //             }
    //         } catch (err) {
    //             console.error("Error fetching institutions:", err);
    //         }
    //     };
    //     fetchInstitutions();
    // }, [step]);

    // const filteredInstitutions = institutionList
    //     .filter(item =>
    //         item.institutionId?.toLowerCase().includes(searchInstitution.toLowerCase())
    //     )
    //     .sort((a, b) =>
    //         (a.institutionId || "").localeCompare(b.institutionId || "", undefined, { sensitivity: "base" })
    // );

    const filteredConnectors = (connectorList || [])
        .filter(r => (r?.name || "").toLowerCase().includes((searchLinkName || "").toLowerCase()))
        .sort((a, b) => (a?.name || "").localeCompare(b?.name || "", undefined, { sensitivity: "base" })
    );

    console.log("filteredConnectors", filteredConnectors);
    
    // 👉 Navigation Handlers
    const goNext = () => {
        formObject.valid = ref4Form.current.checkValidity();

        if (formObject.valid) {
            setStep(prev => {
                const nextStep = prev + 1;

                setTimeout(() => {
                    formObject.valid = ref4Form.current.checkValidity();
                    setRedraw(v => v + 1); // trigger re-render for button state
                }, 0);

                return nextStep;
            })
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
            let filename = config?.connectorPath || "$KL_CFG_DIR/kconnector.cfg"
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

    // 👉 Render Stepper (only in Add mode)
    const renderStepper = () => {
        if (editMode !== 0) return null; // hide in Edit mode
        return (
            <div className="col-3 mr-24">
                <div className="stepper-background">
                    <div className="stepper-title">
                        {sl.l_create_timer}
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
                                <span className={`material-symbols-outlined ${step > 2 ? "completed" : "pending"}`} style={{fontSize: "19px"}}>
                                    {step > 2 ? "check_circle" : "adjust"}
                                </span>
                            </div>
                            <div className="step-vertical-content">
                                {sl.l_link}
                            </div>
                        </div>
                        <div className={`step-vertical ${step === 3 ? "active" : ""} d-flex`}>
                            <div className="step-vertical-icon">
                                <span className={`material-symbols-outlined ${step > 3 ? "completed" : "pending"}`} style={{fontSize: "19px"}}>
                                    {step > 3 ? "check_circle" : "adjust"}
                                </span>
                            </div>
                            <div className="step-vertical-content">
                                {sl.l_flag_type}
                            </div>
                        </div>
                        {/* <div className={`step-vertical ${step === 4 ? "active" : ""} d-flex`}>
                            <div className="step-vertical-icon">
                                <span className="material-symbols-outlined" style={{fontSize: "19px"}}>adjust</span>
                            </div>
                            <div className="step-vertical-content">
                                {sl.l_connection}
                            </div>
                        </div> */}
                        {/* <div className={`step-vertical ${step === 5 ? "active" : ""} d-flex`}>
                            <div className="step-vertical-icon">
                                <span className="material-symbols-outlined" style={{fontSize: "19px"}}>adjust</span>
                            </div>
                            <div className="step-vertical-content">
                                {sl.l_connection_mode}
                            </div>
                        </div> */}
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
                ${step === 1 ? "justify-content-center" : (editMode === 0 ? "justify-content-left" : "justify-content-center")}`}>
                {step !== 1 && renderStepper()}
                <div className="col-6" style={{ minHeight: "80vh" }}>
                    {step === 1 && (
                        <>
                            <div className="pb-3">
                                <div className="edit-title-font">
                                    {(editMode === 0) ? sl.l_new_route : sl.l_edit_timer}
                                </div>
                                <div className="edit-desc-font">
                                    {sl.l_new_route_desc}
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="my-3">
                                    {
                                        (editMode === 1) ? (
                                            <>
                                                <div>
                                                    <InputLabel label={sl.l_routing_id} />
                                                    <input name="routingId"
                                                        type="text"
                                                        className={`form-control ${tBox.getClass4IsInvalid2('routingId', formObject)}`}
                                                        placeholder={sl.p_routing_id}
                                                        value={inputData?.routingId || ""}
                                                        onChange={change4Input}
                                                        disabled={true} />

                                                    <ErrorLine message={tBox.getFieldErrorMessage2('routingId', sl, formObject)} />
                                                </div>
                                                <div>
                                                    <InputLabel label={sl.l_link_name} required />
                                                    <input name="routingName"
                                                        type="text"
                                                        className={`form-control ${tBox.getClass4IsInvalid2('routingName', formObject)}`}
                                                        placeholder={sl.p_enter_unique_link_name}
                                                        value={inputData?.routingName || ""}
                                                        onChange={change4Input}
                                                        disabled={editMode === 1}
                                                        required />

                                                    <ErrorLine message={tBox.getFieldErrorMessage2('routingName', sl, formObject)} />
                                                </div>
                                                <div>
                                                    <InputLabel label={sl.l_status} required />
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
                                                <div>
                                                    <InputLabel label={sl.l_link_order} required />
                                                    <input name="routingOrder"
                                                        type="text"
                                                        className={`form-control ${tBox.getClass4IsInvalid2('routingOrder', formObject)}`}
                                                        placeholder={sl.p_enter_link_order_number}
                                                        value={inputData?.routingOrder || ""}
                                                        onChange={change4Input}
                                                        required />

                                                    <ErrorLine message={tBox.getFieldErrorMessage2('routingOrder', sl, formObject)} />
                                                </div>
                                                <div>
                                                    <InputLabel label={sl.l_link_type} required />
                                                    <input name="linkType"
                                                        type="text"
                                                        className={`form-control ${tBox.getClass4IsInvalid2('linkType', formObject)}`}
                                                        placeholder={sl.p_enter_link_type}
                                                        value={inputData?.linkType || ""}
                                                        onChange={change4Input}
                                                        required />

                                                    <ErrorLine message={tBox.getFieldErrorMessage2('linkType', sl, formObject)} />
                                                </div>
                                            </>
                                        ) : (
                                            <div>
                                                <InputLabel label={sl.l_new_routing_id} required />
                                                <input name="institutionId"
                                                    type="text"
                                                    className={`form-control ${tBox.getClass4IsInvalid2('institutionId', formObject)}`}
                                                    placeholder={sl.p_routing_visa}
                                                    value={inputData?.institutionId || ""}
                                                    onChange={change4Input}
                                                    disabled={editMode === 1}
                                                    required />

                                                <ErrorLine message={tBox.getFieldErrorMessage2('institutionId', sl, formObject)} />
                                            </div>
                                        )
                                    }

                                    <div className="mt-4">
                                        {editMode === 0 ? (
                                                <div className="mt-4 d-flex justify-content-between" style={{paddingTop: "450px"}}>
                                                    <button type="button" className="btn btn-outline-dark btn-width-100 mr-8" onClick={goNext}>
                                                        {sl.b_next_advance}
                                                    </button>
                                                    <button className="btn btn-primary btn-width-100"
                                                    type="button"
                                                    onClick={click4AddRecord}
                                                    disabled={!formObject?.valid || !formObject?.dirty}>
                                                        {sl.b_create_now}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button type="button" className="col-7 btn btn-primary" onClick={click4UpdateRecord} style={{width: "100%"}}>
                                                    {sl.b_save}
                                                </button>
                                            )
                                        }
                                    </div>
                                </div>  
                                {/* end of field inner panel */}
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className="pb-3">
                                <div className="edit-title-font">
                                    {sl.l_new_link_type}
                                </div>
                                <div className="edit-desc-font">
                                    {sl.l_new_route_desc}
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="d-flex justify-content-between mb-4">
                                    <div className="d-flex justify-content-between mb-4">
                                        {[
                                            { key: "1", label: sl.l_new_link, descKey: "new_link" },
                                            { key: "2", label: sl.l_existing_link, descKey: "existing_link" }
                                        ].map((item, index) => (
                                            <label
                                            key={index}
                                            htmlFor={"linkType" + item.key}
                                            className={`link_type_box mr-24 text-center p-4 
                                                ${inputData?.routingNameOption === item.key ? "active" : ""}`}
                                            >
                                            <input
                                                className="form-check-input d-none"
                                                type="radio"
                                                id={"linkType" + item.key}
                                                name="routingNameOption"
                                                value={item.key}
                                                checked={inputData?.routingNameOption === item.key}
                                                onChange={change4Input}
                                            />
                                            {/* <div className="radio-circle mb-3">
                                                {inputData?.routingNameOption === item.key && (
                                                <div className="radio-dot"></div>
                                                )}
                                            </div> */}
                                            <div className="tick-box mb-3">
                                                {inputData?.routingNameOption === item.key && <span className="tick">✔</span>}
                                            </div>
                                            <div className="saf_option_title mb-2">
                                                {item.label}
                                            </div>
                                            <div className="saf_option_desc">
                                                {tBox.getLabel(sl, item.descKey, "o_link_type_")}
                                            </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {(inputData?.routingNameOption === "1" || inputData?.routingNameOption === "2") && (
                                    <>
                                        <div>
                                            <InputLabel label={inputData.routingNameOption === "2" ? sl.l_link_name : sl.l_new_link_name} required />
                                            <input name="routingName2"
                                                type="text"
                                                className={`form-control ${tBox.getClass4IsInvalid2('routingName2', formObject)}`}
                                                placeholder={sl.p_enter_unique_link_name}
                                                value={inputData?.routingName2 || ""}
                                                onChange={change4Input}
                                                readOnly={inputData?.routingNameOption === "2"}
                                                onClick={() => {
                                                    if (inputData?.routingNameOption === "2") {
                                                        setShowLinkDrawer(true);   // open drawer
                                                    }
                                                }}
                                                // disabled={editMode === 1}
                                                required />

                                            <ErrorLine message={tBox.getFieldErrorMessage2('routingName2', sl, formObject)} />
                                        </div>
                                        <div>
                                            <InputLabel label={sl.l_link_order} required />
                                            <input name="linkOrder"
                                                type="text"
                                                className={`form-control ${tBox.getClass4IsInvalid2('linkOrder', formObject)}`}
                                                placeholder={sl.p_enter_link_order_number}
                                                value={inputData?.linkOrder || ""}
                                                onChange={change4Input}
                                                disabled={editMode === 1}
                                                required />

                                            <ErrorLine message={tBox.getFieldErrorMessage2('linkOrder', sl, formObject)} />
                                        </div>
                                        <div>
                                            <InputLabel label={sl.l_link_type} required />
                                            <input name="linkType"
                                                type="text"
                                                className={`form-control ${tBox.getClass4IsInvalid2('linkType', formObject)}`}
                                                placeholder={sl.p_enter_link_type}
                                                value={inputData?.linkType || ""}
                                                onChange={change4Input}
                                                disabled={editMode === 1}
                                                required />

                                            <ErrorLine message={tBox.getFieldErrorMessage2('linkType', sl, formObject)} />
                                        </div>
                                    </>
                                    
                                    
                                )}
                                
                                {editMode === 0 ? (
                                    <div className="mt-4 d-flex justify-content-between" style={{paddingTop: "50px"}}>
                                        <button type="button" className="btn btn-outline-dark" onClick={goBack}>
                                            {sl.b_back}
                                        </button>
                                        <button className="btn btn-primary"
                                        type="button"
                                        onClick={goNext}
                                        disabled={!formObject?.valid || !formObject?.dirty}>
                                            {sl.b_next}
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

                                {/* Drawer */}
                                {showLinkDrawer && (
                                    <div className="drawer-overlay" onClick={() => setShowLinkDrawer(false)}>
                                        <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
                                            <div className="drawer-title">
                                                {sl.l_existing_link_name}
                                            </div>
                                            <div className="drawer-description pb-16">
                                                {sl.l_select_existing_connector}
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
                                                        value={searchLinkName}
                                                        onChange={(e) => setSearchLinkName(e.target.value)}
                                                        style={{ backgroundColor: "#F3F3F4", fontSize: "14px" }} />
                                                </div>
                                            </div>
                                            <hr />

                                            {/* Link list */}
                                            <div className="institution-list">
                                                {filteredConnectors.map((item, idx) => (
                                                    <div key={idx} className="form-check">
                                                        <input
                                                            type="radio"
                                                            id={`inst-${idx}`}
                                                            name="institution"
                                                            className="form-check-input"
                                                            checked={selectedLinkName === item.name}
                                                            onChange={() => {
                                                                // setSelectedInstitutionId(item.rowId);
                                                                setSelectedLinkName(item.name);
                                                            }}
                                                        />
                                                        <label className="form-check-label" htmlFor={`inst-${idx}`}>
                                                            {item.name}
                                                        </label>
                                                    </div>
                                                ))}

                                                {filteredConnectors.length === 0 && (
                                                    <div className="text-muted">
                                                        {sl.l_no_result_found}
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                className="btn btn-primary mb-16"
                                                disabled={!selectedLinkName}
                                                onClick={() => {
                                                    inputData.routingName2 = selectedLinkName;
                                                    formObject.dirty = true;
                                                    formObject.valid = true;
                                                    setShowLinkDrawer(false);
                                                    setRedraw(v => v + 1);
                                                    }} >
                                                        {sl.b_apply}
                                            </button>
                                            <button
                                                className="btn btn-ghost-unity"
                                                onClick={() => setShowLinkDrawer(false)}>
                                                    {sl.b_cancel}
                                            </button>
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
                                    {sl.l_routing_flags}
                                </div>
                                <div className="edit-desc-font">
                                    {sl.l_addr_identify_acc}
                                </div>
                            </div>

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
                                                <label className="form-check-label pb-16" htmlFor={"routingFlag" + record.flagValue}>
                                                    <div className="saf_option_title">
                                                        {tBox.getLabel(sl, record.flagValue, "o_routing_flag_title_")}
                                                    </div>
                                                    <div className="saf_option_desc">
                                                        {tBox.getLabel(sl, record.flagValue, "o_routing_flag_") || record.flagDescription} 
                                                    </div>
                                                </label>
                                            </div>
                                        );
                                    })
                                }
                            </div>

                            {editMode === 0 ? (
                                <>
                                    <button type="button" className="btn btn-outline-dark" onClick={goBack}>
                                        {sl.b_back}
                                    </button>
                                    <button type="button" className="btn btn-primary" onClick={click4AddRecord} disabled={!formObject?.valid || !formObject?.dirty}>
                                        {sl.b_create_route}
                                    </button>
                                </>
                                ) : (
                                    <div className="mt-4">
                                        <button type="button" className="col-7 btn btn-primary" onClick={click4UpdateRecord} style={{width: "100%"}}>
                                            {sl.b_save}
                                        </button>
                                    </div>
                                )
                            }

                            {/* {showAttachModal && (
                                <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
                                    <div className="modal-dialog modal-dialog-centered" role="document">
                                        <div className="modal-content border-0 shadow rounded-3" style={{padding: "24px 32px"}}>
                                            <div className="modal-body p-0">
                                                <div className="d-flex align-items-center mb-3">
                                                    <span className="material-icons text-primary me-2" style={{ width: "24px", height: "24px" }}>info</span>
                                                    <div className="fw-bold mb-0 fs-unity-18">{sl.l_attach_institution}</div>
                                                </div>
                                                <p>
                                                    {sl.l_your} <strong>{inputData?.institutionId}</strong> {sl.l_has_been_saved} 🎉
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
                            )} */}
                        </>
                    )}
                </div>
            </form>

            <DumpPanel dataList={[
                { name: "inputData", data: inputData },
                { name: "formObject", data: formObject },
                { name: "sl", data: sl },
            ]} debugMode={debugMode} />
        </div >
    );
}