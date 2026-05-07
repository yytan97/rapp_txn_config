import React from "react";

export function RenderEmptyState ({
    image = "images/Visual.svg",
    title,
    description,
    buttonText,
    onButtonClick,
    showButton = true,
    minHeight = "420px",
}) {
    return (
        <div
            className="d-flex flex-column align-items-center justify-content-center text-center"
            style={{ minHeight }}
        >
            <div className="mb-16">
                <div
                    className="d-flex align-items-center justify-content-center rounded-circle"
                    style={{
                        width: "72px",
                        height: "72px",
                        background: "#F3F4F6",
                        margin: "0 auto",
                    }}
                >
                    <img src={image} alt={title || "empty"} />
                </div>
            </div>

            <div className="fw-bold mb-8" style={{ fontSize: "20px", color: "#202224" }}>
                {title}
            </div>

            {description && (
                <div className="mb-24" style={{ fontSize: "14px", color: "#6D7172" }}>
                    {description}
                </div>
            )}

            {showButton && buttonText && (
                <button
                    type="button"
                    className="btn btn-primary px-4"
                    onClick={onButtonClick}
                    style={{ minWidth: "180px" }}
                >
                    {buttonText}
                </button>
            )}
        </div>
    );
}