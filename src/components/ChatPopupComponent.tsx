'use client';
import { Form } from "react-bootstrap";
import { useMessageContext } from "../contextAndProvider/MessageProviderWrapper";
import { IDs } from "../services/Constants";
import { ChatBubbleAndCreateComp } from "./ChatBubbleAndCreateComp";
import { ChatMessagesComp } from "./ChatContentComp";
import { ChatFooterInputComp } from "./ChatFooterInputComp";
import { ChatHeaderComp } from "./ChatHeaderComp";
import { MessageParticipantsStateComp } from "./MessageParticipantsStateComp";
import OpenWrapper from "./OpenWrapper";
import { useCallback, useState } from "react";
import TeleconsultationModal from "./modal/TeleconsultationModal";
import { DiscussionDetails, DiscussionRDVDetails } from "../types/data";
import TeleconsultationInvitationPopup from "./modal/TeleconsultationInvitationPopup";
import PatientProfileDetailsComp from "./PatientProfileDetailsComp";

export const ChatPopupComponent = () => {
    const messageContext = useMessageContext()
    const [state, setState] = useState({
        showTeleconsultationModal: false,
        invitation: false
    });
    const [patientDetails, setPatientDetails] = useState<DiscussionDetails | null>(null)

    const handlePopupCallback = useCallback((type?: 'teleconsult' | 'invitation') => {
        if (type === 'teleconsult') {
            setState((state) => ({ ...state, showTeleconsultationModal: true }))
        } else if (type === 'invitation') {
            setState((state) => ({ ...state, invitation: true }))
        }
    }, [state])
    

    return (
        <div className="react-multi-chat">
            <OpenWrapper id={IDs.chatWrapper} isOpen={messageContext.isOpen}>
                <div className="chat-outerbox">
                    <ChatHeaderComp rdv_invitation={patientDetails?.rdv_invitation} callback={handlePopupCallback} />
                    <div className="d-flex flex-column position-relative" style={{ flex: 1 }}>
                        <MessageParticipantsStateComp />
                        {
                            messageContext.isCreate ?
                                <div className="d-flex flex-column new-chat-content" style={{
                                    flex: 1,
                                }}>
                                    <Form.Control className="form-grey" onChange={(e) => {
                                        messageContext.subjectRef && (messageContext.subjectRef.current = e.target.value)
                                    }} type="text" placeholder="Objet" />
                                </div> : <ChatMessagesComp />
                        }
                        {!messageContext.deadChat && <ChatFooterInputComp />}
                        <PatientProfileDetailsComp patientDetails={patientDetails} setPatientDetails={setPatientDetails} />
                    </div>
                </div>
            </OpenWrapper>
            <ChatBubbleAndCreateComp />
            {
                state.showTeleconsultationModal && <TeleconsultationModal
                    show={state.showTeleconsultationModal}
                    handleClose={(data?: DiscussionRDVDetails) => {
                        if (data) {
                            setPatientDetails((details) => details ? ({ ...details, rdv_invitation: data }) : details)
                        }
                        setState((state) => ({ ...state, showTeleconsultationModal: !state.showTeleconsultationModal }))
                    }}
                />
            }
            {
                <TeleconsultationInvitationPopup
                    show={state.invitation}
                    handleClose={(data?: DiscussionRDVDetails) => {
                        if (data) {
                            setPatientDetails((details) => details ? ({ ...details, rdv_invitation: data }) : details)
                        }
                        setState((state) => ({ ...state, invitation: false }))
                    }}
                    rdv_invitation={patientDetails?.rdv_invitation}
                />
            }
        </div>
    )
}