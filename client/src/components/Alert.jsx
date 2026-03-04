import React from 'react'

export default function Alert(props) {
    const capitalize = (word) => {
        const lower = word.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    }

    if (!props.alert) return null;

    const isSuccess = props.alert.type === "teal";
    const containerClasses = isSuccess
        ? "bg-teal-500/90 border-teal-400"
        : "bg-red-500/90 border-red-400";

    return (
        <div className="fixed top-4 inset-x-0 flex justify-center z-50 pointer-events-none">
            <div
                className={`${containerClasses} pointer-events-auto flex items-center max-w-lg w-full mx-4 text-white text-sm px-4 py-3 rounded-xl shadow-lg border`}
                role="alert"
            >
                <svg
                    className="fill-current w-4 h-4 mr-2 flex-shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                >
                    <path d="M12.432 0c1.34 0 2.01.912 2.01 1.957 0 1.305-1.164 2.512-2.679 2.512-1.269 0-2.009-.75-1.974-1.99C9.789 1.436 10.67 0 12.432 0zM8.309 20c-1.058 0-1.833-.652-1.093-3.524l1.214-5.092c.211-.814.246-1.141 0-1.141-.317 0-1.689.562-2.502 1.117l-.528-.88c2.572-2.186 5.531-3.467 6.801-3.467 1.057 0 1.233 1.273.705 3.23l-1.391 5.352c-.246.945-.141 1.271.106 1.271.317 0 1.357-.392 2.379-1.207l.6.814C12.098 19.02 9.365 20 8.309 20z" />
                </svg>
                <div className="flex-1">
                    <p className="font-semibold">
                        {capitalize(isSuccess ? "success" : "error")}
                    </p>
                    <p className="text-xs mt-0.5">
                        {props.alert.msg}
                    </p>
                </div>
            </div>
        </div>
    )
}
