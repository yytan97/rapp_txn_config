
import * as react from "react";
import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import { globalContext } from "./globalContext.js";

// import { ErrorLine } from "./ErrorLine.js";
import { DumpPanel } from "./DumpPanel.js";

import { SideBar } from "./SideBar.js";
import { TitlePanel } from "./TitlePanel.js";
import { FooterPanel } from "./FooterPanel.js";

import { cleanUp as clenaUp4CryptogramManagement } from "./CryptogramManagementPage.js";
import { cleanUp as clenaUp4TimerManagement } from "./TimerManagementPage.js";
import { cleanUp as clenaUp4BINPrefixManagement } from "./BINPrefixManagementPage.js";


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
        { name: "create_new_institution", callback: callback4CreateNewInstitution, icon: "domain", accessObject: "webapp_configuration_access", accessAction: "institution_management.add" },
        { name: "cryptogram_management", callback: callback4CryptogramManagement, icon: "key", accessObject: "webapp_configuration_access", accessAction: "cryptogram_management.access" },
        { name: "timer_management", callback: callback4TimerManagement, icon: "timer", accessObject: "webapp_configuration_access", accessAction: "timer_management.access" },
        { name: "bin_prefix_management", callback: callback4BINPrefixManagement, icon: "feed", accessObject: "webapp_configuration_access", accessAction: "bin_prefix_management.access" },
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

        clenaUp4CryptogramManagement();
        navigate("/cryptogramManagement");
        return;
    };

    function callback4TimerManagement(e) {
        if (debugMode) console.log("Callback for timer management", e);

        clenaUp4TimerManagement();
        navigate("/timerManagement");
        return;
    };

    function callback4BINPrefixManagement(e) {
        if (debugMode) console.log("Callback for BIN prefix management", e);

        clenaUp4BINPrefixManagement();
        navigate("/binPrefixManagement");
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
                                <h4 className="mt-3 fw-bold">{sl.l_title}</h4>
                            </div>

                            {
                                menuList.map((record, index) => {
                                    if (check4Right(record.accessObject, record.accessAction))
                                        return (
                                            <div key={index} className="col-3">
                                                <div className="d-flex flex-column justify-content-center align-items-center border rounded p-3 synap-btn-option"
                                                    role="button" onClick={(e) => click4MenuOption(e, record)}>
                                                    <span className="material-icons-outlined text-primary"
                                                        style={{ fontSize: "64px" }}>{record.icon}</span>
                                                    <div className="d-flex flex-column justify-content-center align-items-center "
                                                        style={{ height: "64px" }}>
                                                        <div className="fs-14-unity text-center"
                                                            dangerouslySetInnerHTML={{
                                                                __html: tBox.getLabel(sl, record.name, "l_")
                                                            }} >
                                                        </div>
                                                    </div>
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