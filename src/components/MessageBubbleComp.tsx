import { Icon } from "@iconify/react";
import moment from "moment";
import { FC, Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Button, Dropdown, Modal, OverlayTrigger } from "react-bootstrap";
import { useGet } from "../api/API";
import { FileExtToImage, OtherURL } from "../api/AppURL";
import { useFirebaseAuth } from "../contextAndProvider/FirebaseAuthWrapper";
import { useDownloadFileWithProgress } from "../hooks/hooks";
import * as indexDB from '../services/CacheWithIndexeddb';
import { ChatAttachDownloadPath, clm, FileViewer, PDFToBase64, ReduceFileName, ShortProfileName, TimeCheckAndConvert } from "../services/CommonFunction";
import { GetCurrentUserName, GetCurrentUserTypeInt, GetLoggedUserId, UserPrefix } from "../services/Constants";
import i18n from "../services/i18next/i18next";
import { AttachmentData, ChatMessageFireBase, DiscussionUser, FBParticipants, shareFileReqType } from "../types/data";
import { HighlightUrls, UserImageOrName } from "./CommonComponents";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import AudioPlayerComp, { AudioSingleton } from "./AudioPlayerComp";
import { UserBubbleComp } from "./UserBubbleComp";
import { PatientFolderFileModal } from "./modal/PatientFolderFileModal";
import { useMessageContext } from "../contextAndProvider/MessageProviderWrapper";
import CreateFolderModal, { shareFileType } from "./modal/CreateFolderModal";
import UploadModal from "./modal/UploadModal";
import { some } from "lodash";


const userId = GetLoggedUserId()
const userName = GetCurrentUserName()

function GetUnreadUser(unreadMessageUserCount, message, userList) {
    let readbyUser: Array<string> = Object.keys(unreadMessageUserCount)
        .filter(userId => unreadMessageUserCount[userId] === 0 && userId !== message.sentByFbUserId)
        .map(userId => userList[userId]?.nom)


    return readbyUser
    //.join(', ');

    //   return readbyUser.length > 0 ?  i18n.t('seenby') + readbyUser : '' 
}

function unreadUserExists(unreadMessageUserCount, message) {
    let readbyUser: Array<string> = Object.keys(unreadMessageUserCount)
        .filter(userId => unreadMessageUserCount[userId] === 0 && userId !== message.sentByFbUserId)

    return readbyUser.length != 0 ? true : false
}

const ReadMessageUsers: FC<{ readUsers?: Record<string, []>, message, userList }> = ({ readUsers, message, userList }) => {

    return (

        <div>
            {
                GetUnreadUser(readUsers, message, userList).map((readUser) => (
                    <div className="seenUserName">
                        {readUser}
                    </div>
                ))
            }
        </div>

    )
}


export const MessageBubbleComp: FC<ChatMessageFireBase & { messageDelete: (messageId: string, discussionId: string) => void, unreadMessageUserCount: Record<string, []>, lastMessage: { id: string } }> = ({ messageDelete, unreadMessageUserCount, lastMessage, ...message }) => {
    const [show, setShow] = useState(false);
    const firebaseAuth = useFirebaseAuth()
    const type = message.sentByFbUserId == firebaseAuth.fbUid
    const isLastMessage = lastMessage.id == message.id
    const userList = useSelector((state: RootState) => state.discussion.userList)

    const user = userList[message.sentByFbUserId]
    const sentToUser = userList[message.sentToId]


    const seenPopover = (
        <div className="seenPopup" style={{ zIndex: 1000, width: '200px' }}><div>  <ReadMessageUsers readUsers={unreadMessageUserCount} message={message} userList={userList}></ReadMessageUsers></div></div>
    );


    return (
        <Fragment key={message.id}>
            {message.type.toString() != "0" && <div style={{ height: 5 }} />}
            <div id={message.id} key={message.id} className={clm(
                {
                    "my-msg": type,
                    "other-msg": !type,
                    "msg-item": true
                }
            )} >
                {
                    (() => {
                        switch (message.type.toString()) {
                            case "0":
                                return <div className="deleted-msg">
                                    <span  >
                                        <Icon icon="mdi:block" width="18" height="18" /> {i18n.t('deleted_message')}</span>
                                </div>
                            case "1":
                                return type ?
                                    (
                                        <div className='msg-data'>
                                            <HighlightUrls text={message.messageText} />
                                            <div style={{ flex: 1, display: 'flex' }}>
                                                <div className='time-sec'>{`${moment(TimeCheckAndConvert(message.sentAt)).format('DD/MM/YYYY')} ${i18n.t('at')} ${moment(TimeCheckAndConvert(message.sentAt)).format('HH:mm')}`}</div>
                                                <div>
                                                    {(isLastMessage && unreadUserExists(unreadMessageUserCount, message)) &&

                                                        (<Dropdown className='assigne-dd'>
                                                            <Dropdown.Toggle className="btn-transparent">
                                                                <OverlayTrigger delay={{ show: 100, hide: 300 }} overlay={seenPopover} >
                                                                    <Icon icon="mdi:eye" width="20" height="20"></Icon>
                                                                </OverlayTrigger>
                                                            </Dropdown.Toggle>
                                                        </Dropdown>)

                                                    }
                                                </div>

                                            </div>
                                            <Button className='btn-transparent msg-delete' onClick={() => {
                                                setShow(true)
                                            }}><Icon icon="mdi:close-circle" /></Button>


                                        </div>

                                    )
                                    :
                                    (
                                        <>
                                            {user?.has_profile_pic == 1 ? <UserBubbleComp user={user} /> : <div className="usr-icon">{ShortProfileName(`${user?.prenom} ${user?.nom}`)}</div>}

                                            <div className='send-detail'><span className='send-name'>{message.sentByName}</span></div>
                                            <div className='msg-data'>
                                                <HighlightUrls text={message.messageText} />
                                                <div className='time-sec'>{`${moment(TimeCheckAndConvert(message.sentAt)).format('DD/MM/YYYY')} ${i18n.t('at')} ${moment(TimeCheckAndConvert(message.sentAt)).format('HH:mm')}`}</div>
                                            </div>
                                        </>
                                    )
                            case "2":
                                return (
                                    <div className="days-tag"><span>{i18n.t('you_added_Dr_to_this_conversation_on',
                                        {
                                            you: message?.sentByFbUserId == firebaseAuth.fbUid ? i18n.t("you") :  UserPrefix[user?.user_type]  + `${user?.prenom} ${user?.nom}`,
                                                to: message?.sentToId == userId ? i18n.t("you") : ((sentToUser?.user_type == 4 ? "le " : '') + UserPrefix[sentToUser?.user_type]  + `${sentToUser?.prenom} ${sentToUser?.nom}`),
                                            date: moment(TimeCheckAndConvert(message.sentAt)).format(`DD/MM/YYYY`),
                                            time: moment(TimeCheckAndConvert(message.sentAt)).format(`HH:mm`)
                                        })}</span>
                                    </div>
                                )
                            case "3":
                                return type ? (
                                    <FileBubbleWithPreview message={message} previewPath={null} deleteOpen={() => setShow(true)} isLastMessage={isLastMessage} unreadMessageUserCount={unreadMessageUserCount} />

                                ) : (
                                    <FileBubbleWithDownload userList={userList} previewPath={null} message={message} />

                                )

                            case "4":
                                return (
                                    <div className="days-tag left-msg"><span>{
                                        i18n.t('you_removed_Dr_from_this_conversation',
                                            {
                                                you: message?.sentByFbUserId == firebaseAuth.fbUid ? i18n.t("you") :  UserPrefix[user.user_type]  + `${user?.prenom} ${user?.nom}`,
                                                to: message?.sentToId == userId ? i18n.t("you") : ((sentToUser.user_type == 4 ? "le " : '') + UserPrefix[sentToUser.user_type]  + `${sentToUser?.prenom} ${sentToUser?.nom}`),
                                                date: moment(TimeCheckAndConvert(message.sentAt)).format(`DD/MM/YYYY`),
                                                time: moment(TimeCheckAndConvert(message.sentAt)).format(`HH:mm`)
                                            })}</span>
                                    </div>
                                )
                            case "7":
                                const userData = userList[message.sentByFbUserId]
                                const objectDetails = {
                                    'newObject': message.objectText,
                                    'oldObject': message.oldObjectText,
                                    'logedDoctor': `${UserPrefix?.[userData?.user_type] ? `${UserPrefix?.[userData.user_type]} ` : ''}${userData?.prenom} ${userData?.nom}`
                                }
                                return (
                                    <div className="days-tag"><span>{i18n.t('changed_the_subject_of'
                                        , {
                                            you: message?.sentByFbUserId == firebaseAuth.fbUid ? i18n.t("you") : objectDetails?.logedDoctor,
                                            old: objectDetails?.oldObject || i18n.t('no_object'),
                                            new: objectDetails?.newObject || i18n.t('no_object'),
                                            date: moment(TimeCheckAndConvert(message.sentAt)).format('DD/MM/YYYY'),
                                            time: moment(TimeCheckAndConvert(message.sentAt)).format('HH:mm')
                                        }
                                    )}</span>
                                    </div>
                                )
                            case "8":
                                  const sentUserData = userList[message.sentByFbUserId]
                                return (
                                    <div className="days-tag"><span>{i18n.t('teleconsultation_added_to_discussion'
                                        , {
                                            you: message?.sentByFbUserId == firebaseAuth.fbUid ? i18n.t("you") : sentUserData?.prenom + ' ' + sentUserData?.nom,
                                            date: moment(TimeCheckAndConvert(message.sentAt)).format('DD/MM/YYYY'),
                                            time: moment(TimeCheckAndConvert(message.sentAt)).format('HH:mm')
                                        }
                                    )}</span>
                                    </div>
                                )
                            default:
                                return (<></>)
                        }
                    })()
                }
            </div>

            {message.type.toString() != "0" && <div style={{ height: 5 }} />}
            <Modal className="cht-modal" show={show} onHide={() => {
                setShow(false)
            }} aria-labelledby="contained-modal-title-vcenter" >
                <Modal.Header closeButton />
                <Modal.Body>
                    <div className="delete-msg">
                        <h6 children={i18n.t('delete-msg')} />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button className="btn-transparent" onClick={() => {
                        setShow(false)
                    }} children={i18n.t('cancle')} />
                    <Button className="red-btn" onClick={() => {
                        messageDelete(message.id, message.discussionId.toString())
                        setShow(false)
                    }} children={i18n.t('delete')} />
                </Modal.Footer>
            </Modal>
        </Fragment>
    )
}

export const FileBubbleWithPreview = ({ message, previewPath, deleteOpen, isLastMessage, unreadMessageUserCount }: { message: ChatMessageFireBase, previewPath: string | null, deleteOpen: () => void, isLastMessage: boolean, unreadMessageUserCount: Record<string, []> }) => {
    const ref = useRef<HTMLImageElement | null>(null);
    const getPath = useGet<'/get-attachment'>({
        endpoint: '/get-attachment'
    })
    const [mainUrl, setMainUrl] = useState<AttachmentData | null>(null);
    const userList = useSelector((state: RootState) => state.discussion.userList)

    useEffect(() => {

        if (ref.current) {
            if (message.attachment?.fileName.includes('.mp3') || message.attachment?.type == 'mp3') return
            if (mainUrl) {
                if (message.messageText != 'photo') {
                    PDFToBase64(mainUrl.preview_path, ref).then(() => {
                        if (ref.current) {
                            ref.current.setAttribute('style', 'object-fit: cover;')
                            ref.current.classList.add('cursor-pointer')
                        }
                    })
                } else {
                    ref.current.src = mainUrl.file_path
                    ref.current.setAttribute('style', 'object-fit: contain;')
                    ref.current.classList.add('cursor-pointer')
                }
            }
        }

    }, [message.messageText, mainUrl]);

    useEffect(() => {
        indexDB.getWithExpiry<AttachmentData>(`${message.discussionId}-${message?.attachment?.uuid}`)
            .then((data) => {
                if (data) {
                    setMainUrl(data)
                } else {
                    getPath?.get?.({
                        reqBody: {
                            aid: message?.attachment?.uuid
                        }
                    }).then((data) => {
                        setMainUrl(data.data)
                        indexDB.setWithExpiry<AttachmentData>(`${message.discussionId}-${message?.attachment?.uuid}`, data.data)
                    })
                }
            }).catch(() => {
                getPath?.get?.({
                    reqBody: {
                        aid: message?.attachment?.uuid
                    }
                }).then((data) => {
                    setMainUrl(data.data)
                    indexDB.setWithExpiry<AttachmentData>(`${message.discussionId}-${message?.attachment?.uuid}`, data.data)
                })
            })


    }, [message.attachment?.uuid]);


    const fileTypeName = message?.attachment?.name?.split('.').pop()?.toLocaleLowerCase()
    const fileName = message?.attachment?.name?.split('.')[0].toLocaleLowerCase()


    const seenPopover = (
        <div className="seenPopup" style={{ zIndex: 1000, width: '200px' }}><div>  <ReadMessageUsers readUsers={unreadMessageUserCount} message={message} userList={userList}></ReadMessageUsers></div></div>
    );


    return (
        <div className='msg-data'>
            <div className='msg-content attach-content'>
                {
                    message.attachment?.type == 'mp3' ?
                        <div className="d-flex">
                            <AudioPlayerComp uri={mainUrl?.file_path || ''} name={message?.attachment?.name} id={message?.attachment?.uuid} />
                        </div>
                        :
                        <>
                            <div className="msg-file">
                                <div onClick={() => {
                                    FileViewer({ filePath: mainUrl?.preview_path || '', fileType: message.messageText == 'photo' ? 'image' : 'pdf' })
                                }} className="file-img">
                                    <img ref={ref} src={OtherURL.loader} />
                                </div>
                            </div>
                            <div className="file-sec  file-sec-btm">
                                <div className="file-name">
                                    {message.messageText != 'photo' &&
                                        <span className="doc-icon">
                                            {
                                                <img src={FileExtToImage[fileTypeName as any]} />
                                            }
                                        </span>
                                    }
                                    <span title={message.attachment?.name} className="file-name-info">{ReduceFileName(message.attachment?.name)}</span>
                                </div>
                            </div>
                        </>
                }
            </div>
            <div style={{ flex: 1, display: 'flex' }}>
                <div className='time-sec'>{`${moment(TimeCheckAndConvert(message.sentAt)).format('DD/MM/YYYY')} ${i18n.t('at')} ${moment(TimeCheckAndConvert(message.sentAt)).format('HH:mm')}`}</div>
                {(isLastMessage && unreadUserExists(unreadMessageUserCount, message)) && (
                    <Dropdown className='assigne-dd'>
                        <Dropdown.Toggle className="btn-transparent">
                            <OverlayTrigger delay={{ show: 100, hide: 300 }} overlay={seenPopover} >
                                <Icon icon="mdi:eye" width="20" height="20"></Icon>
                            </OverlayTrigger>
                        </Dropdown.Toggle>
                    </Dropdown>
                )}


            </div>
            <span className='msg-delete'><Icon onClick={() => {
                AudioSingleton.destroyInstance(message?.attachment?.uuid)
                deleteOpen()
            }} icon="mdi:close-circle" /></span>
        </div>
    )
}

export const FileBubbleWithDownload = ({ message, previewPath, userList }: { message: ChatMessageFireBase, previewPath: string | null, userList: Record<string, DiscussionUser> }) => {
    const ref = useRef<HTMLImageElement | null>(null);
    const fileDownload = useDownloadFileWithProgress()
    const downloadPath = ChatAttachDownloadPath({
        fileName: message?.attachment?.fileName,
        id: message?.attachment?.id?.toString(),
        discussionId: message.discussionId.toString()
    });
    const getPath = useGet<'/get-attachment'>({
        endpoint: '/get-attachment'
    })
    const user = userList[message.sentByFbUserId]

    const currentDiscussionParticipants = useSelector((state: RootState) => state.discussion.currentFBDiscussionInfo.participants)

    const ParticipantsDetails = useSelector((state: RootState) => state.discussion?.currentFBDiscussionInfo?.participantsWithDetails)
    const isPatientActive = useMemo(() => {
        return Object.values(currentDiscussionParticipants as FBParticipants[])
            ?.filter((participant: FBParticipants) => (participant?.userType == '5' && participant?.participantStatus == 1 && participant?.discussionStatus == 1))
            ?.length > 0
    }, [currentDiscussionParticipants])

    const PatientId = useMemo(() => {
        return Object.values(ParticipantsDetails as (FBParticipants & DiscussionUser))
            ?.find((participant: (FBParticipants & DiscussionUser)) => participant?.userType == '5')
            ?.unique_id
    }, [currentDiscussionParticipants])

    const [mainUrl, setMainUrl] = useState<{
        file_path: string
        preview_path: string
    } | null>(null);


    useEffect(() => {
        if (ref.current) {
            if (mainUrl && message.attachment?.type != 'mp3') {
                if (message.messageText != 'photo') {
                    PDFToBase64(mainUrl.preview_path, ref).then(() => {
                        if (ref.current) {
                            ref.current.setAttribute('style', 'object-fit: cover;')
                            ref.current.classList.add('cursor-pointer')
                        }
                    })
                } else {
                    ref.current.src = mainUrl.file_path
                    ref.current.setAttribute('style', 'object-fit: contain;')
                    ref.current.classList.add('cursor-pointer')
                }
            }
        }
        if (message.attachment?.id) {
            setShareFile((d) => ({
                ...d,
                attachmentId: message.attachment?.uuid!
            } as shareFileType))
        }
    }, [message.messageText, mainUrl]);

    useEffect(() => {
        indexDB.getWithExpiry<AttachmentData>(`${message.discussionId}-${message?.attachment?.uuid}`)
            .then((data) => {
                if (data) {
                    setMainUrl(data)
                } else {
                    getPath?.get?.({
                        reqBody: {
                            aid: message?.attachment?.uuid
                        }
                    }).then((data) => {
                        setMainUrl(data.data)
                        indexDB.setWithExpiry<AttachmentData>(`${message.discussionId}-${message?.attachment?.uuid}`, data.data)
                    })
                }
            }).catch(() => {
                getPath?.get?.({
                    reqBody: {
                        aid: message?.attachment?.uuid
                    }
                }).then((data) => {
                    setMainUrl(data.data)
                    indexDB.setWithExpiry<AttachmentData>(`${message.discussionId}-${message?.attachment?.uuid}`, data.data)
                })
            })


    }, [message.attachment?.uuid]);


    const fileTypeName = message?.attachment?.name?.split('.').pop()?.toLocaleLowerCase()
    const fileName = message?.attachment?.name?.split('.')[0].toLocaleLowerCase()
    const isAudioMess = message.attachment?.type == 'mp3'
    const firebaseAuth = useFirebaseAuth()
    // const fileNameTodisplay = fileName + '.pdf' ; 
    const fileNameTodisplay = fileTypeName == 'doc' ? fileName + '.pdf' : ''

    const [shareFile, setShareFile] = useState<shareFileType>({
        uuid: PatientId,
        addFile: false,
        attachmentId: message.attachment?.uuid
    })
    const [openEMailModal, setOpenEmailModal] = useState(false);
    const [params, setParams] = useState<shareFileReqType>({
        patient_id: '',
        folder_name: '',
        folder_id: '',
        attachment_id: '',
        medical_center_id: '',
        attachment_flag: '1',
        hide_from_others: '0',
        mail_patient: '1',
        mail_assoc_docs: '0',
    })

    return (
        <>
            {user?.has_profile_pic == 1 ? <UserBubbleComp user={user} /> : <div className="usr-icon">{ShortProfileName(`${user?.prenom} ${user?.nom}`)}</div>}
            <div className='send-detail'><span className='send-name'>{message.sentByName}</span></div>
            <div className='msg-data'>
                <div className='msg-content attach-content'>
                    {message?.attachment && <div className={`file-sec ${isAudioMess ? 'justify-content-end' : ''}`}>
                        {/* <div className="file-name">{message?.attachment?.fileName}</div> */}
                        {!isAudioMess && <div className="icon"><Icon icon="eva:attach-fill" /><span children={i18n.t('attachment')} /></div>}
                        {(!!mainUrl?.file_path && message.attachment?.type == 'mp3') && <Icon onClick={() => {
                            fileDownload.handleDownload({
                                path: (mainUrl?.file_path),
                                name: (ReduceFileName(message.attachment?.fileName || ''))
                            })
                        }} icon="ic:round-file-download" />}
                    </div>}
                    {isAudioMess ?
                        <>
                            <div className="d-flex">
                                <AudioPlayerComp uri={mainUrl?.file_path || ''} name={message.attachment?.name} id={message.attachment?.uuid} />
                            </div>
                        </>
                        :
                        <>
                            <div className="msg-file">
                                <div className="file-img">
                                    <img ref={ref} onClick={() => {
                                        FileViewer({ filePath: mainUrl?.preview_path || '', fileType: message.messageText == 'photo' ? 'image' : 'pdf' })
                                    }} src={OtherURL.loader} />
                                </div>
                            </div>
                            <div className="file-sec file-sec-btm">
                                <div className="file-name">
                                    {message.attachment?.fileName && message?.messageText != 'photo' && <span className="doc-icon">
                                        {((message.sentByFbUserId == firebaseAuth.fbUid && GetCurrentUserTypeInt() == "5") || message?.messageText == 'photo' || GetCurrentUserTypeInt() != "5") ? <img src={FileExtToImage[fileTypeName as any]} /> :
                                            <img src={FileExtToImage["pdf"]} />

                                        }
                                    </span>}
                                    <span title={message.attachment?.name} className="file-name-info">{(((message.sentByFbUserId == firebaseAuth.fbUid && GetCurrentUserTypeInt() == "5") || message?.messageText == 'photo' || GetCurrentUserTypeInt() != "5") ? ReduceFileName(message.attachment?.name) : fileNameTodisplay)}</span>
                                </div>
                                {!!mainUrl?.file_path && <Icon onClick={() => {
                                    fileDownload.handleDownload({
                                        path: (GetCurrentUserTypeInt() == "5" && fileTypeName == 'doc' ? mainUrl?.preview_path : mainUrl?.file_path),
                                        name: (GetCurrentUserTypeInt() == "5" && fileTypeName == 'doc' ? fileNameTodisplay : ReduceFileName(message.attachment?.name))
                                    })
                                }} icon="ic:round-file-download" />}

                                {(!!mainUrl?.file_path && isPatientActive) && <Icon icon="fluent:share-16-filled" onClick={() => {
                                    setShareFile((d) => ({
                                        ...d,
                                        addFile: true
                                    }))
                                }} />}

                                {/* {!!mainUrl?.file_path && <Icon onClick={() => {
                                    console.log("mainUrl?.file_path ", mainUrl?.file_path, message.attachment?.name)
                                    fetch(mainUrl?.file_path).then((response) => {
                                        response.blob().then((blob) => {
                                            const fileURL =
                                                window.URL.createObjectURL(blob);
                                            let alink = document.createElement("a");
                                            alink.href = fileURL;
                                            alink.download = message.attachment?.name;
                                            alink.click();
                                        });
                                    });
                                }} icon="mdi:home" />} */}
                            </div>
                        </>
                    }
                </div>
                <div className='time-sec'>{`${moment(TimeCheckAndConvert(message.sentAt)).format('DD/MM/YYYY')} ${i18n.t('at')} ${moment(TimeCheckAndConvert(message.sentAt)).format('HH:mm')}`}</div>
            </div>
            {shareFile.addFile && <CreateFolderModal
                show={shareFile.addFile}
                callback={(data?: shareFileReqType) => {
                    setShareFile((d) => ({
                        ...d,
                        addFile: false,
                    }))
                    if (data) {
                        setOpenEmailModal(true)
                        setParams({
                            ...data
                        })
                    }
                }}
                shareFile={shareFile}
            />}
            {openEMailModal && <UploadModal
                show={openEMailModal}
                closeModal={() => setOpenEmailModal(false)}
                params={params}
            />}
        </>
    )
}