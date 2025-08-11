
import * as react from "react";
import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import * as apiBox from "./apiBox.js";
import { globalContext } from "./globalContext.js";

// import { ErrorLine } from "./ErrorLine.js";
import { DumpPanel } from "./DumpPanel.js";
import { Card } from "./Card.js";

import { SideBar } from "./SideBar.js";
import { TitlePanel } from "./TitlePanel.js";
import { FooterPanel } from "./FooterPanel.js";
import { PaginationPanel } from "./PaginationPanel.js";

import { showConfirmDialogBox } from "./ConfirmDialogBox.js";
import { showStateDialogBox, closeStateDialogBox } from "./StateDialogBox.js";
import { showInfoDialogBox } from "./InfoDialogBox.js";

import { cleanUp as cleanUp4Detail } from "./InstitutionDetailPage.js";


// Map loaded lib here ...
const uuidv4 = window.uuidv4;
const moment = window.moment;

let dataList = [];
let fieldList = [];

let tableName = "kswitchinstitution";
let databaseName = "kdb";

const accessObjectName = "webapp_configuration_access";
const accessActionPrefix = "cryptogram_management";

let cursorId = undefined;
let pageObject = {
    totalRecord: 0,
    pageSize: 10,
    page: 1
};

let searchObject = {
    searchText: ""
};


export function cleanUp() {
    dataList = [];
    fieldList = [];

    // cursorId = undefined;
    pageObject = {
        totalRecord: 0,
        pageSize: 10,
        page: 1
    };

    searchObject = {
        searchText: ""
    };

    return;
};

export function InstitutionManagementPage({ debugMode = true }) {
    const componentName = "InstitutionManagementPage";
    if (debugMode) console.log(`${componentName} component start ...`);

    // let data = reactRouter.useLoaderData();
    const {
        config, localData, gsl, dataset, user,
        applicationDebugMode, applicationLanguage,
        updateUser,
        getSessionToken, getUsername,
        check4Right,
        appRedraw
    } = react.useContext(globalContext);

    // check from context
    if (applicationDebugMode !== undefined) debugMode = applicationDebugMode;
    let sl = tBox.getStringLabel(gsl, componentName);

    // const inputFileRef = react.useRef();
    let [redraw, setRedraw] = react.useState(0);
    let [refresh, setRefresh] = react.useState(true);
    let [reset, setReset] = react.useState(true);

    const navigate = reactRouter.useNavigate();

    /*
    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect for app redraw`);
        setRefresh(true);

    }, [appRedraw]);
    */

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

                let result1 = await apiBox.describeTable(getSessionToken(), databaseName, tableName);
                if (result1.flag && result1.data) {
                    fieldList = result1.data?.fields;
                }
                else throw (result1);

                cursorId = undefined;
                pageObject.totalRecord = 0;

                // let s = buildSearchString(searchObject.searchText);
                let s = tBox.buildSearchString(fieldList, searchObject.searchText, config.dbType);

                let result2 = await apiBox.createCursor(getSessionToken(), databaseName, tableName, s);
                if (result2.flag && result2.data) {
                    cursorId = result2.data?.cursor?.identifier;
                    pageObject.totalRecord = result2.data?.cursor?.totalRecords;
                }
                else throw (result2);
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

        if (v == "1") return s + "bg-success";
        if (v == "3") return s + "bg-warning";
        return s + "bg-danger";
    };

    function click4RecordDetail(e, record, index) {
        if (debugMode) console.log("Click for record detail", e, record, index);

        let sp = new URLSearchParams({
            rowId: record.recordData.rowId,
        });

        let path = {
            pathname: "/institutionDetail",
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
            pathname: "/editInstitution",
            search: sp.toString(),
        };
        navigate(path);
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

    return (
        <div className="container-fluid px-0 bg-unity-1">
            <TitlePanel />
            <div className="d-flex ">
                <div style={{ ...(dataset?.sideBarWidth) }}>
                    <SideBar />
                </div>

                <div className="flex-fill" style={{ ...(dataset?.mainPanelWidth) }}>

                    <div className="pl-24 pr-24" style={{ minHeight: "100vh", }}>
                        <div className="col-12 pt-8 fs-12-unity grey-font cursor" onClick={() => navigate(-1)}>
                            <i className="fas fa-chevron-left fa-fw"></i>
                            {sl.l_institution_settings}
                        </div>

                        <div className="col-12 pt-12 pb-16">
                            <div className="title-font fw-bold">
                                {sl.l_title}
                            </div>
                        </div>

                        <div className="col-12 d-flex">
                            <Card label={sl.l_institution_last_updated} tip={sl.t_insti_last} numCount="150"/>
                            <Card label={sl.l_active_institution} tip={sl.t_insti_last} numCount="15"/>
                            <Card label={sl.l_total_institution} tip={sl.t_insti_last} numCount="10"/>
                        </div>

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
                                            <button className="btn btn-unity " role="button" title={sl.t_add_record}
                                                onClick={click4AddRecord}>
                                                {sl.b_add_institution}
                                            </button>
                                        ) : null
                                    }
                                </div>
                            </div>

                            <div className="mt-4 table-responsive " style={{ minHeight: "45vh" }}>
                                <table className="table table-hover mb-0">
                                    <thead>
                                        <tr className="text-nowrap tableRow-title">
                                            <th className="">
                                                {sl.h_institution_id}
                                            </th>
                                            <th className="">
                                                {sl.h_institution_timer_id}
                                            </th>
                                            <th className="" >
                                                {sl.h_institution_crypto_id}
                                            </th>
                                            <th className="" >
                                                {sl.h_institution_routing_id}
                                            </th>
                                            <th className="">
                                                {sl.l_last_updated}
                                            </th>
                                            <th className="">
                                                {sl.h_status}
                                            </th>
                                            <th className="" style={{ width: "24px" }} >
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {
                                            dataList.map((record, index) => {
                                                return (
                                                    <tr key={index} className="text-nowrap" style={{ cursor: "pointer", fontSize: "14px" }} >
                                                        <td className=""
                                                            onClick={(e) => click4RecordDetail(e, record, index)}>
                                                            {record.recordData.institutionId}
                                                        </td>
                                                        <td className=""
                                                            onClick={(e) => click4RecordDetail(e, record, index)}>
                                                            {record.recordData.institutionTimerId || "-"}
                                                        </td>
                                                        <td className=""
                                                            onClick={(e) => click4RecordDetail(e, record, index)}>
                                                            {record.recordData.institutionCryptoId || "-"}
                                                        </td>
                                                        <td className=""
                                                            onClick={(e) => click4RecordDetail(e, record, index)}>
                                                            {record.recordData.institutionRoutingId || "-"}
                                                        </td>
                                                        <td className=""
                                                            onClick={(e) => click4RecordDetail(e, record, index)}>
                                                            {record.recordData.recordDate || "-"}
                                                        </td>
                                                        <td className=""
                                                            onClick={(e) => click4RecordDetail(e, record, index)}>
                                                            <div className={`${getStatusLabelClass(record.recordData.institutionStatus)}`}
                                                                style={{ width: "110px", height: "24px" }} >
                                                                {getLabel(sl, record.recordData.institutionStatus, "o_status_")}
                                                            </div>
                                                        </td>
                                                        <td >

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
                                                                                type="button"
                                                                                onClick={(e) => click4RecordDetail(e, record, index)}>
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

                            <div className="mt-3">
                                <PaginationPanel pageObject={pageObject}
                                    callback4ChangePage={callback4ChangePage}
                                    callback4ChangePageSize={callback4ChangePageSize} />
                            </div>

                        </div>

                    </div>  {/* end of content panel */}

                    <DumpPanel dataList={[
                        { name: "pageObject", data: pageObject },
                        { name: "fieldList", data: fieldList },
                        { name: "dataList", data: dataList },
                        { name: "sl", data: sl },
                    ]} debugMode={debugMode} />

                </div> {/* end of right panel */}

            </div> {/* end of top part */}

            <FooterPanel />
        </div>
    );
}