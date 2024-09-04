import * as react from "react";
// import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import { globalContext } from "./globalContext.js";


// Map loaded lib here ...
const uuidv4 = window.uuidv4;
// const moment = window.moment;
const bootstrap = window.bootstrap;

let modal = undefined;
let action = 0;

let message = "";
let title = "";
let callback4OK = undefined;
let callback4Cancel = undefined;

let label4OK = undefined;
let label4Cancel = undefined;

export function ConfirmDialogBox({ debugMode = true }) {
    const componentName = "ConfirmDialogBox";

    if (debugMode) console.log(`${componentName} component start ...`);
    const { config, localData, gsl, updateApplicationLanguage } = react.useContext(globalContext);
    let sl = tBox.getStringLabel(gsl, componentName);

    const [redraw, setRedraw] = react.useState(0);
    const ref4Div = react.useRef();

    react.useEffect(() => {
        if (debugMode) console.log(`Effect on ${componentName} component`);

        if (modal === undefined) {
            modal = new bootstrap.Modal(ref4Div.current, { backdrop: "static" });
            if (debugMode) console.log("Create modal instance");
            ref4Div.current.addEventListener('hidden.bs.modal', callback4Hide);
            window.addEventListener("showConfirmDialogBox", callback4Show);
        }

        // clean up
        return () => {
            console.log(`Unmount ${componentName}`);
            if (modal !== undefined) {
                console.log(`Clean up for ${componentName}`);
                window.removeEventListener("showConfirmDialogBox", callback4Show);
                ref4Div?.current?.removeEventListener('hidden.bs.modal', callback4Hide);

                modal.dispose();
                modal = undefined;
            }  
        };

    }, []);

    function callback4Hide(e) {
        if (debugMode) console.log("Hide BS modal");

        // 0 and 2 for cancel, only 1 for ok
        if (action !== 1) {
            if (callback4Cancel !== undefined)
                callback4Cancel(message);
        }
        else {
            if (callback4OK !== undefined)
                callback4OK(message);
        }
    }

    function callback4Show(e) {
        console.log("Receive event 'showConfirmDialogBox'", e.detail);
        let detail = e.detail;

        title = detail.title;
        message = detail.message;
        callback4OK = detail.callback4OK;
        callback4Cancel = detail.callback4Cancel;

        label4OK = detail.label4OK;
        label4Cancel = detail.label4Cancel;

        action = 0;

        // here must using function version ...
        setRedraw((v) => v + 1);

        setTimeout(showModal, 100);
        return;
    };

    function showModal() {
        if (debugMode) console.log("Show modal");
        modal.show();
        return;
    };

    function click4Cancel(e) {
        if (debugMode) console.log("Click for cancel", e);
        action = 2;
        modal.hide();
        return;
    };

    function click4OK(e) {
        if (debugMode) console.log("Click for ok ", e);
        action = 1;
        modal.hide();
        return;
    };

    return (
        <>
            <div className="modal" ref={ref4Div} tabIndex="-1" role="dialog" >
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content ">

                        <div className="modal-body text-center">

                            <div className="fs-1 text-primary">
                                <span className="fas fa-question-circle fa-fw fs-1"></span>
                            </div>

                            {
                                title ?
                                    <div className="fw-bold" >{title}</div>
                                    :
                                    null
                            }
                            <div className="mt-3 text-normal" >{message}</div>
                        </div>
                        <div className="modal-footer justify-content-center text-center border-top-0">
                            <button className="btn btn-unity " onClick={click4OK} >
                                {label4OK || sl.b_confirm}
                            </button>
                            <button className="btn btn-outline-unity " onClick={click4Cancel} >
                                {label4Cancel || sl.b_dismiss}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
}

export function showConfirmDialogBox(message, callback4OK, label4OK, callback4Cancel, label4Cancel) {
    console.log("Show confirm dialog box");
    
    let detail = {
        message: message,
        callback4OK: callback4OK,
        callback4Cancel: callback4Cancel,
        label4OK: label4OK,
        label4Cancel: label4Cancel
    };

    let e = new CustomEvent("showConfirmDialogBox", {
        detail: detail
    });
    window.dispatchEvent(e);
    return;
};
