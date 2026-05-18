import * as react from "react";
import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import * as apiBox from "./apiBox.js";
import { globalContext } from "./globalContext.js";

import { ErrorLine } from "./ErrorLine.js";
import { InputLabel } from "./InputLabel.js";

import { DumpPanel } from "./DumpPanel.js";

// import { SideBar } from "./SideBar.js";
// import { TitlePanel } from "./TitlePanel.js";
// import { FooterPanel } from "./FooterPanel.js";
// import { ClosablePanel } from "./ClosablePanel.js";

import { showInfoDialogBox } from "./InfoDialogBox.js";
import { showConfirmDialogBox } from "./ConfirmDialogBox.js";
import { showStateDialogBox, closeStateDialogBox } from "./StateDialogBox.js";

// Map loaded lib here ...
const uuidv4 = window.uuidv4;
const moment = window.moment;

let tableName = "kauth_user";
let databaseName = "kauth";

const accessObjectName = "webapp_team_user_access";
const accessActionPrefix = "user_management";

let dataRecord = undefined;
let userGroupList = [];
let mobileCountryCodeList = [];

// parameter
let username = undefined;
let editMode = 0;

// input variable
let inputData = {};
let formObject = {
    dirty: false,
    valid: false,
    fieldState: {},
};

export function cleanUp() {
    dataRecord = undefined;
    username = undefined;
    editMode = 0;

    inputData = {};
    formObject = {
        dirty: false,
        valid: false,
        fieldState: {},
    };
    return;
};

export function EditUserPage({ debugMode = true }) {
    const componentName = "EditUserPage";
    if (debugMode) console.log(`${componentName} component start ...`);

    const {
        config, localData, gsl, dataset, user,
        applicationDebugMode, applicationLanguage,
        updateUser,
        getSessionToken, getUsername,
        check4Right,
        getMobileCountryCodeList
    } = react.useContext(globalContext);

    // check from context
    if (applicationDebugMode !== undefined) debugMode = applicationDebugMode;
    let sl = tBox.getStringLabel(gsl, componentName);

    let [redraw, setRedraw] = react.useState(0);
    const inputFileRef = react.useRef();
    const [avatar, setAvatar] = react.useState(null);
    const [uploadFile, setUploadFile] = react.useState(null);

    const ref4Form = react.useRef();

    const navigate = reactRouter.useNavigate();
    const location = reactRouter.useLocation();

    // parse parameter here is better
    const sp = new URLSearchParams(location.search);
    username = sp.get('username');
    editMode = parseInt(sp.get('editMode'));

    console.log("Username", username);
    console.log("Edit mode", editMode);

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);

        let timer = setTimeout(async () => {
            // load data list will base on edit mode to provide the input record value
            await loadDataList();
        }, 100);

        return () => {
            if (debugMode) console.log(`Unmount ${componentName}`);
            clearTimeout(timer);

            // edit page can add cleanup here
            cleanUp();
        };
    }, [location.search]);

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect for build field state`);
        let obj = tBox.buildFormFieldState(ref4Form.current);
        formObject.fieldState = obj;
        formObject.valid = ref4Form.current.checkValidity();
    }, [redraw]);     // if having custom validation than need to add redraw to effect state list

    // check for route blocker 
    console.log("Location", location);
    let shouldBlock = react.useCallback(({ currentLocation, nextLocation }) => {
        console.log("Callback for blocker ...")
        // return formState.dirty && currentLocation.pathname !== nextLocation.pathname
        return formObject.dirty && currentLocation.pathname !== nextLocation.pathname

    }, [redraw]);

    let blocker = reactRouter.useBlocker(shouldBlock);
    console.log("Blocker", blocker);

    if (blocker.state === "blocked") {
        if (debugMode) console.log("Show discard confirm dialog box");
        // only in this case need to wrap in other thread else react warning ...
        setTimeout(() => {
            showConfirmDialogBox(sl.m_changes_not_saved,
                callback4BlockerProceed, sl.b_discard,
                callback4BlockerReset);
        }, 100);
    }

    // event handling function here ...

    async function loadDataList() {
        showStateDialogBox();

        try {
            dataRecord = undefined;

            // check for user access right
            if (!check4Right(accessObjectName, `${accessActionPrefix}.access`)) {
                throw { errorCode: "permission_denied" };
            }

            // fetch data 

            // other reference data can be load on this section
            let result2 = await apiBox.getUserGroupRecord(getSessionToken(), "all");
            if (result2.flag) {
                let list2 = result2.data.teams;
                list2.sort(function (a, b) {
                    if (a.name == b.name) return 0;
                    if (a.name < b.name) return -1;
                    return 1;
                });
                userGroupList = list2;
            }
            else userGroupList = [];

            mobileCountryCodeList = await getMobileCountryCodeList();

            if (editMode === 1) {
                let result4 = await apiBox.getUserRecord(getSessionToken(), username);

                if (result4.flag) {
                    let list1 = result4.data.users;
                    list1 = list1.map((item) => {
                        item.username = item.name;
                        return item;
                    });

                    dataRecord = list1[0];

                    console.log("Record", dataRecord);
                    inputData = dataRecord;


                    let result6 = await apiBox.getUserAvatar(username);
                    if (result6.flag)
                        setAvatar(URL.createObjectURL(result6.data));
                }
                else throw (result4);

            } else {
                // provide default value for add mode
                dataRecord = {
                    organizationName: "kdev",
                    primaryGroup: "kdev",
                    mobileCountryCode: 60,
                    recordStatus: 'A'
                };

                dataRecord.flagFilename = getCountryFlag(dataRecord.mobileCountryCode);
                inputData = dataRecord;
            }

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

    function getCountryFlag(code){
        let record2 = mobileCountryCodeList.find(function (record1) {
            if (record1.code == code) return true;
            return false;
        });

        if (record2) return record2.flag;
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
        if (v === undefined) return s;
        if (v === "A") return s + "bg-success";
        if (v === "P") return s + "bg-warning";
        return s + "bg-danger";
    };

    function change4Input(e) {
        if (debugMode) console.log("Change for input", e);

        formObject.dirty = true;
        formObject.valid = ref4Form.current.checkValidity();
        let obj = tBox.buildFormFieldState(ref4Form.current);
        formObject.fieldState = obj;

        // add custom validation
        let name = e.target.name;
        let input = e.target;
        let value = e.target.value;
        let type = e.target.type;

        if (type === 'checkbox' && name.indexOf(".") >= 0) {
            if (debugMode) console.log("Change for input checkbox with dot name", name);
            let a = name.split(".");
            let b = a.reduce((s, item) => {
                if (s === null) return `["${item}"]`;
                else return s + `["${item}"]`;
            }, null);
            let s = `inputData${b} = ${input.checked}`;
            console.log(s);
            eval(s);
        }
        else if (type === 'checkbox') {
            if (debugMode) console.log("Change for input checkbox ", name);
            inputData[name] = input.checked;
        }
        else if (name.indexOf(".") >= 0) {
            if (debugMode) console.log("Change for input checkbox with dot name", name);
            let a = name.split(".");
            let b = a.reduce((s, item) => {
                if (s === null) return `["${item}"]`;
                else return s + `["${item}"]`;
            }, null);
            let s = `inputData${b} = "${value}"`;
            console.log(s);
            eval(s);
        }
        else {
            if (debugMode) console.log("Change for input", name);
            inputData[name] = value;
        }

        if (name === "mobileCountryCode") {       
            inputData.flagFilename = getCountryFlag(inputData.mobileCountryCode);
            setTimeout(() => setRedraw((v) => v + 1), 200);
        }

        console.log("Input data", inputData);
        console.log("Form state", formObject)
        setRedraw((v) => v + 1);
    };

    function callback4BlockerProceed() {
        if (debugMode) console.log("Callback for blocker proceed", blocker);
        blocker?.proceed();
        return;
    };

    function callback4BlockerReset() {
        if (debugMode) console.log("Callback for blocker reset", blocker);
        blocker?.reset();
        return;
    };

    function click4AddRecord(e) {
        if (debugMode) console.log("Click for add record", e);
        let message = sl.m_confirm_add_user;
        message = message.replace("__parameter_1", inputData.username);
        showConfirmDialogBox(message, async function () {
            showStateDialogBox();
            try {

                let record1 = {
                    username: inputData?.username,
                    preferName: inputData?.preferName,
                    organizationName: inputData?.organizationName,
                    groupName: inputData?.primaryGroup
                };

                let result1 = await apiBox.addRecord4User(getSessionToken(), record1);
                if (!result1.flag) throw result1;

                // add mobile
                let record2 = {
                    username: inputData?.username,
                    type: "mobile",
                    address: "+" + inputData?.mobileCountryCode + inputData?.mobileNumber,
                }
                let result2 = await apiBox.addUserContact(getSessionToken(), record2);
                if (!result2.flag) throw result2;

                // add email
                let record3 = {
                    username: inputData?.username,
                    type: "email",
                    address: inputData?.email,
                }
                let result3 = await apiBox.addUserContact(getSessionToken(), record3);
                if (!result3.flag) throw result3;


                let record4 = {
                    username: inputData?.username,
                    type: "email",
                    address: inputData?.email,
                }
                let result4 = await apiBox.getUserContactList(getSessionToken(), inputData?.username);
                if (!result4.flag) throw result4;

                let contactRecord = result4.data.emails[0];

                let result5 = await apiBox.requestResetPasswordLink(inputData?.username, contactRecord?.identifier);
                if (!result5.flag) throw result5;

                // all api call ok
                formObject.dirty = false;

                let message = sl.m_user_added;
                showInfoDialogBox(message, () => navigate(-1));
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

    function click4UpdateRecord(e) {
        if (debugMode) console.log("Click for update record", e);
        let message = sl.m_confirm_update_user;
        message = message.replace("__parameter_1", inputData.username);
        showConfirmDialogBox(message, async function () {
            showStateDialogBox();
            try {

                let result1 = await apiBox.updateRecord4User(getSessionToken(), inputData);
                if (!result1.flag) throw result1;

                if (uploadFile !== null) {
                    console.log("Upload avatar");
                    let result2 = await apiBox.uploadAvatar(inputData?.username, uploadFile, undefined);
                    if (!result2.flag) throw result2;
                }

                // reset dirty flag
                formObject.dirty = false;

                let message = sl.m_user_updated;
                showInfoDialogBox(message, () => navigate(-1));

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

    async function trigger4FileSelect(e) {
        if (debugMode) console.log("Trigger for file select", e);
        inputFileRef.current.click();
        return;
    };

    async function change4File(e) {
        if (debugMode) console.log("Change for file ", e);
        let file = e.target.files[0];
        if (debugMode) console.log(file);

        if (file !== undefined) {
            let url = URL.createObjectURL(file);
            if (debugMode) console.log(url);
            formObject.dirty = true;
            setAvatar(url);
            setUploadFile(file);
        };

        return;
    };


    return (
        <div className="container " >

            <div className="border-bottom d-flex align-items-center justify-content-between sticky-top bg-white"
                style={{ minHeight: "60px" }}>

                <div style={{ color: "#494D4F", fontSize: "16px", cursor: "pointer" }}
                    onClick={() => navigate(-1)}>
                    <i className="fas fa-arrow-left fa-fw me-2 ms-1"></i> {sl.l_previous_page}
                </div>

                <div>
                    {
                        (editMode === 0 && check4Right(accessObjectName, `${accessActionPrefix}.add`)) ? (
                            <button className="ms-1 btn btn-ghost-unity "
                                type="button"
                                onClick={click4AddRecord}
                                title={sl.t_add}
                                disabled={!formObject?.valid || !formObject?.dirty} >
                                <span className="material-icons-outlined fs-24-unity">add</span>
                            </button>

                        ) : null
                    }

                    {
                        (editMode === 1 && check4Right(accessObjectName, `${accessActionPrefix}.edit`)) ? (
                            <button className="ms-1 btn btn-ghost-unity "
                                type="button"
                                onClick={click4UpdateRecord}
                                title={sl.t_update}
                                disabled={!formObject?.valid || !formObject?.dirty} >
                                <span className="material-icons-outlined fs-24-unity">upload_file</span>
                            </button>
                        ) : null
                    }

                </div>

            </div>

            <form ref={ref4Form} className="d-flex justify-content-center mt-4 mb-5">
                <div className="col-8" style={{ minHeight: "50vh" }}>

                    <div className="pb-3 border-bottom">
                        <div style={{ color: "#242627", "fontSize": "16px", fontWeight: "bold" }} >
                            {(editMode === 0) ? sl.l_add_user : sl.l_edit_user}
                        </div>

                        <div style={{ color: "#76797B", fontSize: "12px" }}>
                            {(editMode === 0) ? sl.l_add_user_desc : sl.l_edit_user_desc}
                        </div>
                    </div>

                    {
                        (editMode === 0) ? (
                            <div className="px-4 mt-4">
                                <div style={{ color: "#494D4F", fontSize: "16px", fontWeight: "bold" }} >
                                    {sl.l_subtitle}
                                </div>

                                <div className="my-3 px-3">

                                    <div>
                                        <InputLabel label={sl.l_username} required />
                                        <input name="username"
                                            type="text"
                                            className={`form-control ${tBox.getClass4IsInvalid2('username', formObject)}`}
                                            placeholder={sl.p_username}
                                            value={inputData?.username || ""}
                                            onChange={change4Input}
                                            disabled={editMode === 1}
                                            pattern="^[a-zA-Z0-9._]*$"
                                            required />

                                        <ErrorLine message={tBox.getFieldErrorMessage2('username', sl, formObject)} />
                                    </div>

                                    <div>
                                        <InputLabel label={sl.l_prefer_name} required />
                                        <input name="preferName"
                                            type="text"
                                            className={`form-control ${tBox.getClass4IsInvalid2('preferName', formObject)}`}
                                            placeholder={sl.p_prefer_name}
                                            value={inputData?.preferName || ""}
                                            onChange={change4Input}
                                            required />

                                        <ErrorLine message={tBox.getFieldErrorMessage2('preferName', sl, formObject)} />
                                    </div>

                                    <div>
                                        <InputLabel label={sl.l_email} required />
                                        <input name="email"
                                            type="email"
                                            className={`form-control ${tBox.getClass4IsInvalid2('email', formObject)}`}
                                            placeholder={sl.p_email}
                                            value={inputData?.email || ""}
                                            onChange={change4Input}
                                            required />

                                        <ErrorLine message={tBox.getFieldErrorMessage2('email', sl, formObject)} />
                                    </div>

                                    <div >
                                        <InputLabel label={sl.l_primary_group} required />
                                        <select name="primaryGroup"
                                            className={`form-select ${tBox.getClass4IsInvalid2('primaryGroup', formObject)}`}
                                            value={inputData?.primaryGroup || ""}
                                            onChange={change4Input}
                                            required>
                                            <option value="">{sl.o_primary_group}</option>
                                            {
                                                userGroupList.map((record, index) => {
                                                    return (
                                                        <option key={index} value={record.name}>{record.name}</option>
                                                    );
                                                })
                                            }
                                        </select>

                                        <ErrorLine message={tBox.getFieldErrorMessage2('primaryGroup', sl, formObject)} />
                                    </div>

                                    <div>
                                        <InputLabel label={sl.l_mobile_number} required />
                                        <div class="input-group mb-0">
                                            <div class="input-group-text justify-content-center" style={{ width: "90px" }}>
                                                {
                                                    (inputData.flagFilename) ? (
                                                        <img style={{ width: "25px" }} src={'./images/countryFlag/' + inputData.flagFilename} />
                                                    ) : null
                                                }
                                            </div>
                                            <select name="mobileCountryCode"
                                                className={`form-select ${tBox.getClass4IsInvalid2('mobileCountryCode', formObject)}`}
                                                style={{ width: "105px" }}
                                                value={inputData?.mobileCountryCode || ""}
                                                onChange={change4Input}
                                                required>
                                                <option value="">{sl.o_mobile_coutry_code}</option>
                                                {
                                                    mobileCountryCodeList.map((record, index) => {
                                                        return (
                                                            <option key={index} value={record.code}>+{record.code}</option>
                                                        );
                                                    })
                                                }
                                            </select>
                                            <input name="mobileNumber"
                                                type="mobileNumber"
                                                className={`form-control ${tBox.getClass4IsInvalid2('mobileNumber', formObject)}`}
                                                style={{ width: "calc(100% - 195px)" }}
                                                placeholder={sl.p_mobile_number}
                                                value={inputData?.mobileNumber || ""}
                                                onChange={change4Input}
                                                required />
                                        </div>

                                        <ErrorLine message={tBox.getFieldErrorMessage2('mobileNumber', sl, formObject)} />
                                    </div>

                                </div>

                            </div>
                        ) : (
                            <>
                                <div className="px-4 mt-4 border-bottom">
                                    <div style={{ color: "#494D4F", fontSize: "16px", fontWeight: "bold" }} >
                                        {sl.l_avatar}
                                    </div>

                                    <div className="my-3 px-3">

                                        <div className="position-relative">
                                            <img src={avatar ? avatar : 'images/avatar0002.png'}
                                                onError={(e) => e.target.src = 'images/avatar0002.png'}
                                                className="border border-3 rounded-circle"
                                                style={{ width: "128px", height: "128px", objectFit: "cover" }} />

                                            <input type="file" accept="image/*" name="file1"
                                                ref={inputFileRef}
                                                onChange={change4File}
                                                style={{ display: "none" }} />

                                            <div className="position-absolute" style={{ bottom: "2px", left: "96px" }}
                                                role="button"
                                                onClick={trigger4FileSelect} >
                                                <span className="material-icons fs-16-unity rounded-circle border p-2"
                                                    style={{ backgroundColor: "#f5f5f5" }} role="button">
                                                    add
                                                </span>
                                            </div>
                                        </div>

                                    </div>

                                </div>

                                <div className="px-4 mt-4">
                                    <div style={{ color: "#494D4F", fontSize: "16px", fontWeight: "bold" }} >
                                        {sl.l_user_account}
                                    </div>

                                    <div className="my-3 px-3">

                                        <div>
                                            <InputLabel label={sl.l_username} required />
                                            <input name="username"
                                                type="text"
                                                className={`form-control ${tBox.getClass4IsInvalid2('username', formObject)}`}
                                                placeholder={sl.p_username}
                                                value={inputData?.username || ""}
                                                onChange={change4Input}
                                                disabled={editMode === 1}
                                                required />

                                            <ErrorLine message={tBox.getFieldErrorMessage2('username', sl, formObject)} />
                                        </div>

                                        <div>
                                            <InputLabel label={sl.l_prefer_name} required />
                                            <input name="preferName"
                                                type="text"
                                                className={`form-control ${tBox.getClass4IsInvalid2('preferName', formObject)}`}
                                                placeholder={sl.p_prefer_name}
                                                value={inputData?.preferName || ""}
                                                onChange={change4Input}
                                                required />

                                            <ErrorLine message={tBox.getFieldErrorMessage2('preferName', sl, formObject)} />
                                        </div>

                                    </div>

                                </div>
                            </>
                        )
                    }


                </div >
            </form >

            <DumpPanel dataList={[
                { name: "inputData", data: inputData },
                { name: "formObject", data: formObject },
                { name: "sl", data: sl },
                // { name: "userGroupList", data: userGroupList },
                { name: "mobileCountryCodeList", data: mobileCountryCodeList },
            ]} debugMode={debugMode} />
        </div >
    );
}