
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
import { ClosablePanel } from "./ClosablePanel.js";

import { showStateDialogBox, closeStateDialogBox } from "./StateDialogBox.js";
import { showInfoDialogBox } from "./InfoDialogBox.js";
import { institutionRecord } from "./InstitutionDetailPage.js";

// Map loaded lib here ...
const uuidv4 = window.uuidv4;
const moment = window.moment;

let tableName = "kswitchinstitution_timers";
let databaseName = "kdb";

const accessObjectName = "webapp_configuration_access";
const accessActionPrefix = "timer_management";

let dataRecord = undefined;
let rowId = undefined;
let closePanel = {};
let tabIndex = 1;

export function cleanUp() {
    console.log(`Clean up for ${componentName}`);
    dataRecord = undefined;
    rowId = undefined;
    closePanel = {};
    tabIndex = 1;
    return;
};

const componentName = "TimerDetailPage";

export function TimerDetailPage({ debugMode = true }) {
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
            rowId = sp.get('rowId');

            // fetch data 
            let result4 = await apiBox.getRecord(getSessionToken(), databaseName, tableName, `rowId = ${rowId}`);

            if (result4.flag) {
                let list1 = result4.data.records;
                /* preprocess 
                list1 = list1.map((item) => {
                    return item
                });
                */

                dataRecord = list1[0];
                console.log("Record", dataRecord);
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

    function click4Tab(n) {
        if (debugMode) console.log("Click for tab ", n);

        tabIndex = n;
        setRedraw((v) => v + 1);
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

        let s = "rounded-3 text-center fw-light text-capitalize text-white ";
        if (v == undefined) return s;
        if (v == "A") return s + "bg-success";
        if (v == "P") return s + "bg-warning";
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

    function click4EditRecord(e, record) {
        if (debugMode) console.log("Click for edit record", e, record);

        let sp = new URLSearchParams({
            rowId: record.rowId,
            editMode: 1
        });

        let path = {
            pathname: "/editTimer",
            search: sp.toString(),
        };
        navigate(path);
        return;
    };

    function click4Echo(e, record, index) {
        if (debugMode) console.log("Click for echo ", e, record, index);
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
                                {sl.l_timer_management}
                            </div>
                        </div>

                        <div className="d-flex justify-content-center">
                            <div className="col-11 col-xl-12">
                                <div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center pt-16">
                                            <div className="fs-14-unity pr-8">
                                                {sl.l_timer}
                                            </div>
                                            <div className={`${getStatusLabelClass(dataRecord?.recordStatus)}`}
                                                style={{ color: "#494D4F", fontSize: "14px", width: "110px", height: "24px" }} >
                                                <span >
                                                {getLabel(sl, dataRecord?.recordStatus, "o_record_status_")}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="dropdown dropstart">
                                            {/* <button className="btn-more p-2">
                                                <span class="material-symbols-outlined">more_vert</span>
                                            </button> */}
                                            <span className="d-inline-flex align-items-center " role="button" data-bs-toggle="dropdown">
                                                <div className="btn-more p-2">
                                                    <span className="material-icons fs-18-unity">more_vert</span>
                                                </div>
                                            </span>
                                            <div className="dropdown-menu fs-14-unity border-0 shadow p-0" style={{ borderRadius: "8px" }}>
                                                <ul className="list-unstyled p-2 mb-0">
                                                    <li>
                                                        <button className="dropdown-item border-bottom d-flex align-items-center" type="button">
                                                            <span>{sl.b_change_status}</span>
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button className="dropdown-item border-bottom d-flex align-items-center" type="button">
                                                            <span>{sl.b_delete_timer}</span>
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button className="dropdown-item border-bottom d-flex align-items-center" type="button">
                                                            <span>{sl.b_copy_id}</span>
                                                        </button>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="detail-title">
                                        {dataRecord?.institutionId}
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
                                                        {sl.l_chrono_unit}
                                                    </div>
                                                    <div className="fw-semibold">
                                                        {dataRecord?.chronoUnit || "-"}
                                                    </div>
                                                </div>
                                                <div className="fs-14-unity info-synap">
                                                    <div className="fw-normal pb-4px">
                                                        {sl.l_total_inst_attached}
                                                    </div>
                                                    <div className="fw-semibold">
                                                        {"-"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="tab-wrapper">
                                    <div className="tab-bar">
                                        <div className="col-12 d-flex">
                                            <div className={`tab-item ${tabIndex === 1 ? 'active' : ''}`} onClick={() => click4Tab(1)}>
                                                {sl.l_timer_sm}
                                            </div>
                                            <div className={`tab-item ${tabIndex === 2 ? 'active' : ''}`} onClick={() => click4Tab(2)}>
                                                {sl.l_conf}
                                            </div>
                                            <div className={`tab-item ${tabIndex === 3 ? 'active' : ''}`} onClick={() => click4Tab(3)}>
                                                {sl.l_inst_attached}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-center">
                                    <div className="col-12">
                                        {
                                            tabIndex === 1 ? (
                                                <ClosablePanel name="timer_information"
                                                    title={sl.l_timer_information}
                                                    closeFlag={closePanel?.timer_information}
                                                    callback4Toggle={callback4TogglePanel}>
                                                    <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                        style={{ minHeight: "168px" }} >
                                                        <div className="px-5 py-1 w-100">

                                                            <DisplayLine label={sl.l_row_id} value={dataRecord?.rowId} />
                                                            <DisplayLine label={sl.l_institution_id} value={dataRecord?.institutionId} />
                                                            <DisplayLine label={sl.l_status} value={getLabel(sl, dataRecord?.recordStatus, "o_record_status_")} />
                                                            <DisplayLine label={sl.l_chrono_unit} value={dataRecord?.chronoUnit} />
                                                        </div>
                                                    </div>

                                                    {
                                                        check4Right(accessObjectName, `${accessActionPrefix}.add`) ? (
                                                            <div className="d-flex justify-content-end align-items-center px-4 border-top"
                                                                style={{ minHeight: "56px" }}>
                                                                <button className="btn btn-ghost-unity d-flex align-items-center"
                                                                    style={{ color: "#494D4F", fontWeight: "500" }}
                                                                    onClick={(e) => click4EditRecord(e, dataRecord)}>
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
                                                <ClosablePanel name="timer_information"
                                                    title={sl.l_conf}
                                                    closeFlag={closePanel?.timer_information}
                                                    callback4Toggle={callback4TogglePanel}>
                                                    <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                        style={{ minHeight: "168px" }} >
                                                        <div className="px-5 py-1 w-100">

                                                            <DisplayLine label={sl.l_timer_0} value={dataRecord?.timer0} />
                                                            <DisplayLine label={sl.l_timer_A} value={dataRecord?.timerA} />
                                                            <DisplayLine label={sl.l_timer_K} value={dataRecord?.timerK} />
                                                            <DisplayLine label={sl.l_timer_1} value={dataRecord?.timer1} />
                                                            <DisplayLine label={sl.l_timer_1220} value={dataRecord?.timer1220} />
                                                            <DisplayLine label={sl.l_timer_2} value={dataRecord?.timer2} />
                                                            <DisplayLine label={sl.l_timer_3} value={dataRecord?.timer3} />
                                                            <DisplayLine label={sl.l_timer_4} value={dataRecord?.timer4} />
                                                            <DisplayLine label={sl.l_timer_5} value={dataRecord?.timer5} />
                                                            <DisplayLine label={sl.l_timer_6} value={dataRecord?.timer6} />
                                                            <DisplayLine label={sl.l_timer_7} value={dataRecord?.timer7} />
                                                            <DisplayLine label={sl.l_timer_8} value={dataRecord?.timer8} />
                                                            <DisplayLine label={sl.l_timer_9} value={dataRecord?.timer9} />
                                                            <DisplayLine label={sl.l_timer_10} value={dataRecord?.timer10} />
                                                            <DisplayLine label={sl.l_timer_11} value={dataRecord?.timer11} />

                                                        </div>
                                                    </div>

                                                    {
                                                        check4Right(accessObjectName, `${accessActionPrefix}.add`) ? (
                                                            <div className="d-flex justify-content-end align-items-center px-4 border-top"
                                                                style={{ minHeight: "56px" }}>
                                                                <button className="btn btn-ghost-unity d-flex align-items-center"
                                                                    style={{ color: "#494D4F", fontWeight: "500" }}
                                                                    onClick={(e) => click4EditRecord(e, dataRecord)}>
                                                                    <span className="material-icons-outlined fs-24-unity me-2">edit</span>
                                                                    {sl.b_edit}
                                                                </button>
                                                            </div>
                                                        ) : null
                                                    }

                                                </ClosablePanel>
                                            ) : null
                                        }
                                    </div>
                                </div>
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
        </div>
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