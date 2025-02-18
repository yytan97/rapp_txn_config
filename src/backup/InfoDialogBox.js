import * as react from "react";
// import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import { globalContext } from "./globalContext.js";


// Map loaded lib here ...
// const uuidv4 = window.uuidv4;
// const moment = window.moment;
const bootstrap = window.bootstrap;

let title = undefined;
let callback4OK = undefined;
let modal = undefined;
let label4OK = undefined;

export function InfoDialogBox({ debugMode = false }) {
    const componentName = "InfoDialogBox";
    if (debugMode) console.log(`${componentName} component start ...`);

    const { config, localData, gsl, updateApplicationLanguage } = react.useContext(globalContext);
    let sl = tBox.getStringLabel(gsl, componentName);

    const ref4Div = react.useRef();
    const [message, setMessage] = react.useState("");

    react.useEffect(() => {
        if (debugMode) console.log(`Show ${componentName} component`);

        if (modal === undefined) {
            if (debugMode) console.log("Create modal instance");
            modal = new bootstrap.Modal(ref4Div.current, { backdrop: "static" });
            ref4Div.current.addEventListener('hidden.bs.modal', callback4Hide);

            window.addEventListener("showInfoDialogBox", callback4Show);
        }

        // clean up
        return () => {
            console.log(`Unmount ${componentName}`);
            if (modal !== undefined) {
                console.log(`Clean up for ${componentName}`);
                window.removeEventListener("showInfoDialogBox", callback4Show);
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

    function callback4Show(e) {
        console.log("Receive event 'showInfoDialogBox'", e.detail);
        let detail = e.detail;

        title = detail.title;
        callback4OK = detail.callback4OK;
        label4OK = detail.label4OK;

        setMessage(detail.message);
        setTimeout(showModal, 100);
        return;
    };

    function showModal() {
        if (debugMode) console.log("Show modal");
        modal.show();
        return;
    };

    function click4OK(e) {
        if (debugMode) console.log("Click for ok ", e);
        modal.hide();

        // move the callback call to event modal hidden so esc also trigger callback
        return;
    };

    return (
        <>
            <div className="modal" ref={ref4Div} tabIndex="-1" role="dialog" >
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content ">

                        <div className="modal-body justify-content-center text-center">

                            <div className="fs-1 text-primary">
                                <span className="fas fa-info-circle fa-fw fs-1"></span>
                            </div>

                            {
                                title ?
                                    <div className="fw-bold" >{title}</div>
                                    :
                                    null
                            }

                            <div className="py-3 text-break">{message}</div>
                        </div>
                        <div className="modal-footer justify-content-center text-center border-0">
                            <button type="button"
                                className="btn btn-unity "
                                onClick={click4OK}>
                                {label4OK || sl.b_OK}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export function showInfoDialogBox(message, callback4OK, label4OK) {
    console.log("Show info dialog box");

    let detail = {
        message: message,
        callback4OK: callback4OK,
        label4OK: label4OK,
    };

    let e = new CustomEvent("showInfoDialogBox", {
        detail: detail
    });
    window.dispatchEvent(e);
    return;
};