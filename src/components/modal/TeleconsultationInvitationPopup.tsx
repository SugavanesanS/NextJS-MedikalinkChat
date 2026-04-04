import React, { FC, Fragment, memo, useCallback } from 'react'
import { Modal, Spinner } from 'react-bootstrap'
import { DiscussionRDVDetails, enumUserType } from '../../types/data'
import i18n, { getLocalization } from '../../services/i18next/i18next'
import moment from 'moment'
import { usePost } from '../../api/API'
import { showError, showSuccess } from '../../services/Toastify'
import { GetCurrentUserTypeInt } from '../../services/Constants'
import useZoomMeeting from '../../hooks/UseZoomMeeting'

type TeleconsultationInvitationPopupType = {
    show: boolean,
    handleClose: (data?: DiscussionRDVDetails) => void
    rdv_invitation?: DiscussionRDVDetails
}

const TeleconsultationInvitationPopup: FC<TeleconsultationInvitationPopupType> = ({ show, handleClose, rdv_invitation }) => {

    const CurrentUserType = GetCurrentUserTypeInt()
    const isDoctor = Number(CurrentUserType) == enumUserType.DOCTOR
    const zoomMeeting = useZoomMeeting({ forLink: true })

    const ApiStatusCall = usePost<'/appointment/respond-to-invitation'>({
        endpoint: '/appointment/respond-to-invitation'
    })

    const handleAcceptReject = (type: 'accept' | 'reject' | 'cancel') => {

        const requestStatus = type === 'accept' ? 2 : type === 'reject' ? 3 : 4

        ApiStatusCall?.post?.({
            reqBody: {
                invitation_id: rdv_invitation?.invitation_id || '',
                status: requestStatus
            }
        })
            .then((res) => {
                handleClose(res.data)
                const successString = type === 'accept' ?
                    i18n.t('teleconsultation_invitation_accepted')
                    : type == 'reject' ? i18n.t('teleconsultation_invitation_declined')
                        : i18n.t('teleconsultation_invitation_cancelled')
                showSuccess(successString)
            })
            .catch((err) => {
                showError(err?.data?.message || i18n.t('something_went_wrong'))
                console.log(err)
            })
    }

    const openZoomMeeting = useCallback(() => {
        zoomMeeting.open(rdv_invitation?.rdv?.doctor_meeting_url || '')
        handleClose()
    }, [rdv_invitation])

    return (
        <Modal className="teleconsultationmodal  invite-popup" show={show} onHide={handleClose} aria-labelledby="contained-modal-title-vcenter" >

            <Modal.Header closeButton />
            <Modal.Body>
                <div className='teleconsultation-confirm-body'>

                    <div className='title-container'>
                        <span className=''>{i18n.t('invite_to_continue_discussion', {
                            doctor_name: rdv_invitation?.doctor_name,
                            date: moment(rdv_invitation?.rdv_start_date).locale(getLocalization()).format("DD MMMM YYYY"),
                            time: moment(rdv_invitation?.rdv_start_date).locale(getLocalization()).format("HH:mm")
                        })} </span>
                        <p className='sub-title'>{i18n.t('the_fee_is', { fee: rdv_invitation?.price }) + " " + i18n.t('currency')}</p>
                        {!isDoctor && <p className='sub-title'>{i18n.t('do_you_accept')}</p>}
                    </div>

                    <div className='teleconsultation-confirm-buttons-container' style={{ alignSelf: 'center' }} >
                        {
                            isDoctor ?
                                <Fragment>
                                    {/* <button className='btn-cancel' disabled={ApiStatusCall?.loader} onClick={() => handleAcceptReject('cancel')}>
                                        {i18n.t('cancle')}
                                    </button> */}
                                    {rdv_invitation?.status == 2 && <button className='btn btn-primary' disabled={ApiStatusCall?.loader} onClick={openZoomMeeting}>
                                        {i18n.t('to_start')}
                                    </button>}
                                </Fragment>
                                :
                                <Fragment>
                                    <button className='btn-delete' disabled={ApiStatusCall?.loader} onClick={() => handleAcceptReject('reject')}>
                                        {i18n.t('decline')}
                                    </button>
                                    <button className='btn btn-primary' disabled={ApiStatusCall?.loader} onClick={() => handleAcceptReject('accept')}>
                                        {i18n.t('accept')}
                                    </button>
                                </Fragment>
                        }

                    </div>

                </div>
            </Modal.Body>
        </Modal>
    )
}

export default memo(TeleconsultationInvitationPopup)