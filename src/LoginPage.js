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

export function LoginPage({ debugMode = true }) {
    const componentName = "LoginPage";
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

    async function click4ForgotPassword(e) {
        if (debugMode) console.log("Click for forgot password", e);
        navigate("/forgotPassword");
    };

    async function click4SignIn(e) {
        console.log("Click for sign in ", e);
        showStateDialogBox();
        let record = undefined;

        try {

            let result = await apiBox.login(inputData.username, inputData.password);
            if (result.flag) {
                console.log("Successfully login", result);
                // post login processing, get user detail, check group and load access rigth ...
                record = result.data;
                record.username = record.user.name;
            }
            else {
                console.warn("Login failed", result);
                throw result;
            }

            let result1 = await postLogin(record);
            if (!result1.flag) throw (result1);

            // navigate to dashboard or home; give the update user some time ...
            setTimeout(() => {
                if (debugMode) console.log("Navigate to home");
                navigate("/");
            }, 100 * 2);

            /*
            setTimeout(() => {
                if (debugMode) console.warn("Simulate session timeout");
                updateUser(undefined);
            }, 1000 * 60);  
            */

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
                                        <div className="col-12">
                                            <InputLabel label={sl.l_password} required />
                                            <div className="input-group mb-0">
                                                <input name="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    className={`form-control ${tBox.getClass4IsInvalid2('password', formObject)}`}
                                                    placeholder={sl.p_password}
                                                    maxLength={12}
                                                    value={inputData.password || ""}
                                                    onChange={change4Record}
                                                    required={true}
                                                />
                                                <button className="btn btn-outline-primary" type="button" onClick={toggle4ShowPassword}>
                                                    {
                                                        showPassword ?
                                                            <i className="fas fa-solid fa-eye fa-fw"></i>
                                                            :
                                                            <i className="fas fa-solid fa-eye-slash fa-fw"></i>
                                                    }
                                                </button>
                                            </div>
                                            <ErrorLine message={tBox.getFieldErrorMessage2('password', sl, formObject)} />
                                        </div>

                                        <div className="col-12 text-end" >
                                            <span className="text-primary" role="button" onClick={click4ForgotPassword}>
                                                {sl.l_forgot_password}
                                            </span>
                                        </div>

                                        <div className="col-12 my-5">
                                            <button
                                                type="button"
                                                className="btn btn-outline-primary col-12"
                                                onClick={click4SignIn} disabled={!formObject.valid || !formObject.dirty}>
                                                {sl.b_sign_in}
                                            </button>
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
                            <img src="images/login_image1.png" style={{ width: "100%", height: "calc(100vh - 64px)", minHeight: "calc(720px - 64px)", objectFit: "cover", borderRadius: "16px" }} />
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}