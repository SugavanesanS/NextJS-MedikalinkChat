'use client';
import { Fragment, useRef, useState, useEffect } from "react"
import ReactDOM from "react-dom"
import { RecentChatPage } from "../components/portalPage/RecentChatPage"
import { UrgentChatPage } from "../components/portalPage/UrgentChatPage"

const RecentChatPortal = () => {
    const [container, setContainer] = useState<HTMLElement | null>(null)
    const removeRef = useRef(1)

    useEffect(() => {
        const doc = document.getElementById('recent_msg_block')
        if (doc) {
            if (removeRef.current) { removeRef.current = 0; doc.innerHTML = '' }
            setContainer(doc)
        }
    }, [])

    if (!container) return null
    return ReactDOM.createPortal(<RecentChatPage />, container)
}

const UrgentChatPortal = () => {
    const [container, setContainer] = useState<HTMLElement | null>(null)
    const removeRef = useRef(1)

    useEffect(() => {
        const doc = document.getElementById('urgent_msg_block')
        if (doc) {
            if (removeRef.current) { removeRef.current = 0; doc.innerHTML = '' }
            setContainer(doc)
        }
    }, [])

    if (!container) return null
    return ReactDOM.createPortal(<UrgentChatPage />, container)
}

const ChatHomePagePortal = () => {
    return (
        <Fragment>
            <RecentChatPortal />
            <UrgentChatPortal />
        </Fragment>
    )
}

export default ChatHomePagePortal
