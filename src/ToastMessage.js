import * as react from "react";

export function ToastMessage({ show, message, onClose }) {
    if (!show) return null;

    return (
        <div
            className="position-fixed p-3"
            style={{
                bottom: "20px",
                right: "20px",
                zIndex: 2000,
                background: "#e8f5e9",
                border: "1px solid #b2dfdb",
                borderRadius: "8px",
                minWidth: "240px",
                boxShadow: "0 0 10px rgba(0,0,0,0.15)",
            }}
        >
            <div className="d-flex align-items-center">
                <span className="material-icons-outlined me-2" style={{ color: "#2e7d32" }}>
                    check_circle
                </span>

                <div className="flex-fill" style={{ color: "#494D4F", fontSize: "14px" }}>
                    {message}
                </div>

                <span
                    className="material-icons-outlined ms-3"
                    role="button"
                    onClick={onClose}
                >
                    close
                </span>
            </div>
        </div>
    );
}
