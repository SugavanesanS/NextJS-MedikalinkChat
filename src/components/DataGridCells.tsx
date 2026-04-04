import { Icon } from "@iconify/react";
import { GridRenderCellParams, GridTreeNodeWithRender } from "@mui/x-data-grid";
import { collection, getDocs, getFirestore, limit, orderBy, query, where } from "firebase/firestore";
import { FC, useEffect, useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useFirebaseAuth } from "../contextAndProvider/FirebaseAuthWrapper";
import { clm, ShortProfileName, UserInfoExtract } from "../services/CommonFunction";
import i18n from "../services/i18next/i18next";
import { ChatMessageFireBase, FBDiscussionList } from "../types/data";
import { UserBubbleComp } from "./UserBubbleComp";
import { disStatusOptions, GetCurrentUserTypeInt } from "../services/Constants";


export const PriorityCell: FC<GridRenderCellParams<FBDiscussionList, any, any, GridTreeNodeWithRender> & { discussionData: Record<string, any>, fbUid: string }>
    = ({ row, discussionData, fbUid }) => {

        if(row.discussionId == 0)
        {
            return null
        }

        const extractData = UserInfoExtract(row, discussionData, false, fbUid)
        const allParticipantsWithOutFilter = Object.values(row.participants)
        const user = discussionData?.[extractData.imgUserId]
        const discussionMarkStatus = disStatusOptions.filter(p=> p.value == row.discussionMarkStatus)[0];
     
        return ( 
            <div className='user-inf'>
                
                <div className="user-inf-flex">                        
                     <UserBubbleComp user={user} defaultImage={extractData.defaultImage} />  

                    {(GetCurrentUserTypeInt() != '5') &&
                    row.discussionMarkStatus && < span className="data-badge" style={{backgroundColor: discussionMarkStatus?.color}} children={discussionMarkStatus?.label || 1} />}
                
                </div>
                <div className="user_det">
                    {!!parseInt(row.unreadCount[fbUid]) && <span className="msg_col_count">{row.unreadCount[fbUid]}</span>}
                    {/* row.pin && <span className="chat-pin pined"><Icon icon="octicon:pin-24" /></span> */}
                </div>
            </div>
        )
    }

export const SentToCell: FC<GridRenderCellParams<FBDiscussionList, any, any, GridTreeNodeWithRender> & { discussionData: Record<string, any> }>
    = ({ row, discussionData, }) => {
        const firebaseAuth = useFirebaseAuth()
        if(row.discussionId == 0)
        {
            return null
        }
        const extractData = UserInfoExtract(row, discussionData, true, firebaseAuth.fbUid!)
        return (
            <div>
                <span title={extractData.to} className='object'>{`${extractData.to}`}</span>
            </div>
        )
    }

export const SubjectCell: FC<GridRenderCellParams<FBDiscussionList, any, any, GridTreeNodeWithRender> & { discussionData: Record<string, any> }>
    = ({ row }) => {
        const [lastMessageData, setLastMessageData] = useState<ChatMessageFireBase | null>(null)
        const db = getFirestore()
        const lastMessage = lastMessageData == null ? '' : ['3', 3].includes(lastMessageData?.type) ? i18n.t('attachment') : lastMessageData?.messageText
        useEffect(() => {
            if (!(row.deadChat != 0)) {
                const q = query(
                    collection(db, `Discussion/${row.discussionId}/messages`),
                    where('type', 'in', ['1', '3', 1, 3]),
                    orderBy('sentAt', 'desc'),
                    limit(1)
                );
                getDocs(q).then(async (snapshot) => {
                    if (snapshot.docs[0]) {

                        setLastMessageData(snapshot.docs[0].data() as ChatMessageFireBase)
                    }
                })
            }

        }, [row.deadChat, row.lastMessage])

        if (row.deadChat != 0) {
            return null
        }

        return (
            <div className='msg-res'>
                <span className='object'>{`${row.subject || ""}`}</span>
                <span className='desc'>{`${lastMessage ? `${row.subject ? ' - ' : ''}${lastMessage}` : ''}`}</span>
            </div>
        )
    }

export const ViewArchive: FC<GridRenderCellParams<FBDiscussionList, any, any, GridTreeNodeWithRender> & {
    discussionData: Record<string, any>, archiveFun: (discussionId: number, type: 'archive' | 'unarchive') => void,
    deleteFun: (discussionId: number) => void
    openFun: () => void
}
>
    = ({ row, archiveFun, deleteFun, openFun }) => {
        return (
            <div className='action-icons'>
                <OverlayTrigger delay={{ show: 100, hide: 300 }} overlay={<Tooltip style={{ position: "fixed" }} >{i18n.t('archive')}</Tooltip>}>
                    <span style={{ cursor: 'pointer' }} onClick={(e) => {
                        e.stopPropagation();
                        archiveFun(row.discussionId, 'archive');
                    }}>
                        <Icon className="arc-icon-archive" icon="ic:outline-archive" pointerEvents={'none'} />
                    </span>
                </OverlayTrigger>
                <OverlayTrigger delay={{ show: 100, hide: 300 }} overlay={<Tooltip style={{ position: "fixed" }} >{i18n.t('unarchive')}</Tooltip>}>
                    <span style={{ cursor: 'pointer' }} onClick={(e) => {
                        e.stopPropagation();
                        archiveFun(row.discussionId, 'unarchive');
                    }}
                    >
                        <Icon className="arc-icon-unarchive" icon="ic:outline-unarchive" pointerEvents={'none'} />
                    </span>
                </OverlayTrigger>
                <OverlayTrigger delay={{ show: 100, hide: 300 }} overlay={<Tooltip style={{ position: "fixed" }} >{i18n.t('delete')}</Tooltip>}>
                    <span style={{ cursor: 'pointer' }} onClick={(e) => {
                        e.stopPropagation();
                        deleteFun(row.discussionId);
                    }}
                    >
                        <Icon className="arc-icon-delete" icon="material-symbols:delete-rounded" pointerEvents={'none'} />
                    </span>
                </OverlayTrigger>
            </div>
        )
    }