import * as react from "react";
import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import * as apiBox from "./apiBox.js";

import { globalContext } from "./globalContext.js";
import { Fallback } from "./Fallback.js";

import { LanguageDialogBox } from "./LanguageDialogBox.js";
import { UserProfileDialogBox } from "./UserProfileDialogBox.js";

import { InfoDialogBox } from "./InfoDialogBox.js";
import { ConfirmDialogBox } from "./ConfirmDialogBox.js";
import { StateDialogBox } from "./StateDialogBox.js";

import { appRouterDefination } from "./appRouter.js";


// Map loaded lib here ...
const uuidv4 = window.uuidv4;
const moment = window.moment;

// Layout
export async function layoutLoader() {
    console.log("Layout loader start ...");
    console.log("Layout loader end ...");

    return {
        date: moment().format("YYYY-MM-DD HH:mm:ss"),
        uuid: uuidv4(),
    };
};

export function Layout({ debugMode = true }) {
    const componentName = "Layout";
    if (debugMode) console.log(`${componentName} component start ...`);
    // let navigation = reactRouter.useNavigation();
    // let revalidator = reactRouter.useRevalidator();
    // let fetchers = reactRouter.useFetchers();
    // let fetcherInProgress = fetchers.some((f) => ["loading", "submitting"].includes(f.state));

    const { config, localData, gsl, isLogin } = react.useContext(globalContext);

    const navigate = reactRouter.useNavigate();

    const [historyIndex, setHistoryIndex] = react.useState(window.history.state?.idx);
    let location = reactRouter.useLocation();

    // Expose the underlying history index in the UI for debugging
    react.useEffect(() => {
        setHistoryIndex(window.history.state?.idx);
    }, [location]);

    // Give us meaningful document titles for popping back/forward more than 1 entry
    /*
    react.useEffect(() => {
        document.title = location.pathname;
    }, [location]);
    */

    react.useEffect(() => {
        console.log("Location change", location.pathname, window.history.state?.idx);
        // if (!isLogin && location.pathname != "/login") navigate("/login");

        if (!isLogin) {
            if (location.pathname === "/login" ||
                location.pathname === "/forgotPassword" ||
                location.pathname === "/resetPassword" || location.pathname === "/cpwt") {
                console.warn("Not yet login but no redirect");
            }
            else {
                console.warn("Redirect to login page ");
                navigate("/login");
            }
        }


        window.scrollTo(0, 0);
    }, [location, isLogin]);

    return (
        <>
            <div className="container-fluid p-0">
                <reactRouter.Outlet />
            </div>
        </>
    );
};

let localData = undefined;
let config = undefined;
let gsl = undefined;

let user = undefined;
let dataset = {};
let debugMode = true;
let skipCheck4Right = true;

// App
export default function App() {
    const componentName = "App";
    if (debugMode) console.log(`${componentName} component start ...`);

    const [appRedraw, setAppRedraw] = react.useState(0);
    const [mode, setMode] = react.useState("load");

    const [isLogin, setIsLogin] = react.useState(false);
    const [menuMode, setMenuMode] = react.useState(1);
    const [applicationLanguage, setApplicationLanguage] = react.useState("English");

    // init function
    react.useEffect(() => {
        if (debugMode) console.log("Run on effect", mode);
        let timer = setTimeout(setup, 100);

        return () => clearTimeout(timer)
    }, []);

    // function
    async function setup() {
        console.log("Setup application")
        localData = tBox.getAppLocalData();
        if (debugMode) console.log("Local data", localData);

        config = await tBox.loadConfiguration4Parameter();
        if (debugMode) console.log("Configuration", config);

        let lang = localData?.applicationLanguage || "English";
        gsl = await tBox.loadConfiguration4Label(lang);
        setApplicationLanguage(lang);
        if (debugMode) console.log("Global string label", gsl);

        // setup and configure api box and tool box
        if (config.debugMode !== undefined) {
            debugMode = config.debugMode;
            apiBox.setDebugMode(debugMode);
            if (debugMode) console.warn("Debug mode is on")
        }

        if (config.serviceURLBase !== undefined) {
            apiBox.setServiceURLBase(config.serviceURLBase);
        }

        if (config.serviceURLBase2 !== undefined) {
            apiBox.setServiceURLBase2(config.serviceURLBase2);
        }

        if (config.skipCheck4Right !== undefined) {
            skipCheck4Right = config.skipCheck4Right;
        }

        // postLogin here, here don't show or popup any message
        user = localData?.user;
        if (user !== undefined) {
            await postLogin(user);
        }

        // menu mode 1 for long and 0 for short 
        updateSideBar(menuMode);

        setMode("list");
        if (debugMode) console.log("Mode", mode);
    };

    async function updateApplicationLanguage(lang) {
        if (debugMode) console.log("Update application language");

        tBox.updateAppLocalData("applicationLanguage", lang);
        localData = tBox.getAppLocalData();
        if (debugMode) console.log("Reload local data", localData);

        gsl = await tBox.loadConfiguration4Label(lang);
        console.log("Global string label", gsl);

        setApplicationLanguage(lang);
        return;
    };

    function updateUser(userRecord) {
        // update isLogin, user and reload localData

        tBox.updateAppLocalData("user", userRecord);
        localData = tBox.getAppLocalData();
        if (debugMode) console.log("Reload local data", localData);

        let login = false;
        if (userRecord !== undefined && userRecord.sessionToken !== undefined) login = true;

        user = userRecord;

        if (debugMode) console.log("Update application user record and logoin status", userRecord, login);
        setIsLogin(login);

        return;
    };

    function getSessionToken() {
        let token = user.sessionToken;
        if (debugMode) console.log("Get session token", token);
        return token;
    };

    function getUsername() {
        let s = user.username;
        if (debugMode) console.log("Get username", s);
        return s;
    };

    async function postLogin(userRecord) {
        if (debugMode) console.log("Post login");
        try {
            if (userRecord === undefined) return { flag: false, errorMessage: "No yet login" };

            let result1 = await apiBox.getUser(userRecord.username, userRecord.sessionToken);
            if (result1.flag) {
                let extraInfo = result1.data.users[0];
                userRecord.extraInfo = extraInfo;
            }
            else {
                console.warn("Get user detail fail");
                return result1;
            }

            let result2 = await apiBox.getUserGroup(userRecord.username, userRecord.sessionToken);
            if (result2.flag) {
                let list = result2.data.teams;
                let s = config.accessGroupName || "kadmin,kdev";
                let groupRecord = list.find(function (item) {
                    if (s.includes(item.name)) return true;
                    return false;
                });

                if (groupRecord) {
                    console.log("Group check ok", groupRecord);
                }
                else {
                    console.warn("Invalid user group access");
                    return { flag: false, errorCode: "invalid_user_group_access" };
                }

            }
            else {
                console.warn("Get user group fail");
                return result2;
            }

            // load user access right
            let result3 = await apiBox.getUserAccessRight(userRecord.username, userRecord.sessionToken);
            if (result3.flag) {
                dataset.userAccessRightObjectList = result3?.data?.accessRightsObjects;
            }

            // load user avatar
            let result4 = await apiBox.getUserAvatar(userRecord.username);
            if (result4.flag) {
                dataset.avatar = URL.createObjectURL(result4.data);
                userRecord.avatarURL = result4.url;
            }

            // update user record to local storage and memory 
            updateUser(userRecord);
            return { flag: true, data: userRecord };
        }
        catch (e) {
            // here will repack the runtime error
            console.warn("Runtime error", e);
            return { flag: false, error: e };
        }
    };

    function updateSideBar(mode) {
        if (mode == 1) {
            dataset.sideBarWidth = {
                'minWidth': '241px'
            };

            // max-width: calc(100vw - 79px); min-width: calc(1024px - 79px);
            dataset.mainPanelWidth = {
                'maxWidth': 'calc(100vw - 241px)',
                'minWidth': 'calc(1200px - 241px)',
            };
        }
        else {
            dataset.sideBarWidth = {
                'minWidth': '79px'
            };

            dataset.mainPanelWidth = {
                'maxWidth': 'calc(100vw - 79px)',
                'minWidth': 'calc(1200px - 79px)',
            };
        }
        return;
    };

    function toggleMenuMode() {
        let mode = menuMode;

        if (mode == 0) mode = 1;
        else mode = 0;

        updateSideBar(mode);
        setMenuMode(mode);
        return;
    };

    function check4Right(objectName, actionName) {
        if (skipCheck4Right) {
            if (debugMode) console.log("Skip check for right", objectName, actionName);
            return true;
        }

        // get list from global dataset
        let list = dataset.userAccessRightObjectList;
        if (list == undefined) return false;

        // find the object group
        let record1 = list.find(function (record2) {
            if (record2.name == objectName) return true;
            return false;
        });

        // check for detail action
        if (record1) {
            let flag = record1.accessRightsActions[actionName];
            if (flag == undefined) return false;
            else return flag;
        }
        return false;
    };

    async function getCurrencyList() {
        if (debugMode) console.log("Get currecny list");

        let list = [];
        try {
            if (dataset.currencyList === undefined) {
                if (debugMode) console.log("From host database");

                list = await apiBox.getCurrencyList();
                if (list) {
                    dataset.currencyList = list;
                }
            }
            else {
                if (debugMode) console.log("From memory");
                list = dataset.currencyList;
            }
        }
        catch (e) {
            console.warn("Error", e);
        }
        return list;
    };

    return (
        <globalContext.Provider value={{
            config,
            localData,
            gsl,
            user,
            applicationDebugMode: debugMode,
            applicationLanguage,
            isLogin,
            menuMode,
            dataset,
            appRedraw, setAppRedraw,
            updateApplicationLanguage,
            updateUser,
            getSessionToken, getUsername,
            postLogin,
            toggleMenuMode,
            check4Right,
            getCurrencyList
        }}>

            {
                (mode === "load") ?
                    <Fallback />
                    :
                    <reactRouter.RouterProvider router={router} fallbackElement={<Fallback />} />
            }

            <LanguageDialogBox debugMode={debugMode} />
            <UserProfileDialogBox debugMode={debugMode} />

            <StateDialogBox debugMode={debugMode} />
            <InfoDialogBox debugMode={debugMode} />
            <ConfirmDialogBox debugMode={debugMode} />

        </globalContext.Provider>
    );
};

let router = reactRouter.createHashRouter(appRouterDefination);

if (import.meta.hot) {
    console.warn("META HOT")
    import.meta.hot.dispose(() => router.dispose());
}

