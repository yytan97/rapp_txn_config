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
const accessActionPrefix = "object_management";

let dataRecord = undefined;
let objectName = undefined;
let closePanel = {};

let actionList = [];

let inputData = {};
let formObject = {
    dirty: false,
    valid: false,
    fieldState: {},
};

export function cleanUp() {
    console.log(`Clean up for ${componentName}`);
    dataRecord = undefined;
    objectName = undefined;
    closePanel = {};

    inputData = {};
    formObject = {
        dirty: false,
        valid: false,
        fieldState: {},
    };

    return;
};


const componentName = "ObjectDetailPage";

export function ObjectDetailPage({ debugMode = true }) {
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
            objectName = sp.get('objectName');

            // fetch data 
            let result4 = await apiBox.getObjectRecord(getSessionToken(), objectName);

            if (result4.flag) {
                let list4 = result4.data.accessRightsObjects;
                /* preprocess 
                list4 = list4.map((item) => {
                    return item
                });
                */

                dataRecord = list4[0];
                console.log("Record", dataRecord);

                let result5 = await apiBox.getObjectActionList(getSessionToken(), objectName);
                if (result5.flag) {
                    let record5 = result5.data?.accessRightsObjects[0]?.accessRightsActions;

                    actionList = Object.keys(record5 || {})?.map((key, index) => {
                        return { name: key };
                    });
                }
                else actionList = [];
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

    function click4AddAction(e, actionName) {
        if (debugMode) console.log("Click for add action", e, actionName);

        let message = sl.m_confirm_add_action;
        message = message.replace(/__parameter_1/, actionName);
        showConfirmDialogBox(message, async function () {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.addObjectAction(getSessionToken(), objectName, actionName);
                if (result1 && result1.flag) {
                    let message = sl.m_action_added;
                    showInfoDialogBox(message);

                    inputData.actionName = undefined;
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

    function click4RemoveAction(e, actionName) {
        if (debugMode) console.log("Click for remove action", e, actionName);

        let message = sl.m_confirm_remove_action;
        message = message.replace(/__parameter_1/, actionName);
        showConfirmDialogBox(message, async function () {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {

                let result1 = await apiBox.deleteObjectAction(getSessionToken(), objectName, actionName);
                if (result1 && result1.flag) {
                    let message = sl.m_action_removed;
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
                                                    {sl.l_last_updated}: {tBox.formatDate(dataRecord?.recordTimestamp)}
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
                                    <ClosablePanel name="action"
                                        title={sl.l_actions}
                                        closeFlag={closePanel?.action}
                                        callback4Toggle={callback4TogglePanel}>
                                        <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                            style={{ minHeight: "168px" }} >
                                            <div className="px-5 py-1 w-100">

                                                {
                                                    actionList?.map((record, index) => {
                                                        return (
                                                            <div key={index} className="d-flex align-items-center justify-content-between my-3">

                                                                <div className="d-flex align-items-center">
                                                                    <div className="me-3" style={{ color: "#76797B", fontSize: "12px" }}>
                                                                        {index + 1}
                                                                    </div>
                                                                    <div style={{ color: "#76797B", fontSize: "16px" }}>
                                                                        {record.name}
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    {
                                                                        check4Right(accessObjectName, `${accessActionPrefix}.action.delete`) ? (
                                                                            <span className="d-inline-flex align-items-center "
                                                                                role="button"
                                                                                onClick={(e) => click4RemoveAction(e, record.name, index)}>
                                                                                <span className="material-icons-outlined fs-24-unity">delete</span>
                                                                            </span>
                                                                        ) : null
                                                                    }
                                                                </div>

                                                            </div>
                                                        );
                                                    })

                                                }


                                            </div>
                                        </div>

                                        {
                                            check4Right(accessObjectName, `${accessActionPrefix}.members.add`) ? (

                                                <form name="form4AddAction" noValidate
                                                    ref={ref4Form}
                                                    className="px-4 border-top"
                                                    style={{ minHeight: "56px" }} >

                                                    <div className="mt-3">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <input name="actionName"
                                                                type="text"
                                                                className={`form-control ${tBox.getClass4IsInvalid2('actionName', formObject)}`}
                                                                placeholder={sl.p_action_name}
                                                                pattern="^[a-zA-Z0-9._]*$"
                                                                value={inputData?.actionName || ""}
                                                                onChange={change4Record}
                                                            />

                                                            <button className="ms-2 btn btn-ghost-unity d-flex align-items-center"
                                                                type="button"
                                                                style={{ color: "#494D4F", fontWeight: "500" }}
                                                                onClick={(e) => click4AddAction(e, inputData?.actionName)}
                                                                disabled={!formObject?.valid || !inputData?.actionName}>
                                                                <span className="material-icons-outlined fs-24-unity me-2">add</span>
                                                                <span className="text-nowrap">{sl.b_add_action}</span>
                                                            </button>
                                                        </div>
                                                        <ErrorLine message={tBox.getFieldErrorMessage2('actionName', sl, formObject)} />
                                                    </div>

                                                </form>

                                            ) : null
                                        }

                                    </ClosablePanel>

                                </div>

                            </div>
                        </div>

                    </div>  {/* end of content panel */}

                    <DumpPanel dataList={[
                        { name: "dataRecord", data: dataRecord },
                        { name: "actionList", data: actionList },
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