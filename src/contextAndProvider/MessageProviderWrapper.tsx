'use client';
import { createContext, MutableRefObject, useCallback, useContext, useReducer, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DiscussionActions } from "../redux/reducer/DiscussionReducer";
import { RootState } from "../redux/store";
import { ChatUserProfile } from "../types/data";
import { useFirebaseAuth } from "./FirebaseAuthWrapper";

const initialState: {
    view: 'profile' | 'chat';
    isCreate: boolean;
    isOpen: boolean;
    deadChat: number | false;
} = {
    view: 'chat',
    isCreate: false,
    isOpen: false,
    deadChat: false
};

type FunctionRefType  = { removeAttachment: () => void } | null

const otherFunction: {
    subjectRef: MutableRefObject<string>,
    participantsRef: MutableRefObject<Record<string, ChatUserProfile> | null>
    pinAndUrgentRef: MutableRefObject<{ pin: boolean, urgent: boolean } | null>
    discussionMarkStatusRef: MutableRefObject<Number>
    functionRef: MutableRefObject<FunctionRefType>
    sendWithCloseRef: MutableRefObject<HTMLButtonElement | null>,
    sendRef: MutableRefObject<HTMLButtonElement | null>,
    setView: (view: 'profile' | 'chat') => void;
    closeChat: (type: 'close' | 'minimize') => void
} = {
    closeChat: () => { },
    setView: () => { },
    participantsRef: { current: null },
    pinAndUrgentRef: { current: null },
    discussionMarkStatusRef : { current: 1 },
    subjectRef: { current: '' },
    sendWithCloseRef: { current: null },
    sendRef: { current: null },
    functionRef: { current: null },
}

export const MessageContext = createContext({
    ...initialState, ...otherFunction
});

export const useMessageContext = () => useContext(MessageContext);
const reducer = (state, action) => {
    switch (action.type) {
        case 'SET_VIEW':
            return { ...state, view: action.payload };
        default:
            return state;
    }
};


export const MessageProviderWrapper = ({ children }) => {
    const dispatch = useDispatch();
    const firebaseAuth = useFirebaseAuth();
    const [state, stateDispatch] = useReducer(reducer, initialState);
    const discussionId = useSelector((state: RootState) => state.discussion.currentDiscussionId)
    const fbDiscussionDetails = useSelector((state: RootState) => state.discussion.currentFBDiscussionInfo)
    const subjectRef = useRef('');
    const participantsRef = useRef<Record<string, ChatUserProfile> | null>(null);
    const pinAndUrgentRef = useRef<{ pin: boolean, urgent: boolean } | null>(null);
    const discussionMarkStatusRef = useRef<Number>(1);
    const functionRef = useRef<FunctionRefType>(null);
    const sendWithCloseRef = useRef<HTMLButtonElement | null>(null);
    const sendRef = useRef<HTMLButtonElement | null>(null);

    const setView = useCallback(payload => stateDispatch({ type: 'SET_VIEW', payload }), []);


    const closeChat = useCallback((type: 'close' | 'minimize') => {
        const chatBox = document.getElementById('react-chat-open-wrapper')
        if (chatBox) {
            chatBox.className = 'minimized close'
            setTimeout(() => {
                dispatch(DiscussionActions.disClose(type == 'minimize'));
            }, 500);
        }
    }, []);


    return (
        <MessageContext.Provider value={{
            ...state,
            isCreate: discussionId == 0,
            isOpen: (!!discussionId || discussionId == 0),
            closeChat,
            setView,
            subjectRef,
            discussionMarkStatusRef,
            participantsRef,
            pinAndUrgentRef,
            sendWithCloseRef,
            deadChat: fbDiscussionDetails?.participants[firebaseAuth.fbUid!]?.participantStatus != 1 ? fbDiscussionDetails?.participants[firebaseAuth.fbUid!]?.timestamp : 0,
            sendRef,
            functionRef
        }}>
            {children}
        </MessageContext.Provider>
    );
};
