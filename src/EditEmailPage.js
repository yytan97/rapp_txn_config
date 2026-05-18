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

const accessObjectName = "webapp_team_user_access";
const accessActionPrefix = "user_management";

let dataRecord = undefined;
let countryList = [];

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

export function EditEmailPage({ debugMode = true }) {
    const componentName = "EditEmailPage";
    if (debugMode) console.log(`${componentName} component start ...`);

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

    const ref4Form = react.useRef();

    const navigate = reactRouter.useNavigate();
    const location = reactRouter.useLocation();

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);

        const sp = new URLSearchParams(location.search);
        username = sp.get('username');
        editMode = parseInt(sp.get('editMode'));

        console.log("Username", username);
        console.log("Edit mode", editMode);

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
            countryList = await getCountryList();

            if (editMode === 1) {
                let result4 = await apiBox.getUserProfileRecord(getSessionToken(), username);

                if (result4.flag) {
                    /* preprocess 
                    list1 = list1.map((item) => {
                        return item
                    });
                    */

                    dataRecord = result4.data.userProfile;;
                    console.log("Record", dataRecord);
                    inputData = dataRecord;
                }
                else {
                    dataRecord = {
                        profileNotFound: true,
                        recordStatus: 'A'
                    };
                    inputData = dataRecord;
                }


            } else {
                // provide default value for add mode
                dataRecord = {
                    recordStatus: 'A'
                };
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
        let message = sl.m_confirm_add_email;
        message = message.replace("__parameter_1", inputData.email);
        showConfirmDialogBox(message, async function () {
            showStateDialogBox();
            try {

                let data = {
                    username: username,
                    type: "email",
                    address: inputData.email
                };
                let result1 = await apiBox.addUserContact(getSessionToken(), data);
                if (result1 && result1.flag) {
                    formObject.dirty = false;

                    let message = sl.m_email_added;
                    showInfoDialogBox(message, () => navigate(-1));
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

    function click4UpdateRecord(e) {
        if (debugMode) console.log("Click for update record", e);
        /*
        let message = sl.m_confirm_update_user_profile;
        message = message.replace("__parameter_1", username);
        showConfirmDialogBox(message, async function () {
            showStateDialogBox();
            try {

                let result1 = undefined;
                if (inputData.profileNotFound)
                    result1 = await apiBox.addUserProfile(getSessionToken(), username, inputData);
                else
                    result1 = await apiBox.updateUserProfile(getSessionToken(), username, inputData);

                if (result1 && result1.flag) {
                    formObject.dirty = false;

                    let message = sl.m_user_profile_updated;
                    showInfoDialogBox(message, () => navigate(-1));
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
        */

        return;
    };

    function click4Echo(e, record, index) {
        if (debugMode) console.log("Click for echo ", e, record, index);
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
                            {(editMode === 0) ? sl.l_new_title : sl.l_edit_title}
                        </div>

                        <div style={{ color: "#76797B", fontSize: "12px" }}>
                            {sl.l_description}
                        </div>
                    </div>

                    <div className="px-4 mt-4 ">
                        <div style={{ color: "#494D4F", fontSize: "16px", fontWeight: "bold" }} >
                            {sl.l_subtitle}
                        </div>

                        <div className="my-3 px-3">

                            <div >
                                <InputLabel label={sl.l_email} required />
                                <input name="email"
                                    type="text"
                                    className={`form-control ${tBox.getClass4IsInvalid2('email', formObject)}`}
                                    placeholder={sl.p_email}
                                    value={inputData?.email || ""}
                                    onChange={change4Input}
                                    required />

                                <ErrorLine message={tBox.getFieldErrorMessage2('email', sl, formObject)} />

                            </div>

                        </div>

                    </div>

                </div >
            </form >

            <DumpPanel dataList={[
                { name: "inputData", data: inputData },
                { name: "formObject", data: formObject },
                { name: "sl", data: sl },
                { name: "countryList", data: countryList },
            ]} debugMode={debugMode} />
        </div >
    );
}