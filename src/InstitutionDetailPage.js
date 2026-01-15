
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
import { searchObject } from "./InstitutionManagementPage.js";

// Map loaded lib here ...
const uuidv4 = window.uuidv4;
const moment = window.moment;

let tableName = "kswitchinstitution";
let databaseName = "kdb";

const accessObjectName = "webapp_configuration_access";
const accessActionPrefix = "institution_management";

export let institutionRecord = undefined;
let rowId = undefined;
let closePanel = {};
let tabIndex = 1;

let processingCodeList = [];
let routingList = [];

let dataContent = "";
let connectorList = [];

let dataList = [];

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
    let [refresh, setRefresh] = react.useState(true);
    let [reset, setReset] = react.useState(true);

    const ref4Form = react.useRef();

    const navigate = reactRouter.useNavigate();
    const location = reactRouter.useLocation();

    const [showPcodeDrawer, setShowPcodeDrawer] = react.useState(false);
    const [searchTerm, setSearchTerm] = react.useState("");
    const [selectedPcode, setSelectedPcode] = react.useState([]);
    const processingCode = [
        {code: "00", desc: sl.o_pcode_00 },
        {code: "01", desc: sl.o_pcode_01 },
        {code: "03", desc: sl.o_pcode_03 },
        {code: "09", desc: sl.o_pcode_09 },
        {code: "17", desc: sl.o_pcode_17 },
        {code: "20", desc: sl.o_pcode_20 },
        {code: "21", desc: sl.o_pcode_21 },
        {code: "30", desc: sl.o_pcode_30 },
        {code: "31", desc: sl.o_pcode_31 },
        {code: "32", desc: sl.o_pcode_32 },
        {code: "33", desc: sl.o_pcode_33 },
        {code: "37", desc: sl.o_pcode_37 },
        {code: "38", desc: sl.o_pcode_38 },
        {code: "40", desc: sl.o_pcode_40 },
        {code: "41", desc: sl.o_pcode_41 },
        {code: "42", desc: sl.o_pcode_42 },
        {code: "43", desc: sl.o_pcode_43 },
        {code: "49", desc: sl.o_pcode_49 },
    ];
    const filteredPcodes = processingCode.filter(item =>
        item.code.includes(searchTerm) || item.desc.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const togglePcode = (code) => {
        setSelectedPcode(prev => {
            if (prev.includes(code)) {
                return prev.filter(x => x !== code);
            }
            return [...prev, code];
        })
    };

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

    react.useEffect(() => {
        if (showPcodeDrawer && processingCodeList.length > 0) {
            const defaultSelected = processingCodeList.map(item => item.code);
            setSelectedPcode(defaultSelected);
        }
    }, [showPcodeDrawer]);

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
                institutionRecord = list2[0];

                let result3 = await apiBox.getRecord(
                    getSessionToken(),
                    databaseName,
                    "kswitchinstitution_txn",
                    `institutionId = '${institutionRecord.institutionId}'`
                );

                if (result3.flag) {
                    let rawList = result3.data.records.map(r => {
                        const rawCode = (r.institutionPcode || "").trim();
                        const numeric = /^\d+$/.test(rawCode);
                        return {
                            rowId: r.rowId,
                            rawCode,
                            numeric: /^\d+$/.test(rawCode),
                            paddedCode: numeric ? rawCode.padStart(2, "0") : rawCode,
                            recordDate: r.recordDate || "-",
                            status: r.recordStatus || "-"
                        };
                    });

                    // sort — numeric ascending if all codes are numbers
                    const allNumeric = rawList.every(x => x.numeric);

                    rawList.sort((a, b) => {
                        if (allNumeric) {
                            return parseInt(a.rawCode, 10) - parseInt(b.rawCode, 10);
                        }
                        return a.rawCode.localeCompare(b.rawCode);
                    });

                    // final list the UI will use  
                    processingCodeList = rawList.map(x => ({
                        code: x.paddedCode,
                        recordDate: x.recordDate,
                        status: x.status,
                        rowId: x.rowId
                    }));
                } else {
                    processingCodeList = [];
                }

                console.log("processingCodeList", processingCodeList);

                let result4 = await apiBox.getRecord(
                    getSessionToken(),
                    databaseName,
                    "kswitchroute",
                    `routingKey = '${institutionRecord.institutionRoutingId || institutionRecord.institutionId}'`
                );
                if (result4.flag) {
                    let list4 = result4.data.records;
                    routingList = list4;
                }
                else routingList = [];

                // load connector file
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
        if (v == "A" || v == "1") return s + "bg-success";
        if (v == "D") return s + "bg-warning";
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

    function click4EditRecord(e, record, step = 1) {
        if (debugMode) console.log("Click for edit record", e, record);

        let sp = new URLSearchParams({
            id: record.institutionId,
            editMode: 1,
            step: step
        });

        let path = {
            pathname: "/editInstitutionV2",
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

        // let code = s.substr(0, 2);
        // let list = processingCodeList;
        // if (list.find(element => element.code === code)) {
        //     let message = sl.m_record_already_exist;
        //     showInfoDialogBox(message);
        //     return;
        // }

        // showStateDialogBox();
        // try {
        //     let record1 = {
        //         institutionId: institutionRecord.institutionId,
        //         institutionPcode: code,
        //         recordStatus: "A"
        //     };

        //     let result1 = await apiBox.addRecord(getSessionToken(), databaseName, "kswitchinstitution_txn", record1);
        //     if (result1 && result1.flag) {
        //         inputData.processingCode = "";
        //         await loadDataList();
        //     }
        //     else throw result1;
        // }
        // catch (e) {
        //     console.warn("Error", e);
        //     let message = tBox.getErrorMessage(e, sl);
        //     showInfoDialogBox(message);
        //     if (tBox.isBlockErrorCode(e)) updateUser(undefined);
        // }
        // finally {
        //     closeStateDialogBox();
        // }

        // return;

        const oldList = processingCodeList.map(x => x.code);
        const newList = selectedPcode;

        const toAdd = newList.filter(x => !oldList.includes(x));
        const toRemove = oldList.filter(x => !newList.includes(x));

        showStateDialogBox();

        try {
            // ADD new records
            for (let code of toAdd) {
                let record = {
                    institutionId: institutionRecord.institutionId,
                    institutionPcode: code,
                    recordStatus: "A"
                };

                let addResult = await apiBox.addRecord(
                    getSessionToken(),
                    databaseName,
                    "kswitchinstitution_txn",
                    record
                );

                if (!addResult?.flag) throw addResult;
            }

            // REMOVE unselected records
            for (let code of toRemove) {
                const rec = processingCodeList.find(r => r.code === code);

                if (rec?.rowId) {
                    let delResult = await apiBox.deleteRecord(
                        getSessionToken(),
                        databaseName,
                        "kswitchinstitution_txn",
                        `rowId = '${rec.rowId}'`
                    );
                    if (!delResult?.flag) throw delResult;
                }
            }

            await loadDataList(); // refresh table

        } catch (e) {
            let message = tBox.getErrorMessage(e, sl);
            showInfoDialogBox(message);
            if (tBox.isBlockErrorCode(e)) updateUser(undefined);
        } finally {
            closeStateDialogBox();
        }
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

    function renderAuthorizationFlags(flagString) {
        if (!flagString) return <div>-</div>;
        console.log("flagstring", flagString);

        const cleanFlags = flagString.trim().replace(/\s+/g, "");
        
        const flagMapping = {
            "A": sl.l_authorization_flag_A,
            "P": sl.l_authorization_flag_P,
            "N": sl.l_authorization_flag_N,
        }

        const flags = cleanFlags.split("").map(flag => flagMapping[flag] || flag).filter(Boolean);

        if (flags.length === 0) return <div>-</div>;

        return (
            <ul>
                {flags.map((desc, idx) => (
                    <li style={{listStyleType: "disc", borderLeft: "none"}} key={idx}>
                        {desc}
                    </li>
                ))}
            </ul>
        );
    };

    function renderShutdownFlags(flagString) {
        if (!flagString) return <div>-</div>;
        console.log("flagstring", flagString);
        
        const cleanFlags = flagString.trim().replace(/\s+/g, "");

        const flagMapping = {
            "L": sl.l_shutdown_flag_L,
            "T": sl.l_shutdown_flag_T,
            "S": sl.l_shutdown_flag_S,
        }

        const flags = cleanFlags.split("").map(flag => flagMapping[flag] || flag).filter(Boolean);

        if (flags.length === 0) return <div>-</div>;

        return (
            <ul>
                {flags.map((desc, idx) => (
                    <li style={{listStyleType: "disc", borderLeft: "none"}} key={idx}>
                        {desc}
                    </li>
                ))}
            </ul>
        );
    }

    function renderProcessingFlags(flagString, sl) {
        if (!flagString) return <div>-</div>;

        const binary = parseInt(flagString, 10).toString(2).padStart(5, '0');

        const flagMapping = [
            sl.l_processing_flag1,
            sl.l_processing_flag2,
            sl.l_processing_flag3,
            sl.l_processing_flag4,
            sl.l_processing_flag5
        ];

        const activeFlags = binary.split("").reverse().map((bit, idx) => (bit === "1" ? flagMapping[idx] : null)).filter(Boolean);

        if (activeFlags.length === 0) return <div>-</div>;

        return (
            <ul>
                {activeFlags.map((desc, idx) => (
                    <li  key={idx} style={{ listStyleType: "disc", borderLeft: "none" }}>
                        {desc}
                    </li>
                ))}
            </ul>
        );
    }

    function click4Search(e) {
        if (debugMode) console.log("Click for search or refresh", e);
        // pageObject.page = 1;

        setReset(true);
        setRefresh(true);
        return;
    };

    function click4DeleteRecord(e, record, index) {
        if (debugMode) console.log("Click for delete record", e, record, index);

        let message = sl.m_confirm_delete_record;
        message = message.replace(/__parameter_1/, record.recordData.institutionId);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.deleteRecordWithId(getSessionToken(), databaseName, tableName, record.recordData.rowId);
                if (result1 && result1.flag) {

                    let message = sl.m_record_deleted;
                    showInfoDialogBox(message, () => {
                        setReset(true);
                        setRefresh(true);
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

    function keyPress4SearchText(e) {
        if (debugMode) console.log("Key presss for search", e);

        if (e.key == "Enter") {
            setReset(true);
            setRefresh(true);
        }
        return;
    };

    function change4SearchText(e) {
        if (debugMode) console.log("Change for search text", e);
        searchObject.searchText = e.target.value;
        setRedraw((v) => v + 1);
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
                                {sl.l_institution_management}
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
                                                        {institutionRecord?.institutionTimerId || "-"}
                                                    </div>
                                                </div>
                                                <div className="fs-14-unity info-synap">
                                                    <div className="fw-normal pb-4px">
                                                        {sl.l_cryptogram_id}
                                                    </div>
                                                    <div className="fw-semibold">
                                                        {institutionRecord?.institutionCryptoId || "-"}
                                                    </div>
                                                </div>
                                                <div className="fs-14-unity info-synap">
                                                    <div className="fw-normal pb-4px">
                                                        {sl.l_routing_id}
                                                    </div>
                                                    <div className="fw-semibold">
                                                        {institutionRecord?.institutionRoutingId || "-"}
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
                                        {sl.l_flags}
                                    </div>
                                    <div className={`tab-item ${tabIndex === 3 ? 'active' : ''}`} onClick={() => click4Tab(3)}>
                                        {sl.l_saf}
                                    </div>
                                    <div className={`tab-item ${tabIndex === 4 ? 'active' : ''}`} onClick={() => click4Tab(4)}>
                                        {sl.l_transaction_type}
                                    </div>
                                    <div className={`tab-item ${tabIndex === 5 ? 'active' : ''}`} onClick={() => click4Tab(5)}>
                                        {sl.l_timer}
                                    </div>
                                    <div className={`tab-item ${tabIndex === 6 ? 'active' : ''}`} onClick={() => click4Tab(6)}>
                                        {sl.l_cryptogram}
                                    </div>
                                    <div className={`tab-item ${tabIndex === 7 ? 'active' : ''}`} onClick={() => click4Tab(7)}>
                                        {sl.l_routing}
                                    </div>
                                    <div className={`tab-item ${tabIndex === 8 ? 'active' : ''}`} onClick={() => click4Tab(8)}>
                                        {sl.l_bin_prefix}
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
                                                <div className="pl-24 pr-24 py-1 w-100">

                                                    <DisplayLine label={sl.l_institution_id} value={institutionRecord?.institutionId} />
                                                    <DisplayLine label={sl.l_record_status} value={getLabel(sl, institutionRecord?.recordStatus, "o_status_")} />
                                                    <DisplayLine label={sl.l_institution_record_type} value={institutionRecord?.institutionRecordType} />
                                                    <DisplayLine label={sl.l_institution_owner} value={institutionRecord?.institutionOwner} />
                                                    <DisplayLine label={sl.l_parent} value={institutionRecord?.institutionParent} />
                                                    <DisplayLine label={sl.l_product_code} value={institutionRecord?.institutionCardProduct} />
                                                    <DisplayLine label={sl.l_network_product_category} value={institutionRecord?.institutionNetworkProductCategory} />
                                                    <DisplayLine label={sl.l_card_network} value={institutionRecord?.institutionCardNetwork} />
                                                    <DisplayLine label={sl.l_currency_code} value={institutionRecord?.institutionCurrencyCode} />
                                                    <DisplayLine label={sl.l_country_code} value={institutionRecord?.institutionCountryCode} />
                                                    <DisplayLine label={sl.l_operating_region} value={institutionRecord?.institutionOperatingRegion} />
                                                </div>
                                            </div>

                                            {
                                                check4Right(accessObjectName, `${accessActionPrefix}.add`) ? (
                                                    <div className="d-flex justify-content-end align-items-center px-4 border-top"
                                                        style={{ minHeight: "56px" }}>
                                                        <button className="btn btn-ghost-unity d-flex align-items-center"
                                                            type="button"
                                                            style={{ color: "#494D4F", fontWeight: "500" }}
                                                            onClick={(e) => click4EditRecord(e, institutionRecord, 1)}>
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
                                        <ClosablePanel name="flags"
                                            title={sl.l_flags}
                                            closeFlag={closePanel?.institution_information}
                                            callback4Toggle={callback4TogglePanel}>
                                            <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                style={{ minHeight: "168px" }} >
                                                <div className="pl-24 pr-24 py-1 w-100">

                                                    <DisplayLine label={sl.l_processing_flags} value={renderProcessingFlags(institutionRecord?.institutionProcessingFlags, sl)} />
                                                    <DisplayLine label={sl.l_shutdown_timeout} value={renderShutdownFlags(institutionRecord?.institutionShutdownFlags)} />
                                                    <DisplayLine label={sl.l_authorization_flags} value=
                                                    {renderAuthorizationFlags(institutionRecord?.institutionAuthFlags)} />

                                                </div>
                                            </div>

                                            {
                                                check4Right(accessObjectName, `${accessActionPrefix}.add`) ? (
                                                    <div className="d-flex justify-content-end align-items-center px-4 border-top"
                                                        style={{ minHeight: "56px" }}>
                                                        <button className="btn btn-ghost-unity d-flex align-items-center"
                                                            type="button"
                                                            style={{ color: "#494D4F", fontWeight: "500" }}
                                                            onClick={(e) => click4EditRecord(e, institutionRecord, 3)}>
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
                                    tabIndex === 3 ? (
                                        <ClosablePanel name="saf_settings"
                                            title={sl.l_saf_settings}
                                            closeFlag={closePanel?.institution_information}
                                            callback4Toggle={callback4TogglePanel}>
                                            <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                style={{ minHeight: "168px" }} >
                                                <div className="pl-24 pr-24 py-1 w-100">

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
                                                            onClick={(e) => click4EditRecord(e, institutionRecord, 4)}>
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
                                    tabIndex === 4 ? (
                                        <>       
                                            <div className="mt-16 px-3 py-4 bg-white shadow" style={{ border: "1px solid #f3f3f3", borderRadius: "16px" }}>
                                                <div className="d-flex justify-content-end align-items-center">
                                                    <div className="col-4 pe-3">
                                                        <div className="input-group">
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
                                                        </div>
                                                    </div>

                                                    <div>
                                                        {
                                                            check4Right(accessObjectName, `${accessActionPrefix}.add`) ? (
                                                                <button className="btn btn-unity " role="button" title={sl.t_add_processing_code} onClick={() => setShowPcodeDrawer(true)}>
                                                                    {sl.b_add_processing_code}
                                                                </button>
                                                            ) : null
                                                        }
                                                    </div>
                                                    {/* Drawer component */}
                                                    {showPcodeDrawer && (
                                                        <div className="drawer-overlay" onClick={() => setShowPcodeDrawer(false)}>
                                                            <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
                                                                <div className="drawer-title">
                                                                    {sl.l_set_processing_code}
                                                                </div>
                                                                <div className="drawer-description pb-16">
                                                                    {sl.l_select_pcode}
                                                                </div>
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
                                                                    {filteredPcodes.map((item, idx) => (
                                                                        <div key={idx} className="form-check">
                                                                            <input
                                                                            type="checkbox"
                                                                            id={`pcode-${idx}`}
                                                                            name="pcode"
                                                                            className="form-check-input"
                                                                            checked={selectedPcode.includes(item.code)}
                                                                            onChange={() => {
                                                                                if (selectedPcode.includes(item.code)) {
                                                                                    setSelectedPcode(selectedPcode.filter(c => c !== item.code)); //remove
                                                                                }
                                                                                else {
                                                                                    setSelectedPcode([...selectedPcode, item.code]); //add
                                                                                }
                                                                            }}
                                                                            />
                                                                            <label className="form-check-label" htmlFor={`pcode-${idx}`}>
                                                                                ({item.code}) {item.desc}
                                                                            </label>
                                                                        </div>
                                                                    ))}

                                                                    {filteredPcodes.length === 0 && (
                                                                        <div className="text-muted">
                                                                            {sl.l_no_result_found}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <button className="btn btn-primary  mb-16"
                                                                    disabled={selectedPcode.length === 0}
                                                                    // onClick={() => {
                                                                    //     inputData.processingCodes = [...selectedPcode]; // save multiple values
                                                                    //     setShowPcodeDrawer(false);
                                                                    //     setRedraw(v => v + 1); 
                                                                    // }}>
                                                                    onClick={async () => {
                                                                        await click4AddProcessingCode();
                                                                        setShowPcodeDrawer(false);
                                                                    }}>
                                                                        {sl.b_apply}
                                                                </button>
                                                                <button className="btn btn-ghost-unity"
                                                                    onClick={() => setShowPcodeDrawer(false)}>
                                                                        {sl.b_cancel}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-4 table-responsive " style={{ minHeight: "45vh" }}>
                                                    <table className="table table-hover mb-0">
                                                        <thead>
                                                            <tr className="text-nowrap tableRow-title">
                                                                <th className="">
                                                                    {sl.h_processing_code}
                                                                </th>
                                                                <th className="">
                                                                    {sl.h_last_updated}
                                                                </th>
                                                                <th className="" >
                                                                    {sl.h_status}
                                                                </th>
                                                                <th className="" style={{ width: "24px" }} >
                                                                </th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                            {
                                                                processingCodeList.map((record, index) => {
                                                                    return (
                                                                        <tr key={index} className="text-nowrap" style={{ cursor: "pointer", fontSize: "14px" }} >
                                                                            <td className="">
                                                                                {record.code || "-"}
                                                                            </td>
                                                                            <td className="">
                                                                                {tBox.formatDate(record.recordDate || "-")}
                                                                            </td>
                                                                            <td className="">
                                                                                <div className={`${getStatusLabelClass(record.status)}`}
                                                                                    style={{ width: "110px", height: "24px" }} >
                                                                                    {getLabel(sl, record.status, "o_status_")}
                                                                                </div>
                                                                            </td>
                                                                            <td>
                                                                                <div className="dropdown dropstart ">
                                                                                    <span className="d-inline-flex align-items-center " role="button"
                                                                                        data-bs-toggle="dropdown">
                                                                                        <div className="d-flex align-items-center ">
                                                                                            <span className="material-icons fs-18-unity">more_vert</span>
                                                                                        </div>
                                                                                    </span>

                                                                                    <div className="dropdown-menu fs-14-unity border-0 shadow p-0"
                                                                                        style={{ borderRadius: "8px" }} >
                                                                                        <ul className="list-unstyled p-2 mb-0">
                                                                                            <li style={{borderLeft: "none", marginLeft: "0rem"}}>
                                                                                                <button
                                                                                                    className="dropdown-item border-bottom d-flex align-items-center"
                                                                                                    type="button">
                                                                                                    <span>{sl.b_change_status}</span>
                                                                                                </button>
                                                                                            </li>
                                                                                            {
                                                                                                check4Right(accessObjectName, `${accessActionPrefix}.delete`) ? (
                                                                                                    <li style={{borderLeft: "none", marginLeft: "0rem"}}>
                                                                                                        <button
                                                                                                            className="dropdown-item border-bottom d-flex align-items-center"
                                                                                                            type="button"
                                                                                                            onClick={(e) => click4RemoveProcessingCode(e, record, index)}>
                                                                                                            <span>{sl.b_delete_pcode}</span>
                                                                                                        </button>
                                                                                                    </li>
                                                                                                ) : null
                                                                                            }
                                                                                        </ul>
                                                                                    </div>
                                                                                </div>
                                                                            </td>

                                                                        </tr>

                                                                    );
                                                                })
                                                            }
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* {
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
                                            } */}

                                        </>
                                    ) : null
                                }

                                {
                                    tabIndex === 5 ? (
                                        <>  
                                            <div className="mt-16 px-3 py-4 bg-white shadow" style={{ border: "1px solid #f3f3f3", borderRadius: "16px" }}>
                                                <div className="pl-14 detail-title-font">
                                                    {sl.l_timer_info}
                                                </div>
                                                <div className="mt-4 table-responsive " style={{ minHeight: "45vh" }}>
                                                    <table className="table table-hover mb-0">
                                                        <thead>
                                                            <tr className="text-nowrap tableRow-title">
                                                                <th className="">
                                                                    {sl.h_timer_id}
                                                                </th>
                                                                 <th className="">
                                                                    {sl.h_chrono_unit}
                                                                </th>
                                                                <th className="">
                                                                    {sl.h_last_updated}
                                                                </th>
                                                                <th className="" >
                                                                    {sl.h_status}
                                                                </th>
                                                                <th className="" style={{ width: "24px" }} >
                                                                </th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                            {
                                                                processingCodeList.map((record, index) => {
                                                                    return (
                                                                        <tr key={index} className="text-nowrap" style={{ cursor: "pointer", fontSize: "14px" }} >
                                                                            <td className="">
                                                                                {record.code || "-"}
                                                                            </td>
                                                                            <td className="">
                                                                                {"-"}
                                                                            </td>
                                                                            <td className="">
                                                                                {record.recordDate || "-"}
                                                                            </td>
                                                                            <td className="">
                                                                                <div className={`${getStatusLabelClass(record.status)}`}
                                                                                    style={{ width: "110px", height: "24px" }} >
                                                                                    {getLabel(sl, record.status, "o_status_")}
                                                                                </div>
                                                                            </td>
                                                                            <td>
                                                                                <div className="dropdown dropstart ">
                                                                                    <span className="d-inline-flex align-items-center " role="button"
                                                                                        data-bs-toggle="dropdown">
                                                                                        <div className="d-flex align-items-center ">
                                                                                            <span className="material-icons fs-18-unity">more_vert</span>
                                                                                        </div>
                                                                                    </span>

                                                                                    <div className="dropdown-menu fs-14-unity border-0 shadow p-0"
                                                                                        style={{ borderRadius: "8px" }} >
                                                                                        <ul className="list-unstyled p-2 mb-0">
                                                                                            <li >
                                                                                                <button
                                                                                                    className="dropdown-item border-bottom d-flex align-items-center"
                                                                                                    type="button">
                                                                                                    <span
                                                                                                        className="material-icons-outlined fs-24-unity me-2">find_in_page</span>
                                                                                                    <span>{sl.l_view_detail}</span>
                                                                                                </button>
                                                                                            </li>
                                                                                            {
                                                                                                check4Right(accessObjectName, `${accessActionPrefix}.delete`) ? (
                                                                                                    <li>
                                                                                                        <button
                                                                                                            className="dropdown-item border-bottom d-flex align-items-center"
                                                                                                            type="button"
                                                                                                            onClick={(e) => click4DeleteRecord(e, record, index)}>
                                                                                                            <span
                                                                                                                className="material-icons-outlined fs-24-unity me-2">delete</span>
                                                                                                            <span>{sl.l_delete}</span>
                                                                                                        </button>
                                                                                                    </li>
                                                                                                ) : null
                                                                                            }
                                                                                        </ul>
                                                                                    </div>
                                                                                </div>
                                                                            </td>

                                                                        </tr>

                                                                    );
                                                                })
                                                            }
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* {
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
                                            } */}

                                        </>
                                    ) : null
                                }

                                {
                                    tabIndex === 6 ? (
                                        <>  
                                            <div className="mt-16 px-3 py-4 bg-white shadow" style={{ border: "1px solid #f3f3f3", borderRadius: "16px" }}>
                                                <div className="pl-14 detail-title-font">
                                                    {sl.l_crypto_info}
                                                </div>
                                                <div className="mt-4 table-responsive " style={{ minHeight: "45vh" }}>
                                                    <table className="table table-hover mb-0">
                                                        <thead>
                                                            <tr className="text-nowrap tableRow-title">
                                                                <th className="">
                                                                    {sl.h_crypto_id}
                                                                </th>
                                                                <th className="">
                                                                    {sl.h_key_function}
                                                                </th>
                                                                <th className="">
                                                                    {sl.h_key_algo}
                                                                </th>
                                                                <th className="">
                                                                    {sl.h_bit_size}
                                                                </th>
                                                                <th className="">
                                                                    {sl.h_last_updated}
                                                                </th>
                                                                <th className="" >
                                                                    {sl.h_status}
                                                                </th>
                                                                <th className="" style={{ width: "24px" }} >
                                                                </th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                            {
                                                                processingCodeList.map((record, index) => {
                                                                    return (
                                                                        <tr key={index} className="text-nowrap" style={{ cursor: "pointer", fontSize: "14px" }} >
                                                                            <td className="">
                                                                                {record.code || "-"}
                                                                            </td>
                                                                            <td className="">
                                                                                {"-"}
                                                                            </td>
                                                                            <td className="">
                                                                                {"-"}
                                                                            </td>
                                                                            <td className="">
                                                                                {"-"}
                                                                            </td>
                                                                            <td className="">
                                                                                {record.recordDate || "-"}
                                                                            </td>
                                                                            <td className="">
                                                                                <div className={`${getStatusLabelClass(record.status)}`}
                                                                                    style={{ width: "110px", height: "24px" }} >
                                                                                    {getLabel(sl, record.status, "o_status_")}
                                                                                </div>
                                                                            </td>
                                                                            <td>
                                                                                <div className="dropdown dropstart ">
                                                                                    <span className="d-inline-flex align-items-center " role="button"
                                                                                        data-bs-toggle="dropdown">
                                                                                        <div className="d-flex align-items-center ">
                                                                                            <span className="material-icons fs-18-unity">more_vert</span>
                                                                                        </div>
                                                                                    </span>

                                                                                    <div className="dropdown-menu fs-14-unity border-0 shadow p-0"
                                                                                        style={{ borderRadius: "8px" }} >
                                                                                        <ul className="list-unstyled p-2 mb-0">
                                                                                            <li >
                                                                                                <button
                                                                                                    className="dropdown-item border-bottom d-flex align-items-center"
                                                                                                    type="button">
                                                                                                    <span
                                                                                                        className="material-icons-outlined fs-24-unity me-2">find_in_page</span>
                                                                                                    <span>{sl.l_view_detail}</span>
                                                                                                </button>
                                                                                            </li>
                                                                                            {
                                                                                                check4Right(accessObjectName, `${accessActionPrefix}.delete`) ? (
                                                                                                    <li>
                                                                                                        <button
                                                                                                            className="dropdown-item border-bottom d-flex align-items-center"
                                                                                                            type="button"
                                                                                                            onClick={(e) => click4DeleteRecord(e, record, index)}>
                                                                                                            <span
                                                                                                                className="material-icons-outlined fs-24-unity me-2">delete</span>
                                                                                                            <span>{sl.l_delete}</span>
                                                                                                        </button>
                                                                                                    </li>
                                                                                                ) : null
                                                                                            }
                                                                                        </ul>
                                                                                    </div>
                                                                                </div>
                                                                            </td>

                                                                        </tr>

                                                                    );
                                                                })
                                                            }
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* {
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
                                            } */}

                                        </>
                                    ) : null
                                }

                                {
                                    tabIndex === 7 ? (
                                        <>  
                                            <div className="mt-16 px-3 py-4 bg-white shadow" style={{ border: "1px solid #f3f3f3", borderRadius: "16px" }}>
                                                <div className="pl-14 detail-title-font">
                                                    {sl.l_routing_info}
                                                </div>
                                                <div className="mt-4 table-responsive " style={{ minHeight: "45vh" }}>
                                                    <table className="table table-hover mb-0">
                                                        <thead>
                                                            <tr className="text-nowrap tableRow-title">
                                                                <th className="">
                                                                    {sl.h_routing_id}
                                                                </th>
                                                                <th className="">
                                                                    {sl.h_connector_name}
                                                                </th>
                                                                <th className="">
                                                                    {sl.h_routing_order}
                                                                </th>
                                                                <th className="">
                                                                    {sl.h_link_type}
                                                                </th>
                                                                <th className="">
                                                                    {sl.h_last_updated}
                                                                </th>
                                                                <th className="" >
                                                                    {sl.h_status}
                                                                </th>
                                                                <th className="" style={{ width: "24px" }} >
                                                                </th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                            {
                                                                routingList.map((record, index) => {
                                                                    return (
                                                                        <tr key={index} className="text-nowrap" style={{ cursor: "pointer", fontSize: "14px" }} >
                                                                            <td className="">
                                                                                {record?.routingKey || "-"}
                                                                            </td>
                                                                            <td className="">
                                                                                {record?.routingName || "-"}
                                                                            </td>
                                                                            <td className="">
                                                                                {record?.routingOrder || "-"}
                                                                            </td>
                                                                            <td className="">
                                                                                {record?.linkType || "-"}
                                                                            </td>
                                                                            <td className="">
                                                                                {tBox.formatDate(record?.recordDate)}
                                                                            </td>
                                                                            <td className="">
                                                                                <div className={`${getStatusLabelClass(record.recordStatus)}`}
                                                                                    style={{ width: "110px", height: "24px" }} >
                                                                                    {getLabel(sl, record.recordStatus, "o_status_")}
                                                                                </div>
                                                                            </td>
                                                                            <td>
                                                                                <div className="dropdown dropstart ">
                                                                                    <span className="d-inline-flex align-items-center " role="button"
                                                                                        data-bs-toggle="dropdown">
                                                                                        <div className="d-flex align-items-center ">
                                                                                            <span className="material-icons fs-18-unity">more_vert</span>
                                                                                        </div>
                                                                                    </span>

                                                                                    <div className="dropdown-menu fs-14-unity border-0 shadow p-0"
                                                                                        style={{ borderRadius: "8px" }} >
                                                                                        <ul className="list-unstyled p-2 mb-0">
                                                                                            <li style={{borderLeft: "none", marginLeft: "0rem"}}>
                                                                                                <button
                                                                                                    className="dropdown-item border-bottom d-flex align-items-center"
                                                                                                    type="button">
                                                                                                    <span>{sl.b_view_detail}</span>
                                                                                                </button>
                                                                                            </li>
                                                                                            {
                                                                                                check4Right(accessObjectName, `${accessActionPrefix}.delete`) ? (
                                                                                                    <li style={{borderLeft: "none", marginLeft: "0rem"}}>
                                                                                                        <button
                                                                                                            className="dropdown-item border-bottom d-flex align-items-center"
                                                                                                            type="button"
                                                                                                            onClick={(e) => click4DeleteRecord(e, record, index)}>
                                                                                                            <span>{sl.b_delete}</span>
                                                                                                        </button>
                                                                                                    </li>
                                                                                                ) : null
                                                                                            }
                                                                                        </ul>
                                                                                    </div>
                                                                                </div>
                                                                            </td>

                                                                        </tr>

                                                                    );
                                                                })
                                                            }
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* {
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
                                            } */}

                                        </>
                                    ) : null
                                }

                                {
                                    tabIndex === 8 ? (
                                        <>       
                                            <div className="mt-16 px-3 py-4 bg-white shadow" style={{ border: "1px solid #f3f3f3", borderRadius: "16px" }}>
                                                <div className="d-flex justify-content-end align-items-center">
                                                    <div className="col-4 pe-3">
                                                        <div className="input-group">
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
                                                        </div>
                                                    </div>

                                                    <div>
                                                        {
                                                            check4Right(accessObjectName, `${accessActionPrefix}.add`) ? (
                                                                <button className="btn btn-unity " role="button" title={sl.t_attach_prefix}>
                                                                    {sl.b_attach_prefix}
                                                                </button>
                                                            ) : null
                                                        }
                                                    </div>
                                                    {/* Drawer component */}
                                                    {/* {showPcodeDrawer && (
                                                        <div className="drawer-overlay" onClick={() => setShowPcodeDrawer(false)}>
                                                            <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
                                                                <div className="drawer-title">
                                                                    {sl.l_set_processing_code}
                                                                </div>
                                                                <div className="drawer-description pb-16">
                                                                    {sl.l_select_pcode}
                                                                </div>
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
                                                                    {filteredPcodes.map((item, idx) => (
                                                                        <div key={idx} className="form-check">
                                                                            <input
                                                                            type="radio"
                                                                            id={`pcode-${idx}`}
                                                                            name="pcode"
                                                                            className="form-check-input"
                                                                            checked={selectedPcode.includes(item.code)}
                                                                            onChange={() => togglePcode(item.code)}
                                                                            />
                                                                            <label className="form-check-label" htmlFor={`pcode-${idx}`}>
                                                                                ({item.code}) {item.desc}
                                                                            </label>
                                                                        </div>
                                                                    ))}

                                                                    {filteredPcodes.length === 0 && (
                                                                        <div className="text-muted">
                                                                            {sl.l_no_result_found}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <button className="btn btn-primary  mb-16"
                                                                    disabled={selectedPcode.length === 0}
                                                                    onClick={() => {
                                                                        
                                                                        setShowPcodeDrawer(false);
                                                                        setRedraw(v => v + 1); 
                                                                        }}>
                                                                        {sl.b_apply}
                                                                </button>
                                                                <button className="btn btn-ghost-unity"
                                                                    onClick={() => setShowPcodeDrawer(false)}>
                                                                        {sl.b_cancel}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )} */}
                                                </div>

                                                <div className="mt-4 table-responsive " style={{ minHeight: "45vh" }}>
                                                    <table className="table table-hover mb-0">
                                                        <thead>
                                                            <tr className="text-nowrap tableRow-title">
                                                                <th className="">
                                                                    {sl.h_prefix}
                                                                </th>
                                                                <th className="">
                                                                    {sl.h_priority}
                                                                </th>
                                                                <th className="">
                                                                    {sl.h_last_updated}
                                                                </th>
                                                                <th className="" >
                                                                    {sl.h_status}
                                                                </th>
                                                                <th className="" style={{ width: "24px" }} >
                                                                </th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                            {
                                                                processingCodeList.map((record, index) => {
                                                                    return (
                                                                        <tr key={index} className="text-nowrap" style={{ cursor: "pointer", fontSize: "14px" }} >
                                                                            <td className="">
                                                                                {record.code || "-"}
                                                                            </td>
                                                                            <td className="">
                                                                                {"1"}
                                                                            </td>
                                                                            <td className="">
                                                                                {tBox.formatDate(record?.recordDate) || "-"}
                                                                            </td>
                                                                            <td className="">
                                                                                <div className={`${getStatusLabelClass(record.status)}`}
                                                                                    style={{ width: "110px", height: "24px" }} >
                                                                                    {getLabel(sl, record.status, "o_status_")}
                                                                                </div>
                                                                            </td>
                                                                            <td>
                                                                                <div className="dropdown dropstart ">
                                                                                    <span className="d-inline-flex align-items-center " role="button"
                                                                                        data-bs-toggle="dropdown">
                                                                                        <div className="d-flex align-items-center ">
                                                                                            <span className="material-icons fs-18-unity">more_vert</span>
                                                                                        </div>
                                                                                    </span>

                                                                                    <div className="dropdown-menu fs-14-unity border-0 shadow p-0"
                                                                                        style={{ borderRadius: "8px" }} >
                                                                                        <ul className="list-unstyled p-2 mb-0">
                                                                                            <li >
                                                                                                <button
                                                                                                    className="dropdown-item border-bottom d-flex align-items-center"
                                                                                                    type="button">
                                                                                                    <span
                                                                                                        className="material-icons-outlined fs-24-unity me-2">find_in_page</span>
                                                                                                    <span>{sl.l_view_detail}</span>
                                                                                                </button>
                                                                                            </li>
                                                                                            {
                                                                                                check4Right(accessObjectName, `${accessActionPrefix}.delete`) ? (
                                                                                                    <li>
                                                                                                        <button
                                                                                                            className="dropdown-item border-bottom d-flex align-items-center"
                                                                                                            type="button"
                                                                                                            onClick={(e) => click4DeleteRecord(e, record, index)}>
                                                                                                            <span
                                                                                                                className="material-icons-outlined fs-24-unity me-2">delete</span>
                                                                                                            <span>{sl.l_delete}</span>
                                                                                                        </button>
                                                                                                    </li>
                                                                                                ) : null
                                                                                            }
                                                                                        </ul>
                                                                                    </div>
                                                                                </div>
                                                                            </td>

                                                                        </tr>

                                                                    );
                                                                })
                                                            }
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* {
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
                                            } */}
                                        </>
                                    ) : null
                                }

                                {/* {
                                    tabIndex === 2 ? (
                                        <ClosablePanel name="transaction_type"
                                            title={sl.l_transaction_type}
                                            closeFlag={closePanel?.transaction_type}
                                            callback4Toggle={callback4TogglePanel}>
                                            <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                style={{ minHeight: "168px" }} >
                                                <div className="pl-24 pr-24 py-1 w-100">

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
                                } */}

                                {/* {
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
                                                                <div className="pl-24 pr-24 py-1 w-100">

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
                                } */}


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
        <div className="d-flex table-content-padding">
            <div className="col-4 table-key">
                {label}
            </div>
            <div className="col-8 table-value">
                {value || "-"}
            </div>
        </div>
    );
};