import * as react from "react";
// import * as reactRouter from "react-router-dom";

// import * as tBox from "./tBox.js";
import { globalContext } from "./globalContext.js";


// Map loaded lib here ...
// const uuidv4 = window.uuidv4;
// const moment = window.moment;

export function DumpPanel({ dataList = [], debugMode = false }) {
    const componentName = "DumpPanel";
    if (debugMode) console.log(`${componentName} component start ...`, dataList);
    if (!debugMode) return null;
  
    let s = "";
    for (let item of dataList)
    {
        s += `${item.name} : ${JSON.stringify(item.data, null, 4)}\n\n`;    
    }

    return (
        <>
            <pre className="p-3 border bg-light xxx-rounded">
                {s}
            </pre>
        </>
    );
}