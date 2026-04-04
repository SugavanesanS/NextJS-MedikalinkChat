import { FieldValue, Timestamp } from "firebase/firestore";
import { MutableRefObject } from "react";
import { AppURL, UserDefImage } from "../api/AppURL";
import { DiscussionUser, FBDiscussionList, FBParticipants } from "../types/data";
import { UserPrefix } from "./Constants";
import i18n from "./i18next/i18next";


export const Paths = {
    chatBasePath: AppURL.BASE_URL.replace('api', ''),
    chatFolderPath: 'storage/attachment',
}

/**
 * @function clm
 * Class merge function to convert object keys to classes.
 * @param {Object} e - an object where each key is a class name and each value is a boolean
 * @returns {String} a string of class names where each key is a class name and each value is a boolean
 */
export function clm(e) {
    var t: any = 0, f = ""; for (t in e) { if (e[t]) { if (f) { f += " "; } f += t; } } return f;
}

/**
 * @function debounce
 * @description debounce a function call.
 * @param {function} f - the function to debounce.
 * @param {number} [t=300] - the time in milliseconds.
 * @returns {function} - the debounced function.
 */
export const debounce = (f, t = 300) => {
    let i; return (...a) => { if (!i) { f.apply(this, a); } clearTimeout(i); i = setTimeout(() => { i = undefined; }, t); }
};


/**
 * @function UserInfoExtract
 * Extracts information about the discussion participants from a FBDiscussionList
 * and a Record of DiscussionUser objects.
 * @param {FBDiscussionList} data - the FBDiscussionList object.
 * @param {Record<string, DiscussionUser>} disData - the Record of DiscussionUser objects.
 * @returns {Object} - an object containing the following properties:
 * filterParticipants: an array of FBParticipants objects, filtered to exclude the current user.
 * isGroup: a boolean indicating whether the discussion is a group or not.
 * from: a string containing the name of the current user.
 * to: a string containing the names of the other participants in the discussion.
 * img: a string containing the path to the image representing the discussion
 * (group.png if it's a group, otherwise the user's profile picture).
 */
export const UserInfoExtract = (data: FBDiscussionList, disData: Record<string, DiscussionUser>, to: boolean = false, userFbUid: string) => {
    const lastModifiedUserId = data.lastUserId?.toString()
    const allParticipantsWithOutFilter = Object.values(data.participants)
    const currentParticipants = SortParticipants(FilterValidParticipants(data), disData)
    const filterParticipants = [...currentParticipants].filter(p => p.fbUserId != userFbUid)
    const isGroup = allParticipantsWithOutFilter.length > 2

    return {
        filterParticipants: filterParticipants,
        isGroup,
        from: lastModifiedUserId == userFbUid ? i18n.t('me') : `${UserPrefix[disData[lastModifiedUserId]?.user_type]}${disData?.[lastModifiedUserId]?.prenom} ${disData?.[lastModifiedUserId]?.nom}`,
        ...(to && {
            to: `${currentParticipants.filter(user => user.fbUserId != userFbUid).map(user => `${UserPrefix[user?.userType]}${disData?.[user.fbUserId]?.prenom} ${disData?.[user.fbUserId]?.nom}`).join(', ')}`
        }),
        imgUserId: isGroup ?
            lastModifiedUserId
            : allParticipantsWithOutFilter.filter(p => p.fbUserId != userFbUid)[0]?.fbUserId,
        defaultImage: isGroup ? GetDefaultImage({
            gender: disData?.[lastModifiedUserId]?.gender,
            userType: disData?.[lastModifiedUserId]?.user_type
        }) :
            GetDefaultImage({
                gender: disData?.[filterParticipants[0]?.fbUserId]?.gender,
                userType: disData?.[filterParticipants[0]?.fbUserId]?.user_type
            })
    }
}

/**
 * Filters the participants of a discussion to only include those with a valid participant status.
 * Valid participant statuses are 1 (active), 2 (invited), and 3 (declined).
 * @param {FBDiscussionList} data - the discussion object from which to filter the participants.
 * @returns {FBParticipants[]} - the filtered array of participants.
 */
export const FilterValidParticipants = (data: FBDiscussionList) => {
    return Object.values(data.participants).filter(p => (p.participantStatus == 1 && (p.discussionStatus == 1 || p.discussionStatus == 2))) || []
}

export const SortParticipants = (data: FBParticipants[], disData: Record<string, DiscussionUser>) => {
    return data.sort((a, b) => {
        return disData?.[a.fbUserId]?.prenom.localeCompare(disData?.[b.fbUserId]?.prenom)
    })
}

export const SPsort = (a: FBDiscussionList, b: FBDiscussionList) => (b.deadChat == 0 ? b.timestamp : b.deadChat) - (a.deadChat == 0 ? a.timestamp : a.deadChat);
/**
 * Shortens a profile name by taking the first letter of the first and
 * optionally the second name, or the first two letters of the first name
 * if there is no second name.
 * @param {string} name - the name to shorten.
 * @returns {string} - the shortened name.
 */
export const ShortProfileName =
    (name: string): string => { const n = (name || '')?.trim().split(' '); return (`${n?.[0].charAt(0)}${n?.[1]?.charAt(0) || n?.[0].charAt(1)}` || '').toUpperCase(); };


/**
 * Calls the callback function when the user presses Ctrl+Enter in the form.
 * @param {React.KeyboardEvent<HTMLFormElement>} e - the keyboard event.
 * @param {function} c - the function to call when the user presses Ctrl+Enter.
 * @returns {void}
 */
export const atCtrlEnter = (e: React.KeyboardEvent<HTMLFormElement>, c: () => void): void => { (e.ctrlKey && e.key == 'Enter') && c?.(); };


/**
 * Generates a path for a chat attachment.
 * @param {{ fileName: string, id: string, discussionId: string }} data - an object containing the file name, id, and discussion id.
 * @returns {string} - the generated path.
 */
export const ChatAttachPathMaker = ({ fileName, id, discussionId, fileType }: { fileName: string, id: string, discussionId: string, fileType?: 'image' | 'file' }): string => {
    if (fileType == 'image') {
        return `${Paths.chatBasePath}${Paths.chatFolderPath}/${discussionId}/${id}/${fileName}`
    } else {
        if (fileName?.includes('.pdf')) {
            return `${Paths.chatBasePath}${Paths.chatFolderPath}/${discussionId}/${id}/${fileName}`
        } else {
            return `${Paths.chatBasePath}${Paths.chatFolderPath}/${discussionId}/${id}/pdf/${id}.pdf`
        }
    }

}

export const ChatAttachDownloadPath = ({ fileName, id, discussionId }: { fileName: string, id: string, discussionId: string, fileType?: 'image' | 'file' }): string => {
    return `${Paths.chatBasePath}${Paths.chatFolderPath}/${discussionId}/${id}/${fileName}`
}


export const SendNotification = () => {

    if (!("Notification" in window)) {
        // Check if the browser supports notifications
        alert("This browser does not support desktop notification");
    } else if (Notification.permission == "granted") {
        // Check whether notification permissions have already been granted;
        // if so, create a notification
        const notification = new Notification("Hi there!");
        notification.onclick = () => {
            // const existingTab = Array.from(window.open('', '_self')).find(tab => tab.location.href == targetUrl);
            // if (existingTab) {
            //     existingTab.focus(); // Focus the existing tab
            // } else {
            //     window.open(targetUrl, '_blank'); // Open a new tab if it doesn't exist
            // }
        }
        // …
    } else if (Notification.permission != "denied") {
        // We need to ask the user for permission
        Notification.requestPermission().then((permission) => {
            // If the user accepts, let's create a notification
            if (permission == "granted") {
                const notification = new Notification("Hi there!");
                // …
            }
        });
    }

}


/**
 * Converts a PDF file to a base64 image and sets it as the source of the provided image element.
 * @param {string} url - The URL of the PDF file to convert.
 * @param {MutableRefObject<HTMLImageElement | null>} ref - Reference to the image element to set the base64 image source.
 */
export const PDFToBase64 = (url: string, ref: MutableRefObject<HTMLImageElement | null>): Promise<void> => new Promise((resolve, reject) => {
    window.pdfjsLib.getDocument(url).promise.then((pdf) => {
        pdf.getPage(1).then(function (page) {

            const scale = 0.6; // Adjust the scale if needed
            const viewport = page.getViewport({ scale });

            // Prepare a canvas to render the PDF page
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render the page into the canvas context
            const renderContext = {
                canvasContext: context!,
                viewport: viewport
            };
            page.render(renderContext).promise.then(() => {
                // Convert the canvas to a base64 image
                const base64Image = canvas.toDataURL('image/png');
                // Set the base64 image as the src of the image element
                if (ref.current) {
                    ref.current.src = base64Image;
                    resolve()
                }

            });

        });
    }).catch((error) => {
        console.error('Error loading PDF:', error);
        reject(error)
    });
})

export const ImageToBase64 = (url: string, ref: MutableRefObject<HTMLImageElement | null>): Promise<void> => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(image, 0, 0);
        const base64Image = canvas.toDataURL('image/png');
        if (ref.current) {
            ref.current.src = base64Image;
            resolve()
        }
    };
    image.onerror = (error) => {
        console.error('Error loading image:', error);
        reject(error)
    };
    image.src = url;


})

/**
 * Modifies the disabled state of an array of HTMLButtonElements based on the provided boolean state.
 * @param {{ refs: MutableRefObject<HTMLButtonElement | null>[], state: boolean }} props
 * @param {MutableRefObject<HTMLButtonElement | null>[]} props.refs - an array of MutableRefObjects of HTMLButtonElements.
 * @param {boolean} props.state - the boolean state to set as the disabled property of the button elements.
 */
export const ButtonAccessModifier = (
    { refs, state }: {
        refs: MutableRefObject<HTMLButtonElement | null>[],
        state: boolean
    }) => {
    refs.forEach((ref) => {
        if (ref?.current) {
            ref.current.disabled = state
        }
    })
}

/**
 * Toggles the display of a loader element with the id 'loader' based on the provided boolean state.
 * @param {boolean} state - the boolean state to set as the display property of the loader element.
 * @returns {void}
 */
export const ScreenLoader = (state: boolean): void => {
    const loader = document.getElementById('app-loader')
    if (loader) {
        if (state) {
            loader.style.display = 'block'
        } else {
            loader.style.display = 'none'
        }
    }
}


const FileViewStatic = {
    fileViewModel: 'file_viewer',
    imgB: 'image-block',
    iFrameB: 'ifram-block',
    imgSrc: 'iframe-img',
    pdfSrc: 'frame',
    btnPre: 'prev_icon',
    btnNext: 'next_icon',
    btnClose: 'close_btn',
    disableClassName: 'dis-button'
}

export const FileViewer = ({ filePath, fileType }: { filePath: string, fileType: 'pdf' | 'image' }) => {

    const fileViewModel = window.document.getElementById(FileViewStatic.fileViewModel) as HTMLDivElement
    const imgBlock = window.document.getElementById(FileViewStatic.imgB) as HTMLDivElement
    const iframeBlock = window.document.getElementById(FileViewStatic.iFrameB) as HTMLDivElement
    const imgSrc = window.document.getElementById(FileViewStatic.imgSrc) as HTMLImageElement
    const pdfSrc = window.document.getElementById(FileViewStatic.pdfSrc) as HTMLIFrameElement
    const btnPre = window.document.getElementById(FileViewStatic.btnPre) as HTMLButtonElement
    const btnNext = fileViewModel.querySelector(`#${FileViewStatic.btnNext}`) as HTMLButtonElement
    const btnClose = fileViewModel.querySelector(`#${FileViewStatic.btnClose}`) as HTMLButtonElement

    btnPre.style.display = 'none'
    btnNext.style.display = 'none'
    btnPre.classList.add(FileViewStatic.disableClassName)
    btnNext.classList.add(FileViewStatic.disableClassName)

    switch (fileType) {
        case 'pdf':
            imgBlock.style.display = 'none'
            iframeBlock.style.display = 'block'
            pdfSrc.src = filePath
            break;
        case 'image':
            imgBlock.style.display = 'flex'
            iframeBlock.style.display = 'none'
            imgSrc.src = filePath
            break;
    }
    btnClose.onclick = () => {
        fileViewModel.style.display = 'none'
        fileViewModel.classList.remove('show');
    }

    fileViewModel.style.display = 'block'
    fileViewModel.classList.add('show');
}

/**
 * Reduces the length of a file name while preserving its extension. 
 * If the name exceeds the specified maximum length, the middle characters 
 * are replaced with ellipses (...).
 * 
 * @param {string} fileName - The original file name to be reduced.
 * @param {number} [maxLength=8] - The maximum allowed length for the file name.
 * @returns {string} - The reduced file name with its extension.
 */
export const ReduceFileName = (fileName: string, maxLength: number = 18): string => {
    const split = fileName?.split('.');

    if (!(split?.length > 1)) return fileName;
    let extParts = split.pop();
    let name = split.join('');
    if (name.length <= maxLength) return fileName;
    return `${name.slice(0, 9)}..${name.slice(-3)}.${extParts}`;
};

/**
 * Moves the first element in an array that satisfies the provided testing function
 * to the front of the array, maintaining the order of the other elements.
 * 
 * @param {Array<T>} array - The array to be searched.
 * @param {function} fun - The function used to test each element of the array. 
 *                          It should return a truthy value for the desired element.
 * @returns {Array<T>} - The modified array with the specified element moved to the front.
 */
export const SortToFirst: <T>(array: Array<T>, fun: (value: T, index: number, obj: any[]) => unknown) => T[]
    =
    (array: Array<any>, fun: (value: any, index: number, obj: any[]) => unknown) => {
        const index = array.findIndex(fun);
        if (index > -1) {
            const element = array[index];
            array.splice(index, 1);
            array.unshift(element);
        }
        return array;
    }
export const TimeCheckAndConvert = (time: number | Timestamp | FieldValue, log: boolean = false): number => {
    if (log) {
        // console.log(time, typeof time)
    }
    if (time instanceof Timestamp) {
        return time.toDate().getTime()
    } else {
        return time as number
    }
}

export const GetDefaultImage = (
    {
        gender,
        userType,
    }
) => {
    switch (userType?.toString?.()) {
        case '1':
            return UserDefImage['1']
        case '2':
            return UserDefImage['2']
        case '4':
            return UserDefImage['4']
        case '3':
            return UserDefImage['3']
        case '5':
            if (gender == 1) {
                return UserDefImage['5m']
            } else {
                return UserDefImage['5f']
            }
        case '7':
            return UserDefImage['2']  //need to replace telescretariat image. for now don't have telesecretary image
    }
    return ''
}

export const ParseQuery = (q: string) => Object.fromEntries(new URLSearchParams(q));


export const secsToDurationString = (seconds = 0) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return [
        hrs > 0 ? String(hrs).padStart(2, '0') : null,
        String(mins).padStart(2, '0'),
        String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
}

export const changeFirstLetterToUpperCase = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export const changeFirstLetterToLowerCase = (string: string) => {
    return string.charAt(0).toLowerCase() + string.slice(1);
}

export const sortArrrayAlphabetically = (array: any[]) => {
    return (array || []).sort((a, b) => a.name.localeCompare(b.name))
}