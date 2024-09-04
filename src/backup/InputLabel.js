
import * as react from "react";


// Map loaded lib here ...
// const uuidv4 = window.uuidv4;
// const moment = window.moment;

export function InputLabel({ label, required, debugMode = false }) {
    const componentName = "InputLabel";
    if (debugMode) console.log(`${componentName} component start ...`);

    return (

        <div class="px-3 mb-1" style={{ color: "#76797B", fontSize: "12px" }}>
            {label} {required ? <span class="text-danger">*</span> : null}
        </div>

    );
}
