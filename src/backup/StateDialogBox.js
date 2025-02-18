import * as react from "react";
// import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import { globalContext } from "./globalContext.js";


// Map loaded lib here ...
const uuidv4 = window.uuidv4;
// const moment = window.moment;
const bootstrap = window.bootstrap;

let title = undefined;
let message = "";

let callback4OK = undefined;
let modal = undefined;
let label4OK = undefined;

export function StateDialogBox({ debugMode = false }) {
    const componentName = "StateDialogBox";
    if (debugMode) console.log(`${componentName} component start ...`);

    const { config, localData, gsl, updateApplicationLanguage } = react.useContext(globalContext);
    let sl = tBox.getStringLabel(gsl, componentName);

    const ref4Div = react.useRef();
    const [redraw, setRedraw] = react.useState(0);

    react.useEffect(() => {
        if (debugMode) console.log(`Show ${componentName} component`);

        if (modal === undefined) {
            if (debugMode) console.log("Create modal instance");
            modal = new bootstrap.Modal(ref4Div.current, { backdrop: "static", keyboard: false });
            
            ref4Div.current.addEventListener('hidden.bs.modal', callback4Hide);
            window.addEventListener("showStateDialogBox", callback4Show);
            window.addEventListener("closeStateDialogBox", callback4Close);
        }

        // clean up
        return () => {
            console.log(`Unmount ${componentName}`);
            if (modal !== undefined) {
                console.log(`Clean up for ${componentName}`);
                window.removeEventListener("showStateDialogBox", callback4Show);
                window.removeEventListener("closeStateDialogBox", callback4Close);
                ref4Div?.current?.removeEventListener('hidden.bs.modal', callback4Hide);

                modal.dispose();
                modal = undefined;
            }
        };

    }, []);

    function callback4Hide(e) {
        if (callback4OK != undefined)
            callback4OK(message);
    };

    function callback4Close(e) {
        console.log("Receive event 'closeStateDialogBox'", e.detail);
        let detail = e.detail;

        setTimeout(hideModal, 100);
        return;
    };

    function callback4Show(e) {
        console.log("Receive event 'showStateDialogBox'", e.detail);
        let detail = e.detail;

        title = detail?.title;
        message = detail?.message || "";
        callback4OK = detail?.callback4OK;

        // must using the function version here ...
        setRedraw((v) => v + 1);
        setTimeout(showModal, 100);
        return;
    }

    function showModal() {
        if (debugMode) console.log("Show modal");
        modal.show();
        return;
    };

    function hideModal() {
        if (debugMode) console.log("Hide modal");
        modal.hide();
        return;
    };

    return (
        <>
            <div className="modal" ref={ref4Div} tabIndex="-1" role="dialog" >
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content" style={{ backgroundColor: "transparent", border: "none" }}>
                        <div className="modal-body text-center text-dark ">

                            <div className="spinner-border" role="status"></div>
                            {message ? <div className="pt-3" >{message}</div> : null}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export function showStateDialogBox(message) {
    console.log("Show state dialog box");

    let detail = {
        message: message
    };

    let e = new CustomEvent("showStateDialogBox", {
        detail: detail
    });
    window.dispatchEvent(e);

    return;
};

export function closeStateDialogBox() {
    console.log("Close state dialog box");

    let detail = {};
    
    let e = new CustomEvent("closeStateDialogBox", {
        detail: detail
    });
    window.dispatchEvent(e);

    return;
};
