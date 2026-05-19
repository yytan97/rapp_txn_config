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

const accessObjectName = "webapp_team_user_access";
const accessActionPrefix = "session_management";

let order4Session = {
    field: {},
    name: undefined,
};

let dataRecord = undefined;
let username = undefined;
let closePanel = {};

let sessionList = [];
let inputData = {};

let formObject = {
    dirty: false,
    valid: false,
    fieldState: {},
};

export function cleanUp() {
    console.log(`Clean up for ${componentName}`);
    dataRecord = undefined;
    username = undefined;
    closePanel = {};

    inputData = {};
    formObject = {
        dirty: false,
        valid: false,
        fieldState: {},
    };

    sessionList = [];

    return;
};

const componentName = "SessionDetailPage";

export function SessionDetailPage({ debugMode = true }) {
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
    }, [location.search]);

    // event handling function here ...

    async function loadDataList() {
        showStateDialogBox();

        try {
            dataRecord = undefined;

            // check for user access right
            if (!check4Right(accessObjectName, `${accessActionPrefix}.access`)) {
                throw ({ errorCode: "permission_denied" });
            }

            // parse parameter 
            const sp = new URLSearchParams(location.search);
            username = sp.get('username');

            // fetch data 
            let result4 = await apiBox.getSessionRecord(getSessionToken(), username);

            if (result4.flag) {
                let list4 = result4.data.users;
                /* preprocess 
                list4 = list4.map((item) => {
                    return item
                });
                */

                dataRecord = list4[0];
                console.log("Record", dataRecord);

                let result5 = await apiBox.getUserSessionList(getSessionToken(), username);
                if (result5.flag) {

                    let list5 = result5.data.sessions;
                    sessionList = list5;
                }
                else sessionList = [];

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
        if (v == "active") return s + "bg-success";
        return s + "bg-danger";
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

    function change4Record(e) {
        if (debugMode) console.log("Form", ref4Form.current.checkValidity());

        formObject.dirty = true;
        formObject.valid = ref4Form.current.checkValidity();
        // formObject.fieldState[e.target.name] = tBox.buildFieldState(e.target);
        let obj = tBox.buildFormFieldState(ref4Form.current);
        formObject.fieldState = obj;

        inputData[e.target.name] = e.target.value;
        setRedraw((v) => v + 1);
        return;
    };

    function click4EditRecord(e, record) {
        if (debugMode) console.log("Click for edit record", e, record);

        let sp = new URLSearchParams({
            rowId: record.rowId,
            editMode: 1
        });

        let path = {
            pathname: "/editBINPrefix",
            search: sp.toString(),
        };
        navigate(path);
        return;
    };

    function click4RemoveSession(e, record) {
        if (debugMode) console.log("Click for remove session", e, record);

        let message = sl.m_confirm_remove_session;
        message = message.replace(/__parameter_1/, record.number);
        showConfirmDialogBox(message, async function () {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {

                let result1 = await apiBox.removeSessionWithID(getSessionToken(), record.identifier);
                if (result1 && result1.flag) {
                    let message = sl.m_session_removed;
                    showInfoDialogBox(message);
                    loadDataList(false);
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

    function click4RemoveUserSession(e) {
        if (debugMode) console.log("Click for remove user session", e);

        let message = sl.m_confirm_remove_session;
        message = message.replace(/__parameter_1/, username);
        showConfirmDialogBox(message, async function () {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {

                let result1 = await apiBox.deleteRecord4Session(getSessionToken(), username);
                if (result1 && result1.flag) {
                    let message = sl.m_session_removed;
                    showInfoDialogBox(message);
                    navigate(-1);
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

    function toggle4Order(e, order, name) {
        if (debugMode) console.log("Toggle for order ", e, order, name);
        changeOrder(order, name);
        setRedraw((v) => v + 1);
        return;
    };

    function changeOrder(order, name) {
        if (debugMode) console.log("Change order", order, name);

        if (order.field[name] === undefined) {
            order.field[name] = {};
        }

        for (let key in order.field) {
            let record = order.field[key];

            if (key === name) {
                // 0 not sorted, 1 for sort asc and 2 for sort desc
                if (record.flag === undefined) record.flag = 0;
                record.flag = record.flag + 1;
                if (record.flag >= 3) record.flag = 0;
                order.name = name;
            }
            else {
                record.flag = 0;
            }
        }

        return;
    };

    function getOrderIndicator(order, name) {
        if (debugMode) console.log("Get order indicator", order, name);

        let record = order.field[name];
        if (record === undefined) return <span style={{ width: "12px" }}></span>;
        else if (record?.flag === 1) return <span><i className="fas fa-sort-asc fa-fw"></i></span>;
        else if (record?.flag === 2) return <span><i className="fas fa-sort-desc fa-fw"></i></span>;

        return <span style={{ width: "12px" }}></span>;
    };

    function sort4SessionOrder(record1, record2) {
        let order = order4Session;
        let name = order.name;
        let numericTypeList = ['number'];

        if (name === undefined || order.field[name] === undefined || order.field[name].flag === undefined) return 0;

        let a = eval(`record1.${name}`);
        let b = eval(`record2.${name}`);
        console.log("Sort", a, b);

        if (numericTypeList.includes(name)) {
            if (a !== 'unlimited') a = eval(`parseFloat(record1.${name})`);
            else a = Infinity;

            if (b !== 'unlimited') b = eval(`parseFloat(record2.${name})`);
            else b = Infinity;

            console.log("Sort numeric type", a, b);
        }

        if (order.field[name].flag === 1) {
            if (a > b) return 1;
            if (a === b) return 0
            if (a < b) return -1;

        }
        else if (order.field[name].flag === 2) {
            if (a > b) return -1;
            if (a === b) return 0
            if (a < b) return 1;
        }
        else return 0;
    };

    return (
        <div className="container-fluid px-0 bg-unity-3">
            <TitlePanel />
            <div className="d-flex ">
                <div style={{ ...(dataset?.sideBarWidth) }}>
                    <SideBar />
                </div>

                <div className="flex-fill" style={{ ...(dataset?.mainPanelWidth) }}>

                    <div className="mt-2 mb-4 mx-4" style={{ minHeight: "100vh", }}>

                        <div className=" d-flex justify-content-between">
                            <div className="col-12 col-md-6 text-white"
                                style={{ fontSize: "12px", color: "#76797B", cursor: "pointer" }}
                                onClick={() => navigate(-1)} >
                                <i className="fas fa-chevron-left fa-fw"></i>{sl.l_previous_page}
                            </div>
                            <div className="text-end text-white" style={{ fontSize: "12px", color: "#76797B" }}>
                                {sl.l_last_updated} {tBox.getLastUpdatedDate()}
                            </div>
                        </div>

                        <div className="d-flex justify-content-center">
                            <div className="col-11 col-xl-9">

                                <div className="" style={{ marginTop: "64px" }}>
                                    <div className="d-flex align-items-center justify-content-center bg-white px-5"
                                        style={{ borderRadius: "16px 16px 16px 16px", border: "1px solid #ebebeb", minHeight: "154px" }}>
                                        <div style={{ width: "100%" }} >
                                            <div className="d-flex justify-content-between">
                                                <div style={{ color: "#494D4F", fontSize: "14px" }} >
                                                    {sl.l_last_activity_timestamp}: {tBox.formatDate(dataRecord?.lastActivityTimestamp)}
                                                </div>
                                                <div className={`${getStatusLabelClass(dataRecord?.recordStatus)}`}
                                                    style={{ color: "#494D4F", fontSize: "14px", width: "110px", height: "24px" }} >
                                                    <span >
                                                        {getLabel(sl, dataRecord?.recordStatus, "o_record_status_") || dataRecord?.recordStatus}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ color: "#494D4F", fontSize: "32px", fontWeight: "bold" }} >
                                                {dataRecord?.name}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <ClosablePanel name="session"
                                        title={sl.l_sessions + ` (${dataRecord?.activeSessions || 0})`}
                                        closeFlag={closePanel?.session}
                                        callback4Toggle={callback4TogglePanel}>
                                        <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                            style={{ minHeight: "168px" }} >
                                            <div className="px-5 py-1 w-100">

                                                <div className="table-responsive " >
                                                    <table className="table table-striped mb-3">
                                                        <thead>
                                                            <tr className="text-nowrap" style={{ fontSize: "12px", color: "#A4A6A7", fontWeight: 600 }}>
                                                                <th className="text-end" style={{ width: "40px" }}>
                                                                    {sl.h_no}
                                                                </th>
                                                                <th className="bg-white text-end"
                                                                    style={{ position: "sticky", left: "0px" }}
                                                                    role="button"
                                                                    onClick={(e) => toggle4Order(e, order4Session, 'number')}>
                                                                    {sl.h_session_number} {getOrderIndicator(order4Session, 'number')}
                                                                </th>
                                                                <th role="button" onClick={(e) => toggle4Order(e, order4Session, 'createTimestamp')}>
                                                                    {sl.h_created_timestamp} {getOrderIndicator(order4Session, 'createTimestamp')}
                                                                </th>
                                                                <th role="button" onClick={(e) => toggle4Order(e, order4Session, 'lastActivityTimestamp')}>
                                                                    {sl.h_last_activity_timestamp} {getOrderIndicator(order4Session, 'lastActivityTimestamp')}
                                                                </th>
                                                                <th className="text-end"  >
                                                                </th>

                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                            {
                                                                sessionList?.toSorted(sort4SessionOrder).map((record, index) => {
                                                                    // console.log("Build table row", record, index);
                                                                    return (
                                                                        <tr key={index}
                                                                            className="text-nowrap"
                                                                            style={{ fontSize: "14px" }} >
                                                                            <td className="text-end"  >
                                                                                {index + 1}
                                                                            </td>
                                                                            <td className="bg-white text-end"
                                                                                style={{ position: "sticky", left: "0px" }} >
                                                                                {record?.number}
                                                                            </td>
                                                                            <td>
                                                                                {tBox.formatDate(record?.createTimestamp) || "-"}
                                                                            </td>
                                                                            <td>
                                                                                {tBox.formatDate(record?.lastActivityTimestamp) || "-"}
                                                                            </td>
                                                                            <td className="text-end">
                                                                                <span className="material-icons-outlined fs-24-unity"
                                                                                    onClick={(e) => click4RemoveSession(e, record)}
                                                                                    role="button" >delete</span>
                                                                            </td>

                                                                        </tr>
                                                                    );
                                                                })
                                                            }

                                                        </tbody>
                                                    </table>
                                                </div>

                                            </div>
                                        </div>

                                        {
                                            check4Right(accessObjectName, `${accessActionPrefix}.delete`) ? (
                                                <div className="d-flex justify-content-end align-items-center px-4 border-top"
                                                    style={{ minHeight: "56px" }}>
                                                    <button className="btn btn-ghost-unity d-flex align-items-center"
                                                        type="button"
                                                        style={{ color: "#494D4F", fontWeight: "500" }}
                                                        onClick={(e) => click4RemoveUserSession(e)}>
                                                        <span className="material-icons-outlined fs-24-unity me-2">delete</span>
                                                        {sl.b_remove_all}
                                                    </button>
                                                </div>
                                            ) : null
                                        }

                                    </ClosablePanel>

                                </div>

                            </div>
                        </div>

                    </div>  {/* end of content panel */}

                    <DumpPanel dataList={[
                        { name: "dataRecord", data: dataRecord },
                        { name: "sessionList", data: sessionList },
                        { name: "sl", data: sl },
                    ]} debugMode={debugMode} />

                </div> {/* end of right panel */}

            </div> {/* end of top part */}

            <FooterPanel />
        </div>
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