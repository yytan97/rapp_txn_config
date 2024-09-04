import * as react from "react";
// import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import { globalContext } from "./globalContext.js";

// Map loaded lib here ...
// const uuidv4 = window.uuidv4;
// const moment = window.moment;
const bootstrap = window.bootstrap;

export function InputTextBox({ children, debugMode = true, sl, fieldState, formState, model,
    name, type = "text", placeholder, className = "form-control", required = false,
    ...props }) {
    const componentName = "InputTextBox";
    if (debugMode) console.log(`${componentName} component start ...`, props);

    if (placeholder === undefined && sl !== undefined && name !== undefined)
    {   
        let snakeName = tBox.camel2Snake(name);
        placeholder = sl["p_" + snakeName];
        console.log(`${componentName} build placeholder from string label`, placeholder);
    }

    // add dynamic class name here
    if (fieldState !== undefined && formState !== undefined && name !== undefined)
    {
        let s = tBox.getClass4IsInvalid(fieldState[name]?.valid, formState.dirty, required);
        className += " " + s;
        console.log(`${componentName} build placeholder from string label`, className);
    }

    if (model !== undefined)
    {
        console.log("Model", model);
    }

    react.useEffect(() => {
        if (debugMode) console.log(`Show ${componentName} component`);
    }, []);

    return (
        <>  
            <input name={name} className={className} type={type} placeholder={placeholder} required={required} {...props} >
            </input>
        </>
    );
}
