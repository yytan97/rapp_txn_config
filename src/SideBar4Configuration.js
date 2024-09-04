import * as react from "react";
import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import { globalContext } from "./globalContext.js";

import { cleanUp as clenaUp4InstitutionManagement } from "./InstitutionManagementPage.js";
import { cleanUp as clenaUp4CryptogramManagement } from "./CryptogramManagementPage.js";
import { cleanUp as clenaUp4TableListManagement } from "./TableListManagementPage.js";
import { cleanUp as clenaUp4ConfigurationFileManagement } from "./ConfigurationFileManagementPage.js";

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

    function click4InstitutionManagement(e) {
        let target = "/institutionManagement";
        if (target === location.pathname) {
            console.log("Same path name not action taken ...", target);
            return;
        }

        clenaUp4InstitutionManagement();
        navigate(target);
        // setAppRedraw((v) => v + 1);
        return;
    };

    function click4CryptogramManagement(e) {
        let target = "/cryptogramManagement";
        if (target === location.pathname) {
            console.log("Same path name not action taken ...", target);
            return;
        }

        clenaUp4CryptogramManagement();
        navigate(target);
        return;
    };

    function click4Table(e) {
        let target = "/tableListManagement";
        if (target === location.pathname) {
            console.log("Same path name not action taken ...", target);
            return;
        }

        clenaUp4TableListManagement();
        navigate(target);
        return;
    };

    function click4Configuration(e) {
        let target = "/configurationFileManagement";
        if (target === location.pathname) {
            console.log("Same path name not action taken ...", target);
            return;
        }

        clenaUp4ConfigurationFileManagement();
        navigate(target);
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

                <div className={`my-link ${class4Active('/')}`} role="button" onClick={click4Home}>
                    <span className="material-icons-outlined fs-24-unity">home</span>
                    <span className="ms-3 long-mode-label">{sl.l_home}</span>
                </div>

                {
                    check4Right('webapp_configuration_access', 'institution_management.access') ?
                        (
                            <div className={`my-link ${class4Active('/institutionManagement')}`} role="button" onClick={click4InstitutionManagement}>
                                <span className="material-icons-outlined fs-24-unity">apartment</span>
                                <span className="ms-3 long-mode-label">{sl.l_institution_management}</span>
                            </div>
                        ) : null
                }

                {
                    check4Right('webapp_configuration_access', 'crypto_management.access') ?
                        (
                            <div className={`my-link ${class4Active('/cryptogramManagement')}`} role="button" onClick={click4CryptogramManagement}>
                                <span className="material-icons-outlined fs-24-unity">key</span>
                                <span className="ms-3 long-mode-label">{sl.l_cryptogram_management}</span>
                            </div>
                        ) : null
                }

                {
                    check4Right('webapp_configuration_access', 'table.access') ?
                        (
                            <div className={`my-link ${class4Active('/tableListManagement')}`} role="button" onClick={click4Table}>
                                <span className="material-icons-outlined fs-24-unity">table_view</span>
                                <span className="ms-3 long-mode-label">{sl.l_table}</span>
                            </div>
                        ) : null
                }

                {
                    check4Right('webapp_configuration_access', 'configuration.access') ?
                        (
                            <div className={`my-link ${class4Active('/configurationFileManagement')}`}
                                role="button"
                                onClick={click4Configuration}>
                                <span className="material-icons-outlined fs-24-unity">tune</span>
                                <span className="ms-3 long-mode-label">{sl.l_configuration}</span>
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