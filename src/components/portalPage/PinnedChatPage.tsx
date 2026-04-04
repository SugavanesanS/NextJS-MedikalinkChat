import { Icon } from "@iconify/react"
import moment from "moment"
import { useEffect, useState } from "react"
import { OverlayTrigger, Tooltip } from "react-bootstrap"
import { useSelector } from "react-redux"
import { GetChatEndpoint, OtherURL } from "../../api/AppURL"
import { useFirebaseAuth } from "../../contextAndProvider/FirebaseAuthWrapper"
import { usePostCall } from "../../hooks/ChatHooks"
import { RootState } from "../../redux/store"
import { UserInfoExtract } from "../../services/CommonFunction"
import i18n from "../../services/i18next/i18next"
import { FBDiscussionList } from "../../types/data"
import { chatDatetimeFormat } from "../../services/Constants"


export const PinnedChatPage = () => {
    const firebaseAuth = useFirebaseAuth()
    const messageData = useSelector((state: RootState) => state.discussion.allData)
    const userList = useSelector((state: RootState) => state.discussion.userList)
    const [list, setList] = useState<FBDiscussionList[]>([])
    const postCall = usePostCall()
    const chatPageUrl = GetChatEndpoint();
    
    useEffect(() => {
        const mainData = [...(messageData?.pin || []), ...(messageData?.pinAndUrgent || [])]
        mainData.sort((a: any, b: any) => b.timestamp - a.timestamp).filter(d => d.participants?.[firebaseAuth.fbUid || '']?.discussionStatus == 1)
        setList(mainData.slice(0, 5))
    }, [messageData, firebaseAuth.fbUid])

    return (
        <div className="accu-card notes">
            <div className="accu-card-top">
                <div className="icon-title">
                    <Icon icon={"eos-icons:pin"} />
                    <h4>{i18n.t('notes_internal')}</h4>
                </div>
                <a href={`${chatPageUrl}?opt=2`} className="text-link" title="Voir plus" data-lang="fr">Voir plus</a>
            </div>
            {userList && <div className="notes-outer">

                {
                    list?.map((item) => {
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
                                        <div className="date-time">
                                            <span id="hpurgentmsg_time_1022">  { chatDatetimeFormat(item.timestamp) }</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="rec-msg" id="hpurgentmsg_1022">{item.lastMessage}</div>
                            </div>
                        )
                    })
                }

                {
                    list?.length == 0 &&
                    <div className="nodata-field">
                        <div className="nodata_cont">
                            <div className="icon">
                                <Icon icon={'eos-icons:pin'} />
                            </div>
                            <p>{i18n.t('no_internal_notes')}</p>
                        </div>
                    </div>
                }

            </div>}
        </div>
    )
}