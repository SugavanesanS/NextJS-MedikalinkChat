import { ShortProfileName } from "../services/CommonFunction"
import { URLRegex } from "../services/Constants"
import { ChatMessageFireBase, DiscussionUser } from "../types/data"

export const LoadingComp = () => {
    return (
        <style>
            {` #app-loader {display: block!important;}`}
        </style>
    )
}


export const UserImageOrName = ({ message, user }: { message: ChatMessageFireBase, user: DiscussionUser }) => {
    return (
        <div className='usr-icon'>
            {user?.user_profile_photo && <img style={{ position: 'absolute', zIndex: 5 }} src={user?.user_profile_photo} />}
            <div className='usr-icon'>{ShortProfileName(message.sentByName)}</div>
        </div>
    )
}

export const HighlightUrls = ({ text }: { text: string }) => {
    if (typeof text == 'string') {
        const parts = text?.split?.(URLRegex);

        return (
            <div className="msg-content">
                {parts.map((part, index) =>
                    URLRegex.test(part) ? (
                        <span onClick={() => window.open(part, '_blank')} key={index} className="react-highlighted-url">
                            {part}
                        </span>
                    ) : part
                )}
            </div>
        );
    }
    
    return <div className="msg-content"></div>

};