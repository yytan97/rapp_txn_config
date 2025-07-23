
import * as react from "react";
import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import { globalContext } from "./globalContext.js";

// import { ErrorLine } from "./ErrorLine.js";
import { DumpPanel } from "./DumpPanel.js";

import { SideBar } from "./SideBar.js";
import { TitlePanel } from "./TitlePanel.js";
import { FooterPanel } from "./FooterPanel.js";

import { cleanUp as cleanUp4CryptogramManagement } from "./CryptogramManagementPage.js";
import { cleanUp as cleanUp4TimerManagement } from "./TimerManagementPage.js";
import { cleanUp as cleanUp4BINPrefixManagement } from "./BINPrefixManagementPage.js";


// Map loaded lib here ...
const uuidv4 = window.uuidv4;
const moment = window.moment;

export async function dashboardLoader() {
    console.log("Dashboard loader start ...");
    return {
        date: moment().format("YYYY-MM-DD HH:mm:ss"),
        uuid: uuidv4(),
    };
};

export function Dashboard({ debugMode = false }) {
    const componentName = "Dashboard";
    if (debugMode) console.log(`${componentName} component start ...`);

    const menuList = [
        { name: "merchant", content: "merchant_content", callback: callback4CreateNewInstitution, icon: "/images/merchant.svg", accessObject: "webapp_configuration_access", accessAction: "institution_management.add" },
        { name: "authenticate", content: "auth_content", callback: callback4CryptogramManagement, icon: "/images/authenticate.svg", accessObject: "webapp_configuration_access", accessAction: "cryptogram_management.access" },
        { name: "trans_history", content: "trans_content", callback: callback4TimerManagement, icon: "/images/transaction.svg", accessObject: "webapp_configuration_access", accessAction: "timer_management.access" },
        { name: "sys_config", content: "config_content", callback: callback4SystemComfigurationDashboard, icon: "/images/sys_configuration.svg", accessObject: "webapp_configuration_access", accessAction: "bin_prefix_management.access" },
        { name: "sys_monitoring", content: "monitoring_content", callback: callback4BINPrefixManagement, icon: "/images/monitoring.svg", accessObject: "webapp_configuration_access", accessAction: "bin_prefix_management.access" },
        { name: "ui_workspace", content: "ui_content", callback: callback4BINPrefixManagement, icon: "/images/ui_workspace.svg", accessObject: "webapp_configuration_access", accessAction: "bin_prefix_management.access" },
    ];

    // let data = reactRouter.useLoaderData();
    const { config, localData, gsl, dataset,
        applicationDebugMode,
        applicationLanguage,
        updateApplicationLanguage,
        check4Right
    } = react.useContext(globalContext);

    // check from context
    if (applicationDebugMode !== undefined) debugMode = applicationDebugMode;
    let sl = tBox.getStringLabel(gsl, componentName);

    const navigate = reactRouter.useNavigate();

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);
    }, []);

    // event handling function here ...
    function click4Back(e) {
        if (debugMode) console.log("Click for back ", e);
        navigate(-1);
        return;
    };

    function click4Echo(e) {
        if (debugMode) console.log("Click for echo ", e);
        return;
    };

    function click4TransactionHistory(e) {
        if (debugMode) console.log("Click for transaction history", e);
        navigate("/transactionHistory");
        return;
    };

    function click4MenuOption(e, record) {
        if (debugMode) console.log("Click for menu option", e, record);
        if (record.callback !== undefined) {
            record.callback(e);
        }
        return;
    };

    function callback4CreateNewInstitution(e) {
        if (debugMode) console.log("Callback for create new institution", e);

        let sp = new URLSearchParams({
            editMode: 0
        });

        navigate("/editInstitution");
        return;
    };

    function callback4CryptogramManagement(e) {
        if (debugMode) console.log("Callback for cryptogram management", e);

        cleanUp4CryptogramManagement();
        navigate("/cryptogramManagement");
        return;
    };

    function callback4TimerManagement(e) {
        if (debugMode) console.log("Callback for timer management", e);

        cleanUp4TimerManagement();
        navigate("/timerManagement");
        return;
    };

    function callback4BINPrefixManagement(e) {
        if (debugMode) console.log("Callback for BIN prefix management", e);

        cleanUp4BINPrefixManagement();
        navigate("/binPrefixManagement");
        return;
    };

    function callback4SystemComfigurationDashboard(e) {
        if (debugMode) console.log("Callback for System Configuration Dashboard", e);

        navigate("/systemConfigurationDashboard");
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

                    <div className="container-fluid pl-24 pr-24 pt-52" style={{ minHeight: "100vh", }}>
                        <div className="row">

                            <div className="position-relative">
                                <div className="welcome-container-box">
                                    <div className="title">
                                        {sl.l_main_dashboard}
                                    </div>
                                    <div className="content">
                                        {sl.l_main_dashboard}
                                    </div>
                                </div>
                                <div className="image-pos">
                                    <img src="images/boy.svg" style={{width: "297px", height: "164px"}}/>
                                </div>
                            </div>
                            <div className="col-12 pt-12 pb-16">
                                <div className="title-font fw-bold">
                                    {sl.l_title}
                                </div>
                                <div className="fs-14-unity grey-font">
                                    {sl.l_all_tools}
                                </div>
                            </div>

                            {
                                menuList.map((record, index) => {
                                    if (check4Right(record.accessObject, record.accessAction))
                                        return (
                                            <div key={index} className="col-3 d-flex mb-24">
                                                <div className="w-100 h-100 d-flex flex-column border synap-btn-option dashboard-card position-relative"
                                                    role="button" onClick={(e) => click4MenuOption(e, record)}>
                                                    <span className="fs-12-unity dashboard-label badge bg-success position-absolute top-0 end-0">
                                                        Connecting
                                                    </span>
                                                    <img src={record.icon} alt={record.name} className="menu-img-icon" />
                                                    <div className="d-flex flex-column justify-content-center">
                                                        <div className="fs-16-unity fw-bold pt-24"
                                                            dangerouslySetInnerHTML={{
                                                                __html: tBox.getLabel(sl, record.name, "l_")
                                                            }} >
                                                        </div>
                                                        <div className="pt-4px pb-32 fs-14-unity dark-grey-font"
                                                            dangerouslySetInnerHTML={{
                                                                __html: tBox.getLabel(sl, record.content, "l_")
                                                            }} >
                                                        </div>
                                                    </div>
                                                    <button className="btn btn-outline-dark mt-32 manage-btn" type="button" onClick={(e) => click4MenuOption(e, record)}>
                                                        {sl.b_manage}
                                                        <i class="fa-sharp fa-solid fa-arrow-right" style={{paddingLeft: "8px"}}></i>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    else return null;
                                })
                            }

                        </div>
                    </div>

                    <DumpPanel dataList={[
                        { name: "menuList", data: menuList },
                        { name: "config", data: config },
                        { name: "sl", data: sl },
                    ]} debugMode={debugMode} />

                </div>

            </div>


            <FooterPanel />
        </div>
    );
}