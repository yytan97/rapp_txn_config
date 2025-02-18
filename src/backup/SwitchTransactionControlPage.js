
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
const accessActionPrefix = "switch_institution_control";

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

export function SwitchTransactionControlPage({ debugMode = true }) {
    const componentName = "SwitchTransactionControlPage";
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
            // await tBox.sleep(1000 * 1);
            if (!check4Right(accessObjectName, `${accessActionPrefix}.access`)) {
                throw ({ errorCode: "permission_denied" });
            }

            let result1 = await apiBox.command4TransactionList(getSessionToken());
            dataList = [];
            if (result1.flag) {

                let list1 = result1.data.transactions;

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
        if (v === "true") return s + "bg-success";
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
        let numericTypeList = ["consecutiveTimeoutCount", "safMaxConcurrent", "safMaxTimeout", "safRetry",
            "timer_0", "timer_a", "timer_k", "timer_1", "timer_1_2_20",
            "timer_2", "timer_3", "timer_4", "timer_5", "timer_6", "timer_7",
            "timer_8", "timer_9", "timer_10", "timer_11"];

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

    async function callback4AddInstitution(data1) {
        if (debugMode) console.log("Callback for add", data1);

        showStateDialogBox();
        try {
            let result1 = await apiBox.command4Institution(getSessionToken(), "add", data1.selectValue);
            if (result1 && result1.flag && result1.data.result.code == "0") {

                setNoIndicator(true);
                setRefresh(true);

                let message = sl.m_institution_added;
                showInfoDialogBox(message, () => {
                    // setRefresh(true);
                });
            }
            else {
                let message = sl.e_add_institution || "Fail to add institution";
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

        return;
    };

    async function click4Add(e) {
        if (debugMode) console.log("Click for add", e);
        try {
            showStateDialogBox();

            let result3 = await apiBox.getRecord(getSessionToken(), "kdb", "kswitchinstitution");
            let list3 = [];
            if (result3.flag) {
                list3 = result3.data.records;
                list3 = list3.map((record1) => {
                    let record2 = {};
                    record2.value = record1.institutionId;
                    record2.label = record1.institutionId;
                    return record2;
                });

                list3.sort(function (a, b) {
                    if (a.label == b.label) return 0;
                    if (a.label < b.label) return -1;
                    return 1;
                });
            }

            let data1 = {
                title: sl.l_select_institution_id,
                dataList: list3
            };

            showSelectListDialogBox(data1, callback4AddInstitution);
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

    function click4Sync(e, record, index) {
        if (debugMode) console.log("Click for sync", e, record, index);

        let message = sl.m_confirm_sync_institution;
        message = message.replace(/__parameter_1/, record.id);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.command4Institution(getSessionToken(), "add", record.id);
                if (result1 && result1.flag && result1.data.result.code == "0") {

                    setNoIndicator(true);
                    setRefresh(true);

                    let message = sl.m_institution_synced;
                    showInfoDialogBox(message, () => {
                        // setRefresh(true);
                    });
                }
                else {
                    let message = sl.e_sync_institution || "Fail to sync institution";
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

    function click4DetailRecord(e, record, index) {
        if (debugMode) console.log("Click for detail record", e, record, index);

        if (record.enabled == "true")
            click4Disable(e, record, index);
        else
            click4Enable(e, record, index);
    };

    function click4Enable(e, record, index) {
        if (debugMode) console.log("Click for enable", e, record, index);

        let message = sl.m_confirm_enable_transaction;
        message = message.replace(/__parameter_1/, record.name);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.command4Transaction(getSessionToken(), "enable", record.name);
                if (result1 && result1.flag && result1.data.result.code == "0") {

                    setNoIndicator(true);
                    setRefresh(true);

                    let message = sl.m_transaction_enabled;
                    showInfoDialogBox(message, () => {
                        // setRefresh(true);
                    });
                }
                else {
                    let message = sl.e_enable_transaction || "Fail to enable transaction";
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

        let message = sl.m_confirm_disable_transaction;
        message = message.replace(/__parameter_1/, record.name);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.command4Transaction(getSessionToken(), "disable", record.name);
                if (result1 && result1.flag && result1.data.result.code == "0") {

                    setNoIndicator(true);
                    setRefresh(true);

                    let message = sl.m_transaction_disabled;
                    showInfoDialogBox(message, () => {
                        // setRefresh(true);
                    });
                }
                else {
                    let message = sl.e_disable_transaction || "Fail to disable transaction";
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

    function click4Remove(e, record, index) {
        if (debugMode) console.log("Click for remove", e, record, index);

        let message = sl.m_confirm_remove_institution;
        message = message.replace(/__parameter_1/, record.id);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.command4Institution(getSessionToken(), "remove", record.id);
                if (result1 && result1.flag && result1.data.result.code == "0") {

                    setNoIndicator(true);
                    setRefresh(true);

                    let message = sl.m_institution_removed;
                    showInfoDialogBox(message, () => {
                        // setRefresh(true);
                    });
                }
                else {
                    let message = sl.e_remove_institution || "Fail to remove institution";
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
                                        /*
                                        check4Right(accessObjectName, `${accessActionPrefix}.add`) ? (
                                            <button className="btn btn-ghost-unity " role="button" title={sl.t_add_new_institution}
                                                onClick={(e) => click4Add(e)}>
                                                <span className="material-icons-outlined">add</span>
                                            </button>
                                        ) : null
                                        */
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
                                            <th role="button" onClick={(e) => toggle4Order(e, order, 'enabled')}>
                                                {sl.f_enabled} {getOrderIndicator(order, 'enabled')}
                                            </th>
                                            <th role="button" onClick={(e) => toggle4Order(e, order, 'class')}>
                                                {sl.f_class} {getOrderIndicator(order, 'class')}
                                            </th>
                                            <th role="button" onClick={(e) => toggle4Order(e, order, 'extension')}>
                                                {sl.f_extension} {getOrderIndicator(order, 'extension')}
                                            </th>
                                            <th role="button" onClick={(e) => toggle4Order(e, order, 'vm')}>
                                                {sl.f_vm} {getOrderIndicator(order, 'vm')}
                                            </th>
                                            <th role="button" onClick={(e) => toggle4Order(e, order, 'kernel')}>
                                                {sl.f_kernel} {getOrderIndicator(order, 'kernel')}
                                            </th>
                                            <th role="button" onClick={(e) => toggle4Order(e, order, 'dmc')}>
                                                {sl.f_dmc} {getOrderIndicator(order, 'dmc')}
                                            </th>
                                            <th role="button" onClick={(e) => toggle4Order(e, order, 'routingKey')}>
                                                {sl.f_routingKey} {getOrderIndicator(order, 'routingKey')}
                                            </th>
                                            <th role="button" onClick={(e) => toggle4Order(e, order, 'scripts')}>
                                                {sl.f_scripts} {getOrderIndicator(order, 'scripts')}
                                            </th>
                                            <th role="button" onClick={(e) => toggle4Order(e, order, 'config')}>
                                                {sl.f_config} {getOrderIndicator(order, 'config')}
                                            </th>

                                            {/*<th></th>*/}
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
                                                        style={{ fontSize: "14px", cursor: "pointer" }}
                                                        onClick={(e) => click4DetailRecord(e, record, index)}>
                                                        <td className="text-end"  >
                                                            {index + 1}
                                                        </td>
                                                        <td className="bg-white"
                                                            style={{ position: "sticky", left: "0px" }}
                                                            xxx-data-bs-toggle="dropdown">
                                                            {record?.name}
                                                        </td>

                                                        <td xxx-data-bs-toggle="dropdown">
                                                            <div className={`${getStatusLabelClass(record?.enabled)}`}
                                                                style={{ width: "110px", height: "24px" }} >
                                                                {record?.enabled}
                                                            </div>
                                                        </td>

                                                        <td xxx-data-bs-toggle="dropdown">
                                                            {record?.class || "-"}
                                                        </td>
                                                        <td xxx-data-bs-toggle="dropdown">
                                                            {record?.extension || "-"}
                                                        </td>
                                                        <td xxx-data-bs-toggle="dropdown">
                                                            {record?.vm || "-"}
                                                        </td>
                                                        <td xxx-data-bs-toggle="dropdown">
                                                            {record?.kernel || "-"}
                                                        </td>
                                                        <td data-bs-toggle="dropdown">
                                                            {record?.dmc || "-"}
                                                        </td>
                                                        <td xxx-data-bs-toggle="dropdown">
                                                            {record?.routingKey || "-"}
                                                        </td>

                                                        <td xxx-data-bs-toggle="dropdown">
                                                            {record?.scripts?.toString() || "-"}
                                                        </td>
                                                        <td xxx-data-bs-toggle="dropdown">
                                                            {record?.config?.toString() || "-"}
                                                        </td>

                                                        {/*
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
                                                                            check4Right(accessObjectName, `${accessActionPrefix}.update`) ? (
                                                                                <li>
                                                                                    <button
                                                                                        className="dropdown-item border-bottom d-flex align-items-center"
                                                                                        type="button"
                                                                                        onClick={(e) => click4Sync(e, record, index)}>
                                                                                        <span
                                                                                            className="material-icons-outlined fs-24-unity me-2">sync</span>
                                                                                        <span>{sl.l_sync}</span>
                                                                                    </button>
                                                                                </li>
                                                                            ) : null
                                                                        }

                                                                        {
                                                                            (check4Right(accessObjectName, `${accessActionPrefix}.update`) && record.status !== 'Active') ? (
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
                                                                            (check4Right(accessObjectName, `${accessActionPrefix}.update`) && record.status === 'Active') ? (
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
                                                                            (check4Right(accessObjectName, `${accessActionPrefix}.update`)) ? (
                                                                                <li>
                                                                                    <button
                                                                                        className="dropdown-item border-bottom d-flex align-items-center"
                                                                                        type="button"
                                                                                        onClick={(e) => click4Remove(e, record, index)}>
                                                                                        <span
                                                                                            className="material-icons-outlined fs-24-unity me-2">delete</span>
                                                                                        <span>{sl.l_remove}</span>
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
                                                                                        onClick={(e) => console.log("Click for ", e, record, index)}>
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
                                                        */}
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