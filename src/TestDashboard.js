
import * as react from "react";
import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import { globalContext } from "./globalContext.js";

// import { ErrorLine } from "./ErrorLine.js";
import { DumpPanel } from "./DumpPanel.js";

import { SideBar } from "./SideBar.js";
import { TitlePanel } from "./TitlePanel.js";
import { FooterPanel } from "./FooterPanel.js";

// Map loaded lib here ...
const uuidv4 = window.uuidv4;
const moment = window.moment;

export async function testDashboardLoader() {
    console.log("Test dashboard loader start ...");
    // await tBox.sleep();

    return {
        date: moment().format("YYYY-MM-DD HH:mm:ss"),
        uuid: uuidv4(),
    };
};

export function TestDashboard({ debugMode = false }) {
    const componentName = "TestDashboard";
    if (debugMode) console.log(`${componentName} component start ...`);

    // let data = reactRouter.useLoaderData();
    const { config, localData, gsl, dataset, applicationDebugMode, applicationLanguage, updateApplicationLanguage } = react.useContext(globalContext);

    // check from context
    if (applicationDebugMode !== undefined) debugMode = applicationDebugMode;
    let sl = tBox.getStringLabel(gsl, componentName);

    const navigate = reactRouter.useNavigate();

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);
    }, []);

    // event handling function here ...
    function toggle4Language(e) {
        if (debugMode) console.log("Toggle for Language ", e);

        let lang = applicationLanguage;
        if (lang == "English") lang = "Chinese";
        else lang = "English";

        console.log("Toggle for Language ", lang);
        updateApplicationLanguage(lang);

        return;
    };

    function click4Back(e) {
        if (debugMode) console.log("Click for back ", e);
        navigate(-1);
        return;
    };

    function click4Echo(m) {
        if (debugMode) console.log("Click for echo ", m);
        return;
    };

    async function click4TestForm(e) {
        if (debugMode) console.log("Click for test form ", e);
        navigate("/testForm");
        return;
    };

    async function click4TestDialog(e) {
        if (debugMode) console.log("Click for dialog box", e);
        navigate("/testDialogBox");
        return;
    };

    async function click4TestLogin(e) {
        if (debugMode) console.log("Click for test login", e);
        navigate("/login");
        return;
    };

    async function click4TestMonaco(e) {
        if (debugMode) console.log("Click for test Monaco", e);
        navigate("/testMonaco");
        return;
    };

    async function click4TransactionHistory(e) {
        if (debugMode) console.log("Click for transaction history", e);
        navigate("/transactionHistory");
        return;
    };

    return (
        <div className="container-fluid px-0">
            <style>
                {`
                .synap-btn-option:hover {
                    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
                }
                `}
            </style>

            <TitlePanel />
            <div className="d-flex ">
                <div style={{ ...(dataset?.sideBarWidth) }}>
                    <SideBar />
                </div>

                <div className="flex-fill" style={{ ...(dataset?.mainPanelWidth) }}>

                    <div className="container-fluid" style={{ minHeight: "100vh", }}>
                        <div className="row g-3" >

                            <div className="col-12">
                                <h4 className="mt-3 fw-bold">{sl.title}</h4>
                            </div>

                            <div className="col-3"
                                ng-show="check4Right('webapp_configuration_access','institution_management.add')">
                                <div className="d-flex flex-column justify-content-center align-items-center border rounded p-3 synap-btn-option"
                                    role="button" onClick={click4TestForm}>
                                    <span className="material-icons-outlined text-primary"
                                        style={{ fontSize: "64px" }}>article</span>
                                    <div className="d-flex flex-column justify-content-center align-items-center "
                                        style={{ height: "64px" }}>
                                        <div className="fs-14-unity text-center">
                                            {sl.b_test_form}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-3"
                                ng-show="check4Right('webapp_configuration_access','institution_management.add')">
                                <div className="d-flex flex-column justify-content-center align-items-center border rounded p-3 synap-btn-option"
                                    role="button" onClick={click4TestDialog}>
                                    <span className="material-icons-outlined text-primary"
                                        style={{ fontSize: "64px" }}>web_asset</span>
                                    <div className="d-flex flex-column justify-content-center align-items-center "
                                        style={{ height: "64px" }}>
                                        <div className="fs-14-unity text-center">
                                            {sl.b_test_dialog}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-3"
                                ng-show="check4Right('webapp_configuration_access','institution_management.add')">
                                <div className="d-flex flex-column justify-content-center align-items-center border rounded p-3 synap-btn-option"
                                    role="button" onClick={click4TestMonaco}>
                                    <span className="material-icons-outlined text-primary"
                                        style={{ fontSize: "64px" }}>edit</span>
                                    <div className="d-flex flex-column justify-content-center align-items-center "
                                        style={{ height: "64px" }}>
                                        <div className="fs-14-unity text-center">
                                            {sl.b_test_monaco}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-3"
                                ng-show="check4Right('webapp_configuration_access','institution_management.add')">
                                <div className="d-flex flex-column justify-content-center align-items-center border rounded p-3 synap-btn-option"
                                    role="button" onClick={click4TransactionHistory}>
                                    <span className="material-icons-outlined text-primary"
                                        style={{ fontSize: "64px" }}>manage_search</span>
                                    <div className="d-flex flex-column justify-content-center align-items-center "
                                        style={{ height: "64px" }}>
                                        <div className="fs-14-unity text-center">
                                            {sl.b_transaction_history}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    <DumpPanel dataList={[
                        { name: "localData", data: localData },
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