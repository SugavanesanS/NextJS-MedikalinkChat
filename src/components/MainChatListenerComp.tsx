'use client';
import { FC, PropsWithChildren, useEffect } from "react"
import { useChatUserInfoListener, useDiscussionListHook, useGetChatUserList, usePostMessageHook } from "../hooks/ChatHooks"
import { useUnreadCountUpdater } from "../hooks/hooks"
import * as indexDB from '../services/CacheWithIndexeddb'

const MainChatListenerWrapper: FC<PropsWithChildren> = ({ children }) => {

    useEffect(() => {
        indexDB.cleanupExpiredItems()
    }, [])


    useDiscussionListHook()
    useGetChatUserList()
    usePostMessageHook()
    useChatUserInfoListener()
    useUnreadCountUpdater()
    return <>{children}</>
}

export default MainChatListenerWrapper