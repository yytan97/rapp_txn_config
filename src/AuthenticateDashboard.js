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

export async function dashboardLoader() {
    console.log("Dashboard loader start ...");

    return {
        date: moment().format("YYYY-MM-DD HH:mm:ss"),
        uuid: uuidv4(),
    };
};

export function AuthenticateDashboard({ debugMode = false }) {
    const componentName = "AuthenticateDashboard";
    if (debugMode) console.log(`${componentName} component start ...`);

    const menuList = [
        { name: "team_management", callback: callback4TeamManagement, icon: "images/team_management.svg", accessObject: "webapp_configuration_access", accessAction: "institution_management.add" },
        { name: "user_management", callback: callback4UserManagement, icon: "images/user_management.svg", accessObject: "webapp_configuration_access", accessAction: "table_management.access" },
        { name: "object_management", callback: callback4ObjectManagement, icon: "images/object_management.svg", accessObject: "webapp_configuration_access", accessAction: "configuration_management.access" },
        { name: "session_management", callback: callback4SessionManagement, icon: "images/session_management.svg", accessObject: "webapp_configuration_access", accessAction: "hotcard_management.access" },
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

    function click4MenuOption(e, record) {
        if (debugMode) console.log("Click for menu option", e, record);
        if (record.callback !== undefined) {
            record.callback(e);
        }

        return;
    };

    function callback4TeamManagement(e) {
        if (debugMode) console.log("Callback for create new institution", e);

        let sp = new URLSearchParams({
            editMode: 0
        });

        navigate("/teamManagement");

        return;
    };

    function callback4UserManagement(e) {
        if (debugMode) console.log("Callback for create new institution", e);

        let sp = new URLSearchParams({
            editMode: 0
        });

        navigate("/userManagement");

        return;
    };

    function callback4ObjectManagement(e) {
        if (debugMode) console.log("Callback for create new institution", e);

        let sp = new URLSearchParams({
            editMode: 0
        });

        navigate("/objectManagement");

        return;
    };

    function callback4SessionManagement(e) {
        if (debugMode) console.log("Callback for create new institution", e);

        let sp = new URLSearchParams({
            editMode: 0
        });

        navigate("/sessionManagement");

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
                    <div className="container-fluid pl-24 pr-24" style={{ minHeight: "100vh", }}>
                        <div className="row">
                            {/* <div className="col-12 pt-8 fs-12-unity grey-font cursor" onClick={() => navigate(-1)}>
                                <i className="fas fa-chevron-left fa-fw"></i>
                                {sl.l_home}
                            </div> */}
                            <div className="col-12 pt-12 pb-16">
                                <div className="title-font fw-bold">
                                    {sl.l_title}
                                </div>
                                <div className="fs-14-unity grey-font">
                                    {sl.l_proper_auth}
                                </div>
                            </div>

                            {
                                menuList.map((record, index) => {
                                    if (check4Right(record.accessObject, record.accessAction))
                                        return (
                                            <div key={index} className="col equal-height-col">
                                                <div className="border synap-btn-option dashboard-card">
                                                    <img src={record.icon} alt={record.name} className="menu-img-icon" />
                                                    <div className="d-flex flex-column justify-content-center">
                                                        <div className="fs-16-unity fw-bold pt-16 pb-16"
                                                            dangerouslySetInnerHTML={{
                                                                __html: tBox.getLabel(sl, record.name, "l_")
                                                            }} >
                                                        </div>
                                                    </div>
                                                    <button className="btn btn-outline-dark mt-16 manage-btn" type="button" onClick={(e) => click4MenuOption(e, record)}>
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