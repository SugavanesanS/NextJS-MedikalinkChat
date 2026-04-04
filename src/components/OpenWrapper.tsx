import { FC, PropsWithChildren } from "react";
import { clm } from "../services/CommonFunction";


const OpenWrapper: FC<PropsWithChildren & { isOpen: boolean; className?: Record<string, boolean>, id: string }> = ({ children, isOpen, className, id }) => {

    return (
        <div id={id} className={clm({
            minimized: true,
            open: isOpen,
            close: !isOpen,
            ...className
        })}>
            {
                isOpen && children
            }
        </div>
    )
}

export default OpenWrapper