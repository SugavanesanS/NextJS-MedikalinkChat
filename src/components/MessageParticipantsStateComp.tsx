'use client';
import { Icon } from "@iconify/react"
import { Button, Dropdown, Form, Modal, OverlayTrigger, Tooltip } from "react-bootstrap"
import { shallowEqual, useDispatch, useSelector } from "react-redux"
import { createSelector } from "@reduxjs/toolkit"
import { FC, Fragment, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { AssigneeSearchEnum, ChatUserProfile, DiscussionUser, FBParticipants, VarChar } from "../types/data"
import { ChatPostMessageKey, disStatusOptions, enumDiscussionStatus, GetCurrentUserType, GetCurrentUserTypeInt, GetLoggedUserId, GetMediCenterId, SectionTitle, UserPrefix } from "../services/Constants"
import { ButtonAccessModifier, ScreenLoader, ShortProfileName } from "../services/CommonFunction"
import { useMessageContext } from "../contextAndProvider/MessageProviderWrapper"
import { useGet } from "../api/API"
import { useTimeout } from "../hooks/hooks"
import { Virtuoso } from "react-virtuoso"
import { getParticipants, useOtherFunctionality, useParticipantAddRemoveHook, usePostCall, usePostCreateListener } from "../hooks/ChatHooks"
import { RootState } from "../redux/store"
import { AppURL, MainWithSub } from "../api/AppURL"
import { showError } from "../services/Toastify"
import { useFirebaseAuth } from "../contextAndProvider/FirebaseAuthWrapper"
import { UserBubbleComp } from "./UserBubbleComp"
import i18n from "../services/i18next/i18next"

const userType = GetCurrentUserTypeInt()
const medicalCenterId = GetMediCenterId()

const DataExtract = ({ participants, isCreate }: { participants: (FBParticipants & DiscussionUser) | ChatUserProfile, isCreate: boolean }): {
    id: string | number,
    profilePhoto: string,
    name: string,
    userType: number | string,
} => {

    if (isCreate && 'name' in participants) {
        return {
            id: participants.fb_uid,
            profilePhoto: participants.profile,
            name: `${participants.name}`,
            userType: participants.user_type
        }
    }

    if ('user_profile_photo' in participants) {
        return {
            id: participants.fbUserId,
            profilePhoto: participants.user_profile_photo,
            name: `${participants.prenom} ${participants.nom}`,
            userType: participants.user_type
        }
    }

    return {
        id: participants.fb_uid,
        profilePhoto: participants.profile,
        name: '',
        userType: participants.user_type
    }
}


const UserBubbleList: FC<{ isCreate: boolean, filterParticipants: (FBParticipants & DiscussionUser)[] | ChatUserProfile[], removeUser?: (index: number, user: (FBParticipants & DiscussionUser) | ChatUserProfile) => void }> = ({ filterParticipants, removeUser, isCreate }) => {

    // console.log("filter particpants ", filterParticipants)

    return (
        <div className='group-users'>
            {
                (isCreate ? filterParticipants : filterParticipants.slice(0, 3)).map((user, index) => {
                    const data = DataExtract({ participants: user, isCreate })
                    // console.log(" data ", data)
                    return (
                        <div key={data.id} className='grp-meb'>

                            {data.profile && data.profile.trim() !== ""
                                ? <UserBubbleComp user={user} />
                                : <div className="usr-icon">{ShortProfileName(data.name)}</div>
                            }

                            <span className='usr-nam' title={data.name}>{data.name}</span>
                            {(isCreate && data.userType !== 1) && <span onClick={() => {
                                removeUser && removeUser(index, user)
                            }} className="close"><Icon icon="mdi:close-circle" /></span>}
                        </div>
                    )
                })
            }
            {
                (!isCreate && filterParticipants.length > 3) &&
                <OverlayTrigger
                    placement="bottom"
                    overlay={<Tooltip style={{ position: "fixed" }} >{
                        filterParticipants.map((user) => {
                            return (
                                <Fragment key={user.id}>{DataExtract({ participants: user, isCreate }).name}<br /></Fragment>
                            )

                        })
                    }</Tooltip>}><span className='more-usr'>{`+${filterParticipants.length - 3}`}</span></OverlayTrigger>
            }
        </div>
    )
}



const ParticipantsMenuItems: FC<{ onSelect: (item: ChatUserProfile) => void, discussion_id?: VarChar, searchType: number }> = ({ onSelect, discussion_id, searchType }) => {
    const getHook = useGet<'/discussion/assignee'>({
        'endpoint': '/discussion/assignee',
    })
    const AssigneeType = useSelector((state: RootState) => state.discussion.assignee_search_user_type);
    const timeOut = useTimeout({ duration: 300 })
    const [chatUserList, setChatUserList] = useState<ChatUserProfile[]>([])
    const [searchText, setSearchText] = useState('')

    const initiateApiCall = [
        AssigneeSearchEnum.medecin,
        AssigneeSearchEnum.telesecretaire,
        AssigneeSearchEnum.secretraite,
    ];

    useEffect(() => {
        if (initiateApiCall?.includes(Number(AssigneeSearchEnum[AssigneeType]))) {
            getApiCall();
        } else {
            setChatUserList([])
        }
    }, [AssigneeType])

    const getApiCall = useCallback((text: string = '') => {
        getHook.get?.({
            reqBody: {
                'search': text,
                'type': searchType,
                'search_user_type': AssigneeSearchEnum[AssigneeType],
                'logged_med_center_id': medicalCenterId,
                ...(
                    discussion_id ?
                        {
                            'discussion_id': discussion_id
                        }
                        :
                        {}
                )
            }
        }).then((response) => {
            setChatUserList(response.data)
        }).catch((error) => {
            console.log(error)
        })
    }, [searchType, AssigneeType, discussion_id])

    const searchParticipants = useCallback((text: string) => {
        timeOut.delay(() => {
            if (text) {
                getApiCall(text)
            } else {
                setChatUserList([])
            }
        })
    }, [AssigneeType])
    return (
        <Dropdown.Menu>
            <div className="react-chat-search">
                <Form.Control
                    onChange={(e) => {
                        e.persist()
                        searchParticipants(e.target.value)
                        setSearchText(e.target.value)
                    }}
                    type="text"
                />
            </div>
            {
                (chatUserList.length == 0 && searchText?.length > 0 && !getHook.loader) ? <div className='d-flex justify-content-center align-items-center'>
                    <p className='text-center' style={{ color: 'gray' }} title={i18n.t('no_users_found')}>{i18n.t('no_users_found')}</p>
                </div>
                    :
                    <Virtuoso
                        style={{
                            flex: 1,
                            display: 'flex',
                        }}
                        onEmptied={() =>
                            // (isCreate && filterParticipants.length == 0) &&
                            <div className='grp-meb'>
                                <span className='usr-nam' title={i18n.t('no_users_found')}>{i18n.t('no_users_found')}</span>
                            </div>
                        }
                        totalCount={chatUserList.length}
                        itemContent={(index) => {
                            const item = chatUserList[index]
                            if (item.type) {
                                return (
                                    <Dropdown.Item key={index} className='title'>
                                        <span className="assing_name">{SectionTitle[item.type]}</span>
                                    </Dropdown.Item>
                                )

                            } else {
                                return (
                                    <Dropdown.Item onClick={() => {
                                        onSelect(item)
                                    }} key={item.id}>
                                        <div className="ass-det">
                                            <img className="user-img" src={item.profile} />
                                            <span className='name'>{item.name}</span>
                                            <span className='srch_dob'>{item.dob}</span>
                                        </div>
                                    </Dropdown.Item>
                                )
                            }
                        }}
                    />
            }
        </Dropdown.Menu>
    )
}

const ParticipantsCreateComp = () => {

    const [participants, setParticipants] = useState<Record<string, ChatUserProfile>>({})
    const [pin, setPin] = useState(false)
    const [urgent, setUrgent] = useState(false)
    const [discussionMarkStatus, setDiscussionMarkStatus] = useState<Number>(1)

    const messageContext = useMessageContext()
    const [searchType, setSearchType] = useState(0)
    useImperativeHandle(messageContext.participantsRef, () => participants, [participants])
    useImperativeHandle(messageContext.pinAndUrgentRef, () => ({ pin, urgent }), [pin, urgent])
    useImperativeHandle(messageContext.discussionMarkStatusRef, () => discussionMarkStatus, [discussionMarkStatus])
    const postCall = usePostCall()
    const participantsUserlist = useSelector((state: RootState) => state.discussion.userList);
    const AssigneeType = useSelector((state: RootState) => state.discussion.assignee_search_user_type);

    const discussionStatusSelectedItem = disStatusOptions.filter(p => p.value == discussionMarkStatus);

    usePostCreateListener((data) => {
        if (data.type == ChatPostMessageKey.OPEN_CHAT) {
            if (data.data.reset) {
                setParticipants({})
            }
        }
        if (data.type == ChatPostMessageKey.OPEN_CHAT_INTERNAL) {
            //  console.log("OPEN_CHAT_INTERNAL() ", data.data)
            if (data.data.reset) {
                setParticipants({})
            }
            //patient role, when he add his dossier profile, again his profile should not be added in participants
            if (data.data.user_type == '5' && GetCurrentUserTypeInt() != '5') {
                setParticipants(d => {
                    d[`Patient`] = { ...data.data, ...participantsUserlist[data.data.fb_uid] } as ChatUserProfile

                    return { ...d }
                })

            } else if (data.data.user_type != '5' && data.data.search_type != 1) {
                setParticipants(d => {
                    d[`${(data.data as ChatUserProfile).id.toString()}`] = { ...data.data, ...participantsUserlist[data.data.fb_uid] } as ChatUserProfile
                    return { ...d, ...participantsUserlist[data.data.fbUserId] }
                })
            }
            else if (data.data.search_type == 1) {
                setSearchType(data.data.search_type)
            }

        }
    })

    useEffect(() => {
        if (messageContext.sendWithCloseRef.current && messageContext.sendRef.current) {
            ButtonAccessModifier({
                refs: [messageContext.sendWithCloseRef, messageContext.sendRef],
                state: !(Object.values(participants).length > 0)
            })
        }
    }, [participants])

    return (
        <div className='chat-content-head'>
            <UserBubbleList isCreate={true} filterParticipants={participants ? Object.values(participants) : []} removeUser={(index, user) => {
                // if (messageContext.isCreate && user.user_type == 5) {
                //     messageContext.functionRef.current?.removeAttachment()
                // }
                setParticipants(d => {
                    delete d[user.user_type == '5' ? 'Patient' : (user as ChatUserProfile).id.toString()]
                    return { ...d }
                })
            }} />
            <div className='chtheed-btm'>
                <div className='leftcont'>
                    {(AssigneeType !== 'admin') && <Dropdown className='assigne-dd'>
                        <Dropdown.Toggle className="btn-transparent"><div className='add-usr-icon'><OverlayTrigger delay={{ show: 100, hide: 300 }} overlay={<Tooltip style={{ position: "fixed" }} children={i18n.t('add_to_this_discussion')} />}><span className='iconsty'><Icon icon="ant-design:plus-outlined" /></span></OverlayTrigger><span children={i18n.t('write_to')} /></div></Dropdown.Toggle>
                        <ParticipantsMenuItems onSelect={(user) => {
                            postCall.createInternalWithUser(user)
                        }} searchType={searchType} />
                    </Dropdown>}
                </div>
                <div className='regcont'>
                    {/* <span className='status'>
                        <OverlayTrigger delay={{ show: 100, hide: 300 }}
                            overlay={<Tooltip style={{ position: "fixed" }} children={i18n.t('pin_as_internal_note')} />}>
                            <Icon
                                onClick={() => setPin(d => !d)}
                                color={pin ? '#07669d' : '#99A7B0'} icon={pin ? 'octicon:pin-24' : 'fluent-mdl2:unpin'} />
                        </OverlayTrigger>
                    </span> */}
                    <div className='st-select'>
                        {(GetCurrentUserTypeInt() != '5') && (
                            <Form.Select style={{ backgroundColor: discussionStatusSelectedItem[0].color }}

                                value={discussionMarkStatus.toString()}
                                onChange={(e) => {
                                    setDiscussionMarkStatus(Number(e.target.value))
                                }}>
                                {disStatusOptions.map((option, index) => (
                                    <option key={index} value={option.value} >{option.label}</option>)
                                )}
                            </Form.Select>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}


const ParticipantsUpdateComp = () => {
    const fbUserId = useFirebaseAuth().fbUid
    const participants = useSelector((state: RootState) => getParticipants(state, fbUserId), shallowEqual)
    const { updateUrgent, updatePin, updateDiscussionMarkStatus } = useOtherFunctionality()
    const discussion = useSelector((state: RootState) => state.discussion.currentFBDiscussionInfo)
    const discussionId = useSelector((state: RootState) => state.discussion.currentDiscussionId)
    const addRemoveParticipant = useParticipantAddRemoveHook()
    const patientDetails = participants?.filterParticipants.find((user) => (user?.userType?.toString() == '5'))
    const messageContext = useMessageContext()
    const [show, setShow] = useState<boolean>(false)
    const userData = useRef<any>(null)
    const [discussionMarkStatus, setDiscussionMarkStatus] = useState<Number>(1)

    const userType = GetCurrentUserType()
    const userId = GetLoggedUserId()

    const folderEndPoint = `${MainWithSub}/${userType}/${userId}/patient/dossier/*id*?fb_flag=1`;

    useEffect(() => {
        if (participants.participants && participants.participants?.[fbUserId!]?.participantStatus?.toString() && fbUserId) {
            if (participants.participants?.[fbUserId]?.participantStatus != 1) {
                messageContext?.closeChat?.('close')
            }
        }
    }, [fbUserId, participants.participants])

    const discussionStatusSelectedItem = disStatusOptions.filter(p => p.value == discussion?.discussionMarkStatus);

    const isAdminChat = useMemo(() => {
        return participants.filterParticipants.some((p) => p.userType == 1)
    }, [participants.filterParticipants])

    return (
        <div className='chat-content-head'>
            <UserBubbleList filterParticipants={participants.filterParticipants} isCreate={false} />
            <div className='chtheed-btm'>
                <div className='leftcont'>
                    {!messageContext.deadChat && (
                        <Fragment>
                            {participants.filterParticipants.length >= 2 && <Dropdown className='assigne-dd rem-des'>
                                <Dropdown.Toggle className="btn-transparent"><div className='add-usr-icon'><OverlayTrigger delay={{ show: 100, hide: 300 }} overlay={<Tooltip style={{ position: "fixed" }} children={i18n.t('remove_from_this_discussion')} />}><span className='iconsty'><Icon icon="akar-icons:minus" /></span></OverlayTrigger></div></Dropdown.Toggle>
                                <Dropdown.Menu className="rem-ass">
                                    {
                                        participants.filterParticipants.map((user, index) => {
                                            return <Dropdown.Item onClick={() => { setShow(true); userData.current = user }} key={index}>
                                                <div className="dd-item">
                                                    <span style={{ color: user.blocked_flag == true ? 'red' : 'black' }}> {`${UserPrefix[user.userType]}${user.prenom} ${user.nom}`}</span>
                                                    <Icon icon="ep:close-bold" />
                                                </div>
                                            </Dropdown.Item>
                                        })
                                    }
                                    {participants.filterParticipants.length == 0 && <Dropdown.Item className="no-rec" children={i18n.t("No_users_assign")} />}
                                </Dropdown.Menu>
                            </Dropdown>}
                            {!isAdminChat && <Dropdown className='assigne-dd'>
                                <Dropdown.Toggle className="btn-transparent"><div className='add-usr-icon'><OverlayTrigger delay={{ show: 100, hide: 300 }} overlay={<Tooltip style={{ position: "fixed" }} children={i18n.t('add_to_this_discussion')} />}><span className='iconsty'><Icon icon="ant-design:plus-outlined" /></span></OverlayTrigger><span className="dis-span" children={i18n.t('add_to_this_discussion')} /></div></Dropdown.Toggle>
                                <ParticipantsMenuItems onSelect={
                                    (user) => {
                                        if (user.user_type == 5
                                            &&
                                            Object.values(participants.participants).some((u) => {
                                                return u.user_type == 5 && u.id != user.id
                                            })) {
                                            showError(i18n.t('patient_already_in_discussion'))
                                            return
                                        }
                                        if (Object.values(participants.participants).some((u) => {
                                            return (u.fbUserId == user.fb_uid && u.participantStatus == 1 && (u.discussionStatus == 1 || u.discussionStatus == 2))
                                        })) {
                                            //  console.log(Object.values(participants.participants).find((u) => u.fbUserId == user.fb_uid))
                                            showError(i18n.t('user_already_in_discussion'))
                                            return
                                        }

                                        ScreenLoader(true)
                                        addRemoveParticipant.add(user).then(() => {
                                            ScreenLoader(false)
                                        }).catch(() => {
                                            ScreenLoader(false)
                                        })
                                    }
                                } discussion_id={discussion?.guid || ''} />
                            </Dropdown>}
                        </Fragment>
                    )}
                </div>
                <div className='regcont'>
                    {
                        !messageContext.deadChat && (
                            <Fragment>
                                {/* <span className='status'>
                                    <OverlayTrigger delay={{ show: 100, hide: 300 }}
                                        overlay={<Tooltip style={{ position: "fixed" }} children={i18n.t('pin_as_internal_note')} />}>
                                        <Icon onClick={() => updatePin(!discussion?.pin)} color={discussion?.pin ? '#07669d' : '#99A7B0'} icon={discussion?.pin ? 'octicon:pin-24' : 'fluent-mdl2:unpin'} />
                                    </OverlayTrigger>
                                </span> */}
                                {(GetCurrentUserTypeInt() != '5') && <div className='st-select'>
                                    <Form.Select style={{ backgroundColor: discussionStatusSelectedItem[0]?.color || 'gray' }}
                                        value={discussion?.discussionMarkStatus?.toString() || "1"}
                                        onChange={(e) => {
                                            setDiscussionMarkStatus(Number(e.target.value))
                                            updateDiscussionMarkStatus(Number(e.target.value))
                                        }}>
                                        {disStatusOptions.map((option, index) => (
                                            <option key={index} value={option.value} >{option.label}</option>)
                                        )}
                                    </Form.Select>
                                </div>}
                            </Fragment>
                        )
                    }

                    {userType != '5' && patientDetails?.fbUserId && <Button className="outline-btn btn-sm" target="_blank" disabled={!patientDetails?.fbUserId}
                        href={folderEndPoint.replace('*id*', patientDetails?.fbUserId?.toString())}
                        children={GetCurrentUserTypeInt() == "7" ? i18n.t('patient_profile') : i18n.t('view_medical_records')}
                    />}
                </div>
            </div>
            <Modal className="cht-modal" show={show} onHide={() => {
                setShow(false)
            }} aria-labelledby="contained-modal-title-vcenter" >
                <Modal.Header closeButton />
                <Modal.Body>
                    <div className="delete-msg">
                        <h6 children={i18n.t('remove_person')} />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button className="btn-transparent" onClick={() => {
                        setShow(false)
                    }} children={i18n.t('cancle')} />
                    <Button className="red-btn" onClick={() => {
                        ScreenLoader(true)
                        addRemoveParticipant.remove(userData.current)
                            .then(() => {
                                ScreenLoader(false)
                            })
                            .catch(() => {
                                ScreenLoader(false)
                            })
                        setShow(false)
                    }} children={i18n.t('delete')} />
                </Modal.Footer>
            </Modal>
        </div>
    )

}

export const MessageParticipantsStateComp = () => {
    const messageContext = useMessageContext()
    return messageContext.isCreate ? <ParticipantsCreateComp /> : <ParticipantsUpdateComp />

}
