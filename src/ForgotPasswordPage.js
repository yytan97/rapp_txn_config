import * as react from "react";
import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import * as apiBox from "./apiBox.js";

import { globalContext } from "./globalContext.js";

import { ErrorLine } from "./ErrorLine.js";
import { InputLabel } from "./InputLabel.js";

import { DumpPanel } from "./DumpPanel.js";

// import { showConfirmDialogBox } from "./ConfirmDialogBox.js";
import { showStateDialogBox, closeStateDialogBox } from "./StateDialogBox.js";
import { showInfoDialogBox } from "./InfoDialogBox.js";
import { showLanguageDialogBox } from "./LanguageDialogBox.js";
import { showInputUserContactDialogBox, InputUserContactDialogBox } from "./InputUserContactDialogBox.js";


// Map loaded lib here ...
// const uuidv4 = window.uuidv4;
// const moment = window.moment;

let inputData = {};
let formObject = {
    dirty: false,
    valid: false,
    fieldState: {},
};

export function cleanUp() {
    inputData = {};
    formObject = {
        dirty: false,
        valid: false,
        fieldState: {},
    };
    return;
};

export function ForgotPasswordPage({ debugMode = true }) {
    const componentName = "ForgotPasswordPage";
    console.log(`${componentName} component start ...`);

    // let data = reactRouter.useLoaderData();
    const {
        config, localData, gsl, user, isLogin, applicationDebugMode, applicationLanguage,
        updateApplicationLanguage, updateUser,
        getSessionToken, getUsername, postLogin,
    } = react.useContext(globalContext);

    // check from context
    if (applicationDebugMode !== undefined) debugMode = applicationDebugMode;
    let sl = tBox.getStringLabel(gsl, componentName);

    let [redraw, setRedraw] = react.useState(0);
    let [showPassword, setShowPassword] = react.useState(false);
    const ref4Form = react.useRef();

    const navigate = reactRouter.useNavigate();

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);

        let obj = tBox.buildFormFieldState(ref4Form.current);
        formObject.fieldState = obj;
        formObject.valid = ref4Form.current.checkValidity();

        return () => {
            if (debugMode) console.log(`Unmount ${componentName}`);
            // edit page can add cleanup here
            cleanUp();
        };
    }, []);

    // event handling function here ...
    function toggle4Language(e) {
        console.log("Toggle for Language ", e);

        let lang = applicationLanguage;
        if (lang == "English") lang = "Chinese";
        else lang = "English";

        console.log("Toggle for Language ", lang);
        updateApplicationLanguage(lang);

        return;
    };

    function click4Back(e) {
        console.log("Click for back ", e);
        navigate(-1);
        return;
    };

    function click4Language(e) {
        if (debugMode) console.log("Click for language", e);
        showLanguageDialogBox(applicationLanguage, (data) => {
            if (debugMode) console.log("Callback for ok", data);
            updateApplicationLanguage(data.applicationLanguage);
        });
        return;
    };

    async function callback4OK(data) {
        console.log("Callback for ok", data);
        showStateDialogBox();

        try {

            let result = await apiBox.requestResetPasswordLink(inputData.username, data.contactId);
            if (result?.flag) {
                let message = sl.m_success_request_passowrd_link;
                showInfoDialogBox(message, () => {
                    navigate("/login");
                });
            }
            else throw result;
        }
        catch (e) {
            console.warn("Error", e);
            let message = tBox.getErrorMessage(e, sl);
            showInfoDialogBox(message);

        }
        finally {
            closeStateDialogBox();
        }

        return;
    };

    async function click4Submit(e) {
        console.log("Click for submit", e);
        showStateDialogBox();
        let record = undefined;

        try {
            let result = await apiBox.getUserContact(inputData.username);
            if (result?.flag && result?.data?.emails) {
                let list = result.data.emails;
                console.log("Email list", list);
                showInputUserContactDialogBox(sl.l_select_target_contact, list, callback4OK);
            }
            else throw result;
        }
        catch (e) {
            console.warn("Error", e);
            let message = tBox.getErrorMessage(e, sl);
            showInfoDialogBox(message);

        }
        finally {
            closeStateDialogBox();
        }

        return;
    };

    function toggle4ShowPassword(e) {
        console.log("Toggle for show password ", e);
        setShowPassword(!showPassword);
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
    };

    return (
        <>
            <div className="" style={{ minHeight: "720px", height: "100vh", padding: "32px" }}>
                <div className="row">
                    <div className="col-6" >
                        <div className="d-flex flex-column justify-content-between" style={{ height: "100%" }}>
                            <div>
                                <img src="images/Synap_logo.svg" style={{ width: "76px", height: "33px" }} />
                            </div>
                            <div className="d-flex justify-content-center align-items-center" >
                                <form noValidate className="col-8" ref={ref4Form}>
                                    <div className="row mb-5">
                                        <div className="col-12 fs-3 fw-bold">
                                            {sl.l_title}
                                        </div>
                                        <div>
                                            {sl.l_desc}
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-12">
                                            <InputLabel label={sl.l_username} required />
                                            <input name="username"
                                                type="text"
                                                className={`form-control ${tBox.getClass4IsInvalid2('username', formObject)}`}
                                                placeholder={sl.p_username}
                                                maxLength={64}
                                                value={inputData.username || ""}
                                                onChange={change4Record}
                                                required={true}
                                            />
                                            <ErrorLine message={tBox.getFieldErrorMessage2('username', sl, formObject)} />
                                        </div>

                                        <div className="col-12 my-5">
                                            <button
                                                type="button"
                                                className="btn btn-outline-primary col-12"
                                                onClick={click4Submit} disabled={!formObject.valid || !formObject.dirty}>
                                                {sl.b_submit}
                                            </button>

                                            <div className="mt-3 text-center" >
                                                <a className="text-decoration-none" href="#/login">
                                                    <i className='fas fa-chevron-left'></i> {sl.l_back}
                                                </a>
                                            </div>

                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div style={{ fontSize: "12px" }}>
                                <div className="d-flex justify-content-between align-items-center" >
                                    <div>
                                        <span>{sl.l_copyright}</span>
                                    </div>
                                    <div className="me-4 text-primary" role="button" onClick={click4Language} tabIndex="-1">
                                        <i className="fas fa-language fa-fw" style={{ fontSize: "16px" }}></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="sticky-top" style={{ top: "32px" }}>
                            <img src="images/login-img.svg" style={{ width: "100%", height: "calc(100vh - 64px)", minHeight: "calc(720px - 64px)", objectFit: "cover", borderRadius: "16px" }} />
                        </div>
                    </div>
                </div>

            </div>

            <InputUserContactDialogBox debugMode={debugMode}></InputUserContactDialogBox>
        </>
    );
}