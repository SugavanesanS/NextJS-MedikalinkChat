'use client';
import { useCallback, useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { RootState } from "../redux/store"
import { IDs } from "../services/Constants"


/**
 * useTimeout hook like debounce
 * @param {Object} options
 * @param {number} options.duration - the duration of the timeout
 * @returns {Object} { delay: function, reset: function }
 * - delay: a function that takes a function to be called after the specified duration
 * - reset: a function that cancels the timeout
 */
export const useTimeout = ({ duration }) => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const resetTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
    }, [])
    const delay = useCallback((fn) => {
        resetTimeout()
        timeoutRef.current = setTimeout(fn, duration)
    }, [resetTimeout, duration])
    return { delay, reset: resetTimeout }
}

const sendNotification = (title, options) => {
    if (Notification.permission == 'granted') {
        new Notification(title, options);
    } else {
        console.log('Notification permission not granted.');
    }
};


export const useUnreadCountUpdater = () => {
    const unRead = useSelector((state: RootState) => state.discussion.allChatCount)

    const timeout = useTimeout({ duration: 500 })
    useEffect(() => {

        timeout.delay(() => {
            const unReadDocID = window.document.getElementById(IDs.unreadCount)
            const totalUnreadCounterID = window.document.getElementById(IDs.overallCount)
            const mssante_unread_counterID = window.document.getElementById(IDs.msCount)
            const imap_unread_counterID = window.document.getElementById(IDs.imapCount)
            //  const msCount = mssante_unread_counterID ? mssante_unread_counterID.innerText : 0
            const imapCount = imap_unread_counterID ? imap_unread_counterID.innerText : '0'
            let totalCount: number = unRead + parseInt(imapCount) //+ parseInt(msCount);

            if (totalCount > 0) {
                if (unReadDocID || totalUnreadCounterID) {
                    document.title = document.title.replace(/\s\(\d+\)/, '') + ' (' + totalCount + ')';
                    if (unReadDocID && unRead > 0) {
                        unReadDocID.setAttribute('style', 'display: block !important;');
                        unReadDocID.innerHTML = unRead?.toString();
                    }
                    if (totalUnreadCounterID) {
                        totalUnreadCounterID.setAttribute('style', 'display: block !important;');
                    }
                    if (totalUnreadCounterID?.innerHTML) {
                        totalUnreadCounterID.innerHTML = String(totalCount)
                    }
                }
            } else {
                if (unReadDocID || totalUnreadCounterID) {
                    unReadDocID?.setAttribute('style', 'display: none !important;');
                    if (unReadDocID?.innerHTML) {
                        unReadDocID.innerHTML = unRead?.toString();
                    }
                    totalUnreadCounterID?.setAttribute('style', 'display: none !important;');
                    if (totalUnreadCounterID?.innerHTML) {
                        totalUnreadCounterID.innerHTML = '0'
                    }
                }
                document.title = document.title.replace(/\s\(\d+\)/, '');
            }
        })

    }, [unRead]);

}


/**
 * Logs how many times a component has been re-rendered, given a string to identify the component.
 * @param {string} logString - The string to log.
 * @returns {void}
 */
export const useRenderCount = (logString: string): void => {
    const renderCount = useRef(0)
    // console.log('render', logString, renderCount.current)
    renderCount.current = renderCount.current + 1
}


export const useDownloadFileWithProgress = () => {
    const [progress, setProgress] = useState(0);
    const handleDownload = async ({ path, name }: { path: string, name: string }) => {
        console.log(" path ,  ", path, name)
        const response = await fetch(path);

        // If the response is not okay, handle the error
        if (!response.ok) {
            throw new Error('Failed to fetch the file');
        }

        const contentLength = response.headers.get('content-length'); // Get total file size
        if (!contentLength) {
            console.error('Content-Length response header is missing');
            return;
        }

        const totalSize = parseInt(contentLength, 10);
        let loadedSize = 0; // Track loaded data size

        const reader = response.body?.getReader(); // Read data chunks
        const stream = new ReadableStream({
            async start(controller) {
                while (true) {
                    const data = await reader?.read();
                    if (data?.done) {
                        break;
                    }

                    loadedSize += data?.value.length || 0;
                    setProgress(Math.floor((loadedSize / totalSize) * 100)); // Update progress percentage
                    controller.enqueue(data?.value);
                }
                controller.close();
            }
        });

        const blob = await new Response(stream).blob(); // Create blob from streamed data

        // Create a download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = name;
        link.click();

        // Clean up
        URL.revokeObjectURL(link.href);
        setProgress(0); // Reset progress after download
    };

    return {
        handleDownload
    }

}

export const useTabFocus = () => {
    const [isFocused, setIsFocused] = useState(document.visibilityState == "visible");
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState == "visible") {
                setIsFocused(true);
            } else {
                setIsFocused(false);
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        // Cleanup event listener on unmount
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    return {
        isFocused
    }
};
