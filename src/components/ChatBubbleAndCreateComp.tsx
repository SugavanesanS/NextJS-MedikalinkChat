'use client';
import { Icon } from "@iconify/react"
import { createSelector } from "@reduxjs/toolkit"
import { MutableRefObject, useEffect, useRef } from "react"
import { OverlayTrigger, Popover } from "react-bootstrap"
import { shallowEqual, useDispatch, useSelector } from "react-redux"
import { useFirebaseAuth } from "../contextAndProvider/FirebaseAuthWrapper"
import { usePostCall } from "../hooks/ChatHooks"
import { DiscussionActions } from "../redux/reducer/DiscussionReducer"
import { RootState } from "../redux/store"
import { clm, UserInfoExtract } from "../services/CommonFunction"
import i18n from "../services/i18next/i18next"
import { OutSideClickHandler } from "../services/OutSideClickHandler"
import { FBDiscussionList } from "../types/data"


const staticHeight = {
    padding: 20,
    margin: 14,
    menu: 35,
    bubble: 50,
    gap: 7
}

const bubbleSelector = createSelector(
    [(state: RootState) => state.discussion.bubbleChatIds, (state: RootState) => state.discussion.list],
    (bubbleIds, list) => {
        const data: FBDiscussionList[] = []
        if ((list.archivedDiscussionList || list.discussionList) && bubbleIds) {
            bubbleIds.forEach((id) => {
                const mainData = [...(list.archivedDiscussionList || []), ...(list.discussionList || [])].find(obj => obj.discussionId.toString() == id)
                mainData && (data.push(
                    mainData
                ))
            })
        }
        return data.reverse()
    }
)

const BubbleOpenAndClose = (ref: MutableRefObject<HTMLDivElement | null>, count: number, state?: 'open' | 'close') => {

    count = (count > 5 ? 6 : count) || 0

    if (ref.current) {
        if ((state == 'open' || (state == 'close' ? false : ref.current.classList.contains('open'))) && count > 0) {
            ref.current.style.height = ` ${(count * staticHeight.bubble)
                +
                staticHeight.menu +
                staticHeight.padding +
                staticHeight.margin +
                (staticHeight.gap * (count - 1))}px`
            ref.current.className = `chat-meb-outer height-ani open`
        } else {
            ref.current.style.height = '0px'
            ref.current.className = `chat-meb-outer height-ani close`
        }

    }
}

export const ChatBubbleAndCreateComp = () => {
    const postCall = usePostCall()
    const firebaseAuth = useFirebaseAuth()

    const dispatch = useDispatch()
    const bubbleIdsArr = useSelector(bubbleSelector, shallowEqual)
    const userData = useSelector((state: RootState) => state.discussion.userList)
    const multiBubbleViewRef = useRef<HTMLDivElement | null>(null)
    const currentDiscussionId = useSelector((state: RootState) => state.discussion.currentDiscussionId)

    useEffect(() => {
        BubbleOpenAndClose(multiBubbleViewRef, bubbleIdsArr.length)
    }, [bubbleIdsArr.length])

    return (
        <>
            <div className="chat-fixed">
                <span onClick={() => { postCall.create() }} className="edit"><Icon icon="uil:edit" /></span>
                <span
                    onClick={() => {
                        BubbleOpenAndClose(multiBubbleViewRef, bubbleIdsArr.length, 'open')
                    }}
                    className={clm({
                        "notification-count": true,
                        open: bubbleIdsArr.length > 0,
                        close: bubbleIdsArr.length == 0
                    })}
                >{bubbleIdsArr.length}</span>
            </div>
            <div style={{
                zIndex: 20
            }} className="chat-meb-outer height-ani close" ref={multiBubbleViewRef}>
                <OutSideClickHandler>
                    {
                        ({ show, setShow }) => (
                            <OverlayTrigger show={show} trigger="click" placement="left" overlay={
                                <Popover className="txt-popover">
                                    <div
                                        onClick={() => {
                                            BubbleOpenAndClose(multiBubbleViewRef, bubbleIdsArr.length, 'close')
                                            setShow(false);
                                            setTimeout(() => {
                                                dispatch(DiscussionActions.removeAllBubble())
                                            }, 300);

                                        }}
                                        className="dis-clo"><Icon icon="zondicons:close-outline" /><span children={i18n.t('close_discussions')} /></div>
                                    <div
                                        onClick={() => {
                                            BubbleOpenAndClose(multiBubbleViewRef, bubbleIdsArr.length, 'close')
                                            setShow(false)
                                        }} className="dis-clps"><Icon icon="zondicons:minus-outline" /><span children={i18n.t('collapse_discussions')} /></div>
                                </Popover>}>
                                <div className="setting">
                                    <Icon onClick={() => {
                                        setShow(true)
                                    }} icon="iconamoon:menu-kebab-horizontal" />
                                </div>
                            </OverlayTrigger>
                        )
                    }
                </OutSideClickHandler>
                {

                    bubbleIdsArr.length > 0 && <div className={`multi-meb`}>
                        {
                            [...bubbleIdsArr].slice(0, 5).map((value, index) => {
                                const data = UserInfoExtract(value, userData!, true, firebaseAuth!.fbUid!)
                                return (
                                    <div
                                        onClick={() => {
                                            postCall.open(value.discussionId)
                                        }}
                                        key={index} className={
                                            clm({
                                                "user": true,
                                                "active": value.discussionId == currentDiscussionId
                                            })
                                        }>
                                        <div><img className="user-img" src={data.img} /></div>
                                        <span onClick={(e) => {
                                            e.stopPropagation()
                                            dispatch(DiscussionActions.removeBubble(value.discussionId.toString()))
                                        }} className="close"><Icon icon="gridicons:cross" /></span>
                                        {!!value.unreadCount[firebaseAuth.fbUid!] && <span className="count">{value.unreadCount[firebaseAuth.fbUid!]}</span>}
                                    </div>
                                )
                            })
                        }
                        {
                            bubbleIdsArr.length > 5 &&
                            (<div className="extra-user">
                                <OutSideClickHandler className="attach-popover">
                                    {
                                        ({ show, setShow }) => (
                                            <OverlayTrigger show={show} trigger="click" placement="left" overlay={
                                                <Popover className="txt-popover extra-count-meb attach-popover">
                                                    {
                                                        [...bubbleIdsArr].splice(5, bubbleIdsArr.length).map((value, index) => {
                                                            const data = UserInfoExtract(value, userData!, true, firebaseAuth!.fbUid!)
                                                            return (
                                                                <div onClick={() => {
                                                                    postCall.open(value.discussionId)
                                                                }} key={index} className="members"><span>{data.to}</span><Icon onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    dispatch(DiscussionActions.removeBubble(value.discussionId.toString()))
                                                                }} className="close" icon="gridicons:cross" /></div>
                                                            )
                                                        })
                                                    }
                                                </Popover>}>
                                                <div className="extra-count-dd cursor-pointer">
                                                    <span onClick={() => {
                                                        setShow(true)
                                                    }}>{`+${bubbleIdsArr.length - 5}`}</span>
                                                </div>
                                            </OverlayTrigger>
                                        )
                                    }
                                </OutSideClickHandler>
                            </div>)
                        }
                    </div>
                }
            </div>
        </>
    )
}