import { CommonOptions } from "child_process";
import { toast } from "react-toastify";


export const showError = (message: string, config?: CommonOptions) => {
    toast.error(
        message
        , {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            bodyStyle: { 'fontSize': '14px' },
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
            ...(!!config && config)
        });
};
export const showSuccess = (message: string, config?: CommonOptions) => {
    toast.success(
        // message.charAt(0).toUpperCase() + message.slice(1)
        message
        , {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            bodyStyle: { 'fontSize': '14px' },
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
            ...(!!config && config)
        });
};