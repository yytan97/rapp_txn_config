
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

import { showInputTimerIdDialogBox, InputTimerIdDialogBox } from "./InputTimerIdDialogBox.js";
import { showInputCryptoIdDialogBox, InputCryptoIdDialogBox } from "./InputCryptoIdDialogBox.js";
import { showInputRoutingIdDialogBox, InputRoutingIdDialogBox } from "./InputRoutingIdDialogBox.js";
import { showInputRoutingRecordDialogBox, InputRoutingRecordDialogBox } from "./InputRoutingRecordDialogBox.js";

// Map loaded lib here ...
const uuidv4 = window.uuidv4;
const moment = window.moment;
const bootstrap = window.bootstrap;

let tableName = "kswitchinstitution";
let databaseName = "kdb";

const accessObjectName = "webapp_configuration_access";
const accessActionPrefix = "institution_managment";

let dataRecord = undefined;

// parameter
let institutionId = undefined;
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

let routingRecordList = [];
let timerRecordList = [];
let cryptoRecordList = [];

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

export function EditInstitutionPageV2({ debugMode = true }) {
    const componentName = "EditInstitutionPage";
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

    const [step, setStep] = react.useState(1);

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);

        const sp = new URLSearchParams(location.search);
        institutionId = sp.get('id');
        editMode = parseInt(sp.get('editMode')) || 0;

        console.log("Institution ID", institutionId);
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
    const goNext2 = () => {
        formObject.valid = ref4Form.current.checkValidity();

        if (formObject.valid) {
            setStep(3);

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
            let result1 = await apiBox.getRecord(getSessionToken(), databaseName, "kswitchinstitution_timers");
            if (result1.flag) {
                let list1 = result1.data.records;
                timerRecordList = list1;
            }

            let result2 = await apiBox.getRecord(getSessionToken(), databaseName, "kswitchcryptograms");
            if (result2.flag) {
                let list2 = result2.data.records;
                cryptoRecordList = list2;
            }

            let result3 = await apiBox.getRecord(getSessionToken(), databaseName, "kswitchroute");
            if (result3.flag) {
                let list3 = result3.data.records;
                routingRecordList = list3;
            }

            if (editMode === 1) {

                let result4 = await apiBox.getRecord(getSessionToken(), databaseName, tableName, `institutionId = '${institutionId}'`);

                if (result4.flag) {
                    let list1 = result4.data.records;

                    list1 = list1.map((record) => {
                        if (record.institutionProcessingFlags & 0x01) record.processingFlag1 = true;
                        if (record.institutionProcessingFlags & 0x02) record.processingFlag2 = true;
                        if (record.institutionProcessingFlags & 0x04) record.processingFlag3 = true;
                        if (record.institutionProcessingFlags & 0x08) record.processingFlag4 = true;
                        if (record.institutionProcessingFlags & 0x10) record.processingFlag5 = true;

                        if (record.institutionShutdownFlags.search("L") >= 0) record.shutdownFlag1 = true;
                        if (record.institutionShutdownFlags.search("T") >= 0) record.shutdownFlag2 = true;
                        if (record.institutionShutdownFlags.search("S") >= 0) record.shutdownFlag3 = true;

                        if (record.institutionAuthFlags.search("A") >= 0) record.authorizationFlag1 = true;
                        if (record.institutionAuthFlags.search("P") >= 0) record.authorizationFlag2 = true;
                        if (record.institutionAuthFlags.search("N") >= 0) record.authorizationFlag3 = true;

                        if (record.institutionRoutingId) {
                            if (record.institutionId == record.institutionRoutingId) record.institutionRoutingIdOption = "2";
                            else record.institutionRoutingIdOption = "3";

                            if (routingRecordList.find(element => element.routingKey == record.institutionRoutingId))
                                record.institutionRoutingIdOption = "4";
                        }
                        else record.institutionRoutingIdOption = "1";

                        if (record.institutionCryptoId) {
                            if (record.institutionId == record.institutionCryptoId) record.institutionCryptoIdOption = "2";
                            else record.institutionCryptoIdOption = "3";

                            if (cryptoRecordList.find(element => element.ownerId == record.institutionCryptoId))
                                record.institutionCryptoIdOption = "4";
                        }
                        else record.institutionCryptoIdOption = "1";

                        if (record.institutionTimerId) {
                            if (record.institutionId == record.institutionTimerId) record.institutionTimerIdOption = "2";
                            else record.institutionTimerIdOption = "3";

                            if (timerRecordList.find(element => element.institutionId == record.institutionTimerId))
                                record.institutionTimerIdOption = "4";
                        }
                        else record.institutionTimerIdOption = "1";

                        return record
                    });


                    dataRecord = list1[0];
                    console.log("Record", dataRecord);
                    inputData = dataRecord;
                }
                else throw (result4);
            } else {
                dataRecord = {
                    recordStatus: 'A',
                    institutionStatus: '1',
                    processingCodeList: [
                        "00", "01", "02", "09",
                        "10", "11", "17", "18",
                        "20", "21", "22", "23", "24", "26", "28",
                        "30", "34", "39",
                        "40",
                        "50", "53",
                        "70", "72",
                        "90", "91", "92",
                    ],
                    shutdownFlag1: true,
                    shutdownFlag2: true,
                    shutdownFlag3: true,
                    authorizationFlag2: true,
                    institutionSafInterleavePolicy: "standin",
                    institutionSafMaxConcurrent: "0",
                    institutionSafMaxTimeout: "0",
                    institutionSafRetry: "0",
                    institutionConsecutiveTimeoutCount: "0",
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
        if (debugMode) console.log("Form", ref4Form.current.checkValidity());

        formObject.dirty = true;
        formObject.valid = ref4Form.current.checkValidity();
        let obj = tBox.buildFormFieldState(ref4Form.current);
        formObject.fieldState = obj;

        // add custom validation
        let name = e.target.name;
        let input = e.target;
        let value = e.target.value;

        if (name.startsWith('processingFlag')) {
            inputData[name] = input.checked;
        }
        else if (name.startsWith('shutdownFlag')) {
            inputData[name] = input.checked;
        }
        else if (name.startsWith('authorizationFlag')) {
            inputData[name] = input.checked;
        }
        else inputData[name] = value;

        if (debugMode) console.log("Input data", inputData);

        if (name === "institutionId") {
            if (debugMode) console.log("Change for institution ID");

            if (inputData.institutionRoutingIdOption == 2)
                inputData.institutionRoutingId = inputData.institutionId;

            if (inputData.institutionCryptoIdOption == 2)
                inputData.institutionCryptoId = inputData.institutionId;

            if (inputData.institutionTimerIdOption == 2)
                inputData.institutionTimerId = inputData.institutionId;
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
        message = message.replace("__parameter_1", inputData.institutionId);
        showConfirmDialogBox(message, async function () {
            showStateDialogBox();
            try {
                // await tBox.sleep(1000 * 1);

                let result1 = await addInstitutionRecord();
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

    async function addInstitutionRecord() {
        try {
            let record1 = {
                institutionId: inputData.institutionId,
                institutionStatus: inputData.institutionStatus,
                institutionRecordType: inputData.institutionRecordType,
                institutionOwner: inputData.institutionOwner,
                institutionParent: inputData.institutionParent,
                institutionTimerId: inputData.institutionTimerId,
                institutionCryptoId: inputData.institutionCryptoId,
                institutionProcessingFlags: buildProcessingFlag(inputData),
                institutionShutdownFlags: buildShutdownFlag(inputData),
                institutionAuthFlags: buildAuthFlag(inputData),
                institutionCardProduct: inputData.institutionCardProduct,
                institutionRoutingId: inputData.institutionRoutingId,
                recordStatus: 'A',
                institutionSafInterleavePolicy: inputData.institutionSafInterleavePolicy,
                institutionSafMaxConcurrent: inputData.institutionSafMaxConcurrent,
                institutionSafMaxTimeout: inputData.institutionSafMaxTimeout,
                institutionSafRetry: inputData.institutionSafRetry,
                institutionConsecutiveTimeoutCount: inputData.institutionConsecutiveTimeoutCount,
            };

            let result1 = await apiBox.addRecord(getSessionToken(), databaseName, tableName, record1);
            if (result1.flag === false) throw result1;

            // add processing code
            let list = inputData?.processingCodeList || [];
            for (let n = 0; n < list.length; n++) {
                let record2 = {
                    institutionId: inputData.institutionId,
                    institutionPcode: list[n],
                    recordStatus: "A"
                };

                let result2 = await apiBox.addRecord(getSessionToken(), databaseName, "kswitchinstitution_txn", record2);
                console.log("Result 2", result2)
            }

            // add to route table
            list = inputData.routingList || [];
            for (let n = 0; n < list.length; n++) {
                let record3 = {
                    routingKey: inputData.institutionRoutingId,
                    routingName: list[n].routingName,
                    routingOrder: list[n].routingOrder,
                    linkType: list[n].linkType,
                    routingFlags: list[n].routingFlags,
                    recordStatus: "A"
                };

                let result3 = await apiBox.addRecord(getSessionToken(), databaseName, "kswitchinstitution_txn", record3);
                console.log("Result 3", result3)
            }

            // append connector to cfg file
            let a = [];
            let appendString = "";
            for (let n = 0; n < list.length; n++) {
                let s = buildConnectorParameter(list[n]);
                appendString += s;
            }

            // let filename = "$KSHARE_DIR/klib/config/kconnector.cfg";
            let filename = config?.connectorPath || "$KL_CFG_DIR/kconnector.cfg";

            if (appendString.length > 0) {
                let result4 = await apiBox.readConfigurationFile(getSessionToken(), filename);

                let dt = new Date();
                let dataContent = "";
                if (result4.flag) {
                    dataContent = result4?.data?.files?.[0]?.content;
                    console.log("Data content", dataContent);

                    dataContent += "\n### Added " + dt.toISOString() + "\n" + appendString + "\n";
                    let result5 = await apiBox.writeConfigurationFile(getSessionToken(), filename, dataContent);
                    console.log("Result 5", result5);
                }

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
        message = message.replace("__parameter_1", inputData.institutionId);
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
            let record1 = {
                institutionStatus: inputData.institutionStatus,
                institutionRecordType: inputData.institutionRecordType,
                institutionOwner: inputData.institutionOwner,
                institutionParent: inputData.institutionParent,
                institutionTimerId: inputData.institutionTimerId,
                institutionCryptoId: inputData.institutionCryptoId,
                institutionProcessingFlags: buildProcessingFlag(inputData),
                institutionShutdownFlags: buildShutdownFlag(inputData),
                institutionAuthFlags: buildAuthFlag(inputData),
                institutionCardProduct: inputData.institutionCardProduct,
                institutionRoutingId: inputData.institutionRoutingId,
                recordStatus: inputData.recordStatus,
                institutionSafInterleavePolicy: inputData.institutionSafInterleavePolicy,
                institutionSafMaxConcurrent: inputData.institutionSafMaxConcurrent,
                institutionSafMaxTimeout: inputData.institutionSafMaxTimeout,
                institutionSafRetry: inputData.institutionSafRetry,
                institutionConsecutiveTimeoutCount: inputData.institutionConsecutiveTimeoutCount,
            };

            let result1 = await apiBox.updateRecordWithId(getSessionToken(), databaseName, tableName, inputData.rowId, record1);

            if (result1.flag === false) throw result1;

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

    function click4RemoveProcessingCode(code, index) {
        if (debugMode) console.log("Click for remove processing code", code, index);
        let list = inputData.processingCodeList;

        list.splice(index, 1);
        setRedraw((v) => v + 1);
        return;
    };

    function click4AddProcessingCode() {
        if (debugMode) console.log("Click for add processing code ");

        let s = inputData.processingCodeString;
        if (s == undefined) return;
        if (s == "") return;

        let code = s.substr(0, 2);
        if (inputData.processingCodeList == undefined) inputData.processingCodeList = [];

        let list = inputData.processingCodeList;
        if (list.indexOf(code) < 0) {
            list.push(code);
            inputData.processingCodeList = list.sort();
            inputData.processingCodeString = "";
        }
        else {
            let message = sl.m_record_already_exist;
            showInfoDialogBox(message);
        }
        setRedraw((v) => v + 1);
        return;
    };

    function focus4InstitutionTimerId(e) {
        if (debugMode) console.log("Focus for institution timer id", e);

        let data = {
            optionValue: inputData.institutionTimerIdOption || "1",
            timerId: inputData.institutionTimerId,
        };

        showInputTimerIdDialogBox(data, (data) => {
            if (debugMode) console.log("Callback", data);
            formObject.dirty = true;

            if (data.optionValue == '1')
                inputData.institutionTimerId = undefined;
            else if (data.optionValue == '2')
                inputData.institutionTimerId = inputData.institutionId;
            else if (data.optionValue == '3')
                inputData.institutionTimerId = data.timerId3;
            else if (data.optionValue == '4')
                inputData.institutionTimerId = data.timerId4;
            inputData.institutionTimerIdOption = data.optionValue;
            setRedraw((v) => v + 1);
        });
    };

    function focus4InstitutionCryptoId(e) {
        if (debugMode) console.log("Focus for institution crypto id", e);

        let data = {
            optionValue: inputData.institutionCryptoIdOption || "1",
            cryptoId: inputData.institutionCryptoId,
        };

        showInputCryptoIdDialogBox(data, (data) => {
            if (debugMode) console.log("Callback", data);
            formObject.dirty = true;

            if (data.optionValue == '1')
                inputData.institutionCryptoId = undefined;
            else if (data.optionValue == '2')
                inputData.institutionCryptoId = inputData.institutionId;
            else if (data.optionValue == '3')
                inputData.institutionCryptoId = data.cryptoId3;
            else if (data.optionValue == '4')
                inputData.institutionCryptoId = data.cryptoId4;
            inputData.institutionCryptoIdOption = data.optionValue;
            setRedraw((v) => v + 1);
        });
    };

    function focus4InstitutionRoutingId(e) {
        if (debugMode) console.log("Focus for institution routing id", e);

        let data = {
            optionValue: inputData.institutionRoutingIdOption || "1",
            routingId: inputData.institutionRoutingId,
        };

        showInputRoutingIdDialogBox(data, (data) => {
            if (debugMode) console.log("Callback", data);
            formObject.dirty = true;

            if (data.optionValue == '1')
                inputData.institutionRoutingId = undefined;
            else if (data.optionValue == '2')
                inputData.institutionRoutingId = inputData.institutionId;
            else if (data.optionValue == '3')
                inputData.institutionRoutingId = data.routingId3;
            else if (data.optionValue == '4')
                inputData.institutionRoutingId = data.routingId4;
            inputData.institutionRoutingIdOption = data.optionValue;
            setRedraw((v) => v + 1);
        });
    };

    function click4AddRoutingRecord() {
        if (debugMode) console.log("Click for add routing record");
        let data = {
            mode: 0,
            routingOrder: 1,
        };
        showInputRoutingRecordDialogBox(data, inputData?.routingList, callback4EditRoutingRecord);
    };

    function click4RemoveRoutingRecord(record, index) {
        if (debugMode) console.log("Click for remove routing record");


        let message = sl.m_confirm_delete_record;
        message = message.replace(/__parameter_1/, record.routingName);
        showConfirmDialogBox(message, function () {
            inputData.routingList.splice(index, 1);
            // update page ui
            setRedraw((v) => v + 1);
        });
        return;
    };

    function click4RoutingRecord(record, index) {
        if (debugMode) console.log("Click for routing record");
        let data = JSON.parse(JSON.stringify(record));

        data.mode = 1;
        data.index = index;
        showInputRoutingRecordDialogBox(data, inputData?.routingList, callback4EditRoutingRecord);
    };

    function callback4EditRoutingRecord(data) {
        if (debugMode) console.log("Callback for edit routing record", data);
        formObject.dirty = true;

        data.routingFlags = buildRoutingFlags(data);
        data.connectorMode = buildConnectorMode(data);
        if (data.mode === 1) {
            // edit mode
            inputData.routingList[data.index] = data;
        }
        else {
            // add mode
            if (inputData.routingList === undefined) inputData.routingList = [];
            inputData.routingList.push(data);
        }
        // update page ui
        setRedraw((v) => v + 1);
    };

    function buildConnectorParameter(record) {
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
        let obj = record.connectorModeObject;
        let s = "";

        for (let name in obj) {
            if (obj?.[name])
                s += name + " ";
        }

        return s.trim().toLocaleLowerCase();
    };

    function buildProcessingFlag(record) {
        let n = 0;

        if (record.processingFlag1) n += 0x01;
        if (record.processingFlag2) n += 0x02;
        if (record.processingFlag3) n += 0x04;
        if (record.processingFlag4) n += 0x08;
        if (record.processingFlag5) n += 0x10;

        return n;
    };

    function buildShutdownFlag(record) {
        let s = "";

        if (record.shutdownFlag1) s += "L";
        if (record.shutdownFlag2) s += "T";
        if (record.shutdownFlag3) s += "S";
        return s;
    };

    function buildAuthFlag(record) {
        let s = "";

        if (record.authorizationFlag1) s += "A";
        if (record.authorizationFlag2) s += "P";
        if (record.authorizationFlag3) s += "N";
        return s;
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
                        {sl.l_create_institution}
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
                                {sl.l_additional_info}
                            </div>
                        </div>
                        <div className={`step-vertical ${step === 3 ? "active" : ""} d-flex`}>
                            <div className="step-vertical-icon">
                                <span className="material-symbols-outlined" style={{fontSize: "19px"}}>adjust</span>
                            </div>
                            <div className="step-vertical-content">
                                {sl.l_processing}
                            </div>
                        </div>
                        <div className={`step-vertical ${step === 4 ? "active" : ""} d-flex`}>
                            <div className="step-vertical-icon">
                                <span className="material-symbols-outlined" style={{fontSize: "19px"}}>adjust</span>
                            </div>
                            <div className="step-vertical-content">
                                {sl.l_store_forward}
                            </div>
                        </div>
                        <div className={`step-vertical ${step === 5 ? "active" : ""} d-flex`}>
                            <div className="step-vertical-icon">
                                <span className="material-symbols-outlined" style={{fontSize: "19px"}}>adjust</span>
                            </div>
                            <div className="step-vertical-content">
                                {sl.l_timer}
                            </div>
                        </div>
                        <div className={`step-vertical ${step === 6 ? "active" : ""} d-flex`}>
                            <div className="step-vertical-icon">
                                <span className="material-symbols-outlined" style={{fontSize: "19px"}}>adjust</span>
                            </div>
                            <div className="step-vertical-content">
                                {sl.l_cryptogram}
                            </div>
                        </div>
                        <div className={`step-vertical ${step === 7 ? "active" : ""} d-flex`}>
                            <div className="step-vertical-icon">
                                <span className="material-symbols-outlined" style={{fontSize: "19px"}}>adjust</span>
                            </div>
                            <div className="step-vertical-content">
                                {sl.l_routing}
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
                ${editMode === 0 ? "justify-content-left" : "justify-content-center"}`}>
                {renderStepper()}
                <div className="col-8" style={{ minHeight: "50vh" }}>
                    {step === 1 && (
                        <>
                            <div className="pb-3">
                                <div className="edit-title-font">
                                    {(editMode === 0) ? sl.l_new_institution : sl.l_edit_institution}
                                </div>
                                <div className="edit-desc-font">
                                    {sl.l_desc}
                                </div>
                            </div>
                            <div className="px-4 mt-4">
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

                                <div>
                                    <InputLabel label={sl.l_institution_type} />
                                    <input name="institutionRecordType"
                                        type="text"
                                        className={`form-control ${tBox.getClass4IsInvalid2('institutionRecordType', formObject)}`}
                                        placeholder={sl.p_enter_institution}
                                        value={inputData?.institutionRecordType || ""}
                                        onChange={change4Input}
                                        list="datalist4InstitutionRecordType" />

                                    <datalist id="datalist4InstitutionRecordType">
                                        <option value="FI"></option>
                                        <option value="Branch"></option>
                                        <option value="Product"></option>
                                        <option value="Network"></option>
                                    </datalist>

                                    <ErrorLine message={tBox.getFieldErrorMessage2('institutionRecordType', sl, formObject)} />
                                </div>

                                {/* === Toggle Switch === */}
                                {/* <div>
                                    <InputLabel label={sl.l_owner_of_institution} />
                                    <div className="d-flex align-items-center justify-content-between bg-white px-3 py-2 rounded-3 border">
                                        <div className="text-secondary" style={{ fontSize: "14px" }}>
                                            Assign as Institution Owner
                                        </div>
                                        
                                        <label className="unity-switch">
                                            <input
                                                type="checkbox"
                                                name="isOwner"
                                                checked={!!inputData?.isOwner}
                                                onChange={change4Input}
                                            />
                                            <span className="unity-slider round"></span>
                                        </label>
                                        
                                    </div>
                                </div> */}

                                <div>
                                    <InputLabel label={sl.l_institution_parent} />
                                    <input name="institutionParent"
                                        type="text"
                                        className={`form-control ${tBox.getClass4IsInvalid2('institutionParent', formObject)}`}
                                        placeholder={sl.p_institution_parent}
                                        value={inputData?.institutionParent || ""}
                                        onChange={change4Input} />

                                    <ErrorLine message={tBox.getFieldErrorMessage2('institutionParent', sl, formObject)} />
                                </div>

                                <div className="mt-4 d-flex justify-content-between" style={{paddingTop: "250px"}}>
                                    <button type="button" className="btn btn-outline-dark" onClick={goNext}>
                                        {sl.b_next_advance}
                                    </button>
                                    <button className="btn btn-primary"
                                    type="button"
                                    onClick={click4AddRecord}
                                    disabled={!formObject?.valid || !formObject?.dirty}>
                                        {sl.b_create_now}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className="pb-3">
                                <div className="edit-title-font">
                                    {(editMode === 0) ? sl.l_additional_info : sl.l_edit_institution}
                                </div>
                                <div className="edit-desc-font">
                                    {sl.l_configure_addtional}
                                </div>
                            </div>

                            <div className="px-4 mt-4">
                                <div>
                                    <InputLabel label={sl.l_product_code} />
                                    <input name="institutionCardProduct"
                                        type="text"
                                        className={`form-control ${tBox.getClass4IsInvalid2('institutionCardProduct', formObject)}`}
                                        placeholder="e.g., 1010 for credit card"
                                        value={inputData?.institutionCardProduct || ""}
                                        onChange={change4Input}/>

                                    <ErrorLine message={tBox.getFieldErrorMessage2('institutionCardProduct', sl, formObject)} />
                                </div>

                                <div>
                                    <InputLabel label={sl.l_network_product_category} />
                                    <input name="institutionNetworkProductCatagory"
                                        type="text"
                                        className={`form-control ${tBox.getClass4IsInvalid2('institutionNetworkProductCatagory', formObject)}`}
                                        placeholder={sl.p_enter_product_cat}
                                        value={inputData?.institutionNetworkProductCatagory || ""}
                                        onChange={change4Input}/>

                                    <ErrorLine message={tBox.getFieldErrorMessage2('institutionNetworkProductCatagory', sl, formObject)} />
                                </div>

                                <div>
                                    <InputLabel label={sl.l_card_network} />
                                    <input name="institutionCardNetwork"
                                        type="text"
                                        className={`form-control ${tBox.getClass4IsInvalid2('institutionCardNetwork', formObject)}`}
                                        placeholder={sl.p_enter_card_network}
                                        value={inputData?.institutionCardNetwork || ""}
                                        onChange={change4Input}/>

                                    <ErrorLine message={tBox.getFieldErrorMessage2('institutionCardNetwork', sl, formObject)} />
                                </div>

                                <div>
                                    <InputLabel label={sl.l_currency_code} />
                                    <input name="institutionCurrencyCode"
                                        type="text"
                                        className={`form-control ${tBox.getClass4IsInvalid2('institutionCurrencyCode', formObject)}`}
                                        placeholder={sl.p_enter_currency_code}
                                        value={inputData?.institutionCurrencyCode || ""}
                                        onChange={change4Input}/>
                                        <span className="default-font">
                                            {sl.l_note_numeric}
                                        </span>

                                    <ErrorLine message={tBox.getFieldErrorMessage2('institutionCurrencyCode', sl, formObject)} />
                                </div>

                                <div>
                                    <InputLabel label={sl.l_country_code} />
                                    <input name="institutionCountryCode"
                                        type="text"
                                        className={`form-control ${tBox.getClass4IsInvalid2('institutionCountryCode', formObject)}`}
                                        placeholder={sl.p_enter_country_code}
                                        value={inputData?.institutionCountryCode || ""}
                                        onChange={change4Input}/>
                                        <span className="default-font">
                                            {sl.l_note_numeric}
                                        </span>

                                    <ErrorLine message={tBox.getFieldErrorMessage2('institutionCountryCode', sl, formObject)} />
                                </div>

                                <div>
                                    <InputLabel label={sl.l_operating_region} />
                                    <input name="institutionOperatingRegion"
                                        type="text"
                                        className={`form-control ${tBox.getClass4IsInvalid2('institutionOperatingRegion', formObject)}`}
                                        placeholder="e.g., Southeast Asia"
                                        value={inputData?.institutionOperatingRegion || ""}
                                        onChange={change4Input}/>

                                    <ErrorLine message={tBox.getFieldErrorMessage2('institutionOperatingRegion', sl, formObject)} />
                                </div>

                                <div className="mt-4 d-flex justify-content-between" style={{paddingTop: "0px"}}>
                                    <button type="button" className="btn btn-outline-dark" onClick={goBack}>
                                        {sl.b_back}
                                    </button>
                                    <button type="button" className="btn btn-primary" onClick={goNext2}>
                                        {sl.b_next}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <div>
                                <div className="edit-title-font px-3">
                                    {sl.l_processing_flags}
                                </div>
                                <div>
                                    <InputLabel label={sl.l_address_identify}/>
                                    <div className="px-3">
                                        {
                                            [1, 2, 3, 4, 5].map((item) => {
                                                return (
                                                    <div key={item} className="form-check " >
                                                        <input className="form-check-input"
                                                            type="checkbox"
                                                            id={"processingFlag" + item}
                                                            name={"processingFlag" + item}
                                                            checked={inputData?.["processingFlag" + item] || ""}
                                                            onChange={change4Input} />
                                                        <label className="form-check-label" htmlFor={"processingFlag" + item}>
                                                            {tBox.getLabel(sl, item, "o_processing_flag")}
                                                        </label>
                                                        <span className="ms-1 material-icons text-dark"
                                                            role="button"
                                                            style={{ fontSize: "16px" }}
                                                            data-bs-toggle="popover"
                                                            data-bs-trigger="hover focus"
                                                            data-bs-content={sl["t_processing_flag" + item]}
                                                            tabIndex="-1">
                                                            info
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>
                                </div>
                                <hr/>

                                <div className="mt-3">
                                    <div className="edit-title-font px-3">
                                        {sl.l_shutdown_flags}
                                    </div>
                                    <InputLabel label={sl.l_address_identify} />
                                    <div className="px-3">
                                        {
                                            [1, 2, 3].map((item) => {
                                                return (
                                                    <div key={item} className="form-check " >
                                                        <input className="form-check-input"
                                                            type="checkbox"
                                                            id={"shutdownFlag" + item}
                                                            name={"shutdownFlag" + item}
                                                            checked={inputData?.["shutdownFlag" + item] || ""}
                                                            onChange={change4Input} />
                                                        <label className="form-check-label" htmlFor={"shutdownFlag" + item}>
                                                            {tBox.getLabel(sl, item, "o_shutdown_flag")}
                                                        </label>
                                                        <span className="ms-1 material-icons text-dark"
                                                            role="button"
                                                            style={{ fontSize: "16px" }}
                                                            data-bs-toggle="popover"
                                                            data-bs-trigger="hover focus"
                                                            data-bs-content={sl["t_shutdown_flag" + item]}
                                                            tabIndex="-1">
                                                            info
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>
                                </div>
                                <hr/>

                                <div className="mt-3">
                                    <div className="edit-title-font px-3">
                                        {sl.l_authorization_flags}
                                    </div>
                                    <InputLabel label={sl.l_address_identify} />
                                    <div className="px-3">
                                        {
                                            [1, 2, 3].map((item) => {
                                                return (
                                                    <div key={item} className="form-check " >
                                                        <input className="form-check-input"
                                                            type="checkbox"
                                                            id={"authorizationFlag" + item}
                                                            name={"authorizationFlag" + item}
                                                            checked={inputData?.["authorizationFlag" + item] || ""}
                                                            onChange={change4Input} />
                                                        <label className="form-check-label" htmlFor={"authorizationFlag" + item}>
                                                            {tBox.getLabel(sl, item, "o_authorization_flag")}
                                                        </label>

                                                    </div>
                                                );
                                            })
                                        }
                                    </div>
                                </div>
                                <div className="mt-4 d-flex justify-content-between" style={{paddingTop: "20px"}}>
                                    <button type="button" className="btn btn-outline-dark" onClick={goBack}>
                                        {sl.b_back}
                                    </button>
                                    <button type="button" className="btn btn-primary" onClick={goNext2}>
                                        {sl.b_next}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}


                </div>
            </form >

            <InputTimerIdDialogBox debugMode={debugMode} />
            <InputCryptoIdDialogBox debugMode={debugMode} />
            <InputRoutingIdDialogBox debugMode={debugMode} />
            <InputRoutingRecordDialogBox debugMode={debugMode} />

            <DumpPanel dataList={[
                { name: "inputData", data: inputData },
                { name: "formObject", data: formObject },
                { name: "sl", data: sl },
            ]} debugMode={debugMode} />
        </div >
    );
}