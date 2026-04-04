'use client';
import { Icon } from "@iconify/react"
import { FC, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import { Button, Form, OverlayTrigger, Popover } from "react-bootstrap"
import { shallowEqual, useDispatch, useSelector } from "react-redux"
import { useMessageContext } from "../contextAndProvider/MessageProviderWrapper"
import { getParticipants, useChatFileUpload, useCreateRoomHook, useOtherFunctionality, usePostCreateListener, useSendMessageHandler } from "../hooks/ChatHooks"
import { useTimeout } from "../hooks/hooks"
import { DiscussionActions } from "../redux/reducer/DiscussionReducer"
import { RootState } from "../redux/store"
import { atCtrlEnter, clm, ScreenLoader } from "../services/CommonFunction"
import { AcceptedFiles, AllFileTypes, AllowedAudioExtensions, AudioType, ChatPostMessageKey, FileType, GetCurrentUserTypeInt } from "../services/Constants"
import i18n from "../services/i18next/i18next"
import { OutSideClickHandler } from "../services/OutSideClickHandler"
import { Files } from "../types/data"
import { PatientFolderFileModal } from "./modal/PatientFolderFileModal"
import Dictaphone from "./Dictaphone"
import RecorderComp from "./RecorderComp"
import AudioPlayerComp, { AudioSingleton } from "./AudioPlayerComp"
import { useFirebaseAuth } from "../contextAndProvider/FirebaseAuthWrapper"
import { usePost } from "../api/API"
import AutopResponses from "./AutoResponses"

const FilePreview: FC<{
    file: { uri: string; file: File | Files } | null,
    remove: () => void
}> = ({ file, remove }) => {
    const [ourFile, setOurFile] = useState<{ uri: string; file: File | Files } | null>()
    const timeout = useTimeout({ duration: 300 })
    const mainRef = useRef<HTMLDivElement | null>(null)
    useEffect(() => {
        if (file) {
            mainRef.current?.classList.add('open')
            mainRef.current?.classList.remove('close')
            timeout.reset()
            setOurFile(file)
        } else {
            mainRef.current?.classList.add('close')
            mainRef.current?.classList.remove('open')
            timeout.delay(() => {
                setOurFile(null)
            })
        }
    }, [file])
    const name = ourFile?.file instanceof File ? ourFile.file.name : ourFile?.file.file_display_name
    const type = name?.split('.').pop()?.toLowerCase()
    const isFile = (type == 'pdf' || type == 'doc' || type == 'docx' || type == 'xls' || type == 'xlsx' || type == 'tiff' || type == 'tif')
    const timeStamp = Date.now().toString()

    return (
        <div ref={mainRef} className="msg-att-pdf">
            {ourFile && type ?
                (AllowedAudioExtensions.includes(type) && ourFile.uri) ?
                    <>
                        <AudioPlayerComp uri={ourFile.uri} name={'REC_AUDIO'} id={timeStamp} />
                        <span onClick={() => { AudioSingleton.destroyInstance(timeStamp); remove() }} className='msg-att-delete'>
                            <Icon icon="mdi:close-circle" />
                        </span>
                    </>
                    :
                    <>
                        <div className="msg-preview">
                            {isFile ? (type == 'doc' ? <Icon icon="teenyicons:doc-solid" /> : <img src={FileExtToImage[type as any]} />) :
                                <img className="msg-preview-img" width={20} height={20} src={ourFile.uri} />}
                        </div>
                        <span className="msg-att-name">{name}</span>
                        <span onClick={() => remove()} className='msg-att-delete'><Icon icon="mdi:close-circle" /></span>
                    </>
                : null
            }
        </div>
    )
}


export const ChatFooterInputComp = () => {
    const discussionId = useSelector((state: RootState) => state.discussion.currentDiscussionId)

    const discussionDetails = useSelector((state: RootState) => state.discussion.currentFBDiscussionInfo)
    const fbUserId = useFirebaseAuth().fbUid
    const sendNotification = usePost<'/discussion/notify-participants'>({
        endpoint: '/discussion/notify-participants'
    })
    const participants = useSelector((state: RootState) => getParticipants(state, fbUserId), shallowEqual)
    const { updateUrgent } = useOtherFunctionality()
    const messageContext = useMessageContext();
    const [isRecording, setIsRecording] = useState(false);
    const [folderShow, setFolderShow] = useState(false);
    const createRoomHook = useCreateRoomHook();
    const messageHandler = useSendMessageHandler()
    const messageRef = useRef<HTMLTextAreaElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const dispatch = useDispatch();
    const [file, setFile] = useState<{ uri: string; file: File | Files, duration?: number } | null>(null);
    const contRef = useRef(null);

    const fileUpload = useChatFileUpload()

    const sendMessage = useCallback((send: (message: {
        type: string;
        data: string;
    }, discussionId?: string) => Promise<void> | undefined, discussionId?: string, innerText?: string, discussionGUID?: any,) => {
        return new Promise((resolve) => {
            if (messageRef.current && innerText?.trim?.()) {
                send({
                    type: '1',
                    data: innerText?.trim?.(),
                }, discussionId)?.then(() => {
                    resolve(true)
                    sendNotification.post?.({
                        reqBody: {
                            discussion_id: discussionGUID || '',
                            message: innerText?.trim?.()!
                        }
                    })
                })

            } else {
                resolve(true)
            }
        })
    }, [])

    const send = useCallback((withClose: boolean, text: string) => {

        if (file) {
            fileUpload.upload({
                discussionGuid: discussionDetails?.guid || '',
                file: file.file,
                discussion_id: discussionId?.toString(),
                type: file.file instanceof File ? '1' : '2',
                ...(file.duration ? { audio_duration: file.duration } : {})
            }).then((res) => {
                sendMessage(messageHandler.send, discussionId?.toString(), text, discussionDetails?.guid)
            }).then(() => {
                if (withClose) {
                    messageContext.closeChat('close')
                }
                setFile(null)
            })
            return
        }
        sendMessage(messageHandler.send, discussionId?.toString(), text, discussionDetails?.guid)
            .then(() => {
                if (withClose) {
                    messageContext.closeChat('close')
                }
            })
    }, [messageHandler.send, discussionId, file, discussionDetails?.guid]);


    usePostCreateListener((data) => {
        if (data.type == ChatPostMessageKey.OPEN_CHAT_INTERNAL) {
            if (data.data.user_type == 4) {
                let patientDetails = data.data?.patientInfo
                if (patientDetails && messageRef.current) {
                    messageRef.current.value = `${patientDetails.nom} ${patientDetails.prenom} \n ${patientDetails.gender == 1 ? "Hommee" : "Femmee"} \n ${patientDetails?.dob} \n ${AppURL.PatientDetailURL + patientDetails?.unique_id}`
                }
            }
        }
        else if (data.type == ChatPostMessageKey.OPEN_CHAT_FILE)
            setFile(data.data as any)
    })

    useImperativeHandle(messageContext.functionRef, () => ({
        removeAttachment() {
            setFile(null)
        },
    }), [setFile])

    useEffect(() => {
        return () => {
            AudioSingleton.destroyAll();
        }
    }, [])

    function SendMessage(buttonCloseChat: number) {
        // console.log("blocked flage ", participants.participants, Object.values(participants.participants).filter(p => p.fbUserId == fbUserId && p.blocked_flag == true))

        const blockedUser = Object.values(participants.participants).filter(p => p.fbUserId == fbUserId && p.blocked_flag == true).length
        if (blockedUser == 1) {
            // console.log("Doctor is not available")
            alert("Doctor is not available")
            return
        }

        if (messageContext.isCreate) {
            ScreenLoader(true);
            if (messageContext.participantsRef.current && Object.keys(messageContext.participantsRef.current).length) {
                createRoomHook.CreateNewDiscussion(
                    messageContext.participantsRef.current,
                    messageContext.subjectRef.current,
                    file?.file || null,
                    messageContext?.discussionMarkStatusRef?.current,
                    messageRef.current?.value ? messageRef.current.value.trim() : '',
                    messageContext?.pinAndUrgentRef?.current || undefined,
                ).then((id) => {
                    ScreenLoader(false);

                    if (buttonCloseChat == 1) {
                        messageContext.closeChat('close')
                    }
                    else {
                        if (messageRef.current) {
                            messageRef.current.value = '';
                        }
                        setFile(null)
                        dispatch(DiscussionActions.setCurrentDiscussionId(id))
                    }
                })
            }
        } else {
            send(buttonCloseChat == 1 ? true : false, messageRef.current?.value || '');
            if (messageRef.current?.value) {
                messageRef.current.value = '';
            }
        }

    }

    return (
        <div className="chat-footer">
            <FilePreview file={file} remove={() => {
                setFile(null)
            }} />
            <div className="chat-whiteframe">
                <div className="chat-textframe">
                    <div className="chattextpane">
                        {(!messageContext.isCreate && GetCurrentUserTypeInt() != '5') && <span className={clm({
                            "warning cursor-pointer": true,
                            "urgent": discussionDetails?.urgent
                        })}><Icon onClick={() => updateUrgent(!discussionDetails?.urgent)} icon="clarity:warning-line" /></span>}
                        <Form
                            onKeyDown={(e) => {
                                atCtrlEnter(e, () => {

                                    send(false, messageRef.current?.value || '')
                                    if (messageRef.current?.value) {
                                        messageRef.current.value = '';
                                    }
                                });
                            }} ref={messageRef} as="textarea" placeholder="Message" className={clm({
                                'remove-padding-left': (messageContext.isCreate || GetCurrentUserTypeInt() == '5'),
                            })} />
                    </div>
                    <div className="cht-footbtn" ref={contRef}>
                        {!isRecording && <AutopResponses
                            containerRef={contRef}
                            onSelect={(text) => {
                                if (messageRef.current) {
                                    messageRef.current.value = text;
                                }
                            }}
                        />}
                        <RecorderComp
                            onStartRecording={() => {
                                setIsRecording(true);
                            }}
                            onRecordStop={(blobUrl, audio, duration) => {
                                setIsRecording(false);
                                setFile({ uri: blobUrl!, file: audio, duration })
                            }} />
                        <Dictaphone
                            fieldRef={messageRef.current}
                            liveVoiceToText={(transcript) => {
                                if (messageRef.current) {
                                    messageRef.current.value = (transcript || '')
                                }
                            }}
                        />
                        <div className="attach">
                            <Form.Control
                                accept={AllFileTypes.join(",")}
                                ref={fileInputRef}
                                className="d-none"
                                id="download_from_computer"
                                type="file"
                                onChange={() => {
                                    const file = fileInputRef.current?.files?.[0];
                                    if (!file) return;

                                    if (file && !AcceptedFiles.includes(file.type)) {
                                        alert(i18n.t("unsupported_filetypes", { file: FileType.join(", ") }));
                                        return;
                                    }
                                    const urlObject = URL.createObjectURL(file);

                                    if (FileType.includes(file.type)) {
                                        setFile({
                                            file,
                                            uri: urlObject,
                                        });
                                    }
                                    if (AudioType.includes(file.type)) {
                                        const audio = new Audio();
                                        audio.src = urlObject;
                                        audio.preload = "metadata";
                                        audio.onloadedmetadata = () => {
                                            setFile({
                                                file,
                                                uri: urlObject,
                                                duration: Math.round(audio.duration * 1000)
                                            });
                                        };
                                    }

                                }}
                            />
                            <OutSideClickHandler className={'attach-popover'}>
                                {
                                    ({ show, setShow }) =>
                                    (
                                        <OverlayTrigger show={show} placement="top" container={contRef} overlay={
                                            <Popover className="txt-popover attach-popover">
                                                <div onClick={() => {
                                                    setShow(false);
                                                    fileInputRef.current?.click();
                                                }} className="upfrmcomp">
                                                    <span children={i18n.t("download_from_computer")} />
                                                </div>
                                                {(GetCurrentUserTypeInt() != "7") &&
                                                    <div onClick={() => {
                                                        setFolderShow(true);
                                                        setShow(false);
                                                    }} className="upfrmcomp">
                                                        <span children={i18n.t("download_medical_file")} />
                                                    </div>
                                                }
                                            </Popover>
                                        }>
                                            <Icon onClick={() => { setShow(!show) }} icon="eva:attach-fill" />
                                        </OverlayTrigger>
                                    )
                                }

                            </OutSideClickHandler>
                        </div>

                        <Button
                            ref={messageContext.sendWithCloseRef}
                            onClick={() => SendMessage(1)}
                            className='btn'
                            children={i18n.t("send_and_close")}
                        />
                        <Button
                            ref={messageContext.sendRef}
                            onClick={() => SendMessage(2)}
                            className={clm({ 'btn btn-green': true, })}
                            children={i18n.t("send")}
                        />
                    </div>
                </div>
            </div>
            {folderShow &&
                <PatientFolderFileModal
                    {
                    ...((messageContext.isCreate && messageContext?.participantsRef?.current && Object.values(messageContext.participantsRef.current).length > 0) && {
                        patientDetails: (() => {
                            if (messageContext?.participantsRef?.current) {
                                const patient = Object.values(messageContext?.participantsRef?.current).filter(obj => obj.user_type == '5')
                                if (patient[0]) {
                                    return {
                                        id: patient[0]?.id?.toString(),
                                        name: patient[0]?.name?.toString()
                                    }
                                }

                            }
                            return null

                        })()
                    })
                    }
                    handleClose={(file) => {
                        if (file) {
                            setFile({ uri: file.pdf_path, file })
                        }
                        setFolderShow(false)
                    }}
                />
            }
        </div>
    )
}