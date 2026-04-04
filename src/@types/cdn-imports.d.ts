declare module "https://cdn.jsdelivr.net/npm/react-toastify@10.0.6/+esm" {
    // Define all the named exports from React Toastify
    export {
        Bounce,
        cssTransition, Flip, Slide, toast, ToastContainer, ToastContainerProps, ToastContent,
        ToastOptions, ToastPosition, ToastTransition, TypeOptions, UpdateOptions, Zoom
    } from "react-toastify";

    // Define the default export if applicable
    import ReactToastifyDefault from "react-toastify";
    export default ReactToastifyDefault;
}
