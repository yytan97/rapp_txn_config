
import * as react from "react";
import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import * as apiBox from "./apiBox.js";
import { globalContext } from "./globalContext.js";

import { ErrorLine } from "./ErrorLine.js";
import { DumpPanel } from "./DumpPanel.js";

import { SideBar } from "./SideBar.js";
import { TitlePanel } from "./TitlePanel.js";
import { FooterPanel } from "./FooterPanel.js";
import { ClosablePanel } from "./ClosablePanel.js";

import { showStateDialogBox, closeStateDialogBox } from "./StateDialogBox.js";
import { showInfoDialogBox } from "./InfoDialogBox.js";
import { showConfirmDialogBox } from "./ConfirmDialogBox.js";


// Map loaded lib here ...
const uuidv4 = window.uuidv4;
const moment = window.moment;

let tableName = "kswitchinstitution";
let databaseName = "kdb";

const accessObjectName = "webapp_configuration_access";
const accessActionPrefix = "institution_management";

let institutionRecord = undefined;
let rowId = undefined;
let closePanel = {};
let tabIndex = 1;

let processingCodeList = [];
let routingList = [];

let dataContent = "";
let connectorList = [];

// input variable
let inputData = {};
let formObject = {
    dirty: false,
    valid: false,
    fieldState: {},
};


export function cleanUp() {
    console.log(`Clean up for ${componentName}`);
    institutionRecord = undefined;
    rowId = undefined;
    closePanel = {};
    tabIndex = 1;

    inputData = {};
    formObject = {
        dirty: false,
        valid: false,
        fieldState: {},
    };
    return;
};

const componentName = "InstitutionDetailPage";
export function InstitutionDetailPage({ debugMode = true }) {
    if (debugMode) console.log(`${componentName} component start ...`);

    // let data = reactRouter.useLoaderData();
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

    const ref4Form = react.useRef();

    const navigate = reactRouter.useNavigate();
    const location = reactRouter.useLocation();

    console.log("Location", location);

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);

        let timer = setTimeout(async () => {
            loadDataList();
        }, 100);

        return () => {
            if (debugMode) console.log(`Unmount ${componentName}`);
            clearTimeout(timer)
            // cleanUp();
        };
    }, []);

    // event handling function here ...

    async function loadDataList() {
        showStateDialogBox();

        try {
            institutionRecord = undefined;

            // check for user access right
            if (!check4Right(accessObjectName, `${accessActionPrefix}.access`)) {
                throw ({ errorCode: "permission_denied" });
            }

            // parse parameter 
            const sp = new URLSearchParams(location.search);
            rowId = sp.get('rowId');

            // fetch data 

            let result2 = await apiBox.getRecord(getSessionToken(), databaseName, tableName, `rowId = ${rowId}`);
            if (result2.flag) {
                let list2 = result2.data.records;
                /* preprocess 
                list1 = list2.map((item) => {
                    return item
                });
                */

                institutionRecord = list2[0];
                console.log("Record", institutionRecord);

                let result3 = await apiBox.getRecord(getSessionToken(), databaseName, "kswitchinstitution_txn", `institutionId = '${institutionRecord.institutionId}'`);

                if (result3.flag) {
                    let list3 = result3.data.records;
                    list3 = list3.map((record) => {
                        record.code = record.institutionPcode;
                        if (record.code.length == 1) record.code = "0" + record.code;
                        return record;
                    });

                    list3.sort(function (a, b) {
                        if (a.code == b.code) return 0;
                        if (a.code < b.code) return -1;
                        return 1;
                    });
                    processingCodeList = list3;
                }
                else processingCodeList = [];

                let result4 = await apiBox.getRecord(getSessionToken(), databaseName, "kswitchroute", `routingKey = '${institutionRecord.institutionRoutingId || institutionRecord.institutionId}'`);
                if (result4.flag) {
                    let list4 = result4.data.records;
                    routingList = list4;
                }
                else routingList = [];

                // let filename = "$KSHARE_DIR/klib/config/kconnector.cfg";
                let filename = config?.connectorPath || "$KL_CFG_DIR/kconnector.cfg";

                let result5 = await apiBox.readConfigurationFile(getSessionToken(), filename);
                if (result5.flag) {
                    dataContent = result5?.data?.files?.[0]?.content;
                    console.log("Data content", dataContent);
                }
                else dataContent = "";
                connectorList = extractConnectorObject(dataContent);

            }
            else throw (result2);

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
        if (v == undefined) return s;
        if (v == "1") return s + "bg-success";
        if (v == "3") return s + "bg-warning";
        return s + "bg-danger";
    };

    function getDisplayClass(v) {
        if (debugMode) console.log("Get display class", v);

        if (v === undefined) return " d-none ";
        if (v === true) return " ";
        return " d-none ";
    };

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

    function click4EditRecord(e, record) {
        if (debugMode) console.log("Click for edit record", e, record);

        let sp = new URLSearchParams({
            id: record.institutionId,
            editMode: 1
        });

        let path = {
            pathname: "/editInstitution",
            search: sp.toString(),
        };
        navigate(path);
        return;
    };

    function click4Tab(n) {
        if (debugMode) console.log("Click for tab ", n);

        tabIndex = n;
        setRedraw((v) => v + 1);
        return;
    };

    function change4Record(e) {
        if (debugMode) console.log("Form", ref4Form.current.checkValidity());

        formObject.dirty = true;
        formObject.valid = ref4Form.current.checkValidity();
        // formObject.fieldState[e.target.name] = tBox.buildFieldState(e.target);
        let obj = tBox.buildFormFieldState(ref4Form.current);
        formObject.fieldState = obj;

        inputData[e.target.name] = e.target.value;
        setRedraw((v) => v + 1);

    };

    async function click4AddProcessingCode(e, s) {
        if (debugMode) console.log("Click for add processing code ", e, s);

        let code = s.substr(0, 2);
        let list = processingCodeList;
        if (list.find(element => element.code === code)) {
            let message = sl.m_record_already_exist;
            showInfoDialogBox(message);
            return;
        }

        showStateDialogBox();
        try {
            let record1 = {
                institutionId: institutionRecord.institutionId,
                institutionPcode: code,
                recordStatus: "A"
            };

            let result1 = await apiBox.addRecord(getSessionToken(), databaseName, "kswitchinstitution_txn", record1);
            if (result1 && result1.flag) {
                inputData.processingCode = "";
                await loadDataList();
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

        return;
    };

    function click4RemoveProcessingCode(e, record, index) {
        if (debugMode) console.log("Click for remove procesing code ", e, record, index);

        let message = sl.m_confirm_delete_record;
        message = message.replace(/__parameter_1/, record.code);
        showConfirmDialogBox(message, async function () {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.deleteRecord(getSessionToken(), databaseName, "kswitchinstitution_txn", `rowId = '${record.rowId}'`);
                if (result1 && result1.flag) {
                    await loadDataList();
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

    function click4AddRoute() {
        if (debugMode) console.log("Click for add route ");

        let routingKey = institutionRecord?.institutionRoutingId || institutionRecord.institutionId;
        let sp = new URLSearchParams({
            routingKey: routingKey,
            editMode: 0
        });

        let path = {
            pathname: "/editRoute",
            search: sp.toString(),
        };
        navigate(path);
        return;
    };

    function click4EditRoute(record, index) {
        if (debugMode) console.log("Click for edit route ", record, index);

        let sp = new URLSearchParams({
            rowId: record.rowId,
            routingKey: record.routingKey,
            routingName: record.routingName,
            editMode: 1
        });

        let path = {
            pathname: "/editRoute",
            search: sp.toString(),
        };
        navigate(path);
        return;
    };

    function click4DeleteRoute(record, index) {
        if (debugMode) console.log("Click for delete route ", record, index);

        let message = sl.m_confirm_delete_record;
        message = message.replace(/__parameter_1/, record.routingName);
        showConfirmDialogBox(message, async function () {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.deleteRecord(getSessionToken(), databaseName, "kswitchroute", `rowId = ${record.rowId}`);
                if (result1 && result1.flag) {
                    await commentConnector(record.routingName);
                    let message = sl.m_record_deleted;
                    showInfoDialogBox(message, async () => {
                        await loadDataList();
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

    async function commentConnector(name) {
        try {
            let list = connectorList;
            let connector = list.find(element => element.name == name);
            if (connector && connector.startIndex != undefined) {
                let s2 = dataContent;
                let s1 = s2.substring(connector.startIndex, connector.endIndex);
                let s3 = "";

                let dt = new Date()
                console.log("Connector parameter", s1, connector);

                let s4 = "\n### Removed " + dt.toISOString() + "\n/*\n" + s1 + "\n*/\n";
                console.log("Connector parameter", s4, connector);
                s3 = s2.substring(0, connector.startIndex) + s4 + s2.substring(connector.endIndex);
                console.log("CFG data dump", s3);

                let filename = "$KSHARE_DIR/klib/config/kconnector.cfg";
                let result5 = await apiBox.writeConfigurationFile(getSessionToken(), filename, s3);
                console.log("Result 5", result5)
            }

            return true;

        } catch (error) {
            console.warn(error);
            return false;
        }

    }



    function click4Echo(e, record, index) {
        if (debugMode) console.log("Click for echo ", e, record, index);
        return;
    };


    return (
        <div className="container-fluid px-0 bg-synap-3">
            <TitlePanel />
            <div className="d-flex ">
                <div style={{ ...(dataset?.sideBarWidth) }}>
                    <SideBar />
                </div>

                <div className="flex-fill" style={{ ...(dataset?.mainPanelWidth) }}>
                    <div className="mt-2 mb-4 pl-24 pr-24" style={{ minHeight: "100vh", }}>
                        <div className=" d-flex justify-content-between">
                            <div className="col-12 col-md-6 previous-font"
                                onClick={() => navigate(-1)} >
                                <i className="fas fa-chevron-left fa-fw"></i>
                                {sl.l_previous_page}
                            </div>
                        </div>

                        <div className="d-flex justify-content-center">
                            <div className="col-11 col-xl-12">
                                <div>
                                    <div className="d-flex align-items-center pt-16">
                                        <div className="fs-14-unity pr-8">
                                            {sl.l_institution}
                                        </div>
                                        <div className={`${getStatusLabelClass(institutionRecord?.institutionStatus)}`}
                                            style={{ color: "#494D4F", fontSize: "14px", width: "110px", height: "24px" }} >
                                            <span >
                                            {getLabel(sl, institutionRecord?.institutionStatus, "o_status_")}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="detail-title">
                                        {institutionRecord?.institutionId}
                                    </div>
                                    <div className="d-flex justify-content-center align-items-center bg-white upper-card-box mb-24">
                                        <div style={{ width: "100%" }}>
                                            <div className="d-flex justify-content-between">
                                                <div className="fs-14-unity info-synap">
                                                    <div className="fw-normal pb-4px">
                                                        {sl.l_last_updated}
                                                    </div>
                                                    <div className="fw-semibold">
                                                        {tBox.getLastUpdatedDate()}
                                                    </div>
                                                </div>
                                                <div className="fs-14-unity info-synap">
                                                    <div className="fw-normal pb-4px">
                                                        {sl.l_timer_id}
                                                    </div>
                                                    <div className="fw-semibold">
                                                        {tBox.getLastUpdatedDate()}
                                                    </div>
                                                </div>
                                                <div className="fs-14-unity info-synap">
                                                    <div className="fw-normal pb-4px">
                                                        {sl.l_cryptogram_id}
                                                    </div>
                                                    <div className="fw-semibold">
                                                        {tBox.getLastUpdatedDate()}
                                                    </div>
                                                </div>
                                                <div className="fs-14-unity info-synap">
                                                    <div className="fw-normal pb-4px">
                                                        {sl.l_routing_id}
                                                    </div>
                                                    <div className="fw-semibold">
                                                        {tBox.getLastUpdatedDate()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* <div className="">
                            <div className="px-4" style={{ fontSize: "12px" }}>
                                <div className="my-4"
                                    onClick={() => click4Tab(1)}
                                    style={tabIndex === 1 ? { color: '#487798', cursor: "pointer" } : { color: '#76797B', cursor: "pointer" }}>
                                    {sl.l_institution_information}
                                </div>
                                <div className="my-4"
                                    onClick={() => click4Tab(2)}
                                    style={tabIndex === 2 ? { color: '#487798', cursor: "pointer" } : { color: '#76797B', cursor: "pointer" }}>
                                    {sl.l_transaction_type}
                                </div>
                                <div className="my-4"
                                    onClick={() => click4Tab(3)}
                                    style={tabIndex === 3 ? { color: '#487798', cursor: "pointer" } : { color: '#76797B', cursor: "pointer" }}>
                                    {sl.l_routing_information}
                                </div>
                            </div>
                        </div> */}

                        <div className="tab-wrapper">
                            <div className="tab-bar">
                                <div className="col-12 d-flex">
                                    <div className={`tab-item ${tabIndex === 1 ? 'active' : ''}`} onClick={() => click4Tab(1)}>
                                        {sl.l_institution_information}
                                    </div>
                                    <div className={`tab-item ${tabIndex === 2 ? 'active' : ''}`} onClick={() => click4Tab(2)}>
                                        {sl.l_transaction_type}
                                    </div>
                                    <div className={`tab-item ${tabIndex === 3 ? 'active' : ''}`} onClick={() => click4Tab(3)}>
                                        {sl.l_routing_information}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex justify-content-center">
                            <div className="col-12">

                                {/* <div className="" style={{ marginTop: "64px" }}>
                                    <div className="d-flex align-items-center justify-content-center bg-white px-5"
                                        style={{ borderRadius: "16px 16px 16px 16px", border: "1px solid #ebebeb", minHeight: "154px" }}>
                                        <div style={{ width: "100%" }} >
                                            <div className="d-flex justify-content-between">
                                                <div style={{ color: "#494D4F", fontSize: "14px" }} >
                                                    {sl.l_last_updated}: {institutionRecord?.recordDate}
                                                </div>
                                                <div className={`${getStatusLabelClass(institutionRecord?.institutionStatus)}`}
                                                    style={{ color: "#494D4F", fontSize: "14px", width: "110px", height: "24px" }} >
                                                    <span >
                                                        {getLabel(sl, institutionRecord?.institutionStatus, "o_status_")}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ color: "#494D4F", fontSize: "32px", fontWeight: "bold" }} >
                                                {institutionRecord?.institutionId}
                                            </div>
                                        </div>
                                    </div>
                                </div> */}

                                {
                                    tabIndex === 1 ? (
                                        <ClosablePanel name="institution_information"
                                            title={sl.l_institution_information}
                                            closeFlag={closePanel?.institution_information}
                                            callback4Toggle={callback4TogglePanel}>
                                            <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                style={{ minHeight: "168px" }} >
                                                <div className="px-5 py-1 w-100">

                                                    <DisplayLine label={sl.l_institution_record_type} value={institutionRecord?.institutionRecordType} />
                                                    <DisplayLine label={sl.l_institution_owner} value={institutionRecord?.institutionOwner} />
                                                    <DisplayLine label={sl.l_parent} value={institutionRecord?.institutionParent} />

                                                    <DisplayLine label={sl.l_timer_id} value={institutionRecord?.institutionTimerId} />
                                                    <DisplayLine label={sl.l_crypto_id} value={institutionRecord?.institutionCryptoId} />
                                                    <DisplayLine label={sl.l_processing_flags} value={parseInt(institutionRecord?.institutionProcessingFlags || 0).toString(2)} />
                                                    <DisplayLine label={sl.l_shutdown_flags} value={institutionRecord?.institutionShutdownFlags} />
                                                    <DisplayLine label={sl.l_authorization_flags} value={institutionRecord?.institutionAuthFlags} />
                                                    <DisplayLine label={sl.l_card_product} value={institutionRecord?.institutionCardProduct} />
                                                    <DisplayLine label={sl.l_routing_id} value={institutionRecord?.institutionRoutingId} />
                                                    <DisplayLine label={sl.l_record_status} value={institutionRecord?.recordStatus} />

                                                    <DisplayLine label={sl.l_institution_saf_interleave_policy} value={institutionRecord?.institutionSafInterleavePolicy} />
                                                    <DisplayLine label={sl.l_institution_saf_max_concurrent} value={institutionRecord?.institutionSafMaxConcurrent} />
                                                    <DisplayLine label={sl.l_institution_saf_max_timeout} value={institutionRecord?.institutionSafMaxTimeout} />
                                                    <DisplayLine label={sl.l_institution_saf_retry} value={institutionRecord?.institutionSafRetry} />
                                                    <DisplayLine label={sl.l_institution_consecutive_timeout_count} value={institutionRecord?.institutionConsecutiveTimeoutCount} />

                                                </div>
                                            </div>

                                            {
                                                check4Right(accessObjectName, `${accessActionPrefix}.add`) ? (
                                                    <div className="d-flex justify-content-end align-items-center px-4 border-top"
                                                        style={{ minHeight: "56px" }}>
                                                        <button className="btn btn-ghost-unity d-flex align-items-center"
                                                            type="button"
                                                            style={{ color: "#494D4F", fontWeight: "500" }}
                                                            onClick={(e) => click4EditRecord(e, institutionRecord)}>
                                                            <span className="material-icons-outlined fs-24-unity me-2">edit</span>
                                                            {sl.b_edit}
                                                        </button>
                                                    </div>
                                                ) : null
                                            }

                                        </ClosablePanel>
                                    ) : null
                                }

                                {
                                    tabIndex === 2 ? (
                                        <ClosablePanel name="transaction_type"
                                            title={sl.l_transaction_type}
                                            closeFlag={closePanel?.transaction_type}
                                            callback4Toggle={callback4TogglePanel}>
                                            <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                style={{ minHeight: "168px" }} >
                                                <div className="px-5 py-1 w-100">

                                                    <div className="row flex-fill">
                                                        {
                                                            processingCodeList.map((record, index) => {
                                                                return (
                                                                    <div key={index} className="col-3" ng-repeat="rec in processingCodeList">
                                                                        <div className="d-flex">
                                                                            {
                                                                                check4Right(accessObjectName, `${accessActionPrefix}.transaction_type.delete`) ? (
                                                                                    <span className="material-icons-outlined fs-24-unity text-danger"
                                                                                        role="button"
                                                                                        onClick={(e) => click4RemoveProcessingCode(e, record, index)} >
                                                                                        close
                                                                                    </span>
                                                                                ) : null
                                                                            }
                                                                            <span className="ms-2">{record.code}</span>
                                                                        </div>
                                                                    </div>);
                                                            })
                                                        }
                                                    </div>

                                                </div>

                                            </div>



                                            {
                                                check4Right(accessObjectName, `${accessActionPrefix}.add`) ? (

                                                    <form name="form4AddProcessingCode" noValidate
                                                        ref={ref4Form}
                                                        className="d-flex justify-content-between align-items-center px-4 border-top"
                                                        style={{ minHeight: "56px" }}
                                                        ng-show="!closePanel.transaction_type && check4Right('webapp_configuration_access','institution_management.transaction_type.add')">

                                                        <div className="flex-fill me-3 mt-3">

                                                            <input name="processingCode"
                                                                type="text"
                                                                className={`form-control ${tBox.getClass4IsInvalid2('processingCode', formObject)}`}
                                                                placeholder={sl.p_processing_code}
                                                                pattern="^\d{2}.*"
                                                                value={inputData?.processingCode || ""}
                                                                onChange={change4Record}
                                                                list="datalist4ProcessingCode" />

                                                            <datalist id="datalist4ProcessingCode">
                                                                <option value="00 Purchase" />
                                                                <option value="01 Withdrawal" />
                                                                <option value="03 Check Guarantee" />
                                                                <option value="09 Cash Back" />
                                                                <option value="17 Check Verification" />
                                                                <option value="20 Merchandise Return" />
                                                                <option value="21 Deposit" />
                                                                <option value="30 Debit Inquiry" />
                                                                <option value="31 Balance Inquiry" />
                                                                <option value="32 Mini-Statement" />
                                                                <option value="33 Account Inquiry" />
                                                                <option value="37 Multiple Account Data Inquiry" />
                                                                <option value="38 Check Cleared Inquiry" />
                                                                <option value="40 Transfer" />
                                                                <option value="41 Card Holder Funds Transfer - Debit" />
                                                                <option value="42 Card Holder Funds Transfer - Credit" />
                                                                <option value="43 Bill Payment Credit" />
                                                                <option value="49 Change PIN" />
                                                            </datalist>

                                                            <ErrorLine message={tBox.getFieldErrorMessage2('processingCode', sl, formObject)} />
                                                        </div>

                                                        <button className="btn btn-ghost-unity d-flex align-items-center"
                                                            type="button"
                                                            style={{ color: "#494D4F", fontWeight: "500" }}
                                                            onClick={(e) => click4AddProcessingCode(e, inputData?.processingCode)}
                                                            disabled={!formObject?.valid || !inputData?.processingCode}>
                                                            <span className="material-icons-outlined fs-24-unity me-2">add</span>
                                                            <span className="text-nowrap">{sl.b_add}</span>
                                                        </button>

                                                    </form>

                                                ) : null
                                            }

                                        </ClosablePanel>
                                    ) : null
                                }

                                {
                                    tabIndex === 3 ? (
                                        <>
                                            {
                                                routingList.map((record, index) => {
                                                    return (
                                                        <ClosablePanel key={index} name={`routing_information_${index}`}
                                                            title={record.routingName}
                                                            closeFlag={closePanel[`routing_information_${index}`]}
                                                            callback4Toggle={callback4TogglePanel}>
                                                            <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                                style={{ minHeight: "168px" }} >
                                                                <div className="px-5 py-1 w-100">

                                                                    <DisplayLine label={sl.l_routing_order} value={record?.routingOrder} />
                                                                    <DisplayLine label={sl.l_link_type} value={record?.linkType} />
                                                                    <DisplayLine label={sl.l_routing_flags} value={record?.routingFlags} />
                                                                    <DisplayLine label={sl.l_record_status} value={record?.recordStatus} />
                                                                    <DisplayLine label={sl.l_record_date} value={tBox.formatDate(record?.recordDate)} />

                                                                </div>
                                                            </div>
                                                            <div className={"d-flex justify-content-end align-items-center px-4 border-top " +
                                                                getDisplayClass(check4Right(accessObjectName, `${accessActionPrefix}.routing_information.edit`) ||
                                                                    check4Right(accessObjectName, `${accessActionPrefix}.routing_information.delete`)
                                                                )}
                                                                style={{ minHeight: "56px" }}>
                                                                {
                                                                    check4Right(accessObjectName, `${accessActionPrefix}.routing_information.delete`) ? (
                                                                        <button className="btn btn-ghost-unity d-flex align-items-center me-3"
                                                                            type="button"
                                                                            style={{ color: "#494D4F", fontWeight: "500" }}
                                                                            onClick={() => click4DeleteRoute(record, index)}>
                                                                            <span className="material-icons-outlined fs-24-unity me-2">delete</span>
                                                                            {sl.b_delete}
                                                                        </button>
                                                                    ) : null
                                                                }
                                                                {
                                                                    check4Right(accessObjectName, `${accessActionPrefix}.routing_information.edit`) ? (
                                                                        <button className="btn btn-ghost-unity d-flex align-items-center"
                                                                            type="button"
                                                                            style={{ color: "#494D4F", fontWeight: "500" }}
                                                                            onClick={() => click4EditRoute(record, index)}>
                                                                            <span className="material-icons-outlined fs-24-unity me-2">edit</span>
                                                                            {sl.b_edit}
                                                                        </button>
                                                                    ) : null
                                                                }
                                                            </div>
                                                        </ClosablePanel>
                                                    );
                                                })
                                            }

                                            < div className="d-flex justify-content-between align-items-center mt-3">
                                                <div>
                                                    <span>{sl.l_routing_id}</span>:
                                                    <span className="ms-2">{institutionRecord?.institutionRoutingId || '-'}</span>
                                                </div>
                                                {
                                                    check4Right(accessObjectName, `${accessActionPrefix}.routing_information.add`) ? (
                                                        <button className="btn btn-unity text-nowrap" type="button"
                                                            onClick={click4AddRoute}
                                                            disabled={!institutionRecord.institutionRoutingId}>
                                                            <span className="material-icons-outlined fs-24-unity me-2 ">add</span>
                                                            {sl.b_add_route}
                                                        </button>
                                                    ) : null
                                                }

                                            </div>
                                        </>
                                    ) : null
                                }


                            </div>
                        </div>

                    </div>  {/* end of content panel */}

                    <DumpPanel dataList={[
                        { name: "inputData", data: inputData },
                        { name: "formObject", data: formObject },
                        { name: "institutionRecord", data: institutionRecord },
                        { name: "sl", data: sl },
                    ]} debugMode={debugMode} />

                </div> {/* end of right panel */}

            </div> {/* end of top part */}

            <FooterPanel />
        </div >
    );
};

export function DisplayLine({ label, value, debugMode = false }) {

    return (
        <div className="d-flex justify-content-between align-items-center my-3">
            <div style={{ color: "#76797B", fontSize: "14px" }}>
                {label}
            </div>
            <div style={{ color: "#494D4F", fontSize: "16px" }}>
                {value || "-"}
            </div>
        </div>
    );
};