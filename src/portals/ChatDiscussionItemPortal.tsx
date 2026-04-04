'use client';
import { Fragment, useRef, useState, useEffect, Suspense } from 'react';
import { Button } from 'react-bootstrap';
import ReactDOM from 'react-dom';
import ChatListView from '../components/ChatListView';
import DiscussionListWrapper from '../components/DiscussionListWrapper';
import { ChatProviderWrapper, useChatDiscussionContext } from '../contextAndProvider/ChatProviderWrapper';
import { usePostCall } from '../hooks/ChatHooks';
import i18n from '../services/i18next/i18next';
import { MainWithSub } from '../api/AppURL';

const ChatDiscussionList = () => {
    const chatContext = useChatDiscussionContext()
    const postCall = usePostCall()
    return (
        <Fragment>
            {chatContext.noData &&
                <div className='empty_list_design'>
                    <div className='empty-chat'>
                        <div className='chat-body'>
                            <div className='char-avtar'>
                                <img src={`${MainWithSub}/resources/images/dash-msg.svg`} />
                            </div>
                            <p>{i18n.t('no_messages_no_files')}</p>
                            <Button onClick={() => postCall.create()} className='greenfilled-btn'>
                                {i18n.t('send_message')}
                            </Button>
                        </div>
                    </div>
                </div>
            }
            {!chatContext.noData &&
                <DiscussionListWrapper>
                    <div className={"react-chat-discussion-list d-flex react-chat-listounter"}>
                        <ChatListView />
                    </div>
                </DiscussionListWrapper>
            }
        </Fragment>
    )
}

const ChatDiscussionListPortal = () => {
    const [container, setContainer] = useState<HTMLElement | null>(null)
    const removeRef = useRef(1)

    useEffect(() => {
        const doc = document.getElementById('message_container')

        if (doc) {
            if (removeRef.current) {
                removeRef.current = 0
                doc.innerHTML = ''
            }
            setContainer(doc)
        }
    }, [])


    if (!container) return null

    return ReactDOM.createPortal(
        <Suspense fallback={null}>
            <ChatProviderWrapper>
                <ChatDiscussionList />
            </ChatProviderWrapper>
        </Suspense>,
        container
    )
}

export default ChatDiscussionListPortal
