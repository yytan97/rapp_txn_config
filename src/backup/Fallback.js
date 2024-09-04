// import * as react from "react";
// import * as reactRouter from "react-router-dom";

// import * as tBox from "./tBox.js";


// Map loaded lib here ...
// const uuidv4 = window.uuidv4;
// const moment = window.moment;

// Fallback
export function Fallback() {
    return (
        <>
            <div className="container-fluid">
                <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
                    <div className="spinner-border" role="status" style={{ width: "3rem", height: "3rem" }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        </>
    );
}
