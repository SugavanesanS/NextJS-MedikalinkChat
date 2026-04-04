'use client';
import { Icon } from "@iconify/react"
import { useFirebaseAuth } from "../../contextAndProvider/FirebaseAuthWrapper"
import { usePostCall } from "../../hooks/ChatHooks"
import { RootState } from "../../redux/store"
import { UserInfoExtract } from "../../services/CommonFunction"
import i18n from "../../services/i18next/i18next"
import { FBDiscussionList } from "../../types/data"
import { chatDatetimeFormat, disStatusOptions, GetCurrentUserTypeInt } from "../../services/Constants"


export const RecentChatPage = () => {
    const messageData = useSelector((state: RootState) => state.discussion)
    const userList = useSelector((state: RootState) => state.discussion.userList)
    const firebaseAuth = useFirebaseAuth()
    const [list, setList] = useState<FBDiscussionList[]>([])
    const postCall = usePostCall()
    const chatPageUrl = GetChatEndpoint();

    useEffect(() => {
        const mainData = [...(messageData?.list?.discussionList || []),
        // ...(messageData.list.archivedDiscussionList || [])
        ]
        mainData?.sort((a: any, b: any) => b.timestamp - a.timestamp)
        setList([...mainData.slice(0, 5)])
    }, [messageData])

    

    return (
        <div className="accu-card notes">

            <div className="accu-card-top">
                <div className="icon-title">
                    <Icon icon="mdi:message-badge" />
                    <h4>{i18n.t('recent_messages')}</h4>
                </div>
                { ( userList && list.length > 0) && 
                <a href={`${chatPageUrl}?opt=0`} className="text-link" title="Voir plus">{i18n.t('view_more')}</a> }
            </div>

            { <div className="notes-outer">
                {
                    userList && list.length > 0 && list?.map((item) => {

                        const userInfo = UserInfoExtract(item, userList, true, firebaseAuth.fbUid!)
                        const discussionMarkStatus = disStatusOptions.filter(p=> p.value == item.discussionMarkStatus)[0];
                        

                        return (
                            <div onClick={() => {
                                postCall.open(item.discussionId)
                            }} className="notes-block">
                                <OverlayTrigger delay={{ show: 100, hide: 300 }} overlay={<Tooltip style={{ position: "fixed" }} className="tooltip-ful">{userInfo.to}</Tooltip>}><h5 id="hprecentmsg_sentby_1022">{userInfo.to}</h5></OverlayTrigger>
                                <div className="notes-field">
                                    <div className="notes-txt">
                                        <a href="javascript:void(0);"
                                            data-lang="fr"><span>{item.subject}</span> </a>
                                    </div>
                                    
                                    <div className="msg-date-time">
                                        {
                                        (GetCurrentUserTypeInt() != '5')  && 

                                        <div className="accu-tag" style={{backgroundColor: discussionMarkStatus?.color || disStatusOptions[0].color}} >{discussionMarkStatus?.label || disStatusOptions[0].label}</div>
                                        }
                                        {item?.timestamp && <div className="date-time">
                                            <span id="hprecentmsg_time_1022"> { chatDatetimeFormat(item.timestamp) }</span>
                                        </div>}
                                    </div>
                                </div>
                                <div className="rec-msg" id="hprecentmsg_1022">{item?.lastMessage}</div>
                            </div>
                        )
                    })
                }

                {
                    (list?.length == 0 || !list) &&
                    <div className="nodata-field">
                        <div className="nodata_cont">
                            <div className="icon">
                                <Icon icon={'mdi:message-badge'} />
                            </div>
                            <p>{i18n.t('no_recent_messages')}</p>
                        </div>
                    </div>
                }

            </div>}

        </div>
    )
}