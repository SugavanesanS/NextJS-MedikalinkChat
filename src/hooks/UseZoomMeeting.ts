import { useEffect } from "react";
import { GetCurrentUserTypeInt } from "../services/Constants";
import { enumUserType } from "../types/data";
const useZoomMeeting = ({ forLink = false }) => {

    const openFun = (path) => {

        const pathArr = path.split('/r/')
        const pathSpilt = pathArr.length > 1 && pathArr[1]
        const zoomInfo = pathSpilt && pathSpilt.split('/')
        if (path.includes("/r/") && !path.includes("meeting") && (path.includes("calendar-appointment")) && (zoomInfo[1] == '4')) {
            const pa = path.replace("calendar-appointment", "meeting")

            const features = {
                toolbar: 'no',
                scrollbars: 'no',
                resizable: 'yes',
                top: window.innerHeight * 0.15,
                left: window.innerWidth * 0.15,
                width: window.innerWidth * 0.7,
                height: window.innerHeight * 0.7,
                menubar: 'no',
                location: 'yes',
                directories: 'yes',
                fullscreen: 'no',
                dependent: 'yes'
            }

            window.open(pa, "popup",
                Object.entries(features).reduce((pre, curr) => { return `${pre},${curr[0]}=${curr[1]}` }, '')
            )

        } else {
            if (path.includes('/r/') && (zoomInfo[1] == '4') && (Number(GetCurrentUserTypeInt()) != enumUserType.PATIENT)) {
                window.open(path.split('/r/')[0], '_self')
            }
        }
    }

    useEffect(() => {
        if (!forLink) {
            openFun(window.location.href)
        }
    }, [])

    return { open: openFun }
}

export default useZoomMeeting