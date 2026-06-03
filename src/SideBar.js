import * as react from "react";
import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import { globalContext } from "./globalContext.js";

import { cleanUp as cleanUp4InstitutionManagement } from "./InstitutionManagementPage.js";
import { cleanUp as cleanUp4CryptogramManagement } from "./CryptogramManagementPage.js";
import { cleanUp as cleanUp4TableListManagement } from "./TableListManagementPage.js";
import { cleanUp as cleanUp4ConfigurationFileManagement } from "./ConfigurationFileManagementPage.js";

import "./SideBar.css";

// Map loaded lib here ...
// const uuidv4 = window.uuidv4;
// const moment = window.moment;
// const bootstrap = window.bootstrap;

export function SideBar({ debugMode = false }) {
    const componentName = "SideBar";
    if (debugMode) console.log(`${componentName} component start ...`);

    const { gsl, menuMode, toggleMenuMode, isPinned, togglePinNavigation, check4Right, setAppRedraw } = react.useContext(globalContext);

    // check from context
    let sl = tBox.getStringLabel(gsl, componentName);

    // let menuMode = appData.menuMode;
    const navigate = reactRouter.useNavigate();
    const location = reactRouter.useLocation();

    const isDashboardPage = location.pathname === "/";

    const institutionSettingPathList = [
        "/institutionSettingsDashboard",
        "/institutionManagement",
        "/institutionDetail",
        "/cryptogramManagement",
        "/cryptogramDetail",
        "/timerManagement",
        "/timerDetail",
        "/binPrefixManagement",
        "/binPrefixDetail",
        "/routeManagement",
        "/routeDetail",
    ];

    const systemConfigurationPathList = [
        "/systemConfigurationDashboard",
        ...institutionSettingPathList,
        "/tableListManagement",
        "/tableManagement",
        "/configurationFileManagement",
        "/hotCardManagement",
        "/editHotCard",
    ];

   const teamManagementPathList = [
        "/teamManagement",
        "/teamDetail",
    ];

    const userManagementPathList = [
        "/userManagement",
        "/userDetail",
        "/editUser",
        "/editProfile",
        "/editEmail",
        "/editMobile",
        "/editAddress",
    ];

    const objectManagementPathList = [
        "/objectManagement",
        "/objectDetail",
    ];

    const sessionManagementPathList = [
        "/sessionManagement",
        "/sessionDetail",
    ];

    const authenticatePathList = [
        "/authenticateDashboard",
        ...teamManagementPathList,
        ...userManagementPathList,
        ...objectManagementPathList,
        ...sessionManagementPathList,
    ];

    const isInstitutionSettingPage = institutionSettingPathList.includes(location.pathname);
    const isSystemConfigurationPage = systemConfigurationPathList.includes(location.pathname);
    const isAuthenticatePage = authenticatePathList.includes(location.pathname);
    const isTeamManagementPage = teamManagementPathList.includes(location.pathname);
    const isUserManagementPage = userManagementPathList.includes(location.pathname);
    const isObjectManagementPage = objectManagementPathList.includes(location.pathname);
    const isSessionManagementPage = sessionManagementPathList.includes(location.pathname);

    //submenu
    const [isSubmenuExpand, setIsSubmenuExpand] = react.useState(false);
    const [isAuthenticateSubmenuExpand, setIsAuthenticateSubmenuExpand] = react.useState(false);

    const toggleSubmenu = () => {
        setIsSubmenuExpand(!isSubmenuExpand);
    };

    const toggleAuthenticateSubmenu = () => {
        setIsAuthenticateSubmenuExpand(!isAuthenticateSubmenuExpand);
    };

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);

        if (isSystemConfigurationPage) {
            setIsSubmenuExpand(true);
        }

        if (isAuthenticatePage) {
            setIsAuthenticateSubmenuExpand(true);
        }

    }, [location.pathname]);

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
        let target = "/institutionSettingsDashboard";
        if (target === location.pathname) {
            console.log("Same path name not action taken ...", target);
            return;
        }

        cleanUp4InstitutionManagement();
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

        cleanUp4CryptogramManagement();
        navigate(target);
        return;
    };

    function click4Table(e) {
        let target = "/tableListManagement";
        if (target === location.pathname) {
            console.log("Same path name not action taken ...", target);
            return;
        }

        cleanUp4TableListManagement();
        navigate(target);
        return;
    };

    function click4Configuration(e) {
        let target = "/configurationFileManagement";
        if (target === location.pathname) {
            console.log("Same path name not action taken ...", target);
            return;
        }

        cleanUp4ConfigurationFileManagement();
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

    function click4SystemConfigurationDashboard(e) {
        let target = "/systemConfigurationDashboard";
        if (target === location.pathname) {
            console.log("Same path name not action taken ...", target);
            return;
        }

        navigate(target);
        return;
    };

    function click4AuthenticateDashboard(e) {
        let target = "/authenticateDashboard";
        if (target === location.pathname) {
            console.log("Same path name not action taken ...", target);
            return;
        }

        navigate(target);
        return;
    };

    function click4TeamManagement(e) {
        let target = "/teamManagement";

        if (target === location.pathname) {
            console.log("Same path name not action taken ...", target);
            return;
        }

        navigate(target);
        return;
    };

    function click4UserManagement(e) {
        let target = "/userManagement";

        if (target === location.pathname) {
            console.log("Same path name not action taken ...", target);
            return;
        }

        navigate(target);
        return;
    };

    function click4ObjectManagement(e) {
        let target = "/objectManagement";

        if (target === location.pathname) {
            console.log("Same path name not action taken ...", target);
            return;
        }

        navigate(target);
        return;
    };

    function click4SessionManagement(e) {
        let target = "/sessionManagement";

        if (target === location.pathname) {
            console.log("Same path name not action taken ...", target);
            return;
        }

        navigate(target);
        return;
    };

    function click4TransactionHistory(e) {
        let target = "/searchBox";

        if (target === location.pathname) {
            console.log("Same path name not action taken ...", target);
            return;
        }

        navigate(target);
        return;
    };

    // Figma UI 
    return (
        <div className={`my-sidebar ${class4MenuMode()} ${isPinned ? 'pinned' : ''}`}>
            <div className="my-primary-section">

                <div className="my-title" role="button" onClick={toggle4MenuMode}>
                    <span className="long-mode-label ps-3">
                        <img src="images/Synap_logo.svg" style={{ width: "76px", height: "33px" }} />
                    </span>
                    {!isPinned && (
                        <a className="my-toggle" >
                            {
                                (menuMode === 0) ? <span className="material-icons-outlined fs-24-unity">keyboard_double_arrow_right</span>
                                    : <span className="material-icons-outlined fs-24-unity">keyboard_double_arrow_left</span>
                            }
                        </a>
                    )}
                </div>

                {
                    isDashboardPage && (
                        <>
                            <div className={`my-link ${class4Active('/')}`} role="button" onClick={click4Home}>
                                <span className="material-icons-outlined fs-24-unity">home</span>
                                {menuMode === 1 && (
                                    <span className="ms-2 long-mode-label">{sl.l_home}</span>
                                )}
                            </div>
                            {menuMode === 0 && (
                                <span className={`short-mode-label ${class4Active('/')}`}>{sl.l_home}</span>
                            )}
                        </>
                    )
                }
                 
                {
                    !isDashboardPage && (
                        <>
                            {/* {
                                check4Right('webapp_configuration_access', 'institution_management.access') ?
                                    (
                                        <>
                                            <div className={`my-link ${class4Active('')}`} role="button">
                                                <span className="material-icons-outlined fs-24-unity">point_of_sale</span>
                                                {menuMode === 1 && (
                                                    <span className="ms-2 long-mode-label">{sl.l_merchant}</span>
                                                )}
                                            </div>
                                            {menuMode === 0 && (
                                                <span className={`short-mode-label ${class4Active('/institutionManagement')}`}>{sl.l_merchant}</span>
                                            )}
                                        </>
                                    ) : null
                            } */}

                            {
                                check4Right('webapp_configuration_access', 'authenticate_management.access') ?
                                    (
                                        <div className={`${menuMode === 1 ? 'long-mode-label' : 'short-mode-center'}`}>
                                            <div
                                                className={`my-link ${isAuthenticatePage ? 'active' : ''} ${isAuthenticateSubmenuExpand ? 'submenu-open' : ''}`} role="button" onClick={(e) => { toggleAuthenticateSubmenu(); click4AuthenticateDashboard(e); }}
                                            >
                                                <span className="material-icons-outlined fs-24-unity">
                                                    manage_accounts
                                                </span>

                                                {menuMode === 1 && (
                                                    <>
                                                        <span className="ms-2 long-mode-label">
                                                            {sl.l_authenticate}
                                                        </span>
                                                        <span className="material-icons-outlined submenu-icon">
                                                            {isAuthenticateSubmenuExpand ? 'expand_less' : 'expand_more'}
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {menuMode === 1 && (
                                                <div>
                                                    <div className={`my-submenu-items ${isAuthenticateSubmenuExpand ? 'open' : ''}`}>
                                                        <ul>
                                                            <li>
                                                                <div>
                                                                    <span className={`my-label ${isTeamManagementPage ? 'active' : ''}`} onClick={click4TeamManagement}>
                                                                        {sl.l_team_management}
                                                                    </span>
                                                                </div>
                                                            </li>

                                                            <li>
                                                                <div>
                                                                    <span className={`my-label ${isUserManagementPage ? 'active' : ''}`} onClick={click4UserManagement}>
                                                                        {sl.l_user_management}
                                                                    </span>
                                                                </div>
                                                            </li>

                                                            <li>
                                                                <div>
                                                                    <span className={`my-label ${isObjectManagementPage ? 'active' : ''}`} onClick={click4ObjectManagement}>
                                                                        {sl.l_object_management}
                                                                    </span>
                                                                </div>
                                                            </li>

                                                            <li>
                                                                <div>
                                                                    <span className={`my-label ${isSessionManagementPage ? 'active' : ''}`} onClick={click4SessionManagement}>
                                                                        {sl.l_session_management}
                                                                    </span>
                                                                </div>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}

                                            {menuMode === 0 && (
                                                <span className={`short-mode-label ${
                                                    (
                                                        class4Active('/teamManagement') ||
                                                        class4Active('/userManagement') ||
                                                        class4Active('/objectManagement') ||
                                                        class4Active('/sessionManagement')
                                                    ) ? 'active' : ''
                                                }`}>
                                                    {sl.l_authenticate}
                                                </span>
                                            )}
                                        </div>
                                    ) : null
                            }

                            {
                                check4Right('webapp_configuration_access', 'table.access') ?
                                    (
                                        <>
                                            <div className={`my-link ${class4Active('/searchBox') || class4Active('/transactionHistoryV2') || class4Active('/transactionHistoryDetailV2') }`} role="button" onClick={click4TransactionHistory}>
                                                <span className="material-icons-outlined fs-24-unity">request_quote</span>
                                                {menuMode === 1 && (
                                                    <span className="ms-2 long-mode-label">{sl.l_transaction_history}</span>
                                                )}
                                            </div>
                                            {menuMode === 0 && (
                                                <span className={`short-mode-label ${class4Active('/tableListManagement')}`}>{sl.l_transaction_history}</span>
                                            )}
                                        </>
                                    ) : null
                            }

                            {
                                check4Right('webapp_configuration_access', 'configuration.access') ?
                                    (
                                        <div className={`${menuMode === 1 ? 'long-mode-label' : 'short-mode-center'}`}> 
                                            <div className={`my-link ${isSystemConfigurationPage ? 'active' : ''} ${isSubmenuExpand ? 'submenu-open' : ''}`} role="button" onClick={(e) => { toggleSubmenu(); click4SystemConfigurationDashboard(e); }}>
                                                <span className="material-icons-outlined fs-24-unity">build</span>
                                                {menuMode === 1 && (
                                                    <>
                                                        <span className="ms-2 long-mode-label">{sl.l_system_configuration}</span>
                                                        <span className="material-icons-outlined submenu-icon">
                                                            {isSubmenuExpand ? 'expand_less' : 'expand_more'}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            {menuMode === 1 && (
                                                <div>
                                                    <div className={`my-submenu-items ${isSubmenuExpand ? 'open' : ''}`}>
                                                        <ul>
                                                            <li>
                                                                <div>
                                                                    <span className={`my-label ${isInstitutionSettingPage ? 'active' : ''}`} onClick={click4InstitutionManagement}>
                                                                        {sl.l_institution_setting}
                                                                    </span>
                                                                </div>
                                                            </li>
                                                            <li>
                                                                <div>
                                                                    <span className={`my-label ${class4Active('/tableListManagement') || class4Active('/tableManagement') ? 'active' : ''}`} onClick={click4Table}>
                                                                        {sl.l_table_management}
                                                                    </span>
                                                                </div>
                                                            </li>
                                                            <li>
                                                                <div>
                                                                    <span className={`my-label ${class4Active('/configurationFileManagement') ? 'active' : ''}`} onClick={click4Configuration}>
                                                                        {sl.l_configuration_file}
                                                                    </span>
                                                                </div>
                                                            </li>
                                                            {/* <li>
                                                                <div>
                                                                    <span className={`my-label ${class4Active('/hotCardManagement') || class4Active('/editHotCard') ? 'active' : ''}`}>
                                                                        {sl.l_hot_card}
                                                                    </span>
                                                                </div>
                                                            </li> */}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {menuMode === 0 && (
                                                <span className={`short-mode-label ${class4Active('/configurationFileManagement')}`}>{sl.l_system_configuration}</span>
                                            )}
                                        </div>
                                    ) : null
                            }

                            {/* {
                                check4Right('webapp_configuration_access', 'configuration.access') ?
                                    (
                                        <>
                                            <div className={`my-link ${class4Active('')}`} role="button">
                                                <span className="material-icons-outlined fs-24-unity">monitor_heart</span>
                                                {menuMode === 1 && (
                                                    <span className="ms-2 long-mode-label">{sl.l_system_monitoring}</span>
                                                )}
                                            </div>
                                            {menuMode === 0 && (
                                                <span className={`short-mode-label ${class4Active('')}`}>{sl.l_system_monitoring}</span>
                                            )}
                                        </>
                                    ) : null
                            } */}

                            {/* {
                                check4Right('webapp_configuration_access', 'configuration.access') ?
                                    (
                                        <>
                                            <div className={`my-link ${class4Active('')}`} role="button">
                                                <span className="material-icons-outlined fs-24-unity">design_services</span>
                                                {menuMode === 1 && (
                                                    <span className="ms-2 long-mode-label">{sl.l_ui_workspace}</span>
                                                )}
                                            </div>
                                            {menuMode === 0 && (
                                                <span className={`short-mode-label ${class4Active('')}`}>{sl.l_ui_ws}</span>
                                            )}
                                        </>
                                    ) : null
                            } */}
                        </>
                    )
                }
                
                <>
                    <div className={`my-link ${class4Active('/setting')}`} role="button" onClick={click4Setting}>
                        <span className="material-icons-outlined fs-24-unity">settings</span>
                        {menuMode === 1 && (
                            <span className="ms-2 long-mode-label">{sl.l_setting}</span>
                        )}
                    </div>
                    {menuMode === 0 && (
                        <span className={`short-mode-label ${class4Active('/setting')}`}>{sl.l_setting}</span>
                    )}
                </>
            </div>

            <div className="pt-8 pb-8 my-secondary-section ">
                <div className="my-2 my-divider"></div>
                <div className="my-link1" role="button" onClick={togglePinNavigation}>
                    <span className="ms-3 long-mode-label">{sl.l_pin_navigation}</span>
                    <span className="material-symbols-outlined fs-16-unity">
                        {isPinned ? 'keep_off' : 'keep'}
                    </span>
                </div>
            </div>

        </div>
    )
};