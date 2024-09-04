import * as react from "react";
import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import { globalContext } from "./globalContext.js";

import { ErrorLine } from "./ErrorLine.js";
import { DumpPanel } from "./DumpPanel.js";

import { showInfoDialogBox } from "./InfoDialogBox.js";
import { showConfirmDialogBox } from "./ConfirmDialogBox.js";
import { showStateDialogBox, closeStateDialogBox } from "./StateDialogBox.js";

// Map loaded lib here ...
// const uuidv4 = window.uuidv4;
// const moment = window.moment;

export function TestDialogBoxPage({ debugMode = true }) {
    const componentName = "TestDialogBoxPage";
    if (debugMode) console.log(`${componentName} component start ...`);

    const { config, localData, 
        gsl, applicationLanguage,
        updateApplicationLanguage,
    } = react.useContext(globalContext);

    let sl = tBox.getStringLabel(gsl, componentName);
    const navigate = reactRouter.useNavigate();

    react.useEffect(() => {
        if (debugMode) console.log("Run on effect");
    }, []);

    // event handling function here ...
    function toggle4Language(e) {
        if (debugMode) console.log("Toggle for Language ", e);

        let lang = applicationLanguage;
        if (lang == "English") lang = "Chinese";
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

    function click4Echo(m) {
        if (debugMode) console.log("Click for echo ", m);
        return;
    };

    function click4ShowInfoDialogBox(e) {
        if (debugMode) console.log("Click for show info dialog box ", e);

        let n = tBox.rand();

        let callback4OK = () => {
            console.log(`Back to test page with ok ${n}`);
            return;
        };
       
        showInfoDialogBox(`${n}. ${sl.e_standard_message}`, callback4OK, sl.b_dismiss);

        return;
    };

    function click4ShowConfirmDialogBox(e) {
        if (debugMode) console.log("Click for show confirm dialog box ", e);

        let n = tBox.rand();
        let callback4OK = () => {
            console.log(`Back to test page with ok ${n}`);
            return;
        };

        let callback4Cancel = () => {
            console.log(`Back to test page with cancel ${n}`);
            return;
        };

        showConfirmDialogBox(`${n}. ${sl.m_confirm_update_record}`, callback4OK, undefined, callback4Cancel, sl.b_dismiss);
        return;
    };


    async function click4ShowStateDialogBox(e) {
        if (debugMode) console.log("Click for show state dialog box ", e);

        showStateDialogBox(`${tBox.rand()}. ${sl.l_search} ...`);

        await tBox.sleep(1000 * 2);
        closeStateDialogBox();
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

                <div className="col-6">
                    <div className="text-center fs-3">{sl.title}</div>
                    <div className="col-12 my-2">
                        <button type="button" className="btn btn-outline-primary col-12 "
                            onClick={click4ShowInfoDialogBox} >
                            {sl.b_info}
                        </button>
                    </div>
                    <div className="col-12 my-2">
                        <button type="button" className="btn btn-outline-primary col-12 "
                            onClick={click4ShowConfirmDialogBox} >
                            {sl.b_confirm}
                        </button>
                    </div>
                    <div className="col-12 my-2">
                        <button type="button" className="btn btn-outline-primary col-12 "
                            onClick={click4ShowStateDialogBox} >
                            {sl.b_state}
                        </button>
                    </div>
                </div>

            </div>

            {/*
            <InfoDialogBox message="Hello from information dialog box"
                show={showInfo}
                callback4OK={(m) => { setShowInfo(false) }}
                debugMode={debugMode} />

            <ConfirmDialogBox message="Confirm delete record from table ?"
                show={showConfirm}
                callback4OK={(m) => { setShowConfirm(false) }}
                callback4Cancel={(m) => { setShowConfirm(false) }}
                debugMode={debugMode} />

            <StateDialogBox message="Loading ..."
                show={showState}
                debugMode={debugMode} />
            */}

            <DumpPanel dataList={[
                // { name: "record", data: record },
                // { name: "formState", data: formState },
                // { name: "fieldState", data: fieldState },
                // { name: "localData", data: localData },
                // { name: "config", data: config },
                { name: "sl", data: sl },
            ]} debugMode={debugMode} />
        </>
    );
}