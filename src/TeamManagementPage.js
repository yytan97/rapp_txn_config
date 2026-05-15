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

import { cleanUp as cleanUp4Detail } from "./TeamDetailPage.js";

// Map loaded lib here ...
const uuidv4 = window.uuidv4;
const moment = window.moment;

let dataList = [];
let fieldList = [];

const accessObjectName = "webapp_team_user_access";
const accessActionPrefix = "team_management";

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

export function TeamManagementPage({ debugMode = true }) {
    const componentName = "TeamManagementPage";
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
    let [loadIndicator, setLoadIndicator] = react.useState(true);

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
        if (loadIndicator) showStateDialogBox();

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

                // let s = tBox.buildSearchString(fieldList, searchObject.searchText, config.dbType);

                // let result2 = await apiBox.createCursor(getSessionToken(), databaseName, tableName, s);
                let result2 = await apiBox.createUserGroupCursor(getSessionToken(), searchObject.searchText);
                if (result2.flag && result2.data) {
                    cursorId = result2.data?.cursor?.identifier;
                    pageObject.totalRecord = result2.data?.cursor?.totalRecords;
                }
                else throw (result2);
            }

            // fetch data from cursor
            fixPage();
            let result4 = await apiBox.rewindNFetch4UserGroup(getSessionToken(), cursorId, pageObject.page, pageObject.pageSize);

            if (result4.flag) {
                let list1 = result4.data.teams;
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
            setLoadIndicator(true);

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

        if (v == "active") return s + "bg-success";
        return s + "bg-danger";
    };

    function click4RecordDetail(e, record, index) {
        if (debugMode) console.log("Click for record detail", e, record, index);

        let sp = new URLSearchParams({
            teamName: record.name,
        });

        let path = {
            pathname: "/teamDetail",
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
            pathname: "/editTeam",
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

        let message = sl.m_confirm_delete_team;
        message = message.replace(/__parameter_1/, record.name);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");

            showStateDialogBox();
            try {
                let result1 = await apiBox.deleteRecord4UserGroup(getSessionToken(), record.name);

                if (result1 && result1.flag) {

                    let message = sl.m_team_deleted;
                    showInfoDialogBox(message, () => {
                        return;
                    });
  
                    setLoadIndicator(false);
                    setReset(true);
                    setRefresh(true);
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
                    <div className="mt-2 mb-4 mx-4" style={{ minHeight: "100vh", }}>
                        <div className="text-end" style={{ fontSize: "12px", color: "#76797B" }}>
                            {sl.l_last_updated} {tBox.getLastUpdatedDate()}
                        </div>

                        <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                            {sl.l_title} 
                        </div>

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
                                </div>

                                <div>
                                    {
                                        check4Right(accessObjectName, `${accessActionPrefix}.add`) ? (
                                            <button className="btn btn-ghost-unity " role="button" title={sl.t_add_record}
                                                onClick={click4AddRecord}>
                                                <span className="material-icons-outlined">add</span>
                                            </button>
                                        ) : null
                                    }
                                </div>
                            </div>

                            <div className="mt-4 table-responsive " style={{ minHeight: "45vh" }}>
                                <table className="table table-hover mb-0">
                                    <thead>
                                        <tr className="text-nowrap" style={{ fontSize: "12px", color: "#A4A6A7", fontWeight: "600" }} >
                                            <th className="">
                                                {sl.h_no}
                                            </th>
                                            <th className="">
                                                {sl.h_team_name}
                                            </th>
                                            <th className="">
                                                {sl.h_last_update}
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
                                                            {index + 1}
                                                        </td>
                                                        <td className=""
                                                            onClick={(e) => click4RecordDetail(e, record, index)}>
                                                            {record.name || "-"}
                                                        </td>
                                                        <td className=""
                                                            onClick={(e) => click4RecordDetail(e, record, index)}>
                                                            {tBox.formatDate(record.recordTimestamp) || "-"}
                                                        </td>
                                                        <td className=""
                                                            onClick={(e) => click4RecordDetail(e, record, index)}>
                                                            <div className={`${getStatusLabelClass(record.recordStatus)}`}
                                                                style={{ width: "150px", height: "24px" }} >
                                                                {getLabel(sl, record.recordStatus, "o_status_") || record.recordStatus}
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
                                                                                <span>{sl.b_view_detail}</span>
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