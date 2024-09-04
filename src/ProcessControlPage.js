
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

import { showConfirmDialogBox } from "./ConfirmDialogBox.js";
import { showStateDialogBox, closeStateDialogBox } from "./StateDialogBox.js";
import { showInfoDialogBox } from "./InfoDialogBox.js";
import { showSelectListDialogBox, SelectListDialogBox } from "./SelectListDialogBox.js";

// import { cleanUp as cleanUp4Detail } from "./TableManagementPage.js";

// Map loaded lib here ...
const uuidv4 = window.uuidv4;
const moment = window.moment;

let dataList = [];
let filterText = "";

const accessObjectName = "webapp_switch_service_access";
const accessActionPrefix = "process_control";

let order = {
    field: {},
    name: undefined,
};

export function cleanUp() {
    dataList = [];
    filterText = "";

    order = {
        field: {},
        name: undefined,
    };
    return;
};

export function ProcessControlPage({ debugMode = true }) {
    const componentName = "ProcessControlPage";
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
    let [noIndicator, setNoIndicator] = react.useState(false);
    let [refresh, setRefresh] = react.useState(true);

    const navigate = reactRouter.useNavigate();

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);

        let timer = setTimeout(async () => {
            if (refresh) loadDataList();
        }, 100);

        return () => {
            if (debugMode) console.log(`Unmount ${componentName}`);
            clearTimeout(timer)
        };

    }, [refresh]);

    // event handling function here ...

    async function loadDataList() {
        if (!noIndicator) showStateDialogBox();

        try {

            if (!check4Right(accessObjectName, `${accessActionPrefix}.access`)) {
                throw ({ errorCode: "permission_denied" });
            }

            let result1 = await apiBox.command4ProcessList(getSessionToken());
            dataList = [];
            if (result1.flag) {

                let list1 = result1.data.processes;

                /*
                list1 = list1.map((record1) => {
                    // change from array of object to object ...
                    record1.timerRecord = {};
                    if (record1.Timers) {
                        for (let record2 of record1.Timers) {
                            for (let name in record2) {
                                record1.timerRecord[name] = parseInt(record2[name]);
                            }
                        }
                    }
                    return record1
                });
                */

                dataList = [...list1];
                console.log("Data list", dataList);
            }
            else throw (result1);

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
            setNoIndicator(false);
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
        if (v === "Executing") return s + "bg-success";
        if (v.trim() === "Template") return s + "bg-info";

        return s + "bg-danger";
    };

    function click4Filter(e) {
        if (debugMode) console.log("Click for filter or refresh ", e);
        setRefresh(true);
        return;
    };

    function change4FilterText(e) {
        if (debugMode) console.log("Change for filter text ", e);
        filterText = e.target.value;

        setRedraw((v) => v + 1);
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

    function sort4Order(record1, record2) {
        let name = order.name;
        let numericTypeList = ["restarts", "currentExecCount", "totalExeCount", "minimum_copies", "maximum_copies", "maximum_history"];

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

    function click4Enable(e, record, index) {
        if (debugMode) console.log("Click for enable", e, record, index);

        let message = sl.m_confirm_enable_process;
        message = message.replace(/__parameter_1/, record.name);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.command4Process(getSessionToken(), "enable", record.name);
                if (result1 && result1.flag && result1.data.result.code == "0") {

                    setNoIndicator(true);
                    setRefresh(true);

                    let message = sl.m_process_enabled;
                    showInfoDialogBox(message, () => {
                        // setRefresh(true);
                    });
                }
                else {
                    let message = sl.e_enable_process || "Fail to enable process";
                    showInfoDialogBox(message);
                }
                // else throw result1;

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

    function click4Disable(e, record, index) {
        if (debugMode) console.log("Click for disable", e, record, index);

        let message = sl.m_confirm_disable_process;
        message = message.replace(/__parameter_1/, record.name);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.command4Process(getSessionToken(), "disable", record.name);
                if (result1 && result1.flag && result1.data.result.code == "0") {

                    setNoIndicator(true);
                    setRefresh(true);

                    let message = sl.m_process_disabled;
                    showInfoDialogBox(message, () => {
                        // setRefresh(true);
                    });
                }
                else {
                    let message = sl.e_disable_process || "Fail to disable process";
                    showInfoDialogBox(message);
                }
                // else throw result1;

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

    function click4Start(e, record, index) {
        if (debugMode) console.log("Click for start", e, record, index);

        let message = sl.m_confirm_start_process;
        message = message.replace(/__parameter_1/, record.name);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.command4Process(getSessionToken(), "start", record.name);
                if (result1 && result1.flag && result1.data.result.code == "0") {

                    setNoIndicator(true);
                    setRefresh(true);

                    let message = sl.m_process_started;
                    showInfoDialogBox(message, () => {
                        // setRefresh(true);
                    });
                }
                else {
                    // let message = sl.e_start_process || "Fail to start process";
                    let message = result1.data.result.reason || "Fail to start process";
                    showInfoDialogBox(message);
                }
                // else throw result1;

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

    function click4Stop(e, record, index) {
        if (debugMode) console.log("Click for stop", e, record, index);

        let message = sl.m_confirm_stop_process;
        message = message.replace(/__parameter_1/, record.name);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.command4Process(getSessionToken(), "stop", record.name);
                if (result1 && result1.flag && result1.data.result.code == "0") {

                    setNoIndicator(true);
                    setRefresh(true);

                    let message = sl.m_process_stopped;
                    showInfoDialogBox(message, () => {
                        // setRefresh(true);
                    });
                }
                else {
                    // let message = sl.e_stop_process || "Fail to stop process";
                    let message = result1.data.result.reason || "Fail to stop process";
                    showInfoDialogBox(message);
                }
                // else throw result1;

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

    function click4Restart(e, record, index) {
        if (debugMode) console.log("Click for restart", e, record, index);

        let message = sl.m_confirm_restart_process;
        message = message.replace(/__parameter_1/, record.name);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.command4Process(getSessionToken(), "restart", record.name);
                if (result1 && result1.flag && result1.data.result.code == "0") {

                    setNoIndicator(true);
                    setRefresh(true);

                    let message = sl.m_process_restarted;
                    showInfoDialogBox(message, () => {
                        // setRefresh(true);
                    });
                }
                else {
                    // let message = sl.e_stop_process || "Fail to stop process";
                    let message = result1.data.result.reason || "Fail to restart process";
                    showInfoDialogBox(message);
                }
                // else throw result1;

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

    function click4ServerStat(e) {
        if (debugMode) console.log("Click for server stat", e);

        let message = sl.m_confirm_process_server_stat;
        // message = message.replace(/__parameter_1/, record.name);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.command4ProcessServer(getSessionToken(), "stat");
                if (result1 && result1.flag && result1.data.result.code == "0") {

                    setNoIndicator(true);
                    setRefresh(true);

                    let message = sl.m_process_server_stat_ok;
                    showInfoDialogBox(message, () => {
                        // setRefresh(true);
                    });
                }
                else {
                    // let message = sl.e_stop_process || "Fail to stop process";
                    let message = result1.data.result.reason || "Fail to do process server stat";
                    showInfoDialogBox(message);
                }
                // else throw result1;

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

    function click4ServerStart(e) {
        if (debugMode) console.log("Click for server start", e);

        let message = sl.m_confirm_process_server_start;
        // message = message.replace(/__parameter_1/, record.name);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.command4ProcessServer(getSessionToken(), "start");
                if (result1 && result1.flag && result1.data.result.code == "0") {

                    setNoIndicator(true);
                    setRefresh(true);

                    let message = sl.m_process_server_start_ok;
                    showInfoDialogBox(message, () => {
                        // setRefresh(true);
                    });
                }
                else {
                    // let message = sl.e_stop_process || "Fail to stop process";
                    let message = result1.data.result.reason || "Fail to do process server start";
                    showInfoDialogBox(message);
                }
                // else throw result1;

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

    function click4ServerStop(e) {
        if (debugMode) console.log("Click for server stop", e);

        let message = sl.m_confirm_process_server_stop;
        // message = message.replace(/__parameter_1/, record.name);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.command4ProcessServer(getSessionToken(), "stop");
                if (result1 && result1.flag && result1.data.result.code == "0") {

                    setNoIndicator(true);
                    setRefresh(true);

                    let message = sl.m_process_server_stop_ok;
                    showInfoDialogBox(message, () => {
                        // setRefresh(true);
                    });
                }
                else {
                    // let message = sl.e_stop_process || "Fail to stop process";
                    let message = result1.data.result.reason || "Fail to do process server stop";
                    showInfoDialogBox(message);
                }
                // else throw result1;

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

                        <div style={{ fontSize: "24px", fontWeight: "bold" }}>{sl.l_title}</div>

                        <div className="mt-3 px-3 py-4 bg-white shadow" style={{ border: "1px solid #f3f3f3", borderRadius: "16px" }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="col-7 pe-3">
                                    <div className="input-group">
                                        <input type="text" className="form-control border-0" placeholder={sl.p_filter}
                                            value={filterText}
                                            onChange={change4FilterText}
                                            style={{ backgroundColor: "#F3F3F4", fontSize: "14px" }} />
                                        <button className="btn border-0"
                                            style={{ backgroundColor: "#f3f3f4", "--bs-btn-focus-box-shadow": "0 0 0 0.25rem rgb(97 159 203 / 25%)" }}
                                            type="button" onClick={click4Filter}>
                                            <span className="material-icons-outlined " style={{ color: "#A4A6A7" }}>filter_alt</span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    {
                                        check4Right(accessObjectName, `${accessActionPrefix}.update`) ? (

                                            <div className="dropdown dropstart ">
                                                <button className="btn btn-ghost-unity "
                                                    role="button"
                                                    title={sl.t_process_control}
                                                    data-bs-toggle="dropdown">
                                                    <span className="material-icons-outlined">rocket_launch</span>
                                                </button>

                                                <div className="dropdown-menu fs-14-unity border-0 shadow p-0"
                                                    style={{ borderRadius: "8px" }} >
                                                    <ul className="list-unstyled p-2 mb-0">

                                                        {
                                                            check4Right(accessObjectName, `${accessActionPrefix}.update`) ? (
                                                                <li>
                                                                    <button
                                                                        className="dropdown-item border-bottom d-flex align-items-center"
                                                                        type="button"
                                                                        onClick={(e) => click4ServerStat(e)}>
                                                                        <span
                                                                            className="material-icons-outlined fs-24-unity me-2">sensors</span>
                                                                        <span>{sl.l_server_stat}</span>
                                                                    </button>
                                                                </li>
                                                            ) : null
                                                        }

                                                        {
                                                            (check4Right(accessObjectName, `${accessActionPrefix}.update`)) ? (
                                                                <li>
                                                                    <button
                                                                        className="dropdown-item border-bottom d-flex align-items-center"
                                                                        type="button"
                                                                        onClick={(e) => click4ServerStart(e)}>
                                                                        <span
                                                                            className="material-icons-outlined fs-24-unity me-2">play_arrow</span>
                                                                        <span>{sl.l_server_start}</span>
                                                                    </button>
                                                                </li>
                                                            ) : null
                                                        }

                                                        {
                                                            (check4Right(accessObjectName, `${accessActionPrefix}.update`)) ? (
                                                                <li>
                                                                    <button
                                                                        className="dropdown-item border-bottom d-flex align-items-center"
                                                                        type="button"
                                                                        onClick={(e) => click4ServerStop(e)}>
                                                                        <span
                                                                            className="material-icons-outlined fs-24-unity me-2">stop</span>
                                                                        <span>{sl.l_server_stop}</span>
                                                                    </button>
                                                                </li>
                                                            ) : null
                                                        }

                                                        {
                                                            (!check4Right(accessObjectName, `${accessActionPrefix}.update`)) ? (
                                                                <li>
                                                                    <button
                                                                        className="dropdown-item border-bottom d-flex align-items-center"
                                                                        type="button"
                                                                        onClick={(e) => console.log(e)}>
                                                                        <span
                                                                            className="material-icons-outlined fs-24-unity me-2">remove_circle_outline</span>
                                                                        <span>{sl.l_no_permission}</span>
                                                                    </button>
                                                                </li>
                                                            ) : null
                                                        }

                                                    </ul>
                                                </div>
                                            </div>
                                        ) : null
                                    }

                                </div>

                            </div>

                            <div className="mt-4 table-responsive " style={{ minHeight: "50vh" }} >
                                <table className="table table-hover mb-0">
                                    <thead>
                                        <tr className="text-nowrap" style={{ fontSize: "12px", color: "#A4A6A7", fontWeight: 600 }}>
                                            <th className="text-end" style={{ width: "40px" }}>
                                                {sl.h_no}
                                            </th>
                                            <th className="bg-white"
                                                style={{ position: "sticky", left: "0px" }}
                                                role="button"
                                                onClick={(e) => toggle4Order(e, order, 'name')}>
                                                {sl.f_name} {getOrderIndicator(order, 'name')}
                                            </th>
                                            <th role="button" onClick={(e) => toggle4Order(e, order, 'type')}>
                                                {sl.f_type} {getOrderIndicator(order, 'type')}
                                            </th>
                                            <th role="button" onClick={(e) => toggle4Order(e, order, 'description')}>
                                                {sl.f_description} {getOrderIndicator(order, 'description')}
                                            </th>
                                            <th role="button" onClick={(e) => toggle4Order(e, order, 'inGroup')}>
                                                {sl.f_inGroup} {getOrderIndicator(order, 'inGroup')}
                                            </th>
                                            <th role="button" onClick={(e) => toggle4Order(e, order, 'path')}>
                                                {sl.f_path} {getOrderIndicator(order, 'path')}
                                            </th>
                                            <th role="button" onClick={(e) => toggle4Order(e, order, 'recent_eror')}>
                                                {sl.f_recent_eror} {getOrderIndicator(order, 'recent_eror')}
                                            </th>
                                            <th role="button" onClick={(e) => toggle4Order(e, order, 'status')}>
                                                {sl.f_status} {getOrderIndicator(order, 'status')}
                                            </th>
                                            <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order, 'restarts')}>
                                                {sl.f_restarts} {getOrderIndicator(order, 'restarts')}
                                            </th>
                                            <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order, 'currentExecCount')}>
                                                {sl.f_currentExecCount} {getOrderIndicator(order, 'currentExecCount')}
                                            </th>
                                            <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order, 'totalExeCount')}>
                                                {sl.f_totalExeCount} {getOrderIndicator(order, 'totalExeCount')}
                                            </th>
                                            <th role="button" onClick={(e) => toggle4Order(e, order, 'normal_exit_action')}>
                                                {sl.f_normal_exit_action} {getOrderIndicator(order, 'normal_exit_action')}
                                            </th>

                                            <th role="button" onClick={(e) => toggle4Order(e, order, 'error_exit_action')}>
                                                {sl.f_error_exit_action} {getOrderIndicator(order, 'error_exit_action')}
                                            </th>
                                            <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order, 'minimum_copies')}>
                                                {sl.f_minimum_copies} {getOrderIndicator(order, 'minimum_copies')}
                                            </th>
                                            <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order, 'maximum_copies')}>
                                                {sl.f_maximum_copies} {getOrderIndicator(order, 'maximum_copies')}
                                            </th>
                                            <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order, 'maximum_history')}>
                                                {sl.f_maximum_history} {getOrderIndicator(order, 'maximum_history')}
                                            </th>

                                            <th></th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {
                                            dataList.toSorted(sort4Order).filter((record, index) => {
                                                if (!filterText)
                                                    return true;

                                                let s = tBox.buildFilterText(record);
                                                if (s.toLowerCase().indexOf(filterText.toLowerCase()) >= 0)
                                                    return true;
                                                else
                                                    return false;
                                            }).map((record, index) => {
                                                // console.log("Build table row", record, index);
                                                return (
                                                    <tr key={index}
                                                        className="text-nowrap"
                                                        style={{ fontSize: "14px", cursor: "pointer" }} >
                                                        <td className="text-end"  >
                                                            {index + 1}
                                                        </td>
                                                        <td className="bg-white"
                                                            style={{ position: "sticky", left: "0px" }}
                                                            data-bs-toggle="dropdown">
                                                            {record?.name}
                                                        </td>
                                                        <td data-bs-toggle="dropdown">
                                                            {record?.type || "-"}
                                                        </td>
                                                        <td data-bs-toggle="dropdown">
                                                            {record?.description || "-"}
                                                        </td>
                                                        <td data-bs-toggle="dropdown">
                                                            {record?.inGroup || "-"}
                                                        </td>
                                                        <td data-bs-toggle="dropdown">
                                                            {record?.path || "-"}
                                                        </td>
                                                        <td data-bs-toggle="dropdown">
                                                            {record?.recent_eror || "-"}
                                                        </td>
                                                        <td data-bs-toggle="dropdown">
                                                            <div className={`${getStatusLabelClass(record?.status)}`}
                                                                style={{ width: "150px", height: "24px" }} >
                                                                {record?.status}
                                                            </div>
                                                        </td>
                                                        <td className="text-end" data-bs-toggle="dropdown">
                                                            {record?.restarts || "-"}
                                                        </td>
                                                        <td className="text-end" data-bs-toggle="dropdown">
                                                            {record?.currentExecCount || "-"}
                                                        </td>
                                                        <td className="text-end" data-bs-toggle="dropdown">
                                                            {record?.totalExeCount || "-"}
                                                        </td>
                                                        <td data-bs-toggle="dropdown">
                                                            {record?.normal_exit_action || "-"}
                                                        </td>

                                                        <td data-bs-toggle="dropdown">
                                                            {record?.error_exit_action || "-"}
                                                        </td>
                                                        <td className="text-end" data-bs-toggle="dropdown">
                                                            {record?.minimum_copies || "-"}
                                                        </td>
                                                        <td className="text-end" data-bs-toggle="dropdown">
                                                            {record?.maximum_copies || "-"}
                                                        </td>
                                                        <td className="text-end" data-bs-toggle="dropdown">
                                                            {record?.maximum_history || "-"}
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

                                                                        {
                                                                            (check4Right(accessObjectName, `${accessActionPrefix}.update`) && record?.status.trim() !== 'Enabled') ? (
                                                                                <li>
                                                                                    <button
                                                                                        className="dropdown-item border-bottom d-flex align-items-center"
                                                                                        type="button"
                                                                                        onClick={(e) => click4Enable(e, record, index)}>
                                                                                        <span
                                                                                            className="material-icons-outlined fs-24-unity me-2">check_circle</span>
                                                                                        <span>{sl.l_enable}</span>
                                                                                    </button>
                                                                                </li>
                                                                            ) : null
                                                                        }

                                                                        {
                                                                            (check4Right(accessObjectName, `${accessActionPrefix}.update`) && record?.status.trim() !== 'Disabled') ? (
                                                                                <li>
                                                                                    <button
                                                                                        className="dropdown-item border-bottom d-flex align-items-center"
                                                                                        type="button"
                                                                                        onClick={(e) => click4Disable(e, record, index)}>
                                                                                        <span
                                                                                            className="material-icons-outlined fs-24-unity me-2">block</span>
                                                                                        <span>{sl.l_disable}</span>
                                                                                    </button>
                                                                                </li>
                                                                            ) : null
                                                                        }

                                                                        {
                                                                            check4Right(accessObjectName, `${accessActionPrefix}.update`) ? (
                                                                                <li>
                                                                                    <button
                                                                                        className="dropdown-item border-bottom d-flex align-items-center"
                                                                                        type="button"
                                                                                        onClick={(e) => click4Start(e, record, index)}>
                                                                                        <span
                                                                                            className="material-icons-outlined fs-24-unity me-2">play_arrow</span>
                                                                                        <span>{sl.l_start}</span>
                                                                                    </button>
                                                                                </li>
                                                                            ) : null
                                                                        }

                                                                        {
                                                                            (check4Right(accessObjectName, `${accessActionPrefix}.update`)) ? (
                                                                                <li>
                                                                                    <button
                                                                                        className="dropdown-item border-bottom d-flex align-items-center"
                                                                                        type="button"
                                                                                        onClick={(e) => click4Stop(e, record, index)}>
                                                                                        <span
                                                                                            className="material-icons-outlined fs-24-unity me-2">stop</span>
                                                                                        <span>{sl.l_stop}</span>
                                                                                    </button>
                                                                                </li>
                                                                            ) : null
                                                                        }

                                                                        {
                                                                            (check4Right(accessObjectName, `${accessActionPrefix}.update`)) ? (
                                                                                <li>
                                                                                    <button
                                                                                        className="dropdown-item border-bottom d-flex align-items-center"
                                                                                        type="button"
                                                                                        onClick={(e) => click4Restart(e, record, index)}>
                                                                                        <span
                                                                                            className="material-icons-outlined fs-24-unity me-2">restart_alt</span>
                                                                                        <span>{sl.l_restart}</span>
                                                                                    </button>
                                                                                </li>
                                                                            ) : null
                                                                        }

                                                                        {
                                                                            (!check4Right(accessObjectName, `${accessActionPrefix}.update`)) ? (
                                                                                <li>
                                                                                    <button
                                                                                        className="dropdown-item border-bottom d-flex align-items-center"
                                                                                        type="button"
                                                                                        onClick={(e) => console.log(e, record, index)}>
                                                                                        <span
                                                                                            className="material-icons-outlined fs-24-unity me-2">remove_circle_outline</span>
                                                                                        <span>{sl.l_no_permission}</span>
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


                    </div>

                    <SelectListDialogBox debugMode={debugMode} />
                    <DumpPanel dataList={[
                        { name: "dataList", data: dataList },
                        { name: "config", data: config },
                        { name: "sl", data: sl },
                        { name: "dataset", data: dataset },
                    ]} debugMode={debugMode} />

                </div>

            </div>

            <FooterPanel />
        </div>
    );
}