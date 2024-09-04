// import * as react from "react";
import * as reactRouter from "react-router-dom";

// import * as tBox from "./tBox.js";

// Map loaded lib here ...
// const uuidv4 = window.uuidv4;
// const moment = window.moment;

// Root error boundary
export function RootErrorBoundary() {
    const error = reactRouter.useRouteError();
    const navigate = reactRouter.useNavigate();

    console.log("Root error boundary component start ...");

    return (
        <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: "100vh" }}>
            <div className="col-10 col-md-6">
                <div className="text-center">
                    <i className="fas fa-exclamation-circle fa-fw text-danger fs-1"></i>
                    <div className="fs-5 mt-3">Routing Error</div>
                </div>
                <pre className="mt-3 mb-5 p-3 border bg-light rounded">{error.message || JSON.stringify(error, null, 4)}</pre>
                <div className="mt-3 d-flex justify-content-center align-items-center">
                    <button className="btn btn-primary"
                        onClick={() => {
                            window.location.href = "."
                            // navigate("/");
                        }}>
                        Reload
                    </button>
                </div>

            </div>
        </div>
    );
}
