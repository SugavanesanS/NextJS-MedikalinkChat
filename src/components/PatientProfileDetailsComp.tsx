'use client';
import { createSelector } from "@reduxjs/toolkit";
import React, { FC, memo, useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { shallowEqual, useSelector } from "react-redux";
import { useGet } from "../api/API";
import { AppURL, MainWithSub } from "../api/AppURL";
import { useMessageContext } from "../contextAndProvider/MessageProviderWrapper";
import { RootState } from "../redux/store";
import { FadeOpenClose } from "../services/FadeOpenClose";
import i18n from '../services/i18next/i18next';
import { DiscussionDetails, DiscussionUser, FBParticipants } from "../types/data";
import { GetCurrentUserType, GetCurrentUserTypeInt, GetLoggedUserId } from "../services/Constants";


const loggedUserType = GetCurrentUserTypeInt()

const getPatient = createSelector([state => state.discussion.currentFBDiscussionInfo?.participantsWithDetails, (state: RootState) => state.discussion.currentDiscussionId],
    (participantsWithDetails: Record<number, (FBParticipants & DiscussionUser)> | undefined | null, discussionId): { patient: (FBParticipants & DiscussionUser), discussionId: number | string } => {
        let result = {
            patient: {},
            discussionId
        } as { patient: (FBParticipants & DiscussionUser), discussionId: number | string };
        (participantsWithDetails) && Object.keys(participantsWithDetails).forEach((key) => {
            if (participantsWithDetails[key]?.userType == '5') {
                result = {
                    ...result,
                    patient: participantsWithDetails[key]
                }
            }

        })
        return result
    })

type PatientProfileDetailsCompType = {
    patientDetails: DiscussionDetails | null,
    setPatientDetails: React.Dispatch<React.SetStateAction<DiscussionDetails | null>>
}

const PatientProfileDetailsComp: FC<PatientProfileDetailsCompType> = ({ patientDetails, setPatientDetails }) => {
    const messageContext = useMessageContext()
    const info = useSelector(getPatient, shallowEqual)
    const currentFBDiscussion = useSelector((state: RootState) => state.discussion.currentFBDiscussionInfo);

    const discussionDetails = useGet<'/discussion/patient-detail'>({
        'endpoint': '/discussion/patient-detail'
    })

    const userType = GetCurrentUserType()
    const userId = GetLoggedUserId()

    const folderEndPoint = `${MainWithSub}/${userType}/${userId}/patient/dossier/*id*?fb_flag=1`;


    useEffect(() => {
        if (messageContext.view == 'profile' && !info.patient.fbUserId) {
            messageContext.setView('chat')
        }

        // get patient details if patient id is present
        if (info.patient.fbUserId) {
            discussionDetails.get?.({
                reqBody: {
                    'id': info.patient.fbUserId,
                    'discussion_id': currentFBDiscussion?.guid
                }
            }).then((data) => {
                setPatientDetails(data.data)
            })
        }

    }, [currentFBDiscussion?.discussionId])

    return (
        <FadeOpenClose inProp={messageContext.view == 'profile'}>
            <div className={'patient-profile-details'}>
                <div className="pro-head">
                    <div className="pro-head-det">
                        <img width={30} height={30} src={patientDetails?.profile} />
                        <div className="pro-usr-name"><h5 className="pr-name">{patientDetails?.name}</h5><span className="pr-sts">{[patientDetails?.age, patientDetails?.gender].filter(obj => obj).join(' | ') || '-'}</span></div>
                    </div>
                    {(
                        loggedUserType != '5' && <div className="pro-head-btn">
                            <Button target="_blank"
                                href={folderEndPoint.replace('*id*', info?.patient?.fbUserId?.toString())}
                                className="outline-btn btn-sm"
                                children={GetCurrentUserTypeInt() == "7" ? i18n.t('patient_profile') : i18n.t('view_medical_records')}
                            />
                        </div>
                    )}
                </div>
                <div className="pro-det">
                    <div className="fir-row">
                        <div className="prodet-outer">
                            <div className="add-fld">
                                <div className="lable" children={i18n.t('address')} />
                                <div className="value">{patientDetails?.addresse || '-'}</div>
                            </div>
                        </div>
                        <div className="prodet-outer">
                            <div className="cp-fld">
                                <div className="lable" children={i18n.t('cp_city')} />
                                <div className="value">{patientDetails?.ville || '-'}</div>
                            </div>
                        </div>
                        <div className="prodet-outer">
                            <div className="date-fld">
                                <div className="lable" children={i18n.t('date_of_birth')} />
                                <div className="value">{patientDetails?.dob || '-'}</div>
                            </div>
                        </div>
                        <div className="prodet-outer">
                            <div className="email-fld">
                                <div className="lable" children={i18n.t('email')} />
                                <div className="value">{patientDetails?.email || '-'}</div>
                            </div>
                        </div>
                    </div>
                    <div className="sec-row">
                        <div className="prodet-outer">
                            <div className="add-fld">
                                <div className="lable" children={i18n.t('cellular')} />
                                <div className="value">{patientDetails?.port || '-'}</div>
                            </div>
                        </div>
                        <div className="prodet-outer">
                            <div className="add-fld">
                                <div className="lable" children={i18n.t('cell_number')} />
                                <div className="value">{patientDetails?.telephone || '-'}</div>
                            </div>
                        </div>
                        <div className="prodet-outer">
                            <div className="add-fld">
                                <div className="lable" children={i18n.t('emergency_number')} />
                                <div className="value">{patientDetails?.number_urgence || '-'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="pro-det-btm">
                    <h6 className="tit" children={i18n.t('name_of_attending_physician')}></h6>
                    <div className="docdet-outer">
                        {
                            patientDetails?.sub_doctor && Object.values(patientDetails?.sub_doctor).reduce((pre, curr, index, array) => {
                                if (curr.doctor_name) {
                                    pre.push(
                                        (
                                            <div key={curr.pat_doct_id} className="doc-det">
                                                <h5 className="doc-name">{curr.doctor_name}</h5>
                                                <div className="doc-add">{curr.disp_doctor_fulladdress || '-'}</div>
                                                <span className="docmail">{curr.doctor_email || '-'}</span>
                                            </div>
                                        ) as never
                                    )
                                }
                                if (index == array.length - 1 && !pre.length) {
                                    pre.push(
                                        (
                                            <style>
                                                {
                                                    ` .pro-det-btm { display : none } `
                                                }
                                            </style>
                                        ) as never
                                    )
                                }
                                return pre
                            }, [] as never[])
                        }

                    </div>
                </div>
            </div>
        </FadeOpenClose>
    )
}

export default memo(PatientProfileDetailsComp);