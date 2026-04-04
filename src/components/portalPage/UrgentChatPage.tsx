'use client';
import { Icon } from "@iconify/react"
import { useFirebaseAuth } from "../../contextAndProvider/FirebaseAuthWrapper"
import { usePostCall } from "../../hooks/ChatHooks"
import { RootState } from "../../redux/store"
import { UserInfoExtract } from "../../services/CommonFunction"
import i18n from "../../services/i18next/i18next"
import { FBDiscussionList } from "../../types/data"
import { chatDatetimeFormat, disStatusOptions, enumDiscussionStatus } from "../../services/Constants"

export const UrgentChatPage = () => {
    const firebaseAuth = useFirebaseAuth()
    const messageData = useSelector((state: RootState) => state.discussion.list.discussionList)
    const userList = useSelector((state: RootState) => state.discussion.userList)
    const [list, setList] = useState<FBDiscussionList[]>([])
    const postCall = usePostCall()
    const chatPageUrl = GetChatEndpoint();
    

    useEffect(() => {
        if(messageData)
        {
            const mainData = [...messageData]
            mainData?.sort((a: any, b: any) => b.timestamp - a.timestamp).filter(d => d.participants?.[firebaseAuth.fbUid || '']?.discussionStatus == 1)
            setList(mainData?.filter(p => p.discussionMarkStatus == enumDiscussionStatus.URGENT).slice(0, 5))
        }
    }, [messageData, firebaseAuth.fbUid])


    const urgentChat = disStatusOptions.filter(p=> p.value == enumDiscussionStatus.URGENT)[0]

    return (
        <div className="accu-card notes urgent">
            <div className="accu-card-top">
                <div className="icon-title">
                    <Icon icon={"mdi:message-alert"} />
                    <h4>Messages urgents</h4>
                </div>
                  { ( userList && list?.length > 0) && 
                <a href={`${chatPageUrl}?opt=${enumDiscussionStatus.URGENT}`} className="text-link" title="Voir plus" data-lang="fr">Voir plus</a> }
            </div>
            { <div className="notes-outer">

                {
                   userList && list?.length > 0 && list?.map((item) => {
                        const userInfo = UserInfoExtract(item, userList, true, firebaseAuth.fbUid!)
                        return (
                            <div onClick={() => {
                                postCall.open(item.discussionId)
                            }} id={item.discussionId.toString()} className="notes-block">
                                <OverlayTrigger delay={{ show: 100, hide: 300 }} overlay={<Tooltip style={{ position: "fixed" }} className="tooltip-ful">{userInfo.to}</Tooltip>}><h5 id="hpurgentmsg_sentby_1022">{userInfo?.to}</h5></OverlayTrigger>
                                <div className="notes-field">
                                    <div className="notes-txt">
                                        <a data-lang="fr"><span>{item.subject}</span></a>

                                    </div>
                                    <div className="msg-date-time">
                                        <div className="accu-tag" style={{backgroundColor: urgentChat.color}}>{urgentChat.label}</div>
                                        <div className="date-time">
                                            <span id="hpurgentmsg_time_1022">  { chatDatetimeFormat(item.timestamp) } </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="rec-msg" id="hpurgentmsg_1022">{item.lastMessage}</div>
                            </div>
                        )
                    })
                }

                {
                    
                    (!list || list?.length == 0) &&
                    <div className="nodata-field">
                        <div className="nodata_cont">
                            <div className="icon">
                                <Icon icon={'mdi:message-badge'} />
                            </div>
                            <p>{i18n.t('no_urgent_messages')}</p>
                        </div>
                    </div>
                }

            </div>}
        </div>
    )
}