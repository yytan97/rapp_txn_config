
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

let defaultSearchObject = {
    searchText: "",
    startDate: moment().subtract(30, 'days').format("YYYY-MM-DD"),
    endDate: moment().format("YYYY-MM-DD"),
    filterObject: {
        statusMap: {
            approved: { label: "Approved", value: false },
            declined: { label: "Declined", value: false },
        },
        posEntryModeMap: {
            chip: { label: "Chip", value: false },
            magnetic: { label: "Magnetic", value: false },
            manual: { label: "Manual", value: false },
        },
        mtiMap: {
            "100": { label: "100", value: false },
            "110": { label: "110", value: false },

            "200": { label: "200", value: false },
            "210": { label: "210", value: false },
            "220": { label: "220", value: false },
            "230": { label: "230", value: false },

            "300": { label: "300", value: false },
            "310": { label: "310", value: false },
            "320": { label: "320", value: false },
            "330": { label: "330", value: false },

            "400": { label: "400", value: false },
            "410": { label: "410", value: false },
            "420": { label: "420", value: false },
            "430": { label: "430", value: false },

            "500": { label: "500", value: false },
            "510": { label: "510", value: false },
        },
        transactionTypeMap: {
            purchase: { label: "Purchase", value: false },
            refund: { label: "Refund", value: false },
        },
    },
};

let searchObject = defaultSearchObject;
let tempFilterObject = {};
let tempSearchObject = {};

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

    searchObject = defaultSearchObject;
    return;
};

export function TransactionHistoryOverviewPage({ debugMode = true }) {
    const componentName = "TransactionHistoryOverviewPage";
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

                /*
                let result1 = await apiBox.describeTable(getSessionToken(), databaseName, tableName);
                if (result1.flag && result1.data) {
                    fieldList = result1.data?.fields;
                }
                else throw (result1);
                */

                cursorId = undefined;
                pageObject.totalRecord = 0;

                let filterData = buildFilterData(searchObject);

                let result2 = await apiBox.getTransactionHistoryList(getSessionToken(), filterData);
                if (result2.flag && result2.data && result2.data?.cursor) {
                    cursorId = result2.data?.cursor?.identifier;
                    pageObject.totalRecord = result2.data?.cursor?.totalRecords;
                }
                else if (result2.flag && result2.data && result2.data?.transactions.length === 0)
                {
                    throw ({ errorCode: "9006" });
                }
                else throw (result2);

                currencyList = await getCurrencyList();

            }

            // fetch data from cursor
            fixPage();
            let result4 = await apiBox.rewindNFetch(getSessionToken(), cursorId, pageObject.page, pageObject.pageSize);

            if (result4.flag) {
                let list1 = result4.data.records;
                /* preprocess 
                list1 = list1.map((item) => {
                    return item
                });
                */

                dataList = [...list1];
                console.log("Data list", dataList);
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

    function buildSearchString(v) {
        if (debugMode) console.log("Build search string", v);

        if (v === undefined || v === "") return undefined;

        let list = fieldList;
        let s = "";
        for (let n = 0; n < list.length; n++) {
            let name = list[n].name;

            if (s !== "") s += " or ";
            s += `${name} like '%%${v}%%'`;

        }
        if (debugMode) console.log("Search string", s);
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

        if (v == "A") return s + "bg-success";
        if (v == "P") return s + "bg-warning";
        return s + "bg-danger";
    };

    function click4RecordDetail(e, record, index) {
        if (debugMode) console.log("Click for record detail", e, record, index);

        let sp = new URLSearchParams({
            switchSequence: record.recordData.switchSequence,
        });

        let path = {
            pathname: "/transactionHistoryDetail",
            search: sp.toString(),
        };

        cleanUp4Detail();
        navigate(path);
        return;
    };

    function click4AddRecord(e, record, index) {
        if (debugMode) console.log("Click for add record", e, record, index);

        let sp = new URLSearchParams({
            editMode: 0
        });

        let path = {
            pathname: "/editCryptogram",
            search: sp.toString(),
        };
        // navigate(path);
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

    function click4DeleteRecord(e, record, index) {
        if (debugMode) console.log("Click for delete record", e, record, index);

        let message = sl.m_confirm_delete_record;
        message = message.replace(/__parameter_1/, record.recordData.rowId);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                // await tBox.sleep(1000 * 1);

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

        if (obj.serachText) obj2.searchText = "%" + obj.searchText + "%";

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

    function getToggleButtonClass(v) {
        let s = " ";

        if (v) s += "btn-unity";
        else s += "btn-outline-unity"

        return s;
    };

    function click4FilterDropDown(e) {
        if (debugMode) console.log("Click for filter drop down", e);
        tempFilterObject = JSON.parse(JSON.stringify(searchObject.filterObject));
        setRedraw((v) => v + 1);
        return;
    };

    function click4ApplyFilter(e) {
        if (debugMode) console.log("Click for apply filter ", e);

        searchObject.filterObject = tempFilterObject;
        
        pageObject.page = 1;

        setReset(true);
        setRefresh(true);
        return;
    };

    function click4ClearFilter(e) {
        if (debugMode) console.log("Click for clear filter ", e);
        e.stopPropagation();

        for (let key1 in tempFilterObject) {
            for (let key2 in tempFilterObject[key1]) {
                if (debugMode) console.log("Clear filter", key1, key2);
                let record = tempFilterObject[key1][key2];
                record.value = false;
            }
        }
        setRedraw((v) => v + 1);
        return;
    };

    function click4DateRangeDropDown(e) {
        if (debugMode) console.log("Click for date range drop down", e);
        tempSearchObject = JSON.parse(JSON.stringify(searchObject));
        setRedraw((v) => v + 1);
        return;
    };

    function click4ApplyDateRange(e) {
        if (debugMode) console.log("Click for apply date range ", e);

        searchObject.startDate = tempSearchObject.startDate;
        searchObject.endDate = tempSearchObject.endDate;

        pageObject.page = 1;

        setReset(true);
        setRefresh(true);
        return;
    };

    function click4ClearDateRange(e) {
        if (debugMode) console.log("Click for clear date range ", e);
        e.stopPropagation();

        tempSearchObject.startDate = "";
        tempSearchObject.endDate = "";
        setRedraw((v) => v + 1);
        return;
    };

    return (
        <div className="container-fluid px-0 bg-unity-1">
            <TitlePanel />
            <div className="d-flex ">
                <div style={{ ...(dataset?.sideBarWidth) }}>
                    <SideBar />
                </div>

                <div className="flex-fill" style={{ ...(dataset?.mainPanelWidth) }}>

                    <div className="mt-2 mb-4 mx-4" style={{ minHeight: "100vh", }}>
                        <div className="text-end" style={{ fontSize: "12px", color: "#76797B" }}>
                            {sl.l_last_updated} {tBox.getLastUpdatedDate()}
                        </div>

                        <div style={{ fontSize: "24px", fontWeight: "bold" }}>{sl.l_title} </div>

                        <div className="mt-3 px-3 py-4 bg-white shadow" style={{ border: "1px solid #f3f3f3", borderRadius: "16px" }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="col-7 pe-3">
                                    <div className="input-group">
                                        <input type="text" className="form-control border-0"
                                            placeholder={sl.p_search}
                                            value={searchObject.searchText || ""}
                                            onChange={change4SearchText}
                                            onKeyDown={keyPress4SearchText}
                                            style={{ backgroundColor: "#F3F3F4", fontSize: "14px" }} />
                                        <button className="btn border-0"
                                            style={{ backgroundColor: "#f3f3f4", "--bs-btn-focus-box-shadow": "0 0 0 0.25rem rgb(97 159 203 / 25%)" }}
                                            type="button"
                                            onClick={click4Search}>
                                            <span className="material-icons " style={{ color: "#A4A6A7" }} >search</span>
                                        </button>
                                    </div>
                                </div>  {/* end of search section */}

                                <div className="col-5 d-flex align-items-center justify-content-evenly">
                                    <div className="dropdown dropstart">
                                        <button className="btn btn-ghost-unity text-nowrap"
                                            onClick={click4FilterDropDown}
                                            role="button"
                                            data-bs-toggle="dropdown"
                                            style={{ height: "40px" }}>
                                            <span className="material-icons-outlined fs-24-unity me-1">filter_list</span>
                                            <span>{sl.b_filter}</span>
                                        </button>
                                        <div className="dropdown-menu" style={{ width: "280px" }}>
                                            <div className="px-3">
                                                <div className="fs-10-unity">* {sl.l_you_can_choose_multiple} </div>
                                                <div className="" style={{ color: "#242627", fontSize: "12px", fontWeight: "bold" }}>
                                                    {sl.l_select_status}
                                                </div>
                                                <div className="row mt-2 mb-3 px-2" onClick={(e) => e.stopPropagation()}>
                                                    {
                                                        Object.keys(tempFilterObject?.statusMap || {}).map((key, index) => {
                                                            let record = tempFilterObject?.statusMap[key];
                                                            return (
                                                                <button key={index}
                                                                    className={"btn btn-sm mx-1 my-1 text-capitalize " + getToggleButtonClass(record.value)}
                                                                    style={{ fontSize: "12px", width: "auto", height: "24px", transition: "none" }}
                                                                    onClick={() => {
                                                                        record.value = !record.value;
                                                                        setRedraw((v) => v + 1);
                                                                    }}>
                                                                    {record.label}
                                                                </button>
                                                            );
                                                        })
                                                    }
                                                </div>

                                                <div className="" style={{ color: "#242627", fontSize: "12px", fontWeight: "bold" }}>
                                                    {sl.l_select_mti}
                                                </div>
                                                <div className="row mt-2 mb-3 px-2" onClick={(e) => e.stopPropagation()}>
                                                    {
                                                        Object.keys(tempFilterObject?.mtiMap || {}).map((key, index) => {
                                                            let record = tempFilterObject?.mtiMap[key];
                                                            return (
                                                                <button key={index}
                                                                    className={"btn btn-sm mx-1 my-1 text-capitalize " + getToggleButtonClass(record.value)}
                                                                    style={{ fontSize: "12px", width: "auto", height: "24px", transition: "none" }}
                                                                    onClick={() => {
                                                                        record.value = !record.value;
                                                                        setRedraw((v) => v + 1);
                                                                    }}>
                                                                    {record.label}
                                                                </button>
                                                            );
                                                        })
                                                    }
                                                </div>

                                                <div className="" style={{ color: "#242627", fontSize: "12px", fontWeight: "bold" }}>
                                                    {sl.l_select_transaction_type}
                                                </div>
                                                <div className="row mt-2 mb-3 px-2" onClick={(e) => e.stopPropagation()}>
                                                    {
                                                        Object.keys(tempFilterObject?.transactionTypeMap || {}).map((key, index) => {
                                                            let record = tempFilterObject?.transactionTypeMap[key];
                                                            return (
                                                                <button key={index}
                                                                    className={"btn btn-sm mx-1 my-1 text-capitalize " + getToggleButtonClass(record.value)}
                                                                    style={{ fontSize: "12px", width: "auto", height: "24px", transition: "none" }}
                                                                    onClick={() => {
                                                                        record.value = !record.value;
                                                                        setRedraw((v) => v + 1);
                                                                    }}>
                                                                    {record.label}
                                                                </button>
                                                            );
                                                        })
                                                    }
                                                </div>

                                                <div className="" style={{ color: "#242627", fontSize: "12px", fontWeight: "bold" }}>
                                                    {sl.l_select_pos_entry_mode}
                                                </div>
                                                <div className="row mt-2 mb-3 px-2" onClick={(e) => e.stopPropagation()}>
                                                    {
                                                        Object.keys(tempFilterObject?.posEntryModeMap || {}).map((key, index) => {
                                                            let record = tempFilterObject?.posEntryModeMap[key];
                                                            return (
                                                                <button key={index}
                                                                    className={"btn btn-sm mx-1 my-1 text-capitalize " + getToggleButtonClass(record.value)}
                                                                    style={{ fontSize: "12px", width: "auto", height: "24px", transition: "none" }}
                                                                    onClick={() => {
                                                                        record.value = !record.value;
                                                                        setRedraw((v) => v + 1);
                                                                    }}>
                                                                    {record.label}
                                                                </button>
                                                            );
                                                        })
                                                    }
                                                </div>

                                                <button className="btn btn-unity "
                                                    type="button"
                                                    style={{ fontSize: "12px", width: "100%" }}
                                                    onClick={click4ApplyFilter}>
                                                    {sl.b_apply}
                                                </button>
                                                <button className="btn btn-ghost-unity mt-1 "
                                                    type="button"
                                                    style={{ fontSize: "12px", width: "100%" }}
                                                    onClick={click4ClearFilter} >
                                                    {sl.b_clear}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="dropdown dropstart">
                                        <button className="btn btn-ghost-unity"
                                            onClick={click4DateRangeDropDown}
                                            role="button"
                                            data-bs-toggle="dropdown"
                                            style={{ height: "40px", width: "40px" }}>
                                            <span className="material-icons-outlined fs-24-unity ">calendar_month</span>
                                        </button>
                                        <div className="dropdown-menu px-3" style={{ width: "280px" }}
                                            ng-click="event.stopPropagation()">
                                            <div className="mb-3 py-2" onClick={(e) => e.stopPropagation()}>
                                                <div className="mb-2">
                                                    <label className="form-label form-label-unity-v2">
                                                        {sl.l_from_date}
                                                    </label>
                                                    <input type="date"
                                                        className="form-control"
                                                        placeholder=""
                                                        value={tempSearchObject.startDate || ""}
                                                        onChange={(e) => {
                                                            tempSearchObject.startDate = e.target.value;
                                                            setRedraw((v) => v + 1);
                                                        }} />
                                                </div>
                                                <div className="">
                                                    <label className="form-label form-label-unity-v2">
                                                        {sl.l_to_date}
                                                    </label>
                                                    <input type="date"
                                                        className="form-control"
                                                        placeholder=""
                                                        value={tempSearchObject.endDate || ""}
                                                        onChange={(e) => {
                                                            tempSearchObject.endDate = e.target.value;
                                                            setRedraw((v) => v + 1);
                                                        }} />
                                                </div>
                                            </div>
                                            <button className="btn btn-unity "
                                                type="button"
                                                style={{ fontSize: "12px", width: "100%" }}
                                                onClick={click4ApplyDateRange} >
                                                {sl.b_apply}
                                            </button>
                                            <button className="btn btn-ghost-unity mt-1 "
                                                type="button"
                                                style={{ fontSize: "12px", width: "100%" }}
                                                onClick={click4ClearDateRange} >
                                                {sl.b_clear}
                                            </button>
                                        </div>
                                    </div>

                                </div>

                            </div>  {/* end of search and filter section */}

                            <div className="mt-4 table-responsive " style={{ minHeight: "45vh" }}>
                                <table className="table table-hover mb-0">
                                    <thead>
                                        <tr className="text-nowrap" style={{ fontSize: "12px", color: "#A4A6A7", fontWeight: "600" }} >
                                            <th className="">
                                                {sl.h_no}
                                            </th>
                                            <th className="">
                                                {sl.h_mti}
                                            </th>
                                            <th className="">
                                                {sl.h_transaction_description}
                                            </th>
                                            <th className="" >
                                                {sl.h_mcc}
                                            </th>
                                            <th className="" >
                                                {sl.h_pos_entry_mode}
                                            </th>
                                            <th className="">
                                                {sl.h_masked_pan}
                                            </th>
                                            <th className="">
                                                {sl.h_local_date}
                                            </th>
                                            <th className="">
                                                {sl.h_response}
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
                                                    <tr key={index} className="text-nowrap" style={{ cursor: "pointer", fontSize: "14px" }} >
                                                        <td className=" "
                                                            onClick={(e) => click4RecordDetail(e, record, index)}>
                                                            {index + 1}
                                                        </td>

                                                        <td className=" "
                                                            onClick={(e) => click4RecordDetail(e, record, index)}>
                                                            {record.recordData.mti}
                                                        </td>

                                                        <td className=" "
                                                            onClick={(e) => click4RecordDetail(e, record, index)}>
                                                            {record.recordData.acceptorNameLocation || "-"}
                                                        </td>

                                                        <td className=" "
                                                            onClick={(e) => click4RecordDetail(e, record, index)}>
                                                            {record.recordData.mcc || "-"}
                                                        </td>

                                                        <td className=" "
                                                            onClick={(e) => click4RecordDetail(e, record, index)}>
                                                            {record.recordData.posEntryMode || "-"}
                                                        </td>

                                                        <td className=" "
                                                            onClick={(e) => click4RecordDetail(e, record, index)}>
                                                            {record.recordData.maskedPan || "-"}
                                                        </td>

                                                        <td className=" "
                                                            onClick={(e) => click4RecordDetail(e, record, index)}>
                                                            {record.recordData.localTransactionDate || "-"}
                                                        </td>

                                                        <td className=" "
                                                            onClick={(e) => click4RecordDetail(e, record, index)}>
                                                            {record.recordData.responseCode || "-"}
                                                        </td>

                                                        <td className=" text-end"
                                                            onClick={(e) => click4RecordDetail(e, record, index)}>
                                                            {tBox.getCurrencyAlphaCode(currencyList, record.recordData.transactionCcy) + " "}
                                                            {tBox.formatAmount(record.recordData.transactionAmount,
                                                                tBox.getCurrencyMinorUnit(currencyList, record.recordData.transactionCcy)) || "-"}
                                                        </td>

                                                    </tr>

                                                );
                                            })
                                        }

                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-3">
                                <PaginationPanel pageObject={pageObject}
                                    callback4ChangePage={callback4ChangePage}
                                    callback4ChangePageSize={callback4ChangePageSize} />
                            </div>

                        </div>

                    </div>  {/* end of content panel */}

                    <DumpPanel dataList={[
                        { name: "searchObject", data: searchObject },
                        { name: "dataList", data: dataList },
                        { name: "sl", data: sl },
                    ]} debugMode={debugMode} />

                </div> {/* end of right panel */}

            </div> {/* end of top part */}

            <FooterPanel />
        </div>
    );
}