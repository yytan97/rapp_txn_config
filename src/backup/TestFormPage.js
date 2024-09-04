import * as react from "react";
import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import { globalContext } from "./globalContext.js";

import { ErrorLine } from "./ErrorLine.js";
import { DumpPanel } from "./DumpPanel.js";
import { InputTextBox } from "./InputTextBox.js";

import { showConfirmDialogBox } from "./ConfirmDialogBox.js";
// import { showStateDialogBox, closeStateDialogBox } from "./StateDialogBox.js";
// import { showInfoDialogBox } from "./InfoDialogBox.js";


// Map loaded lib here ...
// const uuidv4 = window.uuidv4;
// const moment = window.moment;

export function TestFormPage({ debugMode = true }) {
    const componentName = "TestFormPage";
    if (debugMode) console.log(`${componentName} component start ...`);

    const {
        config, localData, gsl,
        applicationLanguage,
        updateApplicationLanguage,
    } = react.useContext(globalContext);

    let sl = tBox.getStringLabel(gsl, componentName);

    const [showPassword, setShowPassword] = react.useState(false);

    const [inputData, setInputData] = react.useState({});
    const [fieldState, setFieldState] = react.useState({});
    const [formState, setFormState] = react.useState({ dirty: false, valid: false });
    const ref4Form = react.useRef();

    const navigate = reactRouter.useNavigate();

    let shouldBlock = react.useCallback(({ currentLocation, nextLocation }) => {
        console.log("Callback for blocker ...")
        return formState.dirty && currentLocation.pathname !== nextLocation.pathname
    }, [formState]);

    let blocker = reactRouter.useBlocker(shouldBlock);
    console.log("Blocker", blocker);
    if (blocker.state === "blocked") {
        if (debugMode) console.log("Show confirm dialog box ");
        showConfirmDialogBox(sl.m_changes_not_saved,
            blocker4Proceed, sl.b_discard,
            blocker4Reset, undefined);
    }

    react.useEffect(() => {
        let obj = tBox.buildFormFieldState(ref4Form.current);
        setFieldState(obj);
    }, []);

    // event handling function here ...
    function toggle4Language(e) {
        if (debugMode) console.log("Toggle for Language ", e);

        let lang = applicationLanguage;
        if (lang === "English") lang = "Chinese";
        else lang = "English";

        console.log("Toggle for Language ", lang);
        updateApplicationLanguage(lang);

        return;
    };

    function click4Back(e) {
        if (debugMode) console.log("Click for back ", e);
        navigate(-1);
        return;
    };

    function click4SignIn(e) {
        if (debugMode) console.log("Click for sign in ", e);
        return;
    };

    function toggle4ShowPassword(e) {
        if (debugMode) console.log("Toggle for show password ", e);
        setShowPassword(!showPassword);
        return;
    };

    function change4Record(e) {
        if (debugMode) console.log("Form", ref4Form.current.checkValidity());
        let obj1 = {
            dirty: true,
            valid: ref4Form.current.checkValidity(),
        };
        setFormState(obj1);

        let obj2 = tBox.buildFieldState(e.target);
        setFieldState({
            ...fieldState,
            [e.target.name]: obj2
        });

        setInputData({
            ...inputData,
            [e.target.name]: e.target.value
        });
    };

    function blocker4Proceed() {
        if (debugMode) console.log("Blocker for proceed", blocker);
        blocker?.proceed();
        return;
    };

    function blocker4Reset() {
        if (debugMode) console.log("Blocker for reset", blocker);
        blocker?.reset();
        return;
    };

    return (
        <>
            <div className="position-fixed" style={{ top: "16px", left: "16px" }}>
                <span className="p-2" style={{ cursor: "pointer" }} onClick={click4Back} tabIndex="-1">
                    <i className="fas fa-arrow-left fa-fw"></i>
                </span>
            </div>
            <div className="position-fixed" style={{ top: "16px", right: "16px" }}>
                <span className="p-2" style={{ cursor: "pointer" }} onClick={toggle4Language} tabIndex="-1">
                    <i className="fas fa-language fa-fw"></i>
                </span>
            </div>
            <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh", }}>
                <form name="form4Login" noValidate
                    className="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4"
                    ref={ref4Form}>
                    <div className="row ">
                        <div className="col-12 fs-3 fw-bold my-3">
                            {sl.title}
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-12">
                            <label className="form-label mb-0">{sl.l_full_name}</label>
                            <InputTextBox
                                name="fullName"
                                maxLength={32}
                                value={inputData.fullName || ""}
                                onChange={change4Record}
                                sl={sl}
                                fieldState={fieldState}
                                formState={formState}
                            />
                            <ErrorLine message={tBox.getFieldErrorMessage('fullName', sl, fieldState, formState)} />

                        </div>

                        <div className="col-12">
                            <label className="form-label mb-0">{sl.l_username}</label>
                            <input name="username" type="text"
                                className={`form-control ${tBox.getClass4IsInvalid(fieldState['username']?.valid, formState.dirty, true)}`}
                                placeholder={sl.p_username}
                                maxLength={16}
                                value={inputData.username || ""}
                                onChange={change4Record}
                                required={true}
                            />
                            <ErrorLine message={tBox.getFieldErrorMessage('username', sl, fieldState, formState)} />

                        </div>

                        <div className="col-12">
                            <label className="form-label mb-0">{sl.l_password}</label>
                            <div className="input-group mb-0">
                                <input name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className={`form-control ${tBox.getClass4IsInvalid(fieldState['password']?.valid, formState.dirty, true)}`}
                                    placeholder={sl.p_password}
                                    maxLength={12}
                                    value={inputData.password || ""}
                                    onChange={change4Record}
                                    required={true} />
                                <button className="btn btn-outline-primary" type="button" onClick={toggle4ShowPassword}>
                                    {
                                        showPassword ?
                                            <i className="fas fa-solid fa-eye fa-fw"></i>
                                            :
                                            <i className="fas fa-solid fa-eye-slash fa-fw"></i>
                                    }
                                </button>
                            </div>
                            <ErrorLine message={tBox.getFieldErrorMessage('password', sl, fieldState, formState)} />

                        </div>

                        <div className="col-12">
                            <label className="form-label mb-0">{sl.l_confirm_password}</label>
                            <div className="input-group mb-0">
                                <input name="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    className={`form-control ${tBox.getClass4IsInvalid(fieldState['confirmPassword']?.valid, formState.dirty, true)}`}
                                    placeholder={sl.p_confirm_password}
                                    maxLength={12}
                                    value={inputData.confirmPassword || ""}
                                    onChange={change4Record}
                                    required={true} />
                                <button className="btn btn-outline-primary" type="button" onClick={toggle4ShowPassword}>
                                    {
                                        showPassword ?
                                            <i className="fas fa-solid fa-eye fa-fw"></i>
                                            :
                                            <i className="fas fa-solid fa-eye-slash fa-fw"></i>
                                    }
                                </button>
                            </div>
                            <ErrorLine message={tBox.getFieldErrorMessage('password', sl, fieldState, formState)} />

                        </div>

                        <div className="col-12 my-5">
                            <button type="button" className="btn btn-outline-primary col-12 "
                                onClick={click4SignIn} disabled={!formState.valid || !formState.dirty}>
                                {sl.b_submit}
                            </button>
                        </div>

                    </div>
                </form>
            </div>

            <DumpPanel
                dataList={[
                    { name: "inputData", data: inputData },
                    { name: "formState", data: formState },
                    { name: "fieldState", data: fieldState },
                    { name: "applicationLanguage", data: applicationLanguage },
                    // { name: "config", data: config },
                    { name: "sl", data: sl },
                ]}
                debugMode={debugMode} />
        </>
    );
}