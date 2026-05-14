import * as react from "react";
import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import * as apiBox from "./apiBox.js";
import { globalContext } from "./globalContext.js";

// import { ErrorLine } from "./ErrorLine.js";
import { DumpPanel } from "./DumpPanel.js";

import { SideBar } from "./SideBar.js";
import { TitlePanel } from "./TitlePanel.js";
import { FooterPanel } from "./FooterPanel.js";
import { PaginationPanel } from "./PaginationPanel.js";

import { showConfirmDialogBox } from "./ConfirmDialogBox.js";
import { showStateDialogBox, closeStateDialogBox } from "./StateDialogBox.js";
import { showInfoDialogBox } from "./InfoDialogBox.js";

import { cleanUp as cleanUp4Detail } from "./TransactionHistoryDetailPage.js";

import responseCodeMap from "./kswitchresponsecode.json";
import pcodeMap from "./kswitchpcode.json";

// Map loaded lib here ...
const uuidv4 = window.uuidv4;
const moment = window.moment;

let dataList = [];
let fieldList = [];

let tableName = "kswitch_fin_log";
let databaseName = "kdb";

const accessObjectName = "webapp_configuration_access";
const accessActionPrefix = "transaction_history";

let cursorId = undefined;
let pageObject = {
    totalRecord: 0,
    pageSize: 10,
    page: 1
};

export let searchObject = {
    searchText: ""
};

let currencyList = [];

export function cleanUp() {
    dataList = [];
    fieldList = [];

    // cursorId = undefined;
    pageObject = {
        totalRecord: 0,
        pageSize: 10,
        page: 1
    };

    // searchObject = { ...defaultSearchObject };
    searchObject = {
        searchText: ""
    };

    return;
};

export function TransactionHistoryOverviewPageV2({ debugMode = true }) {
    const componentName = "TransactionHistoryOverviewPageV2";
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

    const navigate = reactRouter.useNavigate();
    const location = reactRouter.useLocation();

    const filterData = location.state?.filterData || {};
    const activeFilterList = buildActiveFilterList(filterData);

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);

        let timer = setTimeout(async () => {
            if (refresh) loadDataList();
        }, 100);

        return () => {
            if (debugMode) console.log(`Unmount ${componentName}`);
            clearTimeout(timer);
        };
    }, [refresh]);

    react.useEffect(() => {
        pageObject.page = 1;
        setReset(true);
        setRefresh(true);
    }, [location.state?.filterData]);

    react.useEffect(() => {
        const tooltipTriggerList = document.querySelectorAll(
            '[data-bs-toggle="tooltip"]'
        );

        tooltipTriggerList.forEach((el) => {
            new window.bootstrap.Tooltip(el);
        });
    }, []);

    
    // event handling function here ...

    async function loadDataList() {
        showStateDialogBox();

        try {
            dataList = [];

            // check for user access right
            if (!check4Right(accessObjectName, `${accessActionPrefix}.access`)) {
                throw ({ errorCode: "permission_denied" });
            }

            // create cursor
            if (reset) {
                if (cursorId !== undefined) {
                    await apiBox.destroyCursor(getSessionToken(), cursorId);
                }

                let result1 = await apiBox.describeTable(getSessionToken(), databaseName, tableName);
                if (result1.flag && result1.data) {
                    fieldList = result1.data?.fields;
                }
                else throw (result1);

                cursorId = undefined;
                pageObject.totalRecord = 0;

                let filterData = location.state?.filterData || {};
                let s = undefined;

                if (filterData && Object.keys(filterData).length > 0) {
                    s = buildAdvancedSelector(filterData);
                }
                else {
                    let search = tBox.buildSearchString(fieldList, searchObject.searchText, config.dbType);
                    s = search ? `${search} order by rowId desc` : "1=1 order by rowId desc";
                }

                let result2 = await apiBox.createCursor(getSessionToken(), databaseName, tableName, s);
                console.log("result2:", result2);
                
                if (result2.flag && result2.data) {
                    cursorId = result2.data?.cursor?.identifier;
                    pageObject.totalRecord = result2.data?.cursor?.totalRecords;
                }
                else throw (result2);

                currencyList = await getCurrencyList();
            }

            // fetch data from cursor
            fixPage();
            let result4 = await apiBox.rewindNFetch(getSessionToken(), cursorId, pageObject.page, pageObject.pageSize);

            if (result4.flag) {
                let list1 = result4.data.records;
                dataList = [...list1];

                console.log("Data list", dataList);
            }
            else throw (result4);
        }
        catch (e) {
            console.warn("Error", e);
            let message = tBox.getErrorMessage(e, sl);
            // showInfoDialogBox(message);
            // if (tBox.isBlockErrorCode(e)) updateUser(undefined);
            const lowerMessage = String(message || "").toLowerCase();

            if (
                lowerMessage.includes("no record") ||
                lowerMessage.includes("no records") ||
                lowerMessage.includes("not found")
            ) {
                dataList = [];
                pageObject.totalRecord = 0;
            } else {
                showInfoDialogBox(message);
            }

            if (tBox.isBlockErrorCode(e)) updateUser(undefined);
        }
        finally {
            closeStateDialogBox();
            setRefresh(false);
            setReset(false);

            window.scrollTo(0, 0);
        }
    };

    function fixPage() {
        if (pageObject.totalRecord === 0) {
            pageObject.page = 1;
            return;
        }

        let totalPage = Math.ceil(pageObject.totalRecord / pageObject.pageSize);
        if (debugMode) console.log("Fix page", pageObject, totalPage);

        if (pageObject.page > totalPage)
            pageObject.page = totalPage;

        return;
    };

    function getLabel(sl, value, prefix = "") {
        if (debugMode) console.log("Get label ", value, prefix);
        let key = prefix + value;
        let s = sl[key];
        return s;
    };

    function getStatusLabelClass(v) {
        if (debugMode) console.log("Get status label class", v);

        const successCodes = ["0", "7", "10", "80", "83"];
        let baseClass = "d-flex justify-content-center align-items-center border-r4 text-center text-capitalize fs-12-unity fw-normal";

        if (v === undefined || v === null || v === "") return baseClass;
        if (successCodes.includes(String(v))) {
            return baseClass + " border border-success text-success success-background";
        }

        return baseClass + " border border-danger text-danger danger-background";
    };

    function click4RecordDetail(e, record, index) {
        if (debugMode) console.log("Click for record detail", e, record, index);

        let sp = new URLSearchParams({
            rowId: record.recordData.rowId,
        });

        let path = {
            pathname: "/transactionHistoryDetailV2",
            search: sp.toString(),
        };

        cleanUp4Detail();
        navigate(path, {
            state: {
                filterData: location.state?.filterData || {}
            }
        });

        return;
    };

    function click4Search(e) {
        if (debugMode) console.log("Click for search or refresh", e);
        pageObject.page = 1;

        setReset(true);
        setRefresh(true);

        return;
    };

    function keyPress4SearchText(e) {
        if (debugMode) console.log("Key presss for search", e);

        if (e.key == "Enter") {
            pageObject.page = 1;

            setReset(true);
            setRefresh(true);
        }

        return;
    };

    function change4SearchText(e) {
        if (debugMode) console.log("Change for search text ", e);
        let s = e.target.value;

        searchObject.searchText = s;
        setRedraw((v) => v + 1);

        return;
    };

    function callback4ChangePageSize(n) {
        if (debugMode) console.log("Callback for change page size ", n);
        console.log("Page object", pageObject);
        pageObject.page = 1;
        setReset(true);
        setRefresh(true);

        return;
    };

    function callback4ChangePage(n) {
        if (debugMode) console.log("Callback for change page ", n);
        console.log("Page object", pageObject);

        setRefresh(true);

        return;
    };

    function buildFilterData(obj) {
        if (debugMode) console.log("Build search or filter data", obj);

        if (obj === undefined || obj === null) return undefined;
        let obj2 = {
            transaction: {
                localDate: {},
                status: {},
                captureMode: {},
                messageTypeIdentifiers: [],
                type: {},
            },
        };

        if (obj.searchText) obj2.searchText = "%" + obj.searchText + "%";

        if (obj.startDate) obj2.transaction.localDate.start = moment(obj.startDate).format("YYYY-MM-DD");
        if (obj.endDate) obj2.transaction.localDate.end = moment(obj.endDate).format("YYYY-MM-DD");

        if (obj?.filterObject?.statusMap) {
            let map = obj.filterObject.statusMap;
            for (let key in map) {
                if (debugMode) console.log("Key", key);
                let record = map[key];
                if (record.value) {
                    if (key == "approved") obj2.transaction.status.success = true;
                    if (key == "declined") obj2.transaction.status.failed = true;
                }
            }
        }

        if (obj?.filterObject?.posEntryModeMap) {
            let map = obj.filterObject.posEntryModeMap;
            for (let key in map) {
                if (debugMode) console.log("Key", key);
                let record = map[key];
                if (record.value) {
                    if (key == "chip") obj2.transaction.captureMode.chip = true;
                    if (key == "magnetic") obj2.transaction.captureMode.magneticStripe = true;
                    if (key == "manual") obj2.transaction.captureMode.manualEntry = true;
                }
            }
        }

        if (obj?.filterObject?.mtiMap) {
            let map = obj.filterObject.mtiMap;
            for (let key in map) {
                if (debugMode) console.log("Key", key);
                let record = map[key];
                if (record.value) {
                    obj2.transaction.messageTypeIdentifiers.push(parseInt(key));
                }
            }
        }

        if (obj?.filterObject?.transactionTypeMap) {
            let map = obj.filterObject.transactionTypeMap;
            for (let key in map) {
                if (debugMode) console.log("Key", key);
                let record = map[key];
                if (record.value) {
                    if (key == "purchase") obj2.transaction.type.purchase = true;
                    if (key == "refund") obj2.transaction.type.refund = true;
                }
            }
        }

        return obj2;
    };

    function formatPcodeDisplay(pcode) {
        if (pcode === undefined || pcode === null) return "-";

        const pcodeStr = String(pcode).padStart(6, "0");

        // get first 2 digits
        const key = String(parseInt(pcodeStr.substring(0, 2)));

        return pcodeMap?.[key]?.value || "-";
    }

    function formatResponseCodeDisplay(rc) {
        if (rc === undefined || rc === null) return "-";
        const key = String(rc);

        return responseCodeMap?.[key]?.value || "-";
    }

    function formatToUTCDateTime(date) {
        const pad = (n) => String(n).padStart(2, "0");

        return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
        `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
    }

    function getStartDateByRange(range) {
        let now = new Date();
        let start = new Date(now);

        switch (range) {
            case "1h":
                start.setHours(now.getHours() - 1);
                break;
            case "12h":
                start.setHours(now.getHours() - 12);
                break;
            case "24h":
                start.setHours(now.getHours() - 24);
                break;
            case "7d":
                start.setDate(now.getDate() - 7);
                break;
            default:
                start.setHours(now.getHours() - 1);
                break;
        }

        return start;
    }

    function escapeSqlValue(v) {
        if (v === undefined || v === null) return "";
        return String(v).replace(/'/g, "''");
    }

    function buildAdvancedSelector(filterData = {}) {
        let conditions = [];

        if (filterData.shortPan) {
            conditions.push(`shortPan = ${Number(filterData.shortPan)}`);
        }
        
        if (filterData.trace) {
            conditions.push(`CAST(trace AS CHAR) LIKE '%${escapeSqlValue(filterData.trace)}%'`);
        }

        if (filterData.retrievalRefnum) {
            conditions.push(`CAST(retrievalRefnum AS CHAR) LIKE '%${escapeSqlValue(filterData.retrievalRefnum)}%'`);
        }

        if (filterData.switchTxnId) {
            const keyword = escapeSqlValue(filterData.switchTxnId.trim());
            conditions.push(`(CAST(switchTxnId AS CHAR) LIKE '%${keyword}%' OR CAST(switchOrigTxnId AS CHAR) LIKE '%${keyword}%')`);
        }

        if (filterData.acceptorTerminalId) {
            conditions.push(`CAST(acceptorTerminalId AS CHAR) LIKE '%${escapeSqlValue(filterData.acceptorTerminalId)}%'`);
        }
        if (filterData.acceptorIdCode) {
            conditions.push(`CAST(acceptorIdCode AS CHAR) LIKE '%${escapeSqlValue(filterData.acceptorIdCode)}%'`);
        }

        if (filterData.recordDate === "custom" && filterData.dateFrom && filterData.dateTo) {
            let localStartDate = new Date(filterData.dateFrom + "T00:00:00");
            let localEndDate = new Date(filterData.dateTo + "T23:59:59");

            let utcStartDate = formatToUTCDateTime(localStartDate);
            let utcEndDate = formatToUTCDateTime(localEndDate);

            conditions.push(`recordDate >= '${utcStartDate}'`);
            conditions.push(`recordDate <= '${utcEndDate}'`);
        }
        else if (filterData.recordDate) {
            let startDate = formatToUTCDateTime(getStartDateByRange(filterData.recordDate));
            let endDate = formatToUTCDateTime(new Date());

            conditions.push(`recordDate >= '${startDate}'`);
            conditions.push(`recordDate <= '${endDate}'`);
        }

        if (conditions.length === 0) return "1=1 order by rowId desc";

        return `${conditions.join(" and ")} order by rowId desc`;
    }

    function click4OpenSearchBox() {
        navigate("/searchBox", {
            state: {
                filterData: location.state?.filterData || {}
            }
        });

        return;
    }

    function buildActiveFilterList(filterData = {}) {
        let list = [];

        if (filterData.recordDate) {
            let recordDateLabelMap = {
                "1h": sl.o_last_1_hour,
                "12h": sl.o_last_12_hours,
                "24h": sl.o_last_24_hours,
                "7d": sl.o_last_7_days,
            };

            if (
                filterData.recordDate === "custom" &&
                filterData.dateFrom &&
                filterData.dateTo
            ) {
                list.push({
                    key: "recordDate",
                    label: (
                        <>
                            <span className="border-right-blue pr-8">
                                {sl.l_record_date}
                            </span>

                            <span className="dark-blue-font fw-semibold pl-8">
                                {moment(filterData.dateFrom).format("DD MMM YYYY")} -{" "}
                                {moment(filterData.dateTo).format("DD MMM YYYY")}
                            </span>
                        </>
                    )
                });
            } else {
                list.push({
                    key: "recordDate",
                    label: (
                        <>
                            <span className="border-right-blue pr-8">
                                {sl.l_record_date}
                            </span>

                            <span className="dark-blue-font fw-semibold pl-8">
                                {recordDateLabelMap[filterData.recordDate]}
                            </span>
                        </>
                    )
                });
            }
        }

        if (filterData.shortPan) {
            list.push({
                key: "shortPan",
                label: (
                    <>
                        <span className="border-right-blue pr-8">{sl.l_masked_pan}</span> <span className="dark-blue-font fw-semibold pl-8"> {filterData.shortPan}</span>
                    </>
                )
            });
        }

        if (filterData.trace) {
            list.push({
                key: "trace",
                label: (
                    <>
                        <span className="border-right-blue pr-8">{sl.l_trace}</span> <span className="dark-blue-font fw-semibold pl-8"> {filterData.trace}</span>
                    </>
                )
            });
        }

        if (filterData.retrievalRefnum) {
            list.push({
                key: "retrievalRefnum",
                label: (
                    <>
                        <span className="border-right-blue pr-8">{sl.l_ref_code}</span> <span className="dark-blue-font fw-semibold pl-8"> {filterData.retrievalRefnum}</span>
                    </>
                )
            });
        }

        if (filterData.switchTxnId) {
            list.push({
                key: "switchTxnId",
                label: (
                    <>
                        <span className="border-right-blue pr-8">{sl.l_switch_txn_id}</span> <span className="dark-blue-font fw-semibold pl-8"> {filterData.switchTxnId}</span>
                    </>
                )
            });
        }

        if (filterData.acceptorTerminalId) {
            list.push({
                key: "acceptorTerminalId",
                label: (
                    <>
                        <span className="border-right-blue pr-8">{sl.l_acceptor_terminal_id}</span> <span className="dark-blue-font fw-semibold pl-8"> {filterData.acceptorTerminalId}</span>
                    </>
                )
            });
        }

        if (filterData.acceptorIdCode) {
            list.push({
                key: "acceptorIdCode",
                label: (
                    <>
                        <span className="border-right-blue pr-8">{sl.l_acceptor_id_code}</span> <span className="dark-blue-font fw-semibold pl-8"> {filterData.acceptorIdCode}</span>
                    </>
                )
            });
        }

        return list;
    }

    function removeFilter(key) {
        let current = location.state?.filterData || {};

        // clone object
        let newFilter = { ...current };

        // remove selected filter
        delete newFilter[key];

        if (key === "recordDate") {
            delete newFilter.dateFrom;
            delete newFilter.dateTo;
        }

        // navigate again with updated filter
        navigate(location.pathname, {
            replace: true,
            state: {
                filterData: newFilter
            }
        });
    }

    function click4Refresh() {
        if (debugMode) console.log("Click for refresh");

        pageObject.page = 1;
        setReset(true);
        setRefresh(true);

        return;
    }

    function renderEmptyState() {
        return (
            <div
                className="d-flex flex-column align-items-center justify-content-center text-center"
                style={{ minHeight: "420px" }}
            >
                <div className="mb-16">
                    <div
                        className="d-flex align-items-center justify-content-center rounded-circle"
                        style={{
                            width: "72px",
                            height: "72px",
                            background: "#F3F4F6",
                            color: "#A0A4A8",
                            fontSize: "34px",
                            margin: "0 auto",
                        }}
                    >
                        <img src="images/Visual.svg" alt="No records"/>
                    </div>
                </div>

                <div className="fw-bold mb-8" style={{ fontSize: "20px", color: "#202224" }}>
                    {sl.l_no_records_found} 
                </div>

                <div className="mb-24" style={{ fontSize: "14px", color: "#6D7172" }}>
                    {sl.l_set_filters}
                </div>

                <button
                    type="button"
                    className="btn btn-primary px-4"
                    onClick={click4OpenSearchBox}
                    style={{ minWidth: "180px" }}
                >
                    {sl.b_adjust_filters}
                </button>
            </div>
        );
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
                        {/* <div className="col-12 pt-8 previous-font" 
                            onClick={() =>
                                navigate("/searchBox", {
                                    state: {
                                        filterData: location.state?.filterData || {}
                                    }
                                })
                            }>
                            <i className="fas fa-chevron-left fa-fw"></i>
                            {sl.l_search}
                        </div> */}

                        <div className="col-12 pt-12 pb-16">
                            <div className="title-font fw-bold">
                                {sl.l_title}
                            </div>
                        </div>

                        <div className="mt-16 px-3 py-4 bg-white shadow" style={{ border: "1px solid #f3f3f3", borderRadius: "16px" }}>
                            <div className="d-flex justify-content-between align-items-start">
                                <div className="col-9 d-flex flex-wrap gap-2">
                                    {activeFilterList.map((item) => (
                                        <div
                                            key={item.key}
                                            className="d-inline-flex align-items-center"
                                            style={{
                                                border: "1px solid #619FCB",
                                                borderRadius: "999px",
                                                padding: "6px",
                                                color: "#619FCB",
                                                fontSize: "14px",
                                                backgroundColor: "#FFFFFF",
                                            }}
                                        >
                                            {/* label */}
                                            {item.label}

                                            {/* remove button */}
                                            {/* <span
                                                className="material-icons-outlined"
                                                style={{
                                                    fontSize: "16px",
                                                    marginLeft: "8px",
                                                    cursor: "pointer",
                                                    color: "#619FCB",
                                                }}
                                                onClick={() => removeFilter(item.key)}
                                            >
                                                close
                                            </span> */}
                                        </div>
                                    ))}
                                </div>
                                <div className="ms-3">
                                    <div className="">
                                        <button className="btn border-gray mr-16"
                                            type="button"
                                            onClick={click4Refresh}
                                        >
                                            <span className="material-icons pr-4px" style={{ color: "#494D4F" }} >refresh</span>
                                            <span className="">{sl.b_refresh}</span>
                                        </button>
                                        <button className="btn border-gray"
                                            type="button"
                                            onClick={click4OpenSearchBox}>
                                            <span className="material-icons " style={{ color: "#494D4F" }} >tune</span>
                                        </button>
                                    </div>
                                </div>
                                {/* end of search section */}
                            </div>  
                            {/* end of search and filter section */}

                            <div className="mt-4" style={{ minHeight: "45vh" }}>
                                {dataList.length === 0 ? (
                                    renderEmptyState()
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead>
                                                <tr className="text-nowrap tableRow-title">
                                                    {/* <th className="" >
                                                        rowId
                                                    </th> */}
                                                    
                                                    <th className="">
                                                        {sl.h_mti}
                                                        <span
                                                            className="ms-1 material-icons text-dark"
                                                            role="button"
                                                            style={{ fontSize: "12px" }}
                                                            data-bs-toggle="tooltip"
                                                            title={sl.t_mti}>
                                                            info
                                                        </span>
                                                    </th>
                                                    <th className="">
                                                        {sl.h_trace}
                                                        <span
                                                            className="ms-1 material-icons text-dark"
                                                            role="button"
                                                            style={{ fontSize: "12px" }}
                                                            data-bs-toggle="tooltip"
                                                            title={sl.t_trace}>
                                                            info
                                                        </span>
                                                    </th>
                                                    <th className="" >
                                                        {sl.h_masked_pan}
                                                    </th>
                                                    <th className="">
                                                        {sl.h_local_date}
                                                        <span
                                                            className="ms-1 material-icons text-dark"
                                                            role="button"
                                                            style={{ fontSize: "12px" }}
                                                            data-bs-toggle="tooltip"
                                                            title={sl.t_local_dateTime}>
                                                            info
                                                        </span>
                                                    </th>
                                                    <th className="text-end">
                                                        {sl.h_amount}
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {
                                                    dataList.map((record, index) => {
                                                        console.log("Build row", record, index);
                                                        return (
                                                            <react.Fragment key={index}>
                                                                <tr className="text-nowrap" style={{ cursor: "pointer", fontSize: "14px", borderBottom: "1px solid #ffffff" }} >
                                                                    {/* <td className=" "
                                                                        onClick={(e) => click4RecordDetail(e, record, index)}>
                                                                        {record.recordData.rowId || "-"}
                                                                    </td> */}

                                                                    <td className=" "
                                                                        onClick={(e) => click4RecordDetail(e, record, index)}>
                                                                        <div className="d-flex flex-column">
                                                                            <div>
                                                                                {record.recordData.mti || "-"}
                                                                            </div>
                                                                        </div> 
                                                                    </td>

                                                                    <td className=" "
                                                                        onClick={(e) => click4RecordDetail(e, record, index)}>
                                                                        {record.recordData.trace || "-"}
                                                                    </td>

                                                                    {/* <td className=" "
                                                                        onClick={(e) => click4RecordDetail(e, record, index)}>
                                                                        <div className="d-flex flex-column">
                                                                            <div>
                                                                                {record.recordData.responseCode !== undefined && record.recordData.responseCode !== null
                                                                                ? String(record.recordData.responseCode).padStart(4, "0")
                                                                                : "-"} 
                                                                            </div>
                                                                            <div className="text-muted" style={{ fontSize: "12px" }}>
                                                                                {record.recordData.authIdResp || "-"}
                                                                            </div>
                                                                        </div>
                                                                    </td> */}

                                                                    <td className=" "
                                                                        onClick={(e) => click4RecordDetail(e, record, index)}>
                                                                        {record.recordData.maskedPan || "-"}
                                                                    </td>

                                                                    <td className=" "
                                                                        onClick={(e) => click4RecordDetail(e, record, index)}>
                                                                        {tBox.formatDateOnly(record.recordData.localTransactionDate) || "-"}
                                                                        {/* {tBox.formatLocalDateTime(
                                                                            record.recordData.localTransactionDate,
                                                                            record.recordData.localTransactionTime
                                                                        )} */}
                                                                    </td>

                                                                    {/* <td className=" "
                                                                        onClick={(e) => click4RecordDetail(e, record, index)}>
                                                                        <div className="d-flex flex-column">
                                                                            <div>
                                                                                {record.recordData.pcode !== undefined && record.recordData.pcode !== null
                                                                                ? String(record.recordData.pcode).padStart(6, "0")
                                                                                : "-"}
                                                                            </div>
                                                                        </div>
                                                                    </td> */}

                                                                    <td className=" text-end"
                                                                        onClick={(e) => click4RecordDetail(e, record, index)}>
                                                                        {tBox.getCurrencyAlphaCode(currencyList, record.recordData.transactionCcy) + " "}
                                                                        {tBox.formatAmount(record.recordData.transactionAmount,
                                                                            tBox.getCurrencyMinorUnit(currencyList, record.recordData.transactionCcy)) || "-"}
                                                                    </td>
                                                                </tr>

                                                                <tr className="text-nowrap" style={{ cursor: "pointer", fontSize: "14px" }} >
                                                                    <td colSpan={5} className="p-0" onClick={(e) => click4RecordDetail(e, record, index)}>
                                                                        <div className="transaction-history-sub-content">
                                                                            <div className="sub-block">
                                                                                <div className="sub-label">{sl.h_orchestration_step}</div>
                                                                                <div className="sub-value">
                                                                                    {record.recordData.orchestrationStep || "-"}
                                                                                </div>
                                                                            </div>

                                                                            <div className="sub-block">
                                                                                <div className="sub-label">{sl.h_response}</div>
                                                                                <div className={`${getStatusLabelClass(record.recordData.responseCode)}`} style={{ padding: "4px 8px", width: "85%" }}>
                                                                                    {formatResponseCodeDisplay(record.recordData.responseCode)}
                                                                                </div>
                                                                            </div>

                                                                            <div className="sub-block">
                                                                                <div className="sub-label">{sl.h_processing_code}</div>
                                                                                <div className="sub-value">
                                                                                    {record.recordData.pcode} - {formatPcodeDisplay(record.recordData.pcode)}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            </react.Fragment>
                                                        );
                                                    })
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="mt-3">
                                <PaginationPanel pageObject={pageObject}
                                    callback4ChangePage={callback4ChangePage}
                                    callback4ChangePageSize={callback4ChangePageSize} />
                            </div>
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