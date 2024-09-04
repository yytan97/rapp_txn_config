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

let passwordState = {};

export function cleanUp() {
    inputData = {};

    formObject = {
        dirty: false,
        valid: false,
        fieldState: {},
    };

    passwordState = {};
    return;
};

export function ResetPasswordPage({ debugMode = true }) {
    const componentName = "ResetPasswordPage";
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
    const ref4NewPassword = react.useRef();
    const ref4ConfirmNewPassword = react.useRef();

    const navigate = reactRouter.useNavigate();
    const location = reactRouter.useLocation();

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);

        let timer = setTimeout(async () => {

            const sp = new URLSearchParams(location.search);
            inputData.token = sp.get('t');
            verifyToken();
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
    }, [redraw]);

    // event handling function here ...
    async function verifyToken() {
        console.log("verify token", inputData.token);
        let result = await apiBox.verifyResetPasswordToken(inputData?.token || "xxx");
        if (!result?.flag) {
            let message = sl.m_invalid_token;
            showInfoDialogBox(message);
        }
        return;
    };

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


    async function click4Submit(e) {
        console.log("Click for submit", e);
        showStateDialogBox();
        let record = undefined;

        try {
            let result = await apiBox.resetPassword(inputData.newPassword, inputData?.token || "xxx");
            if (result?.flag) {
                let message = sl.m_success_reset_password;
                showInfoDialogBox(message, () => {
                    navigate("/login");
                });
            }
            else {
                let message = sl.m_reset_password_failed;
                showInfoDialogBox(message);
            }

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

    function check4NewPassword() {
        if (inputData.newPassword == undefined || inputData.newPassword == "")
            return;

        let flag1 = (inputData.newPassword.length >= 7) ? true : false;
        let flag2 = (/[A-Z]/.test(inputData.newPassword)) ? true : false;
        let flag3 = (/[a-z]/.test(inputData.newPassword)) ? true : false;
        let flag4 = (/[0-9]/.test(inputData.newPassword)) ? true : false;
        let flag5 = (/[^0-9a-zA-Z]/.test(inputData.newPassword)) ? true : false;

        passwordState = { flag1, flag2, flag3, flag4, flag5 };
        console.log("Password state", passwordState);

        if (flag1 && flag2 && flag3 && flag4 && flag5)
            ref4NewPassword?.current?.setCustomValidity("");
        else
            ref4NewPassword?.current?.setCustomValidity("error2");

    };

    function change4Record(e) {
        if (debugMode) console.log("Form", ref4Form.current.checkValidity());

        formObject.dirty = true;
        formObject.valid = ref4Form.current.checkValidity();
        let obj = tBox.buildFormFieldState(ref4Form.current);
        formObject.fieldState = obj;

        inputData[e.target.name] = e.target.value;

        let name = e.target.name;
        if (name === 'newPassword' || name === 'confirmNewPassword') {
            check4NewPassword();

            if (inputData.newPassword === inputData.confirmNewPassword)
                ref4ConfirmNewPassword?.current?.setCustomValidity("");
            else
                ref4ConfirmNewPassword?.current?.setCustomValidity("error2");

            setTimeout(() => setRedraw((v) => v + 1), 200);
        }
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
                                            <InputLabel label={sl.l_new_password} required />
                                            <div className="input-group mb-0">
                                                <input name="newPassword"
                                                    type={showPassword ? 'text' : 'password'}
                                                    className={`form-control ${tBox.getClass4IsInvalid2('newPassword', formObject)}`}
                                                    placeholder={sl.p_new_password}
                                                    maxLength={12}
                                                    value={inputData.newPassword || ""}
                                                    onChange={change4Record}
                                                    required={true}
                                                    ref={ref4NewPassword} />
                                                <button className="btn btn-outline-primary" type="button" onClick={toggle4ShowPassword}>
                                                    {
                                                        showPassword ?
                                                            <i className="fas fa-solid fa-eye fa-fw"></i>
                                                            :
                                                            <i className="fas fa-solid fa-eye-slash fa-fw"></i>
                                                    }
                                                </button>
                                            </div>
                                            <ErrorLine message={tBox.getFieldErrorMessage2('newPassword', sl, formObject)} />
                                        </div>

                                        <div className="col-12">
                                            <InputLabel label={sl.l_confirm_new_password} required />
                                            <div className="input-group mb-0">
                                                <input name="confirmNewPassword"
                                                    type={showPassword ? 'text' : 'password'}
                                                    className={`form-control ${tBox.getClass4IsInvalid2('confirmNewPassword', formObject)}`}
                                                    placeholder={sl.p_confirm_new_password}
                                                    maxLength={12}
                                                    value={inputData.confirmNewPassword || ""}
                                                    onChange={change4Record}
                                                    required={true}
                                                    ref={ref4ConfirmNewPassword} />
                                                <button className="btn btn-outline-primary" type="button" onClick={toggle4ShowPassword}>
                                                    {
                                                        showPassword ?
                                                            <i className="fas fa-solid fa-eye fa-fw"></i>
                                                            :
                                                            <i className="fas fa-solid fa-eye-slash fa-fw"></i>
                                                    }
                                                </button>
                                            </div>
                                            <ErrorLine message={tBox.getFieldErrorMessage2('confirmNewPassword', sl, formObject)} />
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