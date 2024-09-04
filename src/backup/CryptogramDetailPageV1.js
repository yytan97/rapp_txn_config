
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

// Map loaded lib here ...
const uuidv4 = window.uuidv4;
const moment = window.moment;

let dataList = [];
let fieldList = [];

let tableName = "kswitchcryptograms";
let databaseName = "kdb";

let cryptogramRecord = undefined;
let rowId = undefined;
let closePanel = {};

export function CryptogramDetailPage({ debugMode = true }) {
    const componentName = "CryptogramDetailPage";
    if (debugMode) console.log(`${componentName} component start ...`);

    // let data = reactRouter.useLoaderData();
    const {
        config, localData, gsl, dataset, user,
        applicationDebugMode, applicationLanguage,
        updateUser,
        getSessionToken, getUsername,
        showConfirmDialogBox,
        showInfoDialogBox,
        showStateDialogBox, closeStateDialogBox
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

        return () => clearTimeout(timer);
    }, []);

    // event handling function here ...

    async function loadDataList() {
        showStateDialogBox();

        try {
            await tBox.sleep(1000 * 1);
            cryptogramRecord = {};

            // fetch data from cursor
            const sp = new URLSearchParams(location.search);
            rowId = sp.get('rowId');
            let result4 = await apiBox.getRecord(getSessionToken(), databaseName, tableName, `rowId = ${rowId}`);

            if (result4.flag) {
                let list1 = result4.data.records;
                /* preprocess 
                list1 = list1.map((item) => {
                    return item
                });
                */

                cryptogramRecord = list1[0];
                console.log("Record", cryptogramRecord);
                setRedraw((v) => v + 1);
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
        }

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

    function click4Echo(e, record, index) {
        if (debugMode) console.log("Click for echo ", e, record, index);
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
                                                    {sl.l_last_updated}: {cryptogramRecord?.local?.recordDate}
                                                </div>
                                                <div className={`rounded-3 text-center text-white fw-light ${getStatusLabelClass(cryptogramRecord?.recordStatus)}`}
                                                    style={{ color: "#494D4F", fontSize: "14px", width: "110px", height: "24px" }} >
                                                    <span >
                                                        {getLabel(sl, cryptogramRecord?.recordStatus, "o_record_status_")}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ color: "#494D4F", fontSize: "32px", fontWeight: "bold" }} >
                                                {cryptogramRecord?.keyFunction}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <ClosablePanel name="cryptogram_information"
                                        title={sl.l_cryptogram_information}
                                        closeFlag={closePanel?.cryptogram_information}
                                        callback4Toggle={callback4TogglePanel}>
                                        <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                            style={{ minHeight: "168px" }} >
                                            <div className="px-5 py-1 w-100">

                                                <div className="d-flex justify-content-between align-items-center my-3">
                                                    <div style={{ color: "#76797B", fontSize: "14px" }}>
                                                        {sl.l_row_id}
                                                    </div>
                                                    <div style={{ color: "#494D4F", fontSize: "16px" }}>
                                                        {cryptogramRecord?.rowId || '-'}
                                                    </div>
                                                </div>

                                                <div className="d-flex justify-content-between align-items-center my-3">
                                                    <div style={{ color: "#76797B", fontSize: "14px" }}>
                                                        {sl.l_owner_id}
                                                    </div>
                                                    <div style={{ color: "#494D4F", fontSize: "16px" }}>
                                                        {cryptogramRecord?.ownerId || '-'}
                                                    </div>
                                                </div>

                                                <div className="d-flex justify-content-between align-items-center my-3">
                                                    <div style={{ color: "#76797B", fontSize: "14px" }}>
                                                        {sl.l_key_function}
                                                    </div>
                                                    <div style={{ color: "#494D4F", fontSize: "16px" }}>
                                                        {cryptogramRecord?.keyFunction || '-'}
                                                    </div>
                                                </div>

                                                <div className="d-flex justify-content-between align-items-center my-3">
                                                    <div style={{ color: "#76797B", fontSize: "14px" }}>
                                                        {sl.l_key_algo}
                                                    </div>
                                                    <div style={{ color: "#494D4F", fontSize: "16px" }}>
                                                        {cryptogramRecord?.keyAlgo || '-'}
                                                    </div>
                                                </div>

                                                <div className="d-flex justify-content-between align-items-center my-3">
                                                    <div style={{ color: "#76797B", fontSize: "14px" }}>
                                                        {sl.l_bit_size}
                                                    </div>
                                                    <div style={{ color: "#494D4F", fontSize: "16px" }}>
                                                        {cryptogramRecord?.bitSize || '-'}
                                                    </div>
                                                </div>

                                                <div className="d-flex justify-content-between align-items-center my-3">
                                                    <div style={{ color: "#76797B", fontSize: "14px" }}>
                                                        {sl.l_iv}
                                                    </div>
                                                    <div style={{ color: "#494D4F", fontSize: "16px" }}>
                                                        {cryptogramRecord?.iv || '-'}
                                                    </div>
                                                </div>

                                                <div className="d-flex justify-content-between align-items-center my-3">
                                                    <div style={{ color: "#76797B", fontSize: "14px" }}>
                                                        {sl.l_cryptogram}
                                                    </div>
                                                    <div style={{ color: "#494D4F", fontSize: "16px" }}>
                                                        {cryptogramRecord?.cryptogram || '-'}
                                                    </div>
                                                </div>

                                                <div className="d-flex justify-content-between align-items-center my-3">
                                                    <div style={{ color: "#76797B", fontSize: "14px" }}>
                                                        {sl.l_kcv}
                                                    </div>
                                                    <div style={{ color: "#494D4F", fontSize: "16px" }}>
                                                        {cryptogramRecord?.kcv || '-'}
                                                    </div>
                                                </div>

                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-end align-items-center px-4 border-top"
                                            style={{ minHeight: "56px" }}>
                                            <button className="btn btn-ghost-unity d-flex align-items-center"
                                                style={{ color: "#494D4F", fontWeight: "500" }}
                                                ng-click="click4EditCryptogram()">
                                                <span className="material-icons-outlined fs-24-unity me-2">edit</span>
                                                {sl.b_edit}
                                            </button>
                                        </div>
                                    </ClosablePanel>

                                    <div className="mt-4 border" style={{ borderRadius: "16px" }}>
                                        <div className="d-flex align-items-center justify-content-between px-4 py-3" role="button"
                                            onClick={() => toggle4Panel('cryptogram_information')}>
                                            <div style={{ color: "#494D4F", fontSize: "16px", fontWeight: "bold" }}>
                                                {sl.l_cryptogram_information}
                                            </div>
                                            <div className="text-end">
                                                {
                                                    !closePanel?.cryptogram_information ?
                                                        <i className="fas fa-chevron-down fa-fw"></i>
                                                        :
                                                        <i className="fas fa-chevron-left fa-fw"></i>

                                                }
                                            </div>
                                        </div>
                                        {
                                            !closePanel?.cryptogram_information ?
                                                <>
                                                    <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                        style={{ minHeight: "168px" }} >
                                                        <div className="px-5 py-1 w-100">

                                                            <div className="d-flex justify-content-between align-items-center my-3">
                                                                <div style={{ color: "#76797B", fontSize: "14px" }}>
                                                                    {sl.l_row_id}
                                                                </div>
                                                                <div style={{ color: "#494D4F", fontSize: "16px" }}>
                                                                    {cryptogramRecord?.rowId || '-'}
                                                                </div>
                                                            </div>

                                                            <div className="d-flex justify-content-between align-items-center my-3">
                                                                <div style={{ color: "#76797B", fontSize: "14px" }}>
                                                                    {sl.l_owner_id}
                                                                </div>
                                                                <div style={{ color: "#494D4F", fontSize: "16px" }}>
                                                                    {cryptogramRecord?.ownerId || '-'}
                                                                </div>
                                                            </div>

                                                            <div className="d-flex justify-content-between align-items-center my-3">
                                                                <div style={{ color: "#76797B", fontSize: "14px" }}>
                                                                    {sl.l_key_function}
                                                                </div>
                                                                <div style={{ color: "#494D4F", fontSize: "16px" }}>
                                                                    {cryptogramRecord?.keyFunction || '-'}
                                                                </div>
                                                            </div>

                                                            <div className="d-flex justify-content-between align-items-center my-3">
                                                                <div style={{ color: "#76797B", fontSize: "14px" }}>
                                                                    {sl.l_key_algo}
                                                                </div>
                                                                <div style={{ color: "#494D4F", fontSize: "16px" }}>
                                                                    {cryptogramRecord?.keyAlgo || '-'}
                                                                </div>
                                                            </div>

                                                            <div className="d-flex justify-content-between align-items-center my-3">
                                                                <div style={{ color: "#76797B", fontSize: "14px" }}>
                                                                    {sl.l_bit_size}
                                                                </div>
                                                                <div style={{ color: "#494D4F", fontSize: "16px" }}>
                                                                    {cryptogramRecord?.bitSize || '-'}
                                                                </div>
                                                            </div>

                                                            <div className="d-flex justify-content-between align-items-center my-3">
                                                                <div style={{ color: "#76797B", fontSize: "14px" }}>
                                                                    {sl.l_iv}
                                                                </div>
                                                                <div style={{ color: "#494D4F", fontSize: "16px" }}>
                                                                    {cryptogramRecord?.iv || '-'}
                                                                </div>
                                                            </div>

                                                            <div className="d-flex justify-content-between align-items-center my-3">
                                                                <div style={{ color: "#76797B", fontSize: "14px" }}>
                                                                    {sl.l_cryptogram}
                                                                </div>
                                                                <div style={{ color: "#494D4F", fontSize: "16px" }}>
                                                                    {cryptogramRecord?.cryptogram || '-'}
                                                                </div>
                                                            </div>

                                                            <div className="d-flex justify-content-between align-items-center my-3">
                                                                <div style={{ color: "#76797B", fontSize: "14px" }}>
                                                                    {sl.l_kcv}
                                                                </div>
                                                                <div style={{ color: "#494D4F", fontSize: "16px" }}>
                                                                    {cryptogramRecord?.kcv || '-'}
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>

                                                    <div className="d-flex justify-content-end align-items-center px-4 border-top"
                                                        style={{ minHeight: "56px" }}>
                                                        <button className="btn btn-ghost-unity d-flex align-items-center"
                                                            style={{ color: "#494D4F", fontWeight: "500" }}
                                                            ng-click="click4EditCryptogram()">
                                                            <span className="material-icons-outlined fs-24-unity me-2">edit</span>
                                                            {sl.b_edit}
                                                        </button>
                                                    </div>
                                                </>
                                                : null
                                        }

                                    </div>  {/* end of card  */}

                                </div>

                            </div>
                        </div>

                    </div>  {/* end of content panel */}

                    <DumpPanel dataList={[
                        { name: "cryptogramRecord", data: cryptogramRecord },
                        { name: "sl", data: sl },
                    ]} debugMode={debugMode} />

                </div> {/* end of right panel */}

            </div> {/* end of top part */}

            <FooterPanel />
        </div>
    );
}