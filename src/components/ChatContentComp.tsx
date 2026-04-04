'use client';
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { useChatDiscussionHook, useMessageDelete, useUnReadReset } from "../hooks/ChatHooks";
import { useTabFocus } from "../hooks/hooks";
import { RootState } from "../redux/store";
import { MessageBubbleComp } from "./MessageBubbleComp";

export const ChatMessagesComp = () => {
    const { chatMessages: allMessage, loadMore } = useChatDiscussionHook()
    const chatMessages = useMemo(() => [...(allMessage || [])], [allMessage])
    const messageDelete = useMessageDelete()
    const virtuosoRef = useRef<VirtuosoHandle | null>(null)
    const virtuosoBottomState = useRef(false)
    const [scrollerElement, setScrollerElement] = useState<HTMLDivElement | null>(null);
    const tabFocus = useTabFocus()
    const unreadMessageUserCount = useSelector((state: RootState) => state.discussion.currentFBDiscussionInfo?.unreadCount)


    const unReadReset = useUnReadReset()
    useEffect(() => {
        if (!scrollerElement) return;


        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
            const scrollTop = scrollerElement.scrollTop;
            const newScrollTop = scrollTop - event.deltaY;
            scrollerElement.scrollTo({
                top: newScrollTop,
                behavior: 'instant' as any
            });
        };
        scrollerElement.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            scrollerElement.removeEventListener('wheel', handleWheel);
        };
    }, [scrollerElement]);

    useEffect(
        () => {


            if (scrollerElement?.scrollTop != undefined) {
                if (scrollerElement.scrollTop < 100) {
                    if (tabFocus.isFocused) {
                        unReadReset.reset()
                    }
                }
            }
        },
        [allMessage, scrollerElement, tabFocus.isFocused]
    )
    
    return (
        <div className="chat-content position-relative">
            {
                chatMessages
                &&
                <Virtuoso
                    className="chat-virtuoso"
                    atTopStateChange={(state) => {
                        virtuosoBottomState.current = state
                    }}
                    reversed
                    ref={virtuosoRef}
                    atBottomStateChange={(state) => {
                        if (state) {
                            loadMore()
                        }
                    }}
                    scrollerRef={(ref) => {
                        if (ref) {
                            setScrollerElement(ref as any)
                        }
                    }}
                    onScroll={(e: any) => {
                        if (e.currentTarget.scrollTop < 100) {
                            unReadReset.reset()
                        }
                    }}
                    data={chatMessages}
                    totalCount={chatMessages.length}
                    itemContent={(_, message) => <MessageBubbleComp  {...message} messageDelete={(props) => {
                        messageDelete.messageDelete(message.id, message.discussionId.toString(),
                            () => {

                            })
                    }
                    }
                        unreadMessageUserCount={unreadMessageUserCount}
                        lastMessage={chatMessages[0]}
                    />
                    }
                />
            }
        </div>
    )
}