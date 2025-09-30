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


    //submenu
    const [isSubmenuExpand, setIsSubmenuExpand] = react.useState(false);

    const toggleSubmenu = () => {
        setIsSubmenuExpand(!isSubmenuExpand);
      };


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

    // return (
    //     <div className={`my-sidebar ${class4MenuMode()}`}>
    //         <div className="my-primary-section">

    //             <div className="my-title" role="button" onClick={toggle4MenuMode}>
    //                 <span className="long-mode-label ps-3">
    //                     <img src="images/Synap_logo.svg" style={{ width: "76px", height: "33px" }} />
    //                 </span>
    //                 <a className="my-toggle" >
    //                     {
    //                         (menuMode === 0) ? <span className="material-icons-outlined fs-24-unity">keyboard_double_arrow_right</span>
    //                             : <span className="material-icons-outlined fs-24-unity">keyboard_double_arrow_left</span>
    //                     }
    //                 </a>
    //             </div>

    //             <div className={`my-link ${class4Active('/')}`} role="button" onClick={click4Home}>
    //                 <span className="material-icons-outlined fs-24-unity">home</span>
    //                 <span className="ms-3 long-mode-label">{sl.l_home}</span>
    //             </div>

    //             {
    //                 check4Right('webapp_configuration_access', 'institution_management.access') ?
    //                     (
    //                         <div className={`my-link ${class4Active('/institutionManagement')}`} role="button" onClick={click4InstitutionManagement}>
    //                             <span className="material-icons-outlined fs-24-unity">apartment</span>
    //                             <span className="ms-3 long-mode-label">{sl.l_institution_management}</span>
    //                         </div>
    //                     ) : null
    //             }

    //             {
    //                 check4Right('webapp_configuration_access', 'crypto_management.access') ?
    //                     (
    //                         <div className={`my-link ${class4Active('/cryptogramManagement')}`} role="button" onClick={click4CryptogramManagement}>
    //                             <span className="material-icons-outlined fs-24-unity">key</span>
    //                             <span className="ms-3 long-mode-label">{sl.l_cryptogram_management}</span>
    //                         </div>
    //                     ) : null
    //             }

    //             {
    //                 check4Right('webapp_configuration_access', 'table.access') ?
    //                     (
    //                         <div className={`my-link ${class4Active('/tableListManagement')}`} role="button" onClick={click4Table}>
    //                             <span className="material-icons-outlined fs-24-unity">table_view</span>
    //                             <span className="ms-3 long-mode-label">{sl.l_table}</span>
    //                         </div>
    //                     ) : null
    //             }

    //             {
    //                 check4Right('webapp_configuration_access', 'configuration.access') ?
    //                     (
    //                         <div className={`my-link ${class4Active('/configurationFileManagement')}`}
    //                             role="button"
    //                             onClick={click4Configuration}>
    //                             <span className="material-icons-outlined fs-24-unity">tune</span>
    //                             <span className="ms-3 long-mode-label">{sl.l_configuration}</span>
    //                         </div>
    //                     ) : null
    //             }

    //         </div>

    //         <div className="p-3 my-secondary-section ">
    //             <div className="my-3 my-divider"></div>
    //             <div className={`my-link ${class4Active('/setting')}`} role="button" onClick={click4Setting}>
    //                 <span className="material-icons-outlined fs-24-unity">settings</span>
    //                 <span className="ms-3 long-mode-label">{sl.l_setting}</span>
    //             </div>
    //         </div>

    //     </div>

    // )

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

                <div className={`my-link ${class4Active('/')}`} role="button" onClick={click4Home}>
                    <span className="material-icons-outlined fs-24-unity">home</span>
                    {menuMode === 1 && (
                        <span className="ms-2 long-mode-label">{sl.l_home}</span>
                    )}
                </div>
                {menuMode === 0 && (
                    <span className={`short-mode-label ${class4Active('/')}`}>{sl.l_home}</span>
                )}
                
                {
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
                }

                {
                    check4Right('webapp_configuration_access', 'crypto_management.access') ?
                        (
                            <>
                                <div className={`my-link ${class4Active('')}`} role="button">
                                    <span className="material-icons-outlined fs-24-unity">manage_accounts</span>
                                    {menuMode === 1 && (
                                        <span className="ms-2 long-mode-label">{sl.l_authenticate}</span>
                                    )}
                                </div>
                                {menuMode === 0 && (
                                    <span className={`short-mode-label ${class4Active('/cryptogramManagement')}`}>{sl.l_authenticate}</span>
                                )}
                            </>
                        ) : null
                }

                {
                    check4Right('webapp_configuration_access', 'table.access') ?
                        (
                            <>
                                <div className={`my-link ${class4Active('')}`} role="button">
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
                                <div className={`my-link ${(class4Active('/systemConfigurationDashboard') || class4Active('/institutionSettingsDashboard') || class4Active('/institutionManagement') || class4Active('/tableListManagement') || class4Active('/tableManagement') || class4Active('/configurationFileManagement') || class4Active('/cryptogramManagement') || class4Active('/timerManagement') || class4Active('/binPrefixManagement') || class4Active('/binPrefixDetail')) ? 'active' : ''} 
                                ${isSubmenuExpand ? 'submenu-open' : ''}`} role="button" onClick={(e) => {
                                    toggleSubmenu();
                                    click4SystemConfigurationDashboard(e); 
                                }}>
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
                                                        <span class="my-label">{sl.l_institution_setting}</span>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div>
                                                        <span class="my-label">{sl.l_table_management}</span>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div>
                                                        <span class="my-label">{sl.l_configuration_file}</span>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div>
                                                        <span class="my-label">{sl.l_hot_card}</span>
                                                    </div>
                                                </li>
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

                {
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
                                    <span className={`short-mode-label ${class4Active('/')}`}>{sl.l_system_monitoring}</span>
                                )}
                            </>
                        ) : null
                }

                {
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
                                    <span className={`short-mode-label ${class4Active('/')}`}>{sl.l_ui_ws}</span>
                                )}
                            </>
                        ) : null
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