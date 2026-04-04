'use client';
import { FC, useEffect, useState } from "react";


export const OutSideClickHandler: FC<{ className?: string, children: ({ show, setShow }: { show: boolean, setShow: (state: boolean) => void }) => JSX.Element }> = ({ children, className }) => {
    const [show, setShow] = useState<boolean>(false)
    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (!event.target.closest(`.${className}`)) {
                setShow(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, []);
    return (
        <>
            {children({ show, setShow })}
        </>
    )

}