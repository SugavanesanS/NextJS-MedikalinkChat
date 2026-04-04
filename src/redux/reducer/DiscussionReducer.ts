import { createSlice } from "@reduxjs/toolkit";
import { assigneeSearchUserType, DiscussionDetails, DiscussionUser, FBDiscussionList } from "../../types/data";


type MessageInfoReducerType = {
    list: {
        discussionList: FBDiscussionList[] | null
        archivedDiscussionList: FBDiscussionList[] | null
    }
    bubbleChatIds: (number | string)[]
    allChatCount: number
    archiveCount: number,
    allData?: {
        pinAndUrgent: FBDiscussionList[];
        pin: FBDiscussionList[];
        urgent: FBDiscussionList[];
        normal: FBDiscussionList[];
        archive: FBDiscussionList[];
        allCount: number;
    }
    userList: Record<string, DiscussionUser> | null
    currentDiscussion: DiscussionDetails | null
    currentFBDiscussionInfo: FBDiscussionList | null,
    currentDiscussionId: number | string | null,
    assignee_search_user_type: assigneeSearchUserType
}

const initialState: MessageInfoReducerType = {
    allChatCount: 0,
    archiveCount: 0,
    list: {
        discussionList: null,
        archivedDiscussionList: null
    },
    userList: null,
    bubbleChatIds: [],
    currentDiscussion: null,
    currentFBDiscussionInfo: null,
    currentDiscussionId: null,
    assignee_search_user_type: 'all'
}

const DiscussionSlice = createSlice({
    name: 'discussion',
    initialState,
    reducers: {
        removeBubble(state, { payload }) {
            let tempState = { ...state };
            tempState.bubbleChatIds = tempState.bubbleChatIds.filter((id) => id != payload)
            return { ...tempState }
        },
        removeAllBubble(state) {
            let tempState = { ...state };
            tempState.bubbleChatIds = []
            return { ...tempState }
        },
        disClose(state, { payload }) {
            let tempState = { ...state };
            if (payload && tempState.currentDiscussionId) {
                const data = tempState.bubbleChatIds.find((id) => id == tempState.currentDiscussionId)
                !data && (tempState = {
                    ...tempState,
                    bubbleChatIds: [
                        ...tempState.bubbleChatIds,
                        tempState.currentDiscussionId
                    ]
                })
            } else {
                tempState.bubbleChatIds = tempState.bubbleChatIds.filter((id) => id != tempState.currentDiscussionId)

            }
            tempState = {
                ...tempState,
                currentDiscussion: null,
                currentFBDiscussionInfo: null,
                currentDiscussionId: null
            }

            return { ...tempState }
        },
        updateFBDiscussionInfo(state, { payload }: { payload: FBDiscussionList }) {
            state = { ...state, currentFBDiscussionInfo: payload }
            return { ...state }
        },
        setCurrentDiscussionId(state, { payload }) {
            state = { ...state, currentDiscussionId: payload }
            return { ...state }
        },
        setAssigneeSearchUserType(state, { payload }) {
            state = { ...state, assignee_search_user_type: payload }
            return { ...state }
        },
        updateUserList(state, { payload }) {
            state = { ...state, userList: payload }
            return { ...state }
        },
        update(state, { payload }) {
            const { allChatCount, allData, archiveCount } = payload
            state = { ...state, list: payload, allChatCount, allData, archiveCount }
            return { ...state }
        },
        reset(state) {
            state = initialState
            return { ...state }
        },
    }

})


const DiscussionReducer = DiscussionSlice.reducer
export const DiscussionActions = DiscussionSlice.actions
export default DiscussionReducer