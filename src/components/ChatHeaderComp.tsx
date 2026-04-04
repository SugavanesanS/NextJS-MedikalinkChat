'use client';
import { Icon } from "@iconify/react"
import { createSelector } from "@reduxjs/toolkit"
import { FC, useMemo, useRef, useState } from "react"
import { Form, Nav, OverlayTrigger, Tooltip } from "react-bootstrap"
import { shallowEqual, useSelector } from "react-redux"
import { useMessageContext } from "../contextAndProvider/MessageProviderWrapper"
import { useUpdateSubject } from "../hooks/ChatHooks"
import { RootState } from "../redux/store"
import { clm } from "../services/CommonFunction"
import i18n from "../services/i18next/i18next"
import { DiscussionRDVDetails, DiscussionUser, enumUserType, FBParticipants } from "../types/data"
import { GetCurrentUserType, GetCurrentUserTypeInt } from "../services/Constants"
import { Colors } from "../utils/resources/Colors"



const SubjectCell = ({ deadChat }: { deadChat: number | boolean }) => {
    const updateSubject = useUpdateSubject()
    const [isEdit, setIsEdit] = useState(false)
    const currenInfo = useSelector((state: RootState) => state.discussion.currentFBDiscussionInfo?.subject)
    const textRef = useRef<string>(currenInfo || '')

    return (
        <div className="msg-obj">
            <div className="obj-edit">
                {!isEdit &&
                    <>
                        <span className="obj-text">{currenInfo || `(Pas d'objet)`}</span>
                        {(deadChat == 0) && <span onClick={() => {
                            textRef.current = currenInfo || ''
                            setIsEdit(true)
                        }} className="edit">
                            <OverlayTrigger delay={{ show: 100, hide: 300 }} overlay={<Tooltip style={{ position: "fixed" }} children={i18n.t('edit')} />}><Icon icon="eva:edit-outline" /></OverlayTrigger>
                        </span>}
                    </>
                }

                {isEdit && (deadChat == 0) &&
                    <>
                        <Form.Control defaultValue={textRef.current} type="text" onChange={(e) => textRef.current = e.target.value} />
                        <span onClick={() => {
                            updateSubject.update(textRef.current)
                            setTimeout(() => {
                                setIsEdit(false)
                            }, 100);

                        }} className="success"><OverlayTrigger delay={{ show: 100, hide: 300 }} overlay={<Tooltip style={{ position: "fixed" }} children={i18n.t('confirm')} />}><Icon icon="ep:success-filled" /></OverlayTrigger></span>
                        <span onClick={() => {

                            setIsEdit(false)
                        }} className="delete"><OverlayTrigger delay={{ show: 100, hide: 300 }} overlay={<Tooltip style={{ position: "fixed" }} children={i18n.t('cancle')} />}><Icon icon="oui:cross-in-circle-filled" /></OverlayTrigger></span>
                    </>}
            </div>
        </div>
    )
}
const getPatient = createSelector([state => state.discussion.currentFBDiscussionInfo?.participantsWithDetails],
    (participantsWithDetails: Record<number, (FBParticipants & DiscussionUser)> | undefined | null): { patient: (FBParticipants & DiscussionUser) } => {
        let result = {
            patient: {}
        } as { patient: (FBParticipants & DiscussionUser) };
        (participantsWithDetails) && Object.keys(participantsWithDetails).forEach((key) => {
            if (participantsWithDetails[key]?.userType == '5') {
                result = {
                    patient: participantsWithDetails[key]
                }
            }

        })
        return result
    })
type ChatHeaderCompProps = {
    callback: (type?: 'teleconsult' | 'invitation') => void;
    rdv_invitation?: DiscussionRDVDetails | null
}
export const ChatHeaderComp: FC<ChatHeaderCompProps> = ({ callback, rdv_invitation }) => {
    const chatContext = useMessageContext()
    const { patient } = useSelector(getPatient, shallowEqual)

    const currentDiscussionParticipants = useSelector((state: RootState) => state.discussion?.currentFBDiscussionInfo?.participants)
    const CurrentUserType = GetCurrentUserTypeInt()
    const isPatientActive = useMemo(() => {
        if (!currentDiscussionParticipants) return false;
        return Object.values(currentDiscussionParticipants as FBParticipants[])
            ?.filter((participant: FBParticipants) => (participant?.userType == enumUserType.PATIENT && participant?.participantStatus == 1 && participant?.discussionStatus == 1))
            ?.length > 0
    }, [currentDiscussionParticipants])


    return (
        <div className="chat-header">
            {
                chatContext.isCreate ?
                    <div className="chat-new-head">
                        <h5 className="chat-title" children={i18n.t('send_msg')} />
                        <Icon onClick={() => chatContext.closeChat('close')} icon="ep:close-bold" />
                    </div>
                    :
                    <div className="chat-head">
                        <SubjectCell deadChat={chatContext.deadChat} />
                        <div className="cht-rigaction">
                            {(isPatientActive && Number(CurrentUserType) == enumUserType.DOCTOR) &&
                                <span className="teleconsult-icon me-2" onClick={() => {
                                    if (rdv_invitation?.status == 1 || rdv_invitation?.status == 2) {
                                        callback('invitation')
                                    } else {
                                        callback('teleconsult')
                                    }

                                }}>
                                    <Icon icon="carbon:video-filled" width="24" height="24"
                                        {
                                        ...rdv_invitation && { color: Colors.urgentColor }
                                        }
                                    />
                                </span>}
                            {
                                ((rdv_invitation?.status == 1) && Number(CurrentUserType) == enumUserType.PATIENT) &&
                                <span className="teleconsult-icon me-2" onClick={() => callback('invitation')}>
                                    <Icon icon="carbon:video-filled" width="24" height="24" color={Colors.urgentColor} />
                                </span>
                            }
                            <Nav>
                                <Nav.Item>
                                    <Nav.Link
                                        disabled={!patient.fbUserId}
                                        onClick={() => {
                                            chatContext.setView('profile')
                                        }} className={clm({
                                            "active": chatContext.view == 'profile'
                                        })}>
                                        <OverlayTrigger delay={{ show: 100, hide: 300 }} overlay={<Tooltip style={{ position: "fixed" }} children={i18n.t('patient_profile')} />}><Icon icon="bx:user" /></OverlayTrigger>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item >
                                    <Nav.Link
                                        onClick={() => {
                                            chatContext.setView('chat')
                                        }}
                                        className={clm({
                                            "active": chatContext.view == 'chat'
                                        })}>
                                        <OverlayTrigger delay={{ show: 100, hide: 300 }} overlay={<Tooltip style={{ position: "fixed" }} children={i18n.t('discussion')} />}>
                                            <Icon icon="ci:chat" />
                                        </OverlayTrigger>
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>
                            <span
                                onClick={() => {
                                    chatContext.closeChat('minimize')
                                }}
                                className="minimize chthed-action">
                                <OverlayTrigger delay={{ show: 100, hide: 300 }} overlay={<Tooltip style={{ position: "fixed" }} children={i18n.t('collapse_discussions')} />}>
                                    <Icon icon="mingcute:minimize-fill" /></OverlayTrigger>
                            </span>
                            <span onClick={() => chatContext.closeChat('close')} className="close chthed-action"><OverlayTrigger delay={{ show: 100, hide: 300 }} overlay={<Tooltip style={{ position: "fixed" }} children={i18n.t('close')} />}><Icon icon="ep:close-bold" /></OverlayTrigger></span>
                        </div>
                    </div>
            }
        </div>
    )
}