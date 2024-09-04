import * as react from "react";
// import * as reactRouter from "react-router-dom";

// import * as tBox from "./tBox.js";
import { globalContext } from "./globalContext.js";


// Map loaded lib here ...
// const uuidv4 = window.uuidv4;
// const moment = window.moment;

export function ClosablePanel({ name, title, closeFlag = false, callback4Toggle, children, debugMode = false }) {
    const componentName = "ClosablePanel";
    if (debugMode) console.log(`${componentName} component start ...`);

    if (callback4Toggle == undefined) callback4Toggle = () => console.log("Default callback for toggle");

    return (
        <>
            <div className="mt-4 border" style={{ borderRadius: "16px" }}>
                <div className="d-flex align-items-center justify-content-between px-4 py-3" role="button"
                    onClick={(e) => callback4Toggle(name, closeFlag)}>
                    <div style={{ color: "#494D4F", fontSize: "16px", fontWeight: "bold" }}>
                        {title}
                    </div>
                    <div className="text-end">
                        {
                            closeFlag ?
                                <i className="fas fa-chevron-left fa-fw"></i>
                                :
                                <i className="fas fa-chevron-down fa-fw"></i>

                        }
                    </div>

                </div>

                {closeFlag ? null : children}

            </div>

        </>
    );
}