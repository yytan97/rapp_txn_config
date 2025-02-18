
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

let dataList4Link = [];
let dataList4Route = [];
let closePanel = {};

let filterText = "";

const accessObjectName = "webapp_switch_service_access";
const accessActionPrefix = "switch_link_control";

let order4Route = {
    field: {},
    name: undefined,
};

let order4Link = {
    field: {},
    name: undefined,
};

export function cleanUp() {
    dataList4Link = [];
    dataList4Route = [];
    closePanel = {};

    filterText = "";

    order4Route = {
        field: {},
        name: undefined,
    };

    order4Link = {
        field: {},
        name: undefined,
    };
    return;
};

export function SwitchLinkControlPage({ debugMode = true }) {
    const componentName = "SwitchLinkControlPage";
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

            let result3 = await apiBox.command4LinkList(getSessionToken());
            dataList4Link = [];
            if (result3.flag) {

                let list3 = result3?.data?.links;
                dataList4Link = [...list3];
                console.log("Link list", dataList4Link);

                let list4 = result3?.data?.routes;
                dataList4Route = [...list4];
                console.log("Route list", dataList4Route);
            }
            else throw (result3);

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
        if (v === "false") return s + "bg-success";
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

    function sort4RouteOrder(record1, record2) {
        let order = order4Route;
        let name = order.name;
        let numericTypeList = ["totalSize", "version", "linkCount", "linkSize",
            "linkOffset", "refcount"];

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

    function sort4LinkOrder(record1, record2) {
        let order = order4Link;
        let name = order.name;
        let numericTypeList = ["totalSize", "version", "next", "refcount"];

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

    async function callback4AddRoute(data1) {
        if (debugMode) console.log("Callback for add route", data1);

        showStateDialogBox();
        try {
            let result1 = await apiBox.command4Route(getSessionToken(), "add", data1.selectValue);
            if (result1 && result1.flag && result1.data.result.code == "0") {

                setNoIndicator(true);
                setRefresh(true);

                let message = sl.m_route_added;
                showInfoDialogBox(message, () => {
                    // setRefresh(true);
                });
            }
            else {
                let message = sl.e_add_route || "Fail to add route";
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

    async function click4AddRoute(e) {
        if (debugMode) console.log("Click for add route", e);
        try {
            showStateDialogBox();

            let result3 = await apiBox.getRecord(getSessionToken(), "kdb", "kswitchroute", "1 = 1 order by routingKey");
            let list3 = [];
            if (result3.flag) {
                list3 = result3.data.records;
                list3 = list3.map((record1) => {
                    let record2 = {};
                    record2.value = record1.routingKey;
                    record2.label = record1.routingKey;
                    return record2;
                });

                /*
                list3.sort(function (a, b) {
                    if (a.label == b.label) return 0;
                    if (a.label < b.label) return -1;
                    return 1;
                });
                */
            }

            let data1 = {
                title: sl.l_select_routing_id || "Select Routing ID",
                dataList: list3
            };

            showSelectListDialogBox(data1, callback4AddRoute);
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

    function click4SyncRoute(e, record, index) {
        if (debugMode) console.log("Click for sync route", e, record, index);

        let message = sl.m_confirm_sync_route;
        message = message.replace(/__parameter_1/, record.name);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.command4Route(getSessionToken(), "add", record.name);
                if (result1 && result1.flag && result1.data.result.code == "0") {

                    setNoIndicator(true);
                    setRefresh(true);

                    let message = sl.m_route_synced;
                    showInfoDialogBox(message, () => {
                        // setRefresh(true);
                    });
                }
                else {
                    let message = sl.e_sync_route || "Fail to sync route";
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

    function click4EnableRoute(e, record, index) {
        if (debugMode) console.log("Click for enable", e, record, index);

        let message = sl.m_confirm_enable_route;
        message = message.replace(/__parameter_1/, record.name);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.command4Route(getSessionToken(), "enable", record.name);
                if (result1 && result1.flag && result1.data.result.code == "0") {

                    setNoIndicator(true);
                    setRefresh(true);

                    let message = sl.m_route_enabled;
                    showInfoDialogBox(message, () => {
                        // setRefresh(true);
                    });
                }
                else {
                    let message = sl.e_enable_route || "Fail to enable route";
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

    function click4DisableRoute(e, record, index) {
        if (debugMode) console.log("Click for disable", e, record, index);

        let message = sl.m_confirm_disable_route;
        message = message.replace(/__parameter_1/, record.name);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.command4Route(getSessionToken(), "disable", record.name);
                if (result1 && result1.flag && result1.data.result.code == "0") {

                    setNoIndicator(true);
                    setRefresh(true);

                    let message = sl.m_route_disabled;
                    showInfoDialogBox(message, () => {
                        // setRefresh(true);
                    });
                }
                else {
                    let message = sl.e_disable_route || "Fail to disable route";
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

    function click4RemoveRoute(e, record, index) {
        if (debugMode) console.log("Click for remove", e, record, index);

        let message = sl.m_confirm_remove_route;
        message = message.replace(/__parameter_1/, record.name);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.command4Route(getSessionToken(), "remove", record.name);
                if (result1 && result1.flag && result1.data.result.code == "0") {

                    setNoIndicator(true);
                    setRefresh(true);

                    let message = sl.m_route_removed;
                    showInfoDialogBox(message, () => {
                        // setRefresh(true);
                    });
                }
                else {
                    let message = sl.e_remove_route || "Fail to remove route";
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

    // click for link
    async function callback4AddLink(data1) {
        if (debugMode) console.log("Callback for add link", data1);

        showStateDialogBox();
        try {
            let result1 = await apiBox.command4Link(getSessionToken(), "add", data1.selectValue);
            if (result1 && result1.flag && result1.data.result.code == "0") {

                setNoIndicator(true);
                setRefresh(true);

                let message = sl.m_link_added;
                showInfoDialogBox(message, () => {
                    // setRefresh(true);
                });
            }
            else {
                let message = sl.e_add_link || "Fail to add link";
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

    async function click4AddLink(e) {
        if (debugMode) console.log("Click for add link", e);
        try {
            showStateDialogBox();

            let result3 = await apiBox.getRecord(getSessionToken(), "kdb", "kswitchroute", "1 = 1 order by routingKey");
            let list3 = [];
            if (result3.flag) {
                list3 = result3.data.records;
                list3 = list3.map((record1) => {
                    let record2 = {};
                    record2.value = record1.routingKey;
                    record2.label = record1.routingKey;
                    return record2;
                });

                /*
                list3.sort(function (a, b) {
                    if (a.label == b.label) return 0;
                    if (a.label < b.label) return -1;
                    return 1;
                });
                */
            }

            let data1 = {
                title: sl.l_select_routing_id || "Select Routing ID",
                dataList: list3
            };

            showSelectListDialogBox(data1, callback4AddLink);
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

    function click4SyncLink(e, record, index) {
        if (debugMode) console.log("Click for sync link", e, record, index);

        let message = sl.m_confirm_sync_link;
        message = message.replace(/__parameter_1/, record.name);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.command4Link(getSessionToken(), "add", record.name);
                if (result1 && result1.flag && result1.data.result.code == "0") {

                    setNoIndicator(true);
                    setRefresh(true);

                    let message = sl.m_link_synced;
                    showInfoDialogBox(message, () => {
                        // setRefresh(true);
                    });
                }
                else {
                    // let message = sl.e_link_sync || "Fail to sync link";
                    let message = result1.data.actionStatus[0].message || "Fail to sync link";

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

    function click4EnableLink(e, record, index) {
        if (debugMode) console.log("Click for enable", e, record, index);

        let message = sl.m_confirm_enable_link;
        message = message.replace(/__parameter_1/, record.name);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.command4Link(getSessionToken(), "enable", record.name);
                if (result1 && result1.flag && result1.data.result.code == "0") {

                    setNoIndicator(true);
                    setRefresh(true);

                    let message = sl.m_link_enabled;
                    showInfoDialogBox(message, () => {
                        // setRefresh(true);
                    });
                }
                else {
                    let message = sl.e_enable_link || "Fail to enable link";
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

    function click4DisableLink(e, record, index) {
        if (debugMode) console.log("Click for disable", e, record, index);

        let message = sl.m_confirm_disable_link;
        message = message.replace(/__parameter_1/, record.name);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.command4Link(getSessionToken(), "disable", record.name);
                if (result1 && result1.flag && result1.data.result.code == "0") {

                    setNoIndicator(true);
                    setRefresh(true);

                    let message = sl.m_link_disabled;
                    showInfoDialogBox(message, () => {
                        // setRefresh(true);
                    });
                }
                else {
                    let message = sl.e_disable_link || "Fail to disable link";
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

    function click4RemoveLink(e, record, index) {
        if (debugMode) console.log("Click for remove", e, record, index);

        let message = sl.m_confirm_remove_link;
        message = message.replace(/__parameter_1/, record.name);

        showConfirmDialogBox(message, async () => {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.command4Link(getSessionToken(), "remove", record.name);
                if (result1 && result1.flag && result1.data.result.code == "0") {

                    setNoIndicator(true);
                    setRefresh(true);

                    let message = sl.m_link_removed;
                    showInfoDialogBox(message, () => {
                        // setRefresh(true);
                    });
                }
                else {
                    let message = sl.e_remove_link || "Fail to remove link";
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

                        <div className="mt-3 px-3 py-4 bg-white shadow" style={{ border: "1px solid #f3f3f3", borderRadius: "16px", minHeight: "70vh" }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="col-12">
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

                            </div>

                            <div className="mt-4 d-flex justify-content-between align-items-center">
                                <div className="flex-fill d-flex align-items-center"
                                    role="button"
                                    onClick={() => {
                                        closePanel.routeSection = !(closePanel?.routeSection);
                                        setRedraw((v) => v + 1);
                                    }}>
                                    <div className="me-2">
                                        {
                                            (closePanel?.routeSection) ?
                                                <span>
                                                    <i className="fas fa-chevron-left fa-fw"></i>
                                                </span>
                                                :
                                                <span>
                                                    <i className="fas fa-chevron-down fa-fw"></i>
                                                </span>
                                        }

                                    </div>
                                    <div className="fw-bold">{sl.l_route} </div>
                                </div>
                                <div>
                                    {
                                        check4Right(accessObjectName, `${accessActionPrefix}.add`) ? (
                                            <button className="btn btn-ghost-unity " role="button" title={sl.t_add_new_route}
                                                onClick={(e) => click4AddRoute(e)}>
                                                <span className="material-icons-outlined">add</span>
                                            </button>
                                        ) : null
                                    }
                                </div>
                            </div>

                            {
                                (closePanel?.routeSection) ? null :
                                    <div className="table-responsive " xxx-style={{ minHeight: "50vh" }} >
                                        <table className="table table-hover mb-0">
                                            <thead>
                                                <tr className="text-nowrap" style={{ fontSize: "12px", color: "#A4A6A7", fontWeight: 600 }}>
                                                    <th className="text-end" style={{ width: "40px" }}>
                                                        {sl.h_no}
                                                    </th>
                                                    <th className="bg-white"
                                                        style={{ position: "sticky", left: "0px" }}
                                                        role="button"
                                                        onClick={(e) => toggle4Order(e, order4Route, 'name')}>
                                                        {sl.f_name} {getOrderIndicator(order4Route, 'name')}
                                                    </th>
                                                    <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order4Route, 'totalSize')}>
                                                        {sl.f_totalSize} {getOrderIndicator(order4Route, 'totalSize')}
                                                    </th>
                                                    <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order4Route, 'version')}>
                                                        {sl.f_version} {getOrderIndicator(order4Route, 'version')}
                                                    </th>
                                                    <th role="button" onClick={(e) => toggle4Order(e, order4Route, 'flags')}>
                                                        {sl.f_flags} {getOrderIndicator(order4Route, 'flags')}
                                                    </th>
                                                    <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order4Route, 'linkCount')}>
                                                        {sl.f_linkCount} {getOrderIndicator(order4Route, 'linkCount')}
                                                    </th>
                                                    <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order4Route, 'linkSize')}>
                                                        {sl.f_linkSize} {getOrderIndicator(order4Route, 'linkSize')}
                                                    </th>
                                                    <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order4Route, 'linkOffset')}>
                                                        {sl.f_linkOffset} {getOrderIndicator(order4Route, 'linkOffset')}
                                                    </th>
                                                    <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order4Route, 'refcount')}>
                                                        {sl.f_refcount} {getOrderIndicator(order4Route, 'refcount')}
                                                    </th>
                                                    <th role="button" onClick={(e) => toggle4Order(e, order4Route, 'disabled')}>
                                                        {sl.f_disabled} {getOrderIndicator(order4Route, 'disabled')}
                                                    </th>

                                                    <th></th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {
                                                    dataList4Route.toSorted(sort4RouteOrder).filter((record, index) => {
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
                                                                <td className="text-end" data-bs-toggle="dropdown">
                                                                    {record?.totalSize || "-"}
                                                                </td>
                                                                <td className="text-end" data-bs-toggle="dropdown">
                                                                    {record?.version || "-"}
                                                                </td>
                                                                <td data-bs-toggle="dropdown">
                                                                    {record?.flags || "-"}
                                                                </td>
                                                                <td className="text-end" data-bs-toggle="dropdown">
                                                                    {record?.linkCount || "-"}
                                                                </td>
                                                                <td className="text-end" data-bs-toggle="dropdown">
                                                                    {record?.linkSize || "-"}
                                                                </td>
                                                                <td className="text-end" data-bs-toggle="dropdown">
                                                                    {record?.linkOffset || "-"}
                                                                </td>
                                                                <td className="text-end" data-bs-toggle="dropdown">
                                                                    {record?.refcount || "-"}
                                                                </td>

                                                                <td data-bs-toggle="dropdown">
                                                                    <div className={`${getStatusLabelClass(record?.disabled)}`}
                                                                        style={{ width: "110px", height: "24px" }} >
                                                                        {record?.disabled}
                                                                    </div>
                                                                </td>


                                                                <td >
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
                                                                                            onClick={(e) => click4SyncRoute(e, record, index)}>
                                                                                            <span
                                                                                                className="material-icons-outlined fs-24-unity me-2">sync</span>
                                                                                            <span>{sl.l_sync}</span>
                                                                                        </button>
                                                                                    </li>
                                                                                ) : null
                                                                            }

                                                                            {
                                                                                (check4Right(accessObjectName, `${accessActionPrefix}.update`) && record.disabled === "true") ? (
                                                                                    <li>
                                                                                        <button
                                                                                            className="dropdown-item border-bottom d-flex align-items-center"
                                                                                            type="button"
                                                                                            onClick={(e) => click4EnableRoute(e, record, index)}>
                                                                                            <span
                                                                                                className="material-icons-outlined fs-24-unity me-2">check_circle</span>
                                                                                            <span>{sl.l_enable}</span>
                                                                                        </button>
                                                                                    </li>
                                                                                ) : null
                                                                            }

                                                                            {
                                                                                (check4Right(accessObjectName, `${accessActionPrefix}.update`) && record.disabled === "false") ? (
                                                                                    <li>
                                                                                        <button
                                                                                            className="dropdown-item border-bottom d-flex align-items-center"
                                                                                            type="button"
                                                                                            onClick={(e) => click4DisableRoute(e, record, index)}>
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
                                                                                            onClick={(e) => click4RemoveRoute(e, record, index)}>
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

                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                // end of table responsive
                            }

                            <div className="mt-4 d-flex justify-content-between align-items-center">
                                <div className="flex-fill d-flex align-items-center"
                                    role="button"
                                    onClick={() => {
                                        closePanel.linkSection = !(closePanel?.linkSection);
                                        setRedraw((v) => v + 1);
                                    }}>
                                    <div className="me-2">
                                        {
                                            (closePanel?.linkSection) ?
                                                <span>
                                                    <i className="fas fa-chevron-left fa-fw"></i>
                                                </span>
                                                :
                                                <span>
                                                    <i className="fas fa-chevron-down fa-fw"></i>
                                                </span>
                                        }

                                    </div>
                                    <div className="fw-bold">{sl.l_link} </div>
                                </div>
                                <div>
                                    {
                                        check4Right(accessObjectName, `${accessActionPrefix}.add`) ? (
                                            <button className="btn btn-ghost-unity " role="button" title={sl.t_add_new_route}
                                                onClick={(e) => click4AddLink(e)}>
                                                <span className="material-icons-outlined">add</span>
                                            </button>
                                        ) : null
                                    }
                                </div>
                            </div>

                            {
                                (closePanel?.linkSection) ? null :
                                    <div className="table-responsive " xxx-style={{ minHeight: "50vh" }} >
                                        <table className="table table-hover mb-0">
                                            <thead>
                                                <tr className="text-nowrap" style={{ fontSize: "12px", color: "#A4A6A7", fontWeight: 600 }}>
                                                    <th className="text-end" style={{ width: "40px" }}>
                                                        {sl.h_no}
                                                    </th>
                                                    <th className="bg-white"
                                                        style={{ position: "sticky", left: "0px" }}
                                                        role="button"
                                                        onClick={(e) => toggle4Order(e, order4Link, 'name')}>
                                                        {sl.f_name} {getOrderIndicator(order4Link, 'name')}
                                                    </th>
                                                    <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order4Link, 'totalSize')}>
                                                        {sl.f_totalSize} {getOrderIndicator(order4Link, 'totalSize')}
                                                    </th>
                                                    <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order4Link, 'version')}>
                                                        {sl.f_version} {getOrderIndicator(order4Link, 'version')}
                                                    </th>
                                                    <th role="button" onClick={(e) => toggle4Order(e, order4Link, 'flags')}>
                                                        {sl.f_flags} {getOrderIndicator(order4Link, 'flags')}
                                                    </th>
                                                    <th role="button" onClick={(e) => toggle4Order(e, order4Link, 'owner')}>
                                                        {sl.f_owner} {getOrderIndicator(order4Link, 'owner')}
                                                    </th>
                                                    <th role="button" onClick={(e) => toggle4Order(e, order4Link, 'leader')}>
                                                        {sl.f_leader} {getOrderIndicator(order4Link, 'leader')}
                                                    </th>
                                                    <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order4Link, 'next')}>
                                                        {sl.f_next} {getOrderIndicator(order4Link, 'next')}
                                                    </th>
                                                    <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order4Link, 'refcount')}>
                                                        {sl.f_refcount} {getOrderIndicator(order4Link, 'refcount')}
                                                    </th>
                                                    <th role="button" onClick={(e) => toggle4Order(e, order4Link, 'linkType')}>
                                                        {sl.f_linkType} {getOrderIndicator(order4Link, 'linkType')}
                                                    </th>
                                                    <th role="button" onClick={(e) => toggle4Order(e, order4Link, 'disabled')}>
                                                        {sl.f_disabled} {getOrderIndicator(order4Link, 'disabled')}
                                                    </th>

                                                    <th></th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {
                                                    dataList4Link.toSorted(sort4LinkOrder).filter((record, index) => {
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
                                                                <td className="text-end" data-bs-toggle="dropdown">
                                                                    {record?.totalSize || "-"}
                                                                </td>
                                                                <td className="text-end" data-bs-toggle="dropdown">
                                                                    {record?.version || "-"}
                                                                </td>
                                                                <td data-bs-toggle="dropdown">
                                                                    {record?.flags || "-"}
                                                                </td>
                                                                <td data-bs-toggle="dropdown">
                                                                    {record?.owner || "-"}
                                                                </td>
                                                                <td data-bs-toggle="dropdown">
                                                                    {record?.leader || "-"}
                                                                </td>
                                                                <td className="text-end" data-bs-toggle="dropdown">
                                                                    {record?.next || "-"}
                                                                </td>
                                                                <td className="text-end" data-bs-toggle="dropdown">
                                                                    {record?.refcount || "-"}
                                                                </td>
                                                                <td data-bs-toggle="dropdown">
                                                                    {record?.linkType || "-"}
                                                                </td>

                                                                <td data-bs-toggle="dropdown">
                                                                    <div className={`${getStatusLabelClass(record?.disabled)}`}
                                                                        style={{ width: "110px", height: "24px" }} >
                                                                        {record?.disabled}
                                                                    </div>
                                                                </td>


                                                                <td>
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
                                                                                            onClick={(e) => click4SyncLink(e, record, index)}>
                                                                                            <span
                                                                                                className="material-icons-outlined fs-24-unity me-2">sync</span>
                                                                                            <span>{sl.l_sync}</span>
                                                                                        </button>
                                                                                    </li>
                                                                                ) : null
                                                                            }

                                                                            {
                                                                                (check4Right(accessObjectName, `${accessActionPrefix}.update`) && record.disabled === "true") ? (
                                                                                    <li>
                                                                                        <button
                                                                                            className="dropdown-item border-bottom d-flex align-items-center"
                                                                                            type="button"
                                                                                            onClick={(e) => click4EnableLink(e, record, index)}>
                                                                                            <span
                                                                                                className="material-icons-outlined fs-24-unity me-2">check_circle</span>
                                                                                            <span>{sl.l_enable}</span>
                                                                                        </button>
                                                                                    </li>
                                                                                ) : null
                                                                            }

                                                                            {
                                                                                (check4Right(accessObjectName, `${accessActionPrefix}.update`) && record.disabled === "false") ? (
                                                                                    <li>
                                                                                        <button
                                                                                            className="dropdown-item border-bottom d-flex align-items-center"
                                                                                            type="button"
                                                                                            onClick={(e) => click4DisableLink(e, record, index)}>
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
                                                                                            onClick={(e) => click4RemoveLink(e, record, index)}>
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


                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                // end of table responsive
                            }

                        </div>


                    </div>

                    <SelectListDialogBox debugMode={debugMode} />
                    <DumpPanel dataList={[
                        { name: "dataList4Route", data: dataList4Route },
                        { name: "dataList4Link", data: dataList4Link },
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