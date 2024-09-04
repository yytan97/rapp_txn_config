
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

const accessObjectName = "webapp_switch_service_access";
const accessActionPrefix = "switch_server_control";

let order4Thread = {
    field: {},
    name: undefined,
};

let dataRecord = {};

let closePanel = {};
let tabIndex = 1;


// input variable
let inputData = {};
let formObject = {
    dirty: false,
    valid: false,
    fieldState: {},
};

export function cleanUp() {
    console.log(`Clean up for ${componentName}`);
    closePanel = {};
    tabIndex = 1;

    inputData = {};
    formObject = {
        dirty: false,
        valid: false,
        fieldState: {},
    };

    order4Thread = {
        field: {},
        name: undefined,
    };
    return;
};

const componentName = "SwitchServerControlPage";
export function SwitchServerControlPage({ debugMode = true }) {
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

            // check for user access right
            if (!check4Right(accessObjectName, `${accessActionPrefix}.access`)) {
                throw ({ errorCode: "permission_denied" });
            }

            // parse parameter 
            /*
            const sp = new URLSearchParams(location.search);
            rowId = sp.get('rowId');
            */

            // fetch data 
            dataRecord = {};
            let result1 = await apiBox.command4ServerStat(getSessionToken());
            if (result1.flag) {

                dataRecord.server = result1.data?.server;
                dataRecord.stat = result1.data?.statistics;
                console.log("Data record", dataRecord);
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

    /*
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
    */

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

    function sort4ThreadOrder(record1, record2) {
        let order = order4Thread;
        let name = order.name;
        let numericTypeList = ["received", "sent", "failed", "timeout", "total",
            "requests", "responses", "unmatched", "averageCPU", "averageClock"];

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

                            <div className="col-3">

                                <div className="px-4" style={{ marginTop: "200px", fontSize: "12px" }}>
                                    <div className="my-4"
                                        onClick={() => click4Tab(1)}
                                        style={tabIndex === 1 ? { color: '#487798', cursor: "pointer" } : { color: '#76797B', cursor: "pointer" }}>
                                        {sl.l_server_information}
                                    </div>
                                    <div className="my-4"
                                        onClick={() => click4Tab(2)}
                                        style={tabIndex === 2 ? { color: '#487798', cursor: "pointer" } : { color: '#76797B', cursor: "pointer" }}>
                                        {sl.l_server_io}
                                    </div>
                                    <div className="my-4"
                                        onClick={() => click4Tab(3)}
                                        style={tabIndex === 3 ? { color: '#487798', cursor: "pointer" } : { color: '#76797B', cursor: "pointer" }}>
                                        {sl.l_queue}
                                    </div>
                                    <div className="my-4"
                                        onClick={() => click4Tab(4)}
                                        style={tabIndex === 4 ? { color: '#487798', cursor: "pointer" } : { color: '#76797B', cursor: "pointer" }}>
                                        {sl.l_kernel_memory}
                                    </div>
                                    <div className="my-4"
                                        onClick={() => click4Tab(5)}
                                        style={tabIndex === 5 ? { color: '#487798', cursor: "pointer" } : { color: '#76797B', cursor: "pointer" }}>
                                        {sl.l_database}
                                    </div>
                                    <div className="my-4"
                                        onClick={() => click4Tab(6)}
                                        style={tabIndex === 6 ? { color: '#487798', cursor: "pointer" } : { color: '#76797B', cursor: "pointer" }}>
                                        {sl.l_timer}
                                    </div>
                                    <div className="my-4"
                                        onClick={() => click4Tab(7)}
                                        style={tabIndex === 7 ? { color: '#487798', cursor: "pointer" } : { color: '#76797B', cursor: "pointer" }}>
                                        {sl.l_kernel_threads}
                                    </div>

                                </div>
                            </div>

                            <div className="col-9 ">

                                <div className="" style={{ marginTop: "64px" }}>
                                    <div className="d-flex align-items-center justify-content-center bg-white px-5"
                                        style={{ borderRadius: "16px 16px 16px 16px", border: "1px solid #ebebeb", minHeight: "154px" }}>
                                        <div style={{ width: "100%" }} >
                                            <div className="d-flex justify-content-between">
                                                <div style={{ color: "#494D4F", fontSize: "14px" }} >
                                                    {sl.l_start_time}: {dataRecord?.server?.startTime}
                                                </div>
                                                <div className={`${getStatusLabelClass(dataRecord?.server?.state)}`}
                                                    style={{ color: "#494D4F", fontSize: "14px", width: "110px", height: "24px" }} >
                                                    <span >
                                                        {getLabel(sl, dataRecord?.server?.state, "o_state_") || dataRecord?.server?.state}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ color: "#494D4F", fontSize: "32px", fontWeight: "bold" }} >
                                                <span>{sl.l_title}</span>
                                                {(dataRecord?.server?.pid) ? <span className="ms-2">({dataRecord?.server?.pid})</span> : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {
                                    tabIndex === 1 ? (
                                        <ClosablePanel name="server_information"
                                            title={sl.l_server_information}
                                            closeFlag={closePanel?.server_information}
                                            callback4Toggle={callback4TogglePanel}>
                                            <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                style={{ minHeight: "168px" }} >
                                                <div className="px-5 py-1 w-100">

                                                    <DisplayLine label={sl.l_pid} value={dataRecord?.server?.pid} />
                                                    <DisplayLine label={sl.l_start_time} value={dataRecord?.server?.startTime} />
                                                    <DisplayLine label={sl.l_connection_count} value={dataRecord?.server?.connectionCount} />

                                                    <DisplayLine label={sl.l_total_connections} value={dataRecord?.server?.totalConnections} />
                                                    <DisplayLine label={sl.l_timer_connections} value={dataRecord?.server?.timerConnections} />
                                                    <DisplayLine label={sl.l_state} value={dataRecord?.server?.state} />
                                                    <DisplayLine label={sl.l_last_transaction_time} value={dataRecord?.server?.lastTransactionTime} />
                                                    <DisplayLine label={sl.l_total_threads} value={dataRecord?.server?.totalThreads} />
                                                    <DisplayLine label={sl.l_tps_current} value={dataRecord?.server?.arrivalRate?.tpsCurrent} />
                                                    <DisplayLine label={sl.l_tps_current_time} value={dataRecord?.server?.arrivalRate?.tpsCurrentTime} />
                                                    <DisplayLine label={sl.l_tps_max} value={dataRecord?.server?.arrivalRate?.tpsMax} />
                                                    <DisplayLine label={sl.l_tps_max_time} value={dataRecord?.server?.arrivalRate?.tpsMaxTime} />

                                                </div>
                                            </div>

                                        </ClosablePanel>
                                    ) : null
                                }

                                {
                                    tabIndex === 2 ? (
                                        <ClosablePanel name="server_io"
                                            title={sl.l_server_io}
                                            closeFlag={closePanel?.server_io}
                                            callback4Toggle={callback4TogglePanel}>
                                            <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                style={{ minHeight: "168px" }} >
                                                <div className="px-5 py-1 w-100">

                                                    <DisplayLine label={sl.l_total_processed} value={dataRecord?.server?.serverIO?.totalProcessed} />
                                                    <DisplayLine label={sl.l_total_received} value={dataRecord?.server?.serverIO?.totalReceived} />
                                                    <DisplayLine label={sl.l_total_sent} value={dataRecord?.server?.serverIO?.totalSent} />
                                                    <DisplayLine label={sl.l_total_timeout} value={dataRecord?.server?.serverIO?.totalTimeout} />
                                                    <DisplayLine label={sl.l_total_failed_timeout} value={dataRecord?.server?.serverIO?.totalFailedTimeout} />

                                                </div>
                                            </div>

                                        </ClosablePanel>
                                    ) : null
                                }

                                {
                                    tabIndex === 3 ? (
                                        <ClosablePanel name="queue"
                                            title={sl.l_queue}
                                            closeFlag={closePanel?.queue}
                                            callback4Toggle={callback4TogglePanel}>
                                            <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                style={{ minHeight: "168px" }} >
                                                <div className="px-5 py-1 w-100">

                                                    <DisplayLine label={sl.l_available} value={dataRecord?.server?.queues?.available} />
                                                    <DisplayLine label={sl.l_max_size} value={dataRecord?.server?.queues?.runQueue?.maxSize} />
                                                    <DisplayLine label={sl.l_waiting} value={dataRecord?.server?.queues?.runQueue?.waiting} />
                                                    <DisplayLine label={sl.l_timeouts} value={dataRecord?.server?.queues?.runQueue?.timeouts} />
                                                    <DisplayLine label={sl.l_requests} value={dataRecord?.server?.queues?.runQueue?.requests} />
                                                    <DisplayLine label={sl.l_responses} value={dataRecord?.server?.queues?.runQueue?.responses} />
                                                    <DisplayLine label={sl.l_avg_latency} value={dataRecord?.server?.queues?.runQueue?.avgLatency} />

                                                </div>
                                            </div>

                                        </ClosablePanel>
                                    ) : null
                                }

                                {
                                    tabIndex === 4 ? (
                                        <ClosablePanel name="kernel_memory"
                                            title={sl.l_kernel_memory}
                                            closeFlag={closePanel?.kernel_memory}
                                            callback4Toggle={callback4TogglePanel}>
                                            <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                style={{ minHeight: "168px" }} >
                                                <div className="px-5 py-1 w-100">

                                                    <DisplayLine label={sl.l_ctx_current_count} value={dataRecord?.server?.kernelMemory?.ctxCurrentCount} />
                                                    <DisplayLine label={sl.l_ctx_size} value={dataRecord?.server?.kernelMemory?.ctxSize} />
                                                    <DisplayLine label={sl.l_ctx_allocated} value={dataRecord?.server?.kernelMemory?.ctxAllocated} />
                                                    <DisplayLine label={sl.l_msg_current_count} value={dataRecord?.server?.kernelMemory?.msgCurrentCount} />
                                                    <DisplayLine label={sl.l_msg_size} value={dataRecord?.server?.kernelMemory?.msgSize} />
                                                    <DisplayLine label={sl.l_msg_allocated} value={dataRecord?.server?.kernelMemory?.msgAllocated} />

                                                </div>
                                            </div>
                                        </ClosablePanel>
                                    ) : null
                                }

                                {
                                    tabIndex === 5 ? (
                                        <ClosablePanel name="database"
                                            title={sl.l_database}
                                            closeFlag={closePanel?.database}
                                            callback4Toggle={callback4TogglePanel}>
                                            <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                style={{ minHeight: "168px" }} >
                                                <div className="px-5 py-1 w-100">

                                                    <DisplayLine label={sl.l_total_database_writes} value={dataRecord?.server?.database?.totalDatabaseWriters} />
                                                    <DisplayLine label={sl.l_database_write_count} value={dataRecord?.server?.database?.databaseWriteCount} />
                                                    <DisplayLine label={sl.l_database_queue_size} value={dataRecord?.server?.database?.databaseQueueSize} />

                                                </div>
                                            </div>
                                        </ClosablePanel>
                                    ) : null
                                }

                                {
                                    tabIndex === 6 ? (
                                        <ClosablePanel name="timer"
                                            title={sl.l_timer}
                                            closeFlag={closePanel?.timer}
                                            callback4Toggle={callback4TogglePanel}>
                                            <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                style={{ minHeight: "168px" }} >
                                                <div className="px-5 py-1 w-100">

                                                    <DisplayLine label={sl.l_mode} value={dataRecord?.server?.timer?.mode} />
                                                    <DisplayLine label={sl.l_alert_client} value={dataRecord?.server?.timer?.alertClient} />
                                                    <DisplayLine label={sl.l_post_direct} value={dataRecord?.server?.timer?.postDirect} />
                                                    <DisplayLine label={sl.l_alert_client_posts} value={dataRecord?.server?.timer?.alertClientPosts} />
                                                    <DisplayLine label={sl.l_alert_client_queue_current} value={dataRecord?.server?.timer?.alertClientQueueCurrent} />
                                                    <DisplayLine label={sl.l_alert_client_queue_max} value={dataRecord?.server?.timer?.alertClientQueueMax} />
                                                    <DisplayLine label={sl.l_alert_client_event_count} value={dataRecord?.server?.timer?.alertClientEventCount} />

                                                </div>
                                            </div>
                                        </ClosablePanel>
                                    ) : null
                                }

                                {
                                    tabIndex === 7 ? (
                                        <ClosablePanel name="kernel_threads"
                                            title={sl.l_kernel_threads}
                                            closeFlag={closePanel?.kernel_threads}
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
                                                                    <th className="bg-white"
                                                                        style={{ position: "sticky", left: "0px" }}
                                                                        role="button"
                                                                        onClick={(e) => toggle4Order(e, order4Thread, 'thread.threadId')}>
                                                                        {sl.h_thread_id} {getOrderIndicator(order4Thread, 'thread.threadId')}
                                                                    </th>
                                                                    <th role="button" onClick={(e) => toggle4Order(e, order4Thread, 'thread.state')}>
                                                                        {sl.h_state} {getOrderIndicator(order4Thread, 'thread.state')}
                                                                    </th>
                                                                    <th role="button" onClick={(e) => toggle4Order(e, order4Thread, 'thread.lastTransactionTime')}>
                                                                        {sl.h_last_transaction_time} {getOrderIndicator(order4Thread, 'thread.lastTransactionTime')}
                                                                    </th>
                                                                    <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order4Thread, 'thread.received')}>
                                                                        {sl.h_received} {getOrderIndicator(order4Thread, 'thread.received')}
                                                                    </th>
                                                                    <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order4Thread, 'thread.sent')}>
                                                                        {sl.h_sent} {getOrderIndicator(order4Thread, 'thread.sent')}
                                                                    </th>
                                                                    <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order4Thread, 'thread.failed')}>
                                                                        {sl.h_failed} {getOrderIndicator(order4Thread, 'thread.failed')}
                                                                    </th>
                                                                    <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order4Thread, 'thread.timeout')}>
                                                                        {sl.h_timeout} {getOrderIndicator(order4Thread, 'thread.timeout')}
                                                                    </th>
                                                                    <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order4Thread, 'thread.total')}>
                                                                        {sl.h_total} {getOrderIndicator(order4Thread, 'thread.total')}
                                                                    </th>
                                                                    <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order4Thread, 'thread.requests')}>
                                                                        {sl.h_requests} {getOrderIndicator(order4Thread, 'thread.requests')}
                                                                    </th>
                                                                    <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order4Thread, 'thread.responses')}>
                                                                        {sl.h_responses} {getOrderIndicator(order4Thread, 'thread.responses')}
                                                                    </th>
                                                                    <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order4Thread, 'thread.unmatched')}>
                                                                        {sl.h_unmatched} {getOrderIndicator(order4Thread, 'thread.unmatched')}
                                                                    </th>
                                                                    <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order4Thread, 'thread.averageCPU')}>
                                                                        {sl.h_average_cpu} {getOrderIndicator(order4Thread, 'thread.averageCPU')}
                                                                    </th>
                                                                    <th className="text-end" role="button" onClick={(e) => toggle4Order(e, order4Thread, 'thread.averageClock')}>
                                                                        {sl.h_average_clock} {getOrderIndicator(order4Thread, 'thread.averageClock')}
                                                                    </th>

                                                                </tr>
                                                            </thead>

                                                            <tbody>
                                                                {
                                                                    dataRecord?.stat?.kernelThreads?.toSorted(sort4ThreadOrder).map((record, index) => {
                                                                        // console.log("Build table row", record, index);
                                                                        return (
                                                                            <tr key={index}
                                                                                className="text-nowrap"
                                                                                style={{ fontSize: "14px" }} >
                                                                                <td className="text-end"  >
                                                                                    {index + 1}
                                                                                </td>
                                                                                <td className="bg-white"
                                                                                    style={{ position: "sticky", left: "0px" }} >
                                                                                    {record?.thread?.threadId}
                                                                                </td>
                                                                                <td>
                                                                                    {record?.thread?.state || "-"}
                                                                                </td>
                                                                                <td>
                                                                                    {record?.thread?.lastTransactionTime || "-"}
                                                                                </td>
                                                                                <td className="text-end">
                                                                                    {record?.thread?.received || "-"}
                                                                                </td>
                                                                                <td className="text-end">
                                                                                    {record?.thread?.sent || "-"}
                                                                                </td>
                                                                                <td className="text-end">
                                                                                    {record?.thread?.failed || "-"}
                                                                                </td>
                                                                                <td className="text-end">
                                                                                    {record?.thread?.timeout || "-"}
                                                                                </td>
                                                                                <td className="text-end">
                                                                                    {record?.thread?.total || "-"}
                                                                                </td>
                                                                                <td className="text-end">
                                                                                    {record?.thread?.requests || "-"}
                                                                                </td>
                                                                                <td className="text-end">
                                                                                    {record?.thread?.responses || "-"}
                                                                                </td>
                                                                                <td className="text-end">
                                                                                    {record?.thread?.unmatched || "-"}
                                                                                </td>
                                                                                <td className="text-end">
                                                                                    {record?.thread?.averageCPU || "-"}
                                                                                </td>
                                                                                <td className="text-end">
                                                                                    {record?.thread?.averageClock || "-"}
                                                                                </td>

                                                                            </tr>
                                                                        );
                                                                    })
                                                                }
                                                                <tr className="text-nowrap"
                                                                    style={{ fontSize: "14px" }} >
                                                                    <td className="text-end"  >

                                                                    </td>
                                                                    <td className="bg-white fw-bold"
                                                                        style={{ position: "sticky", left: "0px" }} >
                                                                        {sl.l_threads} {dataRecord?.stat?.kernelThreads?.length}
                                                                    </td>
                                                                    <td>
                                                                    </td>
                                                                    <td>
                                                                    </td>
                                                                    <td className="text-end">
                                                                        {dataRecord?.stat?.threadTotals?.received || "-"}
                                                                    </td>
                                                                    <td className="text-end">
                                                                        {dataRecord?.stat?.threadTotals?.sent || "-"}
                                                                    </td>
                                                                    <td className="text-end">
                                                                        {dataRecord?.stat?.threadTotals?.failed || "-"}
                                                                    </td>
                                                                    <td className="text-end">
                                                                        {dataRecord?.stat?.threadTotals?.timeout || "-"}
                                                                    </td>
                                                                    <td className="text-end">
                                                                        {dataRecord?.stat?.threadTotals?.total || "-"}
                                                                    </td>
                                                                    <td className="text-end">
                                                                        {dataRecord?.stat?.threadTotals?.requests || "-"}
                                                                    </td>
                                                                    <td className="text-end">
                                                                        {dataRecord?.stat?.threadTotals?.responses || "-"}
                                                                    </td>
                                                                    <td className="text-end">
                                                                        {dataRecord?.stat?.threadTotals?.unmatched || "-"}
                                                                    </td>
                                                                    <td className="text-end">
                                                                        {dataRecord?.stat?.threadTotals?.averageCPU || "-"}
                                                                    </td>
                                                                    <td className="text-end">
                                                                        {dataRecord?.stat?.threadTotals?.averageClock || "-"}
                                                                    </td>

                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                </div>
                                            </div>
                                        </ClosablePanel>
                                    ) : null
                                }

                            </div>
                        </div>

                    </div>  {/* end of content panel */}

                    <DumpPanel dataList={[
                        { name: "dataRecord", data: dataRecord },
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