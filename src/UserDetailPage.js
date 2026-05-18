import * as react from "react";
import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import * as apiBox from "./apiBox.js";
import { globalContext } from "./globalContext.js";

import { ErrorLine } from "./ErrorLine.js";
import { DumpPanel } from "./DumpPanel.js";

import { SideBar } from "./SideBar.js";
import { TitlePanel } from "./TitlePanel.js";
import { FooterPanel } from "./FooterPanel.js";
import { ClosablePanel } from "./ClosablePanel.js";

import { showStateDialogBox, closeStateDialogBox } from "./StateDialogBox.js";
import { showInfoDialogBox } from "./InfoDialogBox.js";
import { showConfirmDialogBox } from "./ConfirmDialogBox.js";

// Map loaded lib here ...
const uuidv4 = window.uuidv4;
const moment = window.moment;

const accessObjectName = "webapp_team_user_access";
const accessActionPrefix = "user_management";

let dataRecord = undefined;
let profileRecord = undefined;

let username = undefined;
let avatarURL = undefined;

let closePanel = {};
let tabIndex = 1;

let userGroupList = [];
let accessRightObjectList = [];
let objectList = [];
let userEmailList = [];
let userMobileList = [];
let userAddressList = [];
let groupList = [];
let countryList = [];

let addressTypeList = [
    { value: "correspondence", label: "Correspondence" },
    { value: "billing", label: "Billing" },
    { value: "shipping", label: "Shipping" },
];

// input variable
let inputData = {};
let formObject = {
    dirty: false,
    valid: false,
    fieldState: {},
};

export function cleanUp() {
    console.log(`Clean up for ${componentName}`);
    dataRecord = undefined;
    profileRecord = undefined;
    avatarURL = undefined;
    username = undefined;
    closePanel = {};
    tabIndex = 1;

    inputData = {};
    formObject = {
        dirty: false,
        valid: false,
        fieldState: {},
    };

    userGroupList = [];

    return;
};

const componentName = "UserDetailPage";
export function UserDetailPage({ debugMode = true }) {
    if (debugMode) console.log(`${componentName} component start ...`);

    // let data = reactRouter.useLoaderData();
    const {
        config, localData, gsl, dataset, user,
        applicationDebugMode, applicationLanguage,
        updateUser,
        getSessionToken, getUsername,
        getCountryList,
        check4Right
    } = react.useContext(globalContext);

    // check from context
    if (applicationDebugMode !== undefined) debugMode = applicationDebugMode;
    let sl = tBox.getStringLabel(gsl, componentName);

    let [redraw, setRedraw] = react.useState(0);
    // let [refresh, setRefresh] = react.useState(true);
    // let [reset, setReset] = react.useState(true);

    const ref4Form = react.useRef();

    const navigate = reactRouter.useNavigate();
    const location = reactRouter.useLocation();

    console.log("Location", location);

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);

        let timer = setTimeout(async () => {
            loadDataList();
        }, 100);

        return () => {
            if (debugMode) console.log(`Unmount ${componentName}`);
            clearTimeout(timer)
            // cleanUp();
        };
    }, []);

    // event handling function here ...

    async function loadDataList(indicatorFlag = true) {
        if (indicatorFlag) showStateDialogBox();

        try {
            dataRecord = undefined;

            // check for user access right
            if (!check4Right(accessObjectName, `${accessActionPrefix}.access`)) {
                throw ({ errorCode: "permission_denied" });
            }

            // parse parameter 
            const sp = new URLSearchParams(location.search);
            username = sp.get('username');

            // fetch data 

            let result2 = await apiBox.getUserRecord(getSessionToken(), username);
            if (result2.flag) {
                let list2 = result2.data.users;
                /* preprocess 
                list2 = list2.map((item) => {
                    return item
                });
                */

                dataRecord = list2[0];
                console.log("Record", dataRecord);

                let result3 = await apiBox.getUserGroupList4User(getSessionToken(), username);
                if (result3.flag) {
                    let list3 = result3.data.teams;

                    if (list3 == undefined) list3 = [];

                    list3.sort(function (a, b) {
                        if (a.name == b.name) return 0;
                        if (a.name < b.name) return -1;
                        return 1;
                    });

                    userGroupList = list3;
                }
                else userGroupList = [];

                let result4 = await apiBox.getAccessRightList4User(getSessionToken(), username);
                if (result4.flag) {
                    let list4 = result4.data.accessRightsObjects;
                    accessRightObjectList = list4;
                }
                else accessRightObjectList = [];

                // Get full object list
                let result5 = await apiBox.getAccessRightObjectList(getSessionToken());
                if (result5.flag) {
                    let list5 = result5.data.accessRightsObjects;

                    /*
                    list5 = list5.filter((record) => {
                        let record2 = accessRightObjectList.find(function (record1) {
                            if (record1.name == record.name) return true;
                            return false;
                        });

                        if (record2) return false;
                        return true;
                    });
                    */

                    list5.sort(function (a, b) {
                        if (a.name == b.name) return 0;
                        if (a.name < b.name) return -1;
                        return 1;
                    });
                    objectList = list5;
                }
                else objectList = [];

                let result6 = await apiBox.getUserAvatar(username);
                if (result6.flag)
                    avatarURL = URL.createObjectURL(result6.data);

                let result7 = await apiBox.getUserProfileRecord(getSessionToken(), username);
                if (result7.flag) {
                    profileRecord = result7.data.userProfile;
                }
                else profileRecord = {};

                let result8 = await apiBox.getUserContactList(getSessionToken(), username);
                if (result8.flag) {
                    userEmailList = result8.data.emails;
                    userMobileList = result8.data.mobiles;
                }
                else {
                    userEmailList = [];
                    userMobileList = [];
                }

                countryList = await getCountryList();

                let result9 = await apiBox.getUserAddressList(getSessionToken(), username);
                if (result9.flag) {
                    let list9 = result9.data.mailingAddresses;
                    list9 = list9.map((record) => {
                        if (record.mailingAddress.countryCode)
                            record.mailingAddress.countryName = getCountryName(record.mailingAddress.countryCode);
                    
                        return record;
                    });
                    userAddressList = list9;
                }
                else userAddressList = [];

                let result10 = await apiBox.getUserGroupRecord(getSessionToken(), "all");
                if (result10.flag) {
                    groupList = result10.data.teams;
                }
                else groupList = [];
            }
            else throw (result2);

        }
        catch (e) {
            console.warn("Error", e);
            let message = tBox.getErrorMessage(e, sl);
            showInfoDialogBox(message);
            if (tBox.isBlockErrorCode(e)) updateUser(undefined);
        }
        finally {
            closeStateDialogBox();
            window.scrollTo(0, 0);
            setRedraw((v) => v + 1);
        }

    };

    function getCountryName(code) {
        let record2 = countryList?.find(function (record1) {
            if (record1.isoNumericCode == code) return true;
            return false;
        });

        if (record2) return record2.name;
        return undefined;
    };

    function getLabel(sl, value, prefix = "") {
        if (debugMode) console.log("Get label ", value, prefix);
        let key = prefix + value;
        let s = sl[key];
        return s;
    };

    function getStatusLabelClass(v) {
        if (debugMode) console.log("Get status label class", v);

        let s = "rounded-3 text-center fw-light text-capitalize text-white ";
        if (v == undefined) return s;
        if (v == "active") return s + "bg-success";
        // if (v == "3") return s + "bg-warning";
        return s + "bg-danger";
    };

    function getDisplayClass(v) {
        if (debugMode) console.log("Get display class", v);

        if (v === undefined) return " d-none ";
        if (v === true) return " ";
        return " d-none ";
    };

    function toggle4Panel(name) {
        if (debugMode) console.log("Toggle for panel ", name);
        if (closePanel[name] === undefined)
            closePanel[name] = false;

        if (closePanel[name] === true) closePanel[name] = false;
        else closePanel[name] = true;

        setRedraw((v) => v + 1);

        return;
    };

    function callback4TogglePanel(name, flag) {
        if (debugMode) console.log("Callback for toggle panel", name, flag);

        closePanel[name] = !flag;
        setRedraw((v) => v + 1);
        return;
    };

    function click4EditUser(e, record) {
        if (debugMode) console.log("Click for edit user", e, record);

        let sp = new URLSearchParams({
            username: record.name,
            editMode: 1
        });

        let path = {
            pathname: "/editUser",
            search: sp.toString(),
        };
        navigate(path);
        return;
    };

    function click4EditProfile(e, record) {
        if (debugMode) console.log("Click for edit profile", e, record);

        let sp = new URLSearchParams({
            username: record.name,
            editMode: 1
        });

        let path = {
            pathname: "/editProfile",
            search: sp.toString(),
        };
        navigate(path);
        return;
    };

    function click4Tab(n) {
        if (debugMode) console.log("Click for tab ", n);

        tabIndex = n;
        setRedraw((v) => v + 1);
        return;
    };

    function change4Record(e) {
        if (debugMode) console.log("Form", ref4Form.current.checkValidity());

        formObject.dirty = true;
        formObject.valid = ref4Form.current.checkValidity();
        // formObject.fieldState[e.target.name] = tBox.buildFieldState(e.target);
        let obj = tBox.buildFormFieldState(ref4Form.current);
        formObject.fieldState = obj;

        inputData[e.target.name] = e.target.value;
        setRedraw((v) => v + 1);
        return;
    };

    function change4ObjectName(e) {
        if (debugMode) console.log("Change for object name", e);

        inputData[e.target.name] = e.target.value;
        setRedraw((v) => v + 1);
        return;
    };

    function change4AddressType(e) {
        if (debugMode) console.log("Change for address type", e);

        inputData[e.target.name] = e.target.value;
        setRedraw((v) => v + 1);
        return;
    };

    function change4GroupName(e) {
        if (debugMode) console.log("Change for group name", e);

        inputData[e.target.name] = e.target.value;
        setRedraw((v) => v + 1);
        return;
    };

    function click4AddTeam(e, teamName) {
        if (debugMode) console.log("Click for add user to team", e, teamName);

        let message = sl.m_confirm_add_user;
        message = message.replace(/__parameter_1/, teamName);
        showConfirmDialogBox(message, async function () {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.addUser4Group(getSessionToken(), username, teamName);
                if (result1 && result1.flag) {
                    inputData.username = "";

                    let message = sl.m_user_added;
                    showInfoDialogBox(message);

                    loadDataList(false);
                }
                else throw result1;
            }
            catch (e) {
                console.warn("Error", e);
                let message = tBox.getErrorMessage(e, sl);
                showInfoDialogBox(message);
                if (tBox.isBlockErrorCode(e)) updateUser(undefined);
            }
            finally {
                closeStateDialogBox();
            }

        });
        return;
    };

    function click4ViewDetail(e, record) {
        if (debugMode) console.log("Click for view detail", e, record);

        let sp = new URLSearchParams({
            teamName: record.name
        });

        let path = {
            pathname: "/teamDetail",
            search: sp.toString(),
        };
        navigate(path);
        return;
    };

    function click4RemoveTeam(e, record, index) {
        if (debugMode) console.log("Click for remove user from team", e, record, index);

        let message = sl.m_confirm_remove_user;
        message = message.replace(/__parameter_1/, record.name);
        showConfirmDialogBox(message, async function () {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.removeUser4Group(getSessionToken(), username, record.name);
                if (result1 && result1.flag) {
                    let message = sl.m_user_removed;
                    showInfoDialogBox(message);
                    loadDataList(false);
                }
                else throw result1;
            }
            catch (e) {
                console.warn("Error", e);
                let message = tBox.getErrorMessage(e, sl);
                showInfoDialogBox(message);
                if (tBox.isBlockErrorCode(e)) updateUser(undefined);
            }
            finally {
                closeStateDialogBox();
            }

        });
        return;
    };

    function toggle4Action(record, key, value) {
        if (debugMode) console.log("Toggle for action", record, key, value);

        record.dirtyFlag = true;
        let actionRecord = record.accessRightsActions;
        if (actionRecord) {
            if (value) actionRecord[key] = false;
            else actionRecord[key] = true;
        }
        setRedraw((v) => v + 1);
    };

    async function click4AddObject(e, objectName) {
        if (debugMode) console.log("Click for add object ", objectName);
        showStateDialogBox();
        try {
            let result1 = await apiBox.getAccessRightAction4Object(getSessionToken(), objectName);
            if (result1 && result1.flag) {
                let record1 = result1.data.accessRightsObjects[0].accessRightsActions;
                console.log(record1);
                let record2 = {
                    name: objectName,
                    accessRightsActions: record1,
                    newFlag: true,
                }

                accessRightObjectList.push(record2);
                inputData.objectName = "";
                setRedraw((v) => v + 1);
            }
            else throw result1;
        }
        catch (e) {
            console.warn("Error", e);
            let message = tBox.getErrorMessage(e, sl);
            showInfoDialogBox(message);
            if (tBox.isBlockErrorCode(e)) updateUser(undefined);
        }
        finally {
            closeStateDialogBox();
        }
        return;
    };

    function click4UpdateObject(e, record, index) {
        if (debugMode) console.log("Click for update object", e, record, index);

        let message = sl.m_confirm_update_access_right;
        message = message.replace(/__parameter_1/, record.name);
        showConfirmDialogBox(message, async function () {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {
                let result1 = await apiBox.updateAccessRightObject4User(getSessionToken(), record, username);
                if (result1 && result1.flag) {
                    let message = sl.m_access_right_updated;
                    showInfoDialogBox(message);
                    loadDataList(false);
                }
                else throw result1;
            }
            catch (e) {
                console.warn("Error", e);
                let message = tBox.getErrorMessage(e, sl);
                showInfoDialogBox(message);
                if (tBox.isBlockErrorCode(e)) updateUser(undefined);
            }
            finally {
                closeStateDialogBox();
            }

        });
        return;
    };

    function click4AddEmail(e) {
        if (debugMode) console.log("Click for add email", e);

        let sp = new URLSearchParams({
            username: username,
            editMode: 0
        });

        let path = {
            pathname: "/editEmail",
            search: sp.toString(),
        };
        navigate(path);
        return;
    };

    function click4RemoveEmail(e, record, index) {
        if (debugMode) console.log("Click for remove email", e, record, index);

        let message = sl.m_confirm_remove_email;
        message = message.replace(/__parameter_1/, record.maskedData);
        showConfirmDialogBox(message, async function () {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {

                let record1 = {
                    username: username,
                    type: "email",
                    identifier: record.identifier
                }
                let result1 = await apiBox.deleteUserContact(getSessionToken(), record1);
                if (result1 && result1.flag) {
                    let message = sl.m_record_removed;
                    showInfoDialogBox(message);
                    loadDataList(false);
                }
                else throw result1;
            }
            catch (e) {
                console.warn("Error", e);
                let message = tBox.getErrorMessage(e, sl);
                showInfoDialogBox(message);
                if (tBox.isBlockErrorCode(e)) updateUser(undefined);
            }
            finally {
                closeStateDialogBox();
            }

        });
        return;
    };

    function click4AddMobile(e) {
        if (debugMode) console.log("Click for add mobile", e);

        let sp = new URLSearchParams({
            username: username,
            editMode: 0
        });

        let path = {
            pathname: "/editMobile",
            search: sp.toString(),
        };
        navigate(path);
        return;
    };

    function click4RemoveMobile(e, record, index) {
        if (debugMode) console.log("Click for remove mobile", e, record, index);

        let message = sl.m_confirm_remove_mobile;
        message = message.replace(/__parameter_1/, record.maskedData);
        showConfirmDialogBox(message, async function () {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {

                let record1 = {
                    username: username,
                    type: "mobile",
                    identifier: record.identifier
                }
                let result1 = await apiBox.deleteUserContact(getSessionToken(), record1);
                if (result1 && result1.flag) {
                    let message = sl.m_record_removed;
                    showInfoDialogBox(message);
                    loadDataList(false);
                }
                else throw result1;
            }
            catch (e) {
                console.warn("Error", e);
                let message = tBox.getErrorMessage(e, sl);
                showInfoDialogBox(message);
                if (tBox.isBlockErrorCode(e)) updateUser(undefined);
            }
            finally {
                closeStateDialogBox();
            }

        });
        return;
    };

    function click4AddAddress(e, type) {
        if (debugMode) console.log("Click for add address", e);

        let sp = new URLSearchParams({
            username: username,
            type: type,
            editMode: 0
        });

        let path = {
            pathname: "/editAddress",
            search: sp.toString(),
        };
        navigate(path);
        return;
    };

    function click4EditAddress(e, record, index) {
        if (debugMode) console.log("Click for edit address", e, record);

        let sp = new URLSearchParams({
            username: username,
            type: record.mailingAddress.type,
            editMode: 1
        });

        let path = {
            pathname: "/editAddress",
            search: sp.toString(),
        };
        navigate(path);
        return;
    };

    function click4RemoveAddress(e, record, index) {
        if (debugMode) console.log("Click for remove address", e, record, index);

        let message = sl.m_confirm_remove_address;
        message = message.replace(/__parameter_1/, record?.mailingAddress?.type);
        showConfirmDialogBox(message, async function () {
            if (debugMode) console.log("Callback for confirm");
            showStateDialogBox();
            try {

                let record1 = {
                    username: username,
                    type: record?.mailingAddress?.type,
                }
                let result1 = await apiBox.deleteUserAddress(getSessionToken(), record1);
                if (result1 && result1.flag) {
                    let message = sl.m_record_removed;
                    showInfoDialogBox(message);
                    loadDataList(false);
                }
                else throw result1;
            }
            catch (e) {
                console.warn("Error", e);
                let message = tBox.getErrorMessage(e, sl);
                showInfoDialogBox(message);
                if (tBox.isBlockErrorCode(e)) updateUser(undefined);
            }
            finally {
                closeStateDialogBox();
            }

        });
        return;
    };
    
    return (
        <div className="container-fluid px-0 bg-unity-3">
            <TitlePanel />
            <div className="d-flex ">
                <div style={{ ...(dataset?.sideBarWidth) }}>
                    <SideBar />
                </div>

                <div className="flex-fill" style={{ ...(dataset?.mainPanelWidth) }}>

                    <div className="mt-2 mb-4 mx-4" style={{ minHeight: "100vh", }}>

                        <div className=" d-flex justify-content-between">
                            <div className="col-12 col-md-6 text-white"
                                style={{ fontSize: "12px", color: "#76797B", cursor: "pointer" }}
                                onClick={() => navigate(-1)} >
                                <i className="fas fa-chevron-left fa-fw"></i>{sl.l_previous_page}
                            </div>
                            <div className="text-end text-white" style={{ fontSize: "12px", color: "#76797B" }}>
                                {sl.l_last_updated} {tBox.getLastUpdatedDate()}
                            </div>
                        </div>

                        <div className="d-flex justify-content-center">

                            <div className="col-3">
                                <div class="ps-3">
                                    <div class="mt-4 ms-3">
                                        <img src={avatarURL || 'images/avatar0002.png'}
                                            class="border border-3 rounded-circle"
                                            style={{ width: "96px", height: "96px", objectFit: "cover" }} />
                                    </div>
                                </div>

                                <div className="px-4" style={{ marginTop: "100px", fontSize: "12px" }}>
                                    <div className="my-4"
                                        onClick={() => click4Tab(1)}
                                        style={tabIndex === 1 ? { color: '#487798', cursor: "pointer" } : { color: '#76797B', cursor: "pointer" }}>
                                        {sl.l_account_info}
                                    </div>
                                    <div className="my-4"
                                        onClick={() => click4Tab(2)}
                                        style={tabIndex === 2 ? { color: '#487798', cursor: "pointer" } : { color: '#76797B', cursor: "pointer" }}>
                                        {sl.l_teams}
                                    </div>
                                    <div className="my-4"
                                        onClick={() => click4Tab(3)}
                                        style={tabIndex === 3 ? { color: '#487798', cursor: "pointer" } : { color: '#76797B', cursor: "pointer" }}>
                                        {sl.l_access_rights}
                                    </div>
                                    <div className="my-4"
                                        onClick={() => click4Tab(4)}
                                        style={tabIndex === 4 ? { color: '#487798', cursor: "pointer" } : { color: '#76797B', cursor: "pointer" }}>
                                        {sl.l_contact}
                                    </div>
                                    <div className="my-4"
                                        onClick={() => click4Tab(5)}
                                        style={tabIndex === 5 ? { color: '#487798', cursor: "pointer" } : { color: '#76797B', cursor: "pointer" }}>
                                        {sl.l_address}
                                    </div>
                                </div>
                            </div>

                            <div className="col-9 ">

                                <div className="" style={{ marginTop: "64px" }}>
                                    <div className="d-flex align-items-center justify-content-center bg-white px-5"
                                        style={{ borderRadius: "16px 16px 16px 16px", border: "1px solid #ebebeb", minHeight: "154px" }}>
                                        <div style={{ width: "100%" }} >
                                            <div className="d-flex justify-content-between">
                                                <div style={{ color: "#494D4F", fontSize: "14px" }} >
                                                    {sl.l_last_updated}: {tBox.formatDate(dataRecord?.recordTimestamp)}
                                                </div>
                                                <div className={`${getStatusLabelClass(dataRecord?.recordStatus)}`}
                                                    style={{ color: "#494D4F", fontSize: "14px", minWidth: "128px", height: "24px" }} >
                                                    <span >
                                                        {getLabel(sl, dataRecord?.recordStatus, "o_status_") || dataRecord?.recordStatus}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ color: "#494D4F", fontSize: "32px", fontWeight: "bold" }} >
                                                {dataRecord?.name}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {
                                    tabIndex === 1 ? (
                                        <>
                                            <ClosablePanel name="user_account"
                                                title={sl.l_user_account}
                                                closeFlag={closePanel?.user_account}
                                                callback4Toggle={callback4TogglePanel}>
                                                <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                    style={{ minHeight: "168px" }} >
                                                    <div className="px-5 py-1 w-100">

                                                        <DisplayLine label={sl.l_username} value={dataRecord?.name} />
                                                        <DisplayLine label={sl.l_preferred_name} value={dataRecord?.preferName} />

                                                    </div>
                                                </div>

                                                {
                                                    check4Right(accessObjectName, `${accessActionPrefix}.add`) ? (
                                                        <div className="d-flex justify-content-end align-items-center px-4 border-top"
                                                            style={{ minHeight: "56px" }}>
                                                            <button className="btn btn-ghost-unity d-flex align-items-center"
                                                                type="button"
                                                                style={{ color: "#494D4F", fontWeight: "500" }}
                                                                onClick={(e) => click4EditUser(e, dataRecord)}>
                                                                <span className="material-icons-outlined fs-24-unity me-2">edit</span>
                                                                {sl.b_edit}
                                                            </button>
                                                        </div>
                                                    ) : null
                                                }

                                            </ClosablePanel>

                                            <ClosablePanel name="user_profile"
                                                title={sl.l_user_profile}
                                                closeFlag={closePanel?.user_profile}
                                                callback4Toggle={callback4TogglePanel}>
                                                <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                    style={{ minHeight: "168px" }} >
                                                    <div className="px-5 py-1 w-100">

                                                        <DisplayLine label={sl.l_salutation} value={profileRecord?.salutationPrefix} />
                                                        <DisplayLine label={sl.l_first_name} value={profileRecord?.firstName} />
                                                        <DisplayLine label={sl.l_last_name} value={profileRecord?.lastName} />
                                                        <DisplayLine label={sl.l_middle_name} value={profileRecord?.middleName} />
                                                        <DisplayLine label={sl.l_other_name} value={profileRecord?.otherName} />

                                                    </div>
                                                </div>

                                                {
                                                    check4Right(accessObjectName, `${accessActionPrefix}.add`) ? (
                                                        <div className="d-flex justify-content-end align-items-center px-4 border-top"
                                                            style={{ minHeight: "56px" }}>
                                                            <button className="btn btn-ghost-unity d-flex align-items-center"
                                                                type="button"
                                                                style={{ color: "#494D4F", fontWeight: "500" }}
                                                                onClick={(e) => click4EditProfile(e, dataRecord)}>
                                                                <span className="material-icons-outlined fs-24-unity me-2">edit</span>
                                                                {sl.b_edit}
                                                            </button>
                                                        </div>
                                                    ) : null
                                                }

                                            </ClosablePanel>
                                        </>
                                    ) : null
                                }

                                {
                                    tabIndex === 2 ? (
                                        <ClosablePanel name="teams"
                                            title={sl.l_teams}
                                            closeFlag={closePanel?.teams}
                                            callback4Toggle={callback4TogglePanel}>
                                            <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                style={{ minHeight: "168px" }} >
                                                <div className="px-5 py-1 w-100">

                                                    {
                                                        userGroupList.map((record, index) => {
                                                            return (
                                                                <div key={index} className="d-flex align-items-center justify-content-between my-3">

                                                                    <div className="d-flex align-items-center">
                                                                        <div className="me-3" style={{ color: "#76797B", fontSize: "12px" }}>
                                                                            {index + 1}
                                                                        </div>
                                                                        <div style={{ color: "#76797B", fontSize: "16px" }}>
                                                                            {record.name}
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <div className="dropdown dropstart ">
                                                                            <div className="d-flex align-items-center "
                                                                                role="button"
                                                                                data-bs-toggle="dropdown">
                                                                                <span className="material-icons fs-18-unity">more_vert</span>
                                                                            </div>

                                                                            <div className="dropdown-menu fs-14-unity border-0 shadow p-0"
                                                                                style={{ borderRadius: "8px" }} >
                                                                                <ul className="list-unstyled p-2 mb-0">
                                                                                    <li >
                                                                                        <button
                                                                                            className="dropdown-item border-bottom d-flex align-items-center"
                                                                                            type="button"
                                                                                            onClick={(e) => click4ViewDetail(e, record, index)}>
                                                                                            <span
                                                                                                className="material-icons-outlined fs-24-unity me-2">find_in_page</span>
                                                                                            <span>{sl.b_view_detail}</span>
                                                                                        </button>
                                                                                    </li>
                                                                                    {
                                                                                        check4Right(accessObjectName, `${accessActionPrefix}.members.delete`) ? (
                                                                                            <li>
                                                                                                <button
                                                                                                    className="dropdown-item border-bottom d-flex align-items-center"
                                                                                                    type="button"
                                                                                                    onClick={(e) => click4RemoveTeam(e, record, index)}>
                                                                                                    <span
                                                                                                        className="material-icons-outlined fs-24-unity me-2">delete</span>
                                                                                                    <span>{sl.b_remove_from_team}</span>
                                                                                                </button>
                                                                                            </li>
                                                                                        ) : null
                                                                                    }

                                                                                </ul>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                </div>
                                                            );
                                                        })

                                                    }

                                                </div>
                                            </div>

                                            {
                                                check4Right(accessObjectName, `${accessActionPrefix}.teams.add`) ? (

                                                    <div className="d-flex justify-content-between align-items-center px-4 border-top"
                                                        style={{ minHeight: "56px" }} >

                                                        <div className="flex-fill me-3">
                                                            <select className="form-select"
                                                                name="groupName"
                                                                value={inputData.groupName || ""}
                                                                onChange={change4GroupName} >
                                                                <option value="">{sl.o_select_option}</option>
                                                                {
                                                                    groupList?.filter((record) => {
                                                                        let record2 = userGroupList.find(function (record1) {
                                                                            if (record1.name == record.name) return true;
                                                                            return false;
                                                                        });

                                                                        if (record2) return false;
                                                                        return true;

                                                                    }).map((record, index) => {
                                                                        return <option key={index} value={record.name}>{record.name}</option>
                                                                    })

                                                                }
                                                            </select>
                                                        </div>

                                                        <button className="btn btn-ghost-unity d-flex align-items-center"
                                                            type="button"
                                                            style={{ color: "#494D4F", fontWeight: "500" }}
                                                            onClick={(e) => click4AddTeam(e, inputData?.groupName)}
                                                            disabled={!inputData?.groupName}>
                                                            <span className="material-icons-outlined fs-24-unity me-2">add</span>
                                                            <span className="text-nowrap">{sl.b_add_team}</span>
                                                        </button>

                                                    </div>

                                                ) : null
                                            }

                                        </ClosablePanel>
                                    ) : null
                                }

                                {
                                    tabIndex === 3 ? (
                                        <>
                                            {
                                                accessRightObjectList.map((record, index) => {
                                                    return (
                                                        <ClosablePanel key={index} name={`access_right_${index}`}
                                                            title={record.name}
                                                            closeFlag={closePanel[`access_right_${index}`]}
                                                            callback4Toggle={callback4TogglePanel}>
                                                            <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                                style={{ minHeight: "168px" }} >
                                                                <div className="px-5 py-1 w-100">

                                                                    <div className="row py-3" >
                                                                        {
                                                                            Object.keys(record.accessRightsActions || {})?.map((key, index2) => {
                                                                                return (
                                                                                    <div className="col-6 py-1" key={index2} >
                                                                                        <div className="d-flex align-items-center" style={{ cursor: "pointer" }}
                                                                                            onClick={() => toggle4Action(record, key, record.accessRightsActions[key])}>
                                                                                            {
                                                                                                record.accessRightsActions[key] ? (
                                                                                                    <span>
                                                                                                        <i className="fas fa-check-circle fa-fw me-1"
                                                                                                            style={{ color: "#36b37e" }}>
                                                                                                        </i>
                                                                                                        <span style={{ color: "#76797b", fontWeight: "600" }}>
                                                                                                            {key}
                                                                                                        </span>
                                                                                                    </span>
                                                                                                ) : (
                                                                                                    <span>
                                                                                                        <i className="fas fa-minus-circle fa-fw me-1"
                                                                                                            style={{ color: "#b4b5b7" }}>
                                                                                                        </i>
                                                                                                        <span style={{ color: "#b4b5b7" }}>
                                                                                                            {key}
                                                                                                        </span>
                                                                                                    </span>
                                                                                                )

                                                                                            }


                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })
                                                                        }
                                                                    </div>

                                                                </div>
                                                            </div>
                                                            <div className={"d-flex justify-content-end align-items-center px-4 border-top " +
                                                                getDisplayClass(check4Right(accessObjectName, `${accessActionPrefix}.access_rights.update`) ||
                                                                    check4Right(accessObjectName, `${accessActionPrefix}.access_rights.delete`)
                                                                )}
                                                                style={{ minHeight: "56px" }}>

                                                                {
                                                                    check4Right(accessObjectName, `${accessActionPrefix}.access_rights.update`) ? (
                                                                        <button className="btn btn-ghost-unity d-flex align-items-center"
                                                                            type="button"
                                                                            style={{ color: "#494D4F", fontWeight: "500" }}
                                                                            disabled={!record?.dirtyFlag}
                                                                            onClick={(e) => click4UpdateObject(e, record, index)}>
                                                                            <span className="material-icons-outlined fs-24-unity me-2">upload_file</span>
                                                                            {sl.b_update}
                                                                        </button>
                                                                    ) : null
                                                                }
                                                            </div>
                                                        </ClosablePanel>
                                                    );
                                                })
                                            }

                                            <div className="d-flex justify-content-between align-items-center mt-4">
                                                <div className="flex-fill me-2">
                                                    <select className="form-select"
                                                        name="objectName"
                                                        value={inputData.objectName || ""}
                                                        onChange={change4ObjectName} >
                                                        <option value="">{sl.o_select_option}</option>
                                                        {
                                                            objectList.filter((record) => {
                                                                let record2 = accessRightObjectList.find(function (record1) {
                                                                    if (record1.name == record.name) return true;
                                                                    return false;
                                                                });

                                                                if (record2) return false;
                                                                return true;

                                                            }).map((record, index) => {
                                                                return <option key={index} value={record.name}>{record.name}</option>
                                                            })

                                                        }
                                                    </select>
                                                </div>
                                                {
                                                    check4Right(accessObjectName, `${accessActionPrefix}.access_rights.add`) ? (
                                                        <button className="btn btn-unity text-nowrap" type="button"
                                                            onClick={(e) => click4AddObject(e, inputData.objectName)}
                                                            disabled={!inputData.objectName}>
                                                            <span className="material-icons-outlined fs-24-unity me-2 ">add</span>
                                                            {sl.b_add_object}
                                                        </button>
                                                    ) : null
                                                }

                                            </div>
                                        </>
                                    ) : null
                                }

                                {
                                    tabIndex === 4 ? (
                                        <>
                                            <ClosablePanel name="email"
                                                title={sl.l_email}
                                                closeFlag={closePanel?.email}
                                                callback4Toggle={callback4TogglePanel}>
                                                <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                    style={{ minHeight: "168px" }} >
                                                    <div className="px-5 py-1 w-100">
                                                        {
                                                            userEmailList?.map((record, index) => {
                                                                return (
                                                                    <div key={index} className="d-flex align-items-center justify-content-between my-3">

                                                                        <div className="d-flex align-items-center">
                                                                            <div className="me-3" style={{ color: "#76797B", fontSize: "12px" }}>
                                                                                {index + 1}
                                                                            </div>
                                                                            <div style={{ color: "#76797B", fontSize: "16px" }}>
                                                                                {record?.maskedData}
                                                                            </div>
                                                                        </div>

                                                                        <div>
                                                                            {
                                                                                check4Right(accessObjectName, `${accessActionPrefix}.contact.delete`) ? (
                                                                                    <span className="d-inline-flex align-items-center "
                                                                                        role="button"
                                                                                        onClick={(e) => click4RemoveEmail(e, record, index)} >
                                                                                        <span className="material-icons-outlined fs-24-unity">delete</span>
                                                                                    </span>
                                                                                ) : null
                                                                            }
                                                                        </div>

                                                                    </div>
                                                                );
                                                            })
                                                        }

                                                    </div>
                                                </div>

                                                {
                                                    check4Right(accessObjectName, `${accessActionPrefix}.contact.add`) ? (

                                                        <div
                                                            className="d-flex justify-content-end align-items-center px-4 border-top"
                                                            style={{ minHeight: "56px" }} >

                                                            <button className="btn btn-ghost-unity d-flex align-items-center"
                                                                type="button"
                                                                style={{ color: "#494D4F", fontWeight: "500" }}
                                                                onClick={(e) => click4AddEmail(e)} >
                                                                <span className="material-icons-outlined fs-24-unity me-2">add</span>
                                                                <span className="text-nowrap">{sl.b_add_email}</span>
                                                            </button>

                                                        </div>

                                                    ) : null
                                                }

                                            </ClosablePanel>

                                            <ClosablePanel name="mobile"
                                                title={sl.l_mobile}
                                                closeFlag={closePanel?.mobile}
                                                callback4Toggle={callback4TogglePanel}>
                                                <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                    style={{ minHeight: "168px" }} >
                                                    <div className="px-5 py-1 w-100">

                                                        {
                                                            userMobileList?.map((record, index) => {
                                                                return (
                                                                    <div key={index} className="d-flex align-items-center justify-content-between my-3">

                                                                        <div className="d-flex align-items-center">
                                                                            <div className="me-3" style={{ color: "#76797B", fontSize: "12px" }}>
                                                                                {index + 1}
                                                                            </div>
                                                                            <div style={{ color: "#76797B", fontSize: "16px" }}>
                                                                                {record?.maskedData}
                                                                            </div>
                                                                        </div>

                                                                        <div>
                                                                            {
                                                                                check4Right(accessObjectName, `${accessActionPrefix}.contact.delete`) ? (
                                                                                    <span className="d-inline-flex align-items-center "
                                                                                        role="button"
                                                                                        onClick={(e) => click4RemoveMobile(e, record, index)}>
                                                                                        <span className="material-icons-outlined fs-24-unity">delete</span>
                                                                                    </span>
                                                                                ) : null
                                                                            }
                                                                        </div>

                                                                    </div>
                                                                );
                                                            })
                                                        }
                                                    </div>
                                                </div>

                                                {
                                                    check4Right(accessObjectName, `${accessActionPrefix}.contact.add`) ? (

                                                        <div
                                                            className="d-flex justify-content-end align-items-center px-4 border-top"
                                                            style={{ minHeight: "56px" }} >

                                                            <button className="btn btn-ghost-unity d-flex align-items-center"
                                                                type="button"
                                                                style={{ color: "#494D4F", fontWeight: "500" }}
                                                                onClick={(e) => click4AddMobile(e)} >
                                                                <span className="material-icons-outlined fs-24-unity me-2">add</span>
                                                                <span className="text-nowrap">{sl.b_add_mobile}</span>
                                                            </button>

                                                        </div>

                                                    ) : null
                                                }

                                            </ClosablePanel>
                                        </>

                                    ) : null
                                }

                                {
                                    tabIndex === 5 ? (
                                        <>
                                            {
                                                userAddressList.map((record, index) => {
                                                    return (
                                                        <ClosablePanel key={index} name={`address_${index}`}
                                                            title={`${sl.l_address} ${index + 1} (${record.mailingAddress.type})`}
                                                            closeFlag={closePanel[`address_${index}`]}
                                                            callback4Toggle={callback4TogglePanel}>
                                                            <div className="d-flex flex-column align-items-center justify-content-center border-top"
                                                                style={{ minHeight: "168px" }} >
                                                                <div className="px-5 py-1 w-100">

                                                                    <div class="row ">
                                                                        <div class="col-12 ">
                                                                            <div>
                                                                                {record.mailingAddress.addressLine1 || '-'}
                                                                            </div>
                                                                            <div>
                                                                                {record.mailingAddress.addressLine2}
                                                                            </div>
                                                                            <div>
                                                                                {record.mailingAddress.addressLine3}
                                                                            </div>
                                                                            <div>
                                                                                {`${record.mailingAddress.city} ${record.mailingAddress.provinceState} ${record.mailingAddress.postalCode}`}
                                                                            </div>
                                                                            <div>
                                                                                {record.mailingAddress.countryName}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                </div>
                                                            </div>
                                                            <div className={"d-flex justify-content-end align-items-center px-4 border-top " +
                                                                getDisplayClass(check4Right(accessObjectName, `${accessActionPrefix}.address.edit`) ||
                                                                    check4Right(accessObjectName, `${accessActionPrefix}.address.delete`)
                                                                )}
                                                                style={{ minHeight: "56px" }}>
                                                                {
                                                                    check4Right(accessObjectName, `${accessActionPrefix}.address.delete`) ? (
                                                                        <button className="ms-2 btn btn-ghost-unity d-flex align-items-center"
                                                                            type="button"
                                                                            style={{ color: "#494D4F", fontWeight: "500" }}
                                                                            onClick={(e) => click4RemoveAddress(e, record, index)}>
                                                                            <span className="material-icons-outlined fs-24-unity me-2">delete</span>
                                                                            {sl.b_remove}
                                                                        </button>
                                                                    ) : null
                                                                }

                                                                {
                                                                    check4Right(accessObjectName, `${accessActionPrefix}.address.edit`) ? (
                                                                        <button className="ms-2 btn btn-ghost-unity d-flex align-items-center"
                                                                            type="button"
                                                                            style={{ color: "#494D4F", fontWeight: "500" }}
                                                                            onClick={(e) => click4EditAddress(e, record, index)}>
                                                                            <span className="material-icons-outlined fs-24-unity me-2">upload_file</span>
                                                                            {sl.b_edit}
                                                                        </button>
                                                                    ) : null
                                                                }
                                                            </div>
                                                        </ClosablePanel>
                                                    );
                                                })
                                            }

                                            <div className="d-flex justify-content-between align-items-center mt-4">
                                                <div className="flex-fill me-2">
                                                    <select className="form-select"
                                                        name="addressType"
                                                        value={inputData.addressType || ""}
                                                        onChange={change4AddressType} >
                                                        <option value="">{sl.o_select_option}</option>
                                                        {
                                                            addressTypeList.filter((record) => {
                                                                let record2 = userAddressList.find(function (record1) {
                                                                    if (record1.mailingAddress.type == record.value) return true;
                                                                    return false;
                                                                });

                                                                if (record2) return false;
                                                                return true;

                                                            }).map((record, index) => {
                                                                return <option key={index} value={record.value}>{record.label}</option>
                                                            })

                                                        }
                                                    </select>
                                                </div>
                                                {
                                                    check4Right(accessObjectName, `${accessActionPrefix}.address.add`) ? (
                                                        <button className="btn btn-unity text-nowrap" type="button"
                                                            onClick={(e) => click4AddAddress(e, inputData.addressType)}
                                                            disabled={!inputData.addressType}>
                                                            <span className="material-icons-outlined fs-24-unity me-2 ">add</span>
                                                            {sl.b_add_address}
                                                        </button>
                                                    ) : null
                                                }

                                            </div>
                                        </>
                                    ) : null
                                }

                            </div>
                        </div>

                    </div>  {/* end of content panel */}

                    <DumpPanel dataList={[
                        { name: "inputData", data: inputData },
                        { name: "formObject", data: formObject },
                        { name: "dataRecord", data: dataRecord },
                        { name: "profileRecord", data: profileRecord },
                        // { name: "accessRightObjectList", data: accessRightObjectList },
                        // { name: "objectList", data: objectList },
                        { name: "userGroupList", data: userGroupList },
                        { name: "userEmailList", data: userEmailList },
                        { name: "userMobileList", data: userMobileList },
                        { name: "userAddressList", data: userAddressList },
                        { name: "sl", data: sl },
                    ]} debugMode={debugMode} />

                </div> {/* end of right panel */}

            </div> {/* end of top part */}

            <FooterPanel />
        </div >
    );
};

export function DisplayLine({ label, value, debugMode = false }) {

    return (
        <div className="d-flex justify-content-between align-items-center my-3">
            <div style={{ color: "#76797B", fontSize: "14px" }}>
                {label}
            </div>
            <div style={{ color: "#494D4F", fontSize: "16px" }}>
                {value || "-"}
            </div>
        </div>
    );
};