import * as react from "react";
// import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import { globalContext } from "./globalContext.js";


// Map loaded lib here ...
// const uuidv4 = window.uuidv4;
// const moment = window.moment;
// const bootstrap = window.bootstrap;

export function FooterPanel({ debugMode = false }) {
    const componentName = "FooterPanel";
    if (debugMode) console.log(`${componentName} component start ...`);

    const { gsl, appData, dataset } = react.useContext(globalContext);

    // check from context
    let sl = tBox.getStringLabel(gsl, componentName);

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);
    }, []);

    return (
        <>
            <div className="d-flex align-items-center bg-white border" style={{ width: "100%", height: "50px", fontSize: "10px" }} >
                <span style={{ ...(dataset.sideBarWidth) }}></span>
                <span className="ms-3">{ sl.l_copyright }</span>
            </div>
        </>
    )
};