import * as react from "react";
// import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import { globalContext } from "./globalContext.js";


// Map loaded lib here ...
// const uuidv4 = window.uuidv4;
// const moment = window.moment;
const bootstrap = window.bootstrap;

let schema = undefined;
let callback4OK = undefined;
let modal = undefined;
let label4OK = undefined;

export function TableSchemaDialogBox({ debugMode = false }) {
    const componentName = "TableSchemaDialogBox";
    if (debugMode) console.log(`${componentName} component start ...`);

    const { config, localData, gsl, user, dataset, updateApplicationLanguage } = react.useContext(globalContext);
    let sl = tBox.getStringLabel(gsl, componentName);

    const ref4Div = react.useRef();
    const [redraw, setRedraw] = react.useState(0);

    react.useEffect(() => {
        if (debugMode) console.log(`Show ${componentName} component`);

        if (modal === undefined) {
            if (debugMode) console.log("Create modal instance");
            modal = new bootstrap.Modal(ref4Div.current, { backdrop: "static" });

            ref4Div.current.addEventListener('hidden.bs.modal', callback4Hide);
            window.addEventListener("showTableSchemaDialogBox", callback4Show);
        }

        // clean up
        return () => {
            console.log(`Unmount ${componentName}`);
            if (modal !== undefined) {
                console.log(`Clean up for ${componentName}`);
                window.removeEventListener("showTableSchemaDialogBox", callback4Show);
                ref4Div?.current?.removeEventListener('hidden.bs.modal', callback4Hide);

                modal.dispose();
                modal = undefined;
            }
        };

    }, []);

    function callback4Hide(e) {
        if (callback4OK != undefined)
            callback4OK();
    };

    function callback4Show(e) {
        console.log("Receive event 'showTableSchemaDialogBox'", e.detail);
        let detail = e.detail;

        schema = detail.schema;
        
        callback4OK = detail.callback4OK;
        label4OK = detail.label4OK;

        setRedraw((v) => v + 1);
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

        return;
    };

    return (
        <>
            <div className="modal" ref={ref4Div} tabIndex="-1" role="dialog" >
                <div className="modal-dialog modal-dialog-scrollable modal-dialog-centered" role="document">

                    <div className="modal-content ">

                        <div className="modal-body justify-content-center text-center">

                            <div className="text-primary">
                                <span className="material-icons fs-1">info</span>
                            </div>

                            <div className="mt-3 table-responsive text-start">
                                <table className="table table-striped">
                                    <thead>
                                        <tr >
                                            <th >{sl.h_no}</th>
                                            <th >{sl.h_name}</th>
                                            <th >{sl.h_type}</th>
                                            <th className="text-end">{sl.h_size}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            schema?.map((record, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td>{index + 1}</td>
                                                        <td>{record.name}</td>
                                                        <td>{record.type}</td>
                                                        <td className="text-end">{record.size}</td>
                                                    </tr>
                                                );
                                            })
                                        }
                                    </tbody>

                                </table>
                            </div>

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

export function showTableSchemaDialogBox(schema) {
    console.log("Show user profile dialog box");
    let detail = {
        schema: schema
    };

    let e = new CustomEvent("showTableSchemaDialogBox", {
        detail: detail
    });
    window.dispatchEvent(e);
    return;
};