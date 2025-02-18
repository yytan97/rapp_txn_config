
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

// import "./TransactionHistoryDetailPage.css";


// Map loaded lib here ...
const uuidv4 = window.uuidv4;
const moment = window.moment;

let tableName = "kswitch_fin_log";
let databaseName = "kdb";

const accessObjectName = "webapp_configuration_access";
const accessActionPrefix = "transaction_history";

let dataRecord = undefined;
let switchSequence = undefined;
let closePanel = {};
let currencyList = [];

export function cleanUp() {
    console.log(`Clean up for ${componentName}`);
    dataRecord = undefined;
    switchSequence = undefined;
    closePanel = {};
    return;
};

const componentName = "TransactionHistoryDetailPage";

export function TransactionHistoryDetailPage({ debugMode = true }) {
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
            switchSequence = sp.get('switchSequence');

            // fetch data 
            let filterSegment = {
                transaction: {
                    switchSequence: switchSequence
                }
            };
            let result4 = await apiBox.getTransactionHistoryList(getSessionToken(), filterSegment);

            if (result4.flag) {
                let list1 = result4.data.transactions;
                /* preprocess 
                list1 = list1.map((item) => {
                    return item
                });
                */

                dataRecord = list1[0];
                console.log("Record", dataRecord);
            }
            else throw (result4);

            currencyList = await getCurrencyList();

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

    /*
    function getLabel(sl, value, prefix = "") {
        if (debugMode) console.log("Get label ", value, prefix);
        let key = prefix + value;
        let s = sl[key];
        return s;
    };
    */

    function getStatusLabelClass(v) {
        if (debugMode) console.log("Get status label class", v);

        let s = "rounded-3 text-center fw-light text-capitalize text-white ";
        if (v == undefined) return s;
        if (v == "0") return s + "bg-success";
        return s + "bg-danger";

    };

    function check4Value(name) {
        let value = undefined;
        if (dataRecord) value = dataRecord[name];

        if (name == "local") return false;

        if (name == "rowId") return false;
        if (name == "recordStatus") return false;

        if (name == "pcode") return true;
        if (name == "responseCode") return true;
        if (name == "switchResponseCode") return true;
        if (value == undefined || value == "" || value == "0" || value == "0.0") return false;
        if (value == "0000-00-00" || value == "00:00:00") return false;
        if (value == "0000-00-00 00:00:00") return false;

        return true;
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
            pathname: "/editCryptogram",
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
        <>
            <style>
                {`
                .synap-field-line:hover {
                    background-color: #f5f5f5;
                }
                `}
            </style>

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
                                                        {
                                                            tBox.getLabel(sl, tBox.processingCode2Description(dataRecord?.pcode), "s_") ||
                                                            tBox.processingCode2Description(dataRecord?.pcode)
                                                        }

                                                    </div>
                                                    <div className={`${getStatusLabelClass(dataRecord?.responseCode)}`}
                                                        style={{ color: "#494D4F", fontSize: "14px", width: "110px", height: "24px" }} >
                                                        <span>
                                                            {
                                                                tBox.getLabel(sl, tBox.responseCode2Description(dataRecord?.responseCode), "s_") ||
                                                                tBox.responseCode2Description(dataRecord?.responseCode)
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                                <div style={{ color: "#494D4F", fontSize: "32px", fontWeight: "bold" }} >
                                                    {tBox.getCurrencyAlphaCode(currencyList, dataRecord?.transactionCcy) + " "}
                                                    {
                                                        tBox.formatAmount(dataRecord?.transactionAmount,
                                                            tBox.getCurrencyMinorUnit(currencyList, dataRecord?.transactionCcy))
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <ClosablePanel name="transaction_detail"
                                            title={sl.l_transaction_detail}
                                            closeFlag={closePanel?.transaction_detail}
                                            callback4Toggle={callback4TogglePanel}>
                                            <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                style={{ minHeight: "168px" }} >
                                                <div className="p-1 w-100 mb-3">

                                                    {
                                                        Object.keys(dataRecord || {})?.map((key, index) => {
                                                            return check4Value(key) ? <DisplayLine
                                                                key={index}
                                                                label={tBox.getLabel(sl, key, "f_") || key}
                                                                value={dataRecord?.[key]} /> : null;
                                                        })
                                                    }

                                                </div>
                                            </div>
                                        </ClosablePanel>

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
        </>
    );
};

export function DisplayLine({ label, value, debugMode = false }) {

    return (
        <div className="d-flex justify-content-between align-items-center px-5 py-2 synap-field-line">
            <div className="text-nowrap" style={{ color: "#76797B", fontSize: "14px", minWidth: "30%" }}>
                {label}
            </div>
            <div className="flex-fill text-end text-break" style={{ color: "#494D4F", fontSize: "16px" }}>
                {value || "-"}
            </div>
        </div>
    );
};

