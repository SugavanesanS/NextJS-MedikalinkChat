'use client';
import { FC, PropsWithChildren, useEffect, useState } from 'react';
import { clm } from './CommonFunction';


export const FadeOpenClose: FC<PropsWithChildren & { inProp: boolean }> = ({ inProp, children }) => {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (inProp) {
            setVisible(true)
        } else {
            setTimeout(() => {
                setVisible(false)
            }, 300);
        }
    }, [inProp])

    return (
        <div className={clm({
            "fade": true,
            "fade-in": inProp,
            "fade-out": !inProp
        })}>
            {
                visible && children
            }

        </div>
    );
}