import * as react from "react";
import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import { globalContext } from "./globalContext.js";

import { cleanUp as cleanUp4SwitchInstitution } from "./SwitchInstitutionControlPage.js";
import { cleanUp as cleanUp4SwitchLink } from "./SwitchLinkControlPage.js";
import { cleanUp as cleanUp4SwitchTransaction } from "./SwitchTransactionControlPage.js";
import { cleanUp as cleanUp4SwitchServer } from "./SwitchServerControlPage.js";
import { cleanUp as cleanUp4ProcessControl } from "./ProcessControlPage.js";

import "./SideBar.css";

// Map loaded lib here ...
// const uuidv4 = window.uuidv4;
// const moment = window.moment;
// const bootstrap = window.bootstrap;

export function SideBar({ debugMode = false }) {
    const componentName = "SideBar";
    if (debugMode) console.log(`${componentName} component start ...`);

    const { gsl, menuMode, toggleMenuMode, check4Right, setAppRedraw } = react.useContext(globalContext);

    // check from context
    let sl = tBox.getStringLabel(gsl, componentName);

    // let menuMode = appData.menuMode;
    const navigate = reactRouter.useNavigate();
    const location = reactRouter.useLocation();

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);
    }, []);

    function toggle4MenuMode() {
        toggleMenuMode();
        return;
    };

    function class4MenuMode() {
        if (menuMode === 0) return "";
        return "long-mode";
    };

    function class4Active(s) {
        if (s === location.pathname) return "active";
        return "";
    };

    function click4Home(e) {
        let target = "/";
        if (target === location.pathname) {
            console.log("Same path name not action taken ...", target);
            return;
        }

        navigate(target);
        return;
    };

    function click4SwitchInstitution(e) {
        let target = "/switchInstitution";
        if (target === location.pathname) {
            console.log("Same path name not action taken ...", target);
            return;
        }

        cleanUp4SwitchInstitution();
        navigate(target);
        // setAppRedraw((v) => v + 1);
        return;
    };

    function click4SwitchLink(e) {
        let target = "/switchLink";
        if (target === location.pathname) {
            console.log("Same path name not action taken ...", target);
            return;
        }

        cleanUp4SwitchLink();
        navigate(target);
        // setAppRedraw((v) => v + 1);
        return;
    };

    function click4SwitchTransaction(e) {
        let target = "/switchTransaction";
        if (target === location.pathname) {
            console.log("Same path name not action taken ...", target);
            return;
        }

        cleanUp4SwitchTransaction();
        navigate(target);
        // setAppRedraw((v) => v + 1);
        return;
    };

    function click4SwitchServer(e) {
        let target = "/switchServer";
        if (target === location.pathname) {
            console.log("Same path name not action taken ...", target);
            return;
        }

        cleanUp4SwitchServer();
        navigate(target);
        // setAppRedraw((v) => v + 1);
        return;
    };


    function click4ProcessControl(e) {
        let target = "/processControl";
        if (target === location.pathname) {
            console.log("Same path name not action taken ...", target);
            return;
        }

        cleanUp4ProcessControl();
        navigate(target);
        // setAppRedraw((v) => v + 1);
        return;
    };

    function click4Setting() {
        let target = "/setting";
        if (target === location.pathname) {
            console.log("Same path name not action taken ...", target);
            return;
        }

        navigate(target);
        return;
    };

    return (
        <div className={`my-sidebar ${class4MenuMode()}`}>
            <div className="my-primary-section">

                <div className="my-title" role="button" onClick={toggle4MenuMode}>
                    <span className="long-mode-label ps-3">
                        <img src="images/Synap_logo.svg" style={{ width: "76px", height: "33px" }} />
                    </span>
                    <a className="my-toggle" >
                        {
                            (menuMode === 0) ? <i className="fas fa-chevron-circle-right" ></i>
                                : <i className="fas fa-chevron-circle-left" ></i>
                        }
                    </a>
                </div>

                <div className={`my-link ${class4Active('/switchInstitution')}`}
                    role="button"
                    onClick={click4SwitchInstitution}>
                    <span className="material-icons-outlined fs-24-unity">business</span>
                    <span className="ms-3 long-mode-label">{sl.l_institution}</span>
                </div>

                {
                    check4Right('webapp_switch_service_access', 'switch_link_control.access') ?
                        (
                            <div className={`my-link ${class4Active('/switchLink')}`}
                                role="button"
                                onClick={click4SwitchLink}>
                                <span className="material-icons-outlined fs-24-unity">route</span>
                                <span className="ms-3 long-mode-label">{sl.l_link}</span>
                            </div>
                        ) : null
                }

                {
                    check4Right('webapp_switch_service_access', 'switch_transaction_control.access') ?
                        (
                            <div className={`my-link ${class4Active('/switchTransaction')}`}
                                role="button"
                                onClick={click4SwitchTransaction}>
                                <span className="material-icons-outlined fs-24-unity">source</span>
                                <span className="ms-3 long-mode-label">{sl.l_transaction}</span>
                            </div>
                        ) : null
                }

                {
                    check4Right('webapp_switch_service_access', 'switch_server_control.access') ?
                        (
                            <div className={`my-link ${class4Active('/switchServer')}`}
                                role="button"
                                onClick={click4SwitchServer}>
                                <span className="material-icons-outlined fs-24-unity">dns</span>
                                <span className="ms-3 long-mode-label">{sl.l_server}</span>
                            </div>
                        ) : null
                }

                {
                    check4Right('webapp_switch_service_access', 'process_control.access') ?
                        (
                            <div className={`my-link ${class4Active('/processControl')}`}
                                role="button"
                                onClick={click4ProcessControl}>
                                <span className="material-icons-outlined fs-24-unity">widgets</span>
                                <span className="ms-3 long-mode-label">{sl.l_process}</span>
                            </div>
                        ) : null
                }



            </div>

            <div className="p-3 my-secondary-section ">
                <div className="my-3 my-divider"></div>
                <div className={`my-link ${class4Active('/setting')}`} role="button" onClick={click4Setting}>
                    <span className="material-icons-outlined fs-24-unity">settings</span>
                    <span className="ms-3 long-mode-label">{sl.l_setting}</span>
                </div>
            </div>

        </div>

    )
};