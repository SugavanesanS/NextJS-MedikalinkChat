'use client';
import { GridSortModel } from "@mui/x-data-grid";
import { createSelector } from "@reduxjs/toolkit";
import { createContext, useCallback, useContext, useEffect, useReducer, useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "next/navigation";
import { RootState } from "../redux/store";
import { ParseQuery } from "../services/CommonFunction";
import i18n from "../services/i18next/i18next";
import { FBDiscussionList } from "../types/data";
import { useFirebaseAuth } from "./FirebaseAuthWrapper";
import { disStatusOptions, enumDiscussionStatus } from "../services/Constants";


export const ChatFilterTags: { value: 'all' | 'doctor' | 'patient' | 'group' | 'sec' | 'telesec', label: string }[] = [
    {
        value: 'all',
        label: i18n.t('all')
    },
    {
        value: 'doctor',
        label: i18n.t('doctor')
    },
    {
        value: 'patient',
        label: i18n.t('patient')
    },
     {
        value: 'sec',
        label: i18n.t('secretariat')
    },
    {
        value: 'telesec',
        label: i18n.t('telesecretary')
    },
    {
        value: 'group',
        label: i18n.t('group')
    }
]

const initialState: {
    viewType: 'list' | 'grid',
    archive: boolean,
    search: string,
    list: FBDiscussionList[] | null
    view: 'profile' | 'chat'
    urgent: boolean,
    disStatus: Number,
    pin: boolean,
    urgentAndPin: boolean
    unreadCount: boolean
    sortModel: GridSortModel
    tag: 'doctor' | 'patient' | 'all' | 'group' | 'sec' | 'telesec'
} = {
    viewType: 'list',
    archive: false,
    search: '',
    list: null,
    view: 'chat',
    urgent: false,
    disStatus: 0,
    pin: false,
    urgentAndPin: false,
    unreadCount: false,
    sortModel: [{ field: 'date', sort: 'desc' }],
    tag: 'all'
};

const otherFunction: {
    noData: boolean,
    setViewType: (viewType: 'list' | 'grid') => void,
    setArchive: (archive: boolean) => void,
    setSearch: (search: string) => void
    setView: (view: 'profile' | 'chat') => void
    setUrgent: (urgent: boolean) => void
    setDisStatus: (disStatus: Number) => void,
    setPin: (pin: boolean) => void
    setUrgentAndPin: (urgentAndPin: boolean) => void
    setUnreadCount: (unreadCount: boolean) => void
    setSortModel: (model: GridSortModel) => void
    setTag: (tag: 'doctor' | 'patient' | 'all' | 'group' | 'sec' | 'telesec') => void
} = {
    noData: false,
    setViewType: () => { },
    setArchive: () => { },
    setSearch: () => { },
    setView: () => { },
    setUrgent: () => { },
    setDisStatus: () => { },
    setPin: () => { },
    setUrgentAndPin() { },
    setUnreadCount: () => { },
    setSortModel: () => { },
    setTag: () => { }
}

export const ChatContext = createContext({
    ...initialState, ...otherFunction
});

export const useChatDiscussionContext = () => useContext(ChatContext);
const reducer = (state, action) => {
    console.log("action pay load ------- ", action.payload)
    switch (action.type) {
        case 'SET_VIEW_TYPE':
            return { ...state, viewType: action.payload };
        case 'SET_ARCHIVE':
            return { ...state, archive: action.payload };
        case 'SET_SEARCH':
            return { ...state, search: action.payload };
        case 'SET_URGENT':
            return { ...state, urgent: action.payload };
        case 'SET_DISSTATUS':
            return { ...state, disStatus: action.payload };
        case 'SET_PIN':
            return { ...state, pin: action.payload };
        case 'SET_URGENT_AND_PIN':
            return { ...state, urgentAndPin: action.payload };
        case 'SET_UNREAD_COUNT':
            return { ...state, unreadCount: action.payload };
        case 'SET_MODEL':
            return { ...state, sortModel: action.payload };
        case 'SET_TAG':
            return { ...state, tag: action.payload };
        default:
            return state;
    }
};

const getList = createSelector([(state: RootState) => state.discussion.list.archivedDiscussionList, (state: RootState) => state.discussion.list.discussionList],
    (list, list2) => {
        return {
            archivedDiscussionList: list,
            discussionList: list2
        }
    })

export const ChatProviderWrapper = ({ children }) => {
    const userList = useSelector((state: RootState) => state.discussion.userList);
    const list: {
        archivedDiscussionList: FBDiscussionList[] | null,
        discussionList: FBDiscussionList[] | null,
    } = useSelector(getList);

    const [state, stateDispatch] = useReducer(reducer, initialState);
    const [filterList, setFilterList] = useState<FBDiscussionList[] | null>(null);

    const setViewType = useCallback(payload => stateDispatch({ type: 'SET_VIEW_TYPE', payload }), []);
    const setArchive = useCallback(payload => stateDispatch({ type: 'SET_ARCHIVE', payload }), []);
    const setSearch = useCallback(payload => stateDispatch({ type: 'SET_SEARCH', payload }), []);
    const setUrgent = useCallback(payload => { stateDispatch({ type: 'SET_URGENT', payload }) }, []);
    const setDisStatus = useCallback(payload => { stateDispatch({ type: 'SET_DISSTATUS', payload }) }, []);
    const setPin = useCallback(payload => stateDispatch({ type: 'SET_PIN', payload }), []);
    const setUnreadCount = useCallback(payload => stateDispatch({ type: 'SET_UNREAD_COUNT', payload }), []);
    const setUrgentAndPin = useCallback(payload => stateDispatch({ type: 'SET_URGENT_AND_PIN', payload }), []);
    const setSortModel = useCallback(payload => stateDispatch({ type: 'SET_MODEL', payload }), []);
    const setTag = useCallback(payload => stateDispatch({ type: 'SET_TAG', payload }), []);

    const firebaseAuth = useFirebaseAuth();
    const searchParams = useSearchParams();
    let userId: string = firebaseAuth.fbUid!;

    useEffect(() => {
        const { archive, search, urgent, pin, unreadCount, urgentAndPin, disStatus } = state;
        const fList = archive ? list.archivedDiscussionList?.filter(obj => obj.participants?.[userId]?.participantStatus == 1) : list.discussionList?.filter(obj => obj.participants?.[userId]?.participantStatus == 1);

        // Step 1: Filter based on search input
        const searchLower = search?.toLowerCase();
        const filteredList = searchLower
            ? fList?.filter(item => {
                const lastMessage = item?.lastMessage?.toLowerCase();
                const subject = item?.subject?.toLowerCase();
                const participantsName = Object.values(item?.participants || []).map(obj => `${userList?.[obj.fbUserId]?.prenom} ${userList?.[obj.fbUserId]?.nom}`).join(' ').toLowerCase();
                return lastMessage?.includes(searchLower) || subject?.includes(searchLower) || participantsName?.includes(searchLower);
            })
            : fList;

        if (!filteredList?.length) {
            setFilterList([]);
        }

        // Step 2: Filter based on flags (urgent, pin, unreadCount, urgentAndPin)
        const shouldApplyFlagFilter = urgent || pin || unreadCount || urgentAndPin;
        const mergedList = shouldApplyFlagFilter
            ? filteredList?.filter(item => {
                const isUrgent = urgent && item?.urgent;
                const isPinned = pin && item?.pin;
                const isUrgentAndPinned = urgentAndPin && (item?.urgent && item?.pin);
                const hasUnread = unreadCount && item?.unreadCount?.[userId] > 0;
                return isUrgent || isPinned || isUrgentAndPinned || hasUnread;
            })
            : filteredList;

        // Step 3: Deduplicate list based on discussionId
        const uniqueList = Array.from(
            new Map(mergedList?.map(item => [item.discussionId, item])).values()
        );

        disStatus == 0 ? setFilterList(uniqueList) : setFilterList(uniqueList.filter((item) => item.discussionMarkStatus == disStatus));
        
    }, [list, state, userId, userList]);


    useEffect(() => {
        const search = ParseQuery(searchParams.toString() ? `?${searchParams.toString()}` : '');
        if (search?.opt) {
            console.log("serach opt ", search?.opt)
            switch (search?.opt?.toString()) {
                case  enumDiscussionStatus.URGENT.toString():
                    setDisStatus(enumDiscussionStatus.URGENT)
                    
                    break;
                case '0':
                    setDisStatus(0)
                    break;
                    break;
                case '1':
                    stateDispatch({ type: 'SET_URGENT', payload: true });
                    break;
                case '2':
                    stateDispatch({ type: 'SET_PIN', payload: true });
                    break;
                case '3':
                    stateDispatch({ type: 'SET_URGENT_AND_PIN', payload: true });
                    break;
                case '4':
                    stateDispatch({ type: 'SET_UNREAD_COUNT', payload: true });
                    break;
                case '5':
                    stateDispatch({ type: 'SET_MODEL', payload: [{ field: 'date', sort: 'desc' }] });
                default:
                    break;
            }

            // Remove the opt parameter from the URL
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('opt');
            window.history.replaceState({}, '', newUrl.toString());

        }
    }, [searchParams]);


    return (
        <ChatContext.Provider value={{
            ...state,
            list: filterList || (state.archive ? list.archivedDiscussionList : list.discussionList),
            noData: list.archivedDiscussionList?.length == 0 && list.discussionList?.length == 0,
            setViewType,
            setArchive,
            setSearch,
            setUrgent,
            setPin,
            setUrgentAndPin,
            setUnreadCount,
            setDisStatus,
            setSortModel,
            setTag
        }}>
            {children}
        </ChatContext.Provider>
    );
};
