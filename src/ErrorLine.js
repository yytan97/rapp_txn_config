
import * as react from "react";
// import * as reactRouter from "react-router-dom";

// import * as tBox from "./tBox.js";
import { globalContext } from "./globalContext.js";


// Map loaded lib here ...
// const uuidv4 = window.uuidv4;
// const moment = window.moment;

export function ErrorLine({ message, debugMode = false}) {
    const componentName = "ErrorLine";
    if (debugMode) console.log(`${componentName} component start ...`, message);

    return (
        <>
            <div className="text-danger px-3 error-text-unity-v2" >
                <span>{message}</span>
            </div>
        </>
    );
}
