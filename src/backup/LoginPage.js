import * as react from "react";
import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import * as apiBox from "./apiBox.js";

import { globalContext } from "./globalContext.js";

import { ErrorLine } from "./ErrorLine.js";
import { DumpPanel } from "./DumpPanel.js";

// import { showConfirmDialogBox } from "./ConfirmDialogBox.js";
import { showStateDialogBox, closeStateDialogBox } from "./StateDialogBox.js";
import { showInfoDialogBox } from "./InfoDialogBox.js";

// Map loaded lib here ...
// const uuidv4 = window.uuidv4;
// const moment = window.moment;

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

    const [showPassword, setShowPassword] = react.useState(false);
    const [inputData, setInputData] = react.useState({});
    const ref4Form = react.useRef();

    const [fieldState, setFieldState] = react.useState({});
    const [formState, setFormState] = react.useState({ dirty: false, valid: false });
    const navigate = reactRouter.useNavigate();

    react.useEffect(() => {
        let obj = tBox.buildFormFieldState(ref4Form.current);
        setFieldState(obj);
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
            if (!result1.flag) throw(result1);

            // navigate to dashboard or home; give the update user some time ...
            setTimeout(() => {
                if (debugMode) console.log("Navigate to home");
                navigate("/home");
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

    return (
        <>
            {/*
            <div className="position-fixed" style={{ top: "16px", left: "16px" }}>
                <span className="p-2" style={{ cursor: "pointer" }} onClick={click4Back} tabIndex="-1">
                    <i className="fas fa-arrow-left fa-fw"></i>
                </span>
            </div>
            */}
            
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

                        <div className="col-12 my-5">
                            <button type="button" className="btn btn-outline-primary col-12 "
                                onClick={click4SignIn} disabled={!formState.valid || !formState.dirty}>
                                {sl.b_sign_in}
                            </button>
                        </div>

                    </div>
                </form>
            </div>

            <DumpPanel dataList={[
                { name: "inputData", data: inputData },
                { name: "formState", data: formState },
                { name: "fieldState", data: fieldState },
                { name: "user", data: user },
                // { name: "config", data: config },
                { name: "sl", data: sl },
            ]} debugMode={debugMode} />
        </>
    );
}