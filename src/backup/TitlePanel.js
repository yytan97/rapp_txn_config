import * as react from "react";
import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import * as apiBox from "./apiBox.js";

import { globalContext } from "./globalContext.js";

import { showConfirmDialogBox } from "./ConfirmDialogBox.js";
import { showLanguageDialogBox } from "./LanguageDialogBox.js";
import { showUserProfileDialogBox } from "./UserProfileDialogBox.js";

// Map loaded lib here ...
// const uuidv4 = window.uuidv4;
// const moment = window.moment;
// const bootstrap = window.bootstrap;

export function TitlePanel({ debugMode = true }) {
    const componentName = "TitlePanel";
    if (debugMode) console.log(`${componentName} component start ...`);

    const {
        gsl, user, dataset,
        applicationLanguage, updateApplicationLanguage,
        getSessionToken, updateUser,
    } = react.useContext(globalContext);

    // check from context
    let sl = tBox.getStringLabel(gsl, componentName);

    const navigate = reactRouter.useNavigate();

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);
    }, []);

    function click4UserProfile(e) {
        if (debugMode) console.log("Click for user profile", e);
        showUserProfileDialogBox(user, dataset.avatar);
        return
    };

    function click4Language(e) {
        if (debugMode) console.log("Click for language", e);
        showLanguageDialogBox(applicationLanguage, (data) => {
            if (debugMode) console.log("Callback for ok", data);
            updateApplicationLanguage(data.applicationLanguage);

        });
        return;
    };

    function click4Logout(e) {
        if (debugMode) console.log("Click for logout", e);

        let message = sl?.m_confirm_logout?.replace("__parameter_1", user.username);
        showConfirmDialogBox(message, async () => {
            let result = await apiBox.logout(getSessionToken());
            if (result.flag) {
                updateUser(undefined);
                // navigate("/login");
            }
        });

        return
    };

    return (
        <div className="sticky-top">
            <div className="d-flex align-items-center bg-white shadow-sm " style={{ height: "60px" }}>
                <div style={{ ...(dataset.sideBarWidth) }}></div>

                <div className="flex-fill d-flex justify-content-end align-items-center pe-3">
                    <div className="ms-3 dropdown ">
                        <span role="button" data-bs-toggle="dropdown" >
                            {
                                (dataset.avatar === undefined) ?
                                    <img className="rounded-circle border" src="images/avatar0002.png" style={{ width: "32px", height: "32px", objectFit: "cover" }} />
                                    :
                                    <img className="rounded-circle border" src={dataset.avatar} style={{ width: "32px", height: "32px", objectFit: "cover" }} />
                            }
                        </span>

                        <div className="dropdown-menu fs-14-unity shadow p-0">
                            <div className="text-center border-bottom  ">
                                <div className="d-flex justify-content-center align-items-center p-2">
                                    {
                                        (dataset.avatar === undefined) ?
                                            <img className="rounded-circle border" src="images/avatar0002.png" style={{ width: "32px", height: "32px", objectFit: "cover" }} />
                                            :
                                            <img className="rounded-circle border" src={dataset.avatar} style={{ width: "32px", height: "32px", objectFit: "cover" }} />
                                    }
                                    <div className="ms-2 fs-12-unity d-flex flex-column ">
                                        <div>{user?.username}</div>
                                    </div>
                                </div>
                            </div>
                            <ul className="list-unstyled p-2 mb-0">
                                <li>
                                    <button className="dropdown-item border-bottom " type="button" onClick={click4UserProfile} >
                                        {sl.l_my_profile}
                                    </button>
                                </li>
                                <li>
                                    <button className="dropdown-item border-bottom " type="button" onClick={click4Language} >
                                        {sl.l_language}
                                    </button>
                                </li>
                                <li>
                                    <button className="dropdown-item border-bottom" type="button" onClick={click4Logout}>
                                        {sl.l_logout}
                                    </button>
                                </li>
                            </ul>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    )
};
