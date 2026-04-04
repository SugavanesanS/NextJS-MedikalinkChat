import { createSelector } from "@reduxjs/toolkit"
import { getAuth, signOut } from "firebase/auth"
import { collection, doc, FirestoreError, getDoc, getDocs, getFirestore, increment, limit, onSnapshot, orderBy, query, setDoc, startAfter, updateDoc, where, writeBatch } from "firebase/firestore"
import { useCallback, useEffect, useRef, useState } from "react"
import { shallowEqual, useDispatch, useSelector } from "react-redux"
import { useGet, usePost } from "../api/API"
import { useFirebaseAuth } from "../contextAndProvider/FirebaseAuthWrapper"
import { useMessageContext } from "../contextAndProvider/MessageProviderWrapper"
import { DiscussionActions } from "../redux/reducer/DiscussionReducer"
import { RootState } from "../redux/store"
import { ScreenLoader, SPsort } from "../services/CommonFunction"
import { ChatPostMessageKey, GetCurrentUserName, GetCurrentUserTypeInt, getImageSize, GetLoggedUserId, GetMediCenterId, ImageCheckReg, objectToFormData } from "../services/Constants"
import { ChatMessageFireBase, ChatUserProfile, DiscussionUser, FBDiscussionList, FBParticipants, FileRes, Files, intAdminType, VarChar } from "../types/data"
import { useTimeout } from "./hooks"
import * as indexDB from '../services/CacheWithIndexeddb';


type ChatDiscussionReturnType = {
    chatMessages: ChatMessageFireBase[] | null;
    loadMore: () => void;
    lastDoc: any
}

const mainUserId = parseInt(GetLoggedUserId()?.toString())

const userType = GetCurrentUserTypeInt()
const medicalCenterId = GetMediCenterId()
const userName = GetCurrentUserName()
const initialLimit = 20

/**
 * A hook that fetches a list of discussions the user is participating in and
 * updates the state in the discussion reducer.
 *
 * @returns {undefined}
 */
export const useDiscussionListHook = () => {
    const dispatch = useDispatch();
    const db = getFirestore();
    const fireAuth = useFirebaseAuth()

    useEffect(() => {
        const userId = fireAuth.fbUid

        if (userId == null) {
            return
        }
        const subscription = onSnapshot(
            query(collection(db, `Discussion`), where(`participants.${userId}`, '!=', null)),
            (snapshot) => {
                const result = snapshot?.docs?.reduce((pre, currMain, ind, array) => {
                    const curr = {
                        discussionId: currMain.id,
                        ...currMain.data(),
                    } as FBDiscussionList & { discussionId: string };

                    if (curr.participants[userId]?.participantStatus == 0) {
                        return pre;
                    }

                    if (curr.participants[userId].participantStatus == 1) {
                        pre.allCount = pre.allCount + parseInt(curr.unreadCount[userId] > 0 ? '1' : '0');
                        if (curr.participants[userId].discussionStatus == 2) {
                            pre.archiveCount = pre.archiveCount + parseInt(curr.unreadCount[userId] > 0 ? '1' : '0');
                        }
                        curr.deadChat = 0
                    } else {
                        curr.deadChat = curr.participants[userId]?.timestamp
                    }

                    // Finding Group and Single Discussion with user id 
                    if (Object.keys(curr.participants).length <= 2) { // single
                        const allParticipants = { ...curr.participants }
                        Reflect.deleteProperty(allParticipants, userId)
                        curr.isGroup = false
                        curr.individualPersonDetail = Object.values(allParticipants)[0]
                    } else { // Group
                        curr.isGroup = true
                        curr.individualPersonDetail = curr.participants[curr.lastUserId]
                    }

                    if (curr.pin && curr.urgent) {
                        pre.pinAndUrgent.push(curr);
                    } else if (curr.pin) {
                        pre.pin.push(curr);
                    } else if (curr.urgent) {
                        pre.urgent.push(curr);
                    } else {
                        pre.normal.push(curr);
                    }

                    return pre;
                }, {
                    pinAndUrgent: [],
                    pin: [],
                    urgent: [],
                    normal: [],
                    archive: [],
                    allCount: 0,
                    archiveCount: 0
                } as {
                    pinAndUrgent: FBDiscussionList[],
                    pin: FBDiscussionList[],
                    urgent: FBDiscussionList[],
                    normal: FBDiscussionList[],
                    archive: FBDiscussionList[],
                    allCount: number,
                    archiveCount: number
                });

                // result.pinAndUrgent.sort(SPsort);
                // result.normal.sort(SPsort);
                // result.pin.sort(SPsort);
                // result.urgent.sort(SPsort);

                const before: FBDiscussionList[] = [
                    ...result.pinAndUrgent,
                    ...result.pin,
                    ...result.urgent,
                    ...result.normal,
                ];

                const archiveList = before.filter(
                    (obj) => obj.participants[userId].discussionStatus == 2
                ); // separating archive list
                const unarchiveList = before.filter(
                    (obj) => obj.participants[userId].discussionStatus == 1
                ); // separating unarchive list
                dispatch(
                    DiscussionActions.update({
                        discussionList: [...unarchiveList],
                        archivedDiscussionList: [...archiveList],
                        allChatCount: result.allCount,
                        archiveCount: result.archiveCount,
                        allData: result,
                    })
                );
            }, (error: FirestoreError) => {
                console.log(error)
            }
        );

        return subscription;

    }, [fireAuth.fbUid]);
};


export const getParticipants = createSelector(
    (state: RootState) => state.discussion.currentFBDiscussionInfo?.participantsWithDetails,
    (_, fbUserId) => fbUserId,
    (participantsWithDetails: Record<number, (FBParticipants & DiscussionUser)> | undefined | null, fbUserId: string) => {
        if (participantsWithDetails == undefined || participantsWithDetails == null) {
            return {
                participants: {},
                filterParticipants: []
            }
        }
        return {
            participants: participantsWithDetails,
            filterParticipants: Object.values(participantsWithDetails).filter(p => p.fbUserId != fbUserId && p.discussionStatus != 0 && p.participantStatus == 1).sort((a, b) => {
                return `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`)
            })
        }
    })


export const useProfileURLFromIndexDB = (userUUID: string) => {

    const getPath = useGet<'/get_user/profile_path'>({
        endpoint: '/get_user/profile_path'
    })
    const [profileMainUrl, setProfileMainUrl] = useState<profileImage | null>(null);

    useEffect(() => {

        indexDB.getWithExpiry<profileImage>(`${'Participants'}-${userUUID}`)
            .then((data) => {
                if (data) {
                    setProfileMainUrl(data)
                } else {

                    if (userUUID) {
                        getPath?.get?.({
                            reqBody: {
                                aid: userUUID
                            }
                        }).then((data) => {
                            setProfileMainUrl(data.data)
                            indexDB.setWithExpiry<profileImage>(`${'Participants'}-${userUUID}`, data.data!)
                        })
                    }

                }
            }).catch(() => {
                /*if (userUUID) {
                        getPath?.get?.({
                            reqBody: {
                                aid: userUUID
                            }
                        }).then((data) => {
                            setProfileMainUrl(data.data)
                            indexDB.setWithExpiry<profileImage>(`${'Participants'}-${userUUID}`, data.data!)                   
                         })
                    } */
            })
    }, [userUUID])

    return profileMainUrl

}




const getList = createSelector(
    [(state: RootState) => state.discussion.list.archivedDiscussionList || [],
    (state: RootState) => state.discussion.list.discussionList || []],
    (list, list2) => {
        let data = {}
        list.concat(list2).forEach((item) => {
            Object.values(item.participants).forEach((el) => {
                if (el.fbUserId && !data[el.fbUserId]) {
                    data[el.fbUserId] = true
                }

            })
        })
        return Object.keys(data)
    }
);

/**
 * A hook that fetches a list of users participating in the current
 * chat conversations and updates the state in the discussion reducer.
 *
 * @returns {undefined}
 */
export const useGetChatUserList = () => {

    const list = useSelector(getList, shallowEqual)
    const timeOut = useTimeout({ duration: 150 })
    const dispatch = useDispatch()
    const chatUserList = useGet<'/discussion/participants-list'>({ endpoint: '/discussion/participants-list' })


    useEffect(() => {
        if (list.length > 0) {
            // timeOut.delay(() => {
            chatUserList.get?.({}).then(res => {
                dispatch(DiscussionActions.updateUserList(res.data))
            }).catch((err) => {
                console.log('err', err)
            })
            //  })

        }
        return  // timeOut.reset
    }, [list])
}

/**
 * Custom hook to manage chat discussions.
 * @param {ChatDiscussionHookType} param0 - The discussion ID and optional filter date.
 * @returns {ChatDiscussionReturnType} The message collection reference, chat messages, and loadMore function.
 */
export const useChatDiscussionHook = (): ChatDiscussionReturnType => {
    const db = getFirestore()
    const messageContext = useMessageContext()
    const selectorId = useSelector((state: RootState) => state.discussion.currentDiscussionId)
    const [discussionId, setDiscussionId] = useState<string | number | null>(null)
    const [filterDate, setFilterDate] = useState<number | null>(messageContext.deadChat || null)
    const [chatMessages, setChatMessages] = useState<ChatMessageFireBase[] | null>(null)
    const [lastDoc, setLastDoc] = useState<any>(null)
    const loadMoreInitiate = useRef(false)
    useEffect(() => {
        if (selectorId != discussionId) {
            setDiscussionId(selectorId)
            setChatMessages(null)
            setLastDoc(null)
            loadMoreInitiate.current = false
        }
    }, [selectorId])

    useEffect(() => {
        setFilterDate(messageContext.deadChat || null)
    }, [messageContext.deadChat])

    const loadMore =
        useCallback(() => {
            if (loadMoreInitiate.current) {
                return
            }
            const message = collection(db, `Discussion/${discussionId}/messages`)

            if (lastDoc) {
                loadMoreInitiate.current = true
                getDocs(
                    query(
                        message,
                        orderBy('sentAt', 'desc'),
                        startAfter(lastDoc),
                        limit(initialLimit + 5)
                    )
                ).then((snapshot) => {
                    const data: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    if (data.length > 0) {
                        setLastDoc(snapshot?.docs[snapshot?.docs?.length - 1]);
                        setChatMessages((state) => { return state ? [...state, ...data] : [] });
                    } else {
                        setLastDoc(null)
                    }
                }).finally(() => {
                    loadMoreInitiate.current = false
                })
            } else {
                if (!chatMessages || chatMessages.length == 0) {
                    loadMoreInitiate.current = true
                    getDocs(
                        query(
                            message,
                            orderBy('sentAt', 'desc'),
                            limit(initialLimit)
                        )
                    ).then((snapshot) => {
                        const data: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        if (data.length > 0) {
                            setLastDoc(snapshot?.docs[snapshot?.docs?.length - 1]);
                            setChatMessages((state) => { return state ? [...state, ...data] : data ? [...data] : [] });
                        } else {
                            setLastDoc(null)
                        }
                    }).finally(() => {
                        loadMoreInitiate.current = false
                    })
                }
            }
        }, [lastDoc, discussionId, chatMessages]);


    /* const fetchDiscussion = async (discussionId) => {
           try {
             const docRef = doc(db, `Discussion/${discussionId}`)
                     const discussionDoc = await getDoc(docRef)
        
             console.log("discussion id  ", discussionId , discussionDoc.data())
             return discussionDoc.data()
           } catch (error) {
             console.error("Error fetching data:", error);
           }
         }; */

    useEffect(() => {
        if (discussionId) {
            loadMore() // initial load
            const ConfigDate = Date.now()
            const q = query(collection(db, `Discussion/${discussionId}/messages`));

            //   const discussionData =  fetchDiscussion(discussionId)

            const unsubscribe = onSnapshot(q, {
                'includeMetadataChanges': true
            }, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    switch (change.type) {
                        case 'added':
                            const data = { id: change.doc.id, ...change.doc.data() } as any
                            if (data.sentAt > ConfigDate) {
                                setChatMessages((state) => { return state ? [...[data], ...(state && state)] : [...data] });
                            }
                            break;
                        case 'modified':
                            const GatherData = { id: change.doc.id, ...change.doc.data() } as any
                            if (GatherData.type == '0') {
                                setChatMessages((state: any) => {
                                    const data = state?.map((item) => {
                                        if (item.id == change.doc.id) {
                                            return GatherData
                                        }
                                        return item
                                    })

                                    return [...data]
                                })
                            }
                            break;
                        default:
                            break;
                    }
                });
            });

            return () => {
                unsubscribe()
            }
        }
    }, [discussionId])

    return {
        chatMessages,
        loadMore,
        lastDoc,
    }
}

/**
 * Custom hook to reset unread count.
 * @param {Object} param0 - The discussion ID.zxxz
 * @returns {Object} The reset function.
 */
export const useUnReadReset = (): {
    reset: () => void
} => {
    const db = getFirestore()
    const selectorId = useSelector((state: RootState) => state.discussion.currentDiscussionId)
    const firebaseAuth = useFirebaseAuth()
    const reset = useCallback(() => {
        if (selectorId && firebaseAuth.fbUid) {
            const patch = writeBatch(db);
            patch.update(doc(db, `Discussion/${selectorId}`),
                {
                    [`unreadCount.${firebaseAuth.fbUid}`]: 0
                }
            );
            patch.commit().catch(() => { });
        }

    }, [selectorId, firebaseAuth.fbUid])

    return {
        reset
    }
}

export const usePostCall = () => {

    const open = useCallback((discussionId: number) => window.postMessage({
        type: ChatPostMessageKey.OPEN_CHAT, data: {
            discussionId
        }
    }), [])

    const create = useCallback((props?: any) => window.postMessage({
        type: ChatPostMessageKey.OPEN_CHAT_CREATE, data: props
    }), [])

    const createInternalWithUser = useCallback((props?: any) => window.postMessage({
        type: ChatPostMessageKey.OPEN_CHAT_INTERNAL, data: props
    }), [])

    const shareInternalFile = useCallback((props?: any) => window.postMessage({
        type: ChatPostMessageKey.OPEN_CHAT_FILE, data: props
    }), [])

    return {
        open,
        create,
        createInternalWithUser,
        shareInternalFile
    }
}

export const usePostMessageHook = () => {
    const dispatch = useDispatch()
    const postCall = usePostCall()
    const firebaseAuth = useFirebaseAuth()
    const discussion = useSelector((state: RootState) => state.discussion)
    const getApi = useGet<'/init-admin-chat'>({
        endpoint: '/init-admin-chat'
    })

    useEffect(() => {
        const func = (event: { data: { type: keyof typeof ChatPostMessageKey, data: any, fileData?: any }, origin: string }) => {

            if (event.origin != window.location.origin) {
                return;
            }

            console.log("event from chat -", event.data)

            switch (event.data.type) {
                case ChatPostMessageKey.OPEN_CHAT:
                    let sendId = event.data.data.discussionId;
                    const data = [...(discussion.list.discussionList || []), ...(discussion.list.archivedDiscussionList || [])].find((item) => item.guid == event.data.data.discussionId)
                    if (data) {
                        sendId = data.discussionId
                    }

                    dispatch(DiscussionActions.setCurrentDiscussionId(sendId))
                    if (event.data.data.user_type == 4) {
                        setTimeout(() => {
                            if (event.data.data) {
                                postCall.createInternalWithUser(event.data.data)
                            }
                        }, 300);
                    }
                    break;

                case ChatPostMessageKey.OPEN_CHAT_CREATE:
                    dispatch(DiscussionActions.setCurrentDiscussionId(0))
                    break;

                case ChatPostMessageKey.OPEN_CHAT_CREATE_WITH_ADMIN:
                    dispatch(DiscussionActions.setAssigneeSearchUserType('admin'))
                    getApi.get?.({})
                        .then((data) => {
                            const user = data as unknown as intAdminType
                            const eventData = {
                                "id": user?.fb_uid,
                                "fb_uid": user?.fb_uid,
                                "name": user?.name,
                                "dob": user?.dob,
                                "user_type": user.user_type,
                                "gender": user?.gender,
                                "profile": user?.profile,
                                "reset": true,
                                "patientInfo": []
                            }

                            dispatch(DiscussionActions.setCurrentDiscussionId(0))
                            // setTimeout(() => {
                                postCall.createInternalWithUser(eventData)
                            // }, 300);
                        })
                    break;

                case ChatPostMessageKey.OPEN_CHAT_CREATE_WITH_USER:
                    dispatch(DiscussionActions.setCurrentDiscussionId(0))
                    setTimeout(() => {
                        if (event.data.data) {
                            postCall.createInternalWithUser(event.data.data)
                        }

                        if (event.data.fileData?.file != undefined) {
                            postCall.shareInternalFile(event.data.fileData)
                        }

                    }, 300);

                    break;
                case ChatPostMessageKey.FIREBASE_LOGOUT:
                    const auth = getAuth();
                    firebaseAuth.onLogout?.()
                    localStorage.clear()
                    signOut(auth).then(() => {
                        console.log('sign out')
                    }).catch((error) => {
                        console.log(error)
                    })
                    break;

                default:
                    break;
            }
        }
        window.addEventListener('message',
            func
        )
        return () => {
            window.removeEventListener('message', func)
        }
    }, [discussion.list])


}

export const usePostCreateListener = (callBack: (data: { type: keyof typeof ChatPostMessageKey, data: any }) => void) => {

    useEffect(() => {
        const func = (event: { data: { type: keyof typeof ChatPostMessageKey, data: any }, origin: string }) => {
            // console.log('event', event)
            if (event.origin != window.location.origin) {
                return;
            }
            switch (event.data.type) {
                case ChatPostMessageKey.OPEN_CHAT_INTERNAL:
                    callBack(event.data)
                    break;
                case ChatPostMessageKey.OPEN_CHAT_FILE:
                    callBack(event.data)
                    break;
            }
        }
        window.addEventListener('message',
            func
        )
        return () => {
            window.removeEventListener('message', func)
        }
    }, [])

}

export const useChatUserInfoListener = () => {

    const dispatch = useDispatch();
    const d = useSelector((state: RootState) => state.discussion);
    const timeOut = useTimeout({ duration: 120 });
    const firebaseAuth = useFirebaseAuth()
    useEffect(() => {
        if (d.list.discussionList && d.list.archivedDiscussionList && d.currentDiscussionId && d.userList) {

            timeOut.delay(() => {
                const list = [...(d?.list?.discussionList || []), ...(d?.list?.archivedDiscussionList || [])]
                const discussion = list?.find(obj => obj.discussionId == d.currentDiscussionId)
                if (discussion?.participants) {
                    const tempDiscussion = JSON.parse(JSON.stringify(discussion))
                    const details: any = {};
                    const data = Object.values(tempDiscussion.participants).map((data) => {
                        return { userId: (data as any).fbUserId as any, fbUserId: (data as any)?.fbUserId }
                    })

                    data?.forEach((data) => {
                        details[data.fbUserId] = { ...tempDiscussion?.participants[data.fbUserId], ...d?.userList?.[data.fbUserId] }
                    });
                    tempDiscussion.participantsWithDetails = details
                    dispatch(DiscussionActions.updateFBDiscussionInfo({
                        ...tempDiscussion as any, ...discussion
                    }))
                }
            })
        }
    }, [d.currentDiscussionId, d.list.discussionList, d.list.archivedDiscussionList, d.userList, firebaseAuth.fbUid])
}

export const useUpdateSubject = () => {
    const fbDiscussionDetails = useSelector((state: RootState) => state.discussion.currentFBDiscussionInfo);
    const sendMessageHandler = useSendMessageHook();
    const firebaseAuth = useFirebaseAuth();
    const update = useCallback((subject: string) => {
        const db = getFirestore()
        const patch = writeBatch(db);
        if (fbDiscussionDetails?.discussionId) {
            patch.update(doc(db, `Discussion/${fbDiscussionDetails?.discussionId!}`), {
                subject: subject,
                timestamp: Date.now()

            })
            patch.commit().then(() => {
                sendMessageHandler.set({
                    discussionId: fbDiscussionDetails?.discussionId,
                    sentById: mainUserId, // wait for work
                    sentByFbUserId: firebaseAuth.fbUid!,
                    sentByName: userName,
                    type: '7',
                    sentAt: Date.now(),
                    objectText: subject,
                    oldObjectText: fbDiscussionDetails?.subject.toString(),
                    status: '1',
                }, fbDiscussionDetails.discussionId.toString())
            })
        }

    }, [fbDiscussionDetails?.discussionId, fbDiscussionDetails?.subject])

    return {
        update
    }
}

export const useCreateRoomHook = () => {
    const userId = mainUserId || parseInt(GetLoggedUserId()?.toString())
    const createDiscussion = usePost<'/discussion/initiate'>({ endpoint: '/discussion/initiate' });
    const fileUpload = useChatFileUpload()
    const db = getFirestore()
    const firebaseAuth = useFirebaseAuth()
    const CreateNewDiscussion = useCallback(
        async (usersData: Record<string, ChatUserProfile>,
            title: string,
            file: File | Files | null,
            discussionMarkStatus: Number | 1,
            messageText?: string,
            pinAndUrgent?: { pin: boolean, urgent: boolean },
        ) => await new Promise(async (resolve, reject) => {
            let userIds: Array<number | string> = [], userNames: Array<string> = [], patientId: string = '';
            const participants = {} as Record<number, FBParticipants>
            participants[firebaseAuth.fbUid!] = {
                userId: userId,
                fbUserId: firebaseAuth.fbUid!,
                userType: userType,
                participantStatus: 1,
                discussionStatus: 1,
                timestamp: Date.now()
            }

            console.log(" disucssion status create room - ", discussionMarkStatus)
            const tempMap = Object.entries(usersData)
            for (let [_, value] of tempMap) {
                participants[value.fb_uid] = {
                    userId: value.id as number,
                    userType: value.user_type,
                    fbUserId: value.fb_uid,
                    participantStatus: 1,
                    discussionStatus: 1,
                    timestamp: Date.now()
                }
                // participantIds.push(value.id)
                userIds.push(value.id);
                userNames.push(value?.name);
                if (value?.user_type == 5) {
                    patientId = value?.id.toString()
                }
            }

            // Initialize unreadCount object
            const unreadCount = {} as any
            Object.keys(participants).forEach(participant => {
                unreadCount[participant] = `${0 + (file ? 1 : 0) + (messageText ? 1 : 0)}`;
            });
            // Data object to be set in the Firestore document
            const discussionData = {
                timestamp: Date.now(),
                createdUserId: firebaseAuth.fbUid,
                lastUserId: firebaseAuth.fbUid,
                pin: pinAndUrgent?.pin,
                urgent: pinAndUrgent?.urgent,
                discussionType: 1,
                subject: title || '',
                participants,
                unreadCount,
                discussionStatus: discussionMarkStatus
            };

            createDiscussion?.post?.({
                'reqBody': {
                    "sent_to": patientId,
                    "associated_user_id": userIds.toString(),
                    "associated_user_name": userNames.toString(),
                    "object": title,
                    "logged_med_center_id": parseInt(medicalCenterId),
                    discussionData
                }
            }).then(async (res) => {

                let currentTime = Date.now()
                const discussionId = res?.data?.discussion_id
                let discussionGuid = res?.data?.discussionGuid
                const newChat = res.data.isNewChat
                const patch = writeBatch(db);
                if (newChat) {
                    patch.set(doc(collection(db, `Discussion/${discussionId}/messages`)), {
                        discussionId: discussionId,
                        sentById: userId.toString(),
                        sentByFbUserId: firebaseAuth.fbUid,
                        sentByName: userName,
                        type: '2',
                        sentToId: '',
                        sentToName: '',
                        sentAt: currentTime++,
                        messageText: '',
                        status: '1',
                    });
                }

                if (title) {
                    patch.set(doc(collection(db, `Discussion/${discussionId}/messages`)), {
                        discussionId: discussionId,
                        sentById: userId,
                        sentByFbUserId: firebaseAuth.fbUid!,
                        sentByName: userName,
                        type: '7',
                        sentAt: currentTime++,
                        objectText: title,
                        oldObjectText: '',
                        status: '1',
                    });
                }

                if (messageText) {
                    patch.set(doc(collection(db, `Discussion/${discussionId}/messages`)), {
                        discussionId: discussionId,
                        sentById: userId,
                        sentByFbUserId: firebaseAuth.fbUid,
                        sentByName: userName,
                        type: '1',
                        sentToId: '',
                        sentToName: '',
                        sentAt: currentTime++,
                        messageText: messageText,
                    });

                    const docRef = doc(db, `Discussion/${discussionId}`)
                    const discussionData = await getDoc(docRef)

                    if (discussionData.exists()) {
                        const data = discussionData.data();

                        const unreadCount = {} as any

                        Object.values(data.participants).
                            filter((p: any) => p.participantStatus == 1 && p.fbUserId != firebaseAuth.fbUid)
                            .forEach((p: any) => {
                                unreadCount[p.fbUserId] = increment(1)
                            });

                        console.log("resd status ")
                        patch.update(doc(db, `Discussion/${discussionId}`), {
                            lastUserId: firebaseAuth.fbUid,
                            timestamp: Date.now(),
                            lastMessage: messageText,
                            readStatus: 0,
                            unreadCount
                        });
                    }
                }
                patch.commit().then((result) => {
                    if (file) {
                        fileUpload.upload({
                            file: file,
                            discussion_id: discussionId.toString(),
                            type: file instanceof File ? '1' : '2',
                            participants: participants,
                            discussionGuid: discussionGuid
                        }).then(() => {
                            resolve(discussionId)
                        }).catch((e) => {
                            console.log('error-->', e)
                        })
                    } else {
                        resolve(discussionId)
                    }
                }).catch((error) => {
                    console.log('Error ', error)
                })
            }).catch((e) => {
                console.log('error-->', e)
            }).finally(() => {
            })
        })
        , [firebaseAuth.fbUid])

    return {
        loader: false,
        CreateNewDiscussion
    }
}

export const useSendMessageHook = () => {
    const db = getFirestore()
    const FBParticipants = useSelector((state: RootState) => state.discussion)
    const firebaseAuth = useFirebaseAuth()
    const set =
        useCallback((item: Partial<ChatMessageFireBase>, discussionId?: string, outerParticipants?: Record<number, FBParticipants> | undefined): Promise<void> => {

            const discussion_Id = discussionId || FBParticipants.currentDiscussionId
            const participants = FBParticipants.currentFBDiscussionInfo?.participantsWithDetails || outerParticipants

            const message = collection(db, `Discussion/${(discussion_Id)}/messages`)
            const updates = doc(db, `Discussion/${(discussion_Id)}`)

            const patch = writeBatch(db);

            if (participants) {
                item.messageText && Object.values(participants).filter(d => (d.participantStatus == 1 && d.fbUserId != firebaseAuth.fbUid)).forEach((data) => {
                    patch.update(doc(db, `Discussion/${(discussion_Id)}`), {
                        [`unreadCount.${data.fbUserId}`]: increment(1)
                    })
                })
            }

            patch.commit()
            item.messageText && updateDoc(updates, {
                lastMessage: item.messageText,
                lastUserId: firebaseAuth.fbUid,
                readStatus: 0,
                timestamp: Date.now(),
            })

            return setDoc(doc(message), { ...item, status: 1 })
        }, [FBParticipants?.currentFBDiscussionInfo?.participantsWithDetails, FBParticipants?.currentDiscussionId, firebaseAuth.fbUid])
    return {
        set
    }

}

export const useSendMessageHandler = () => {
    const { set } = useSendMessageHook()
    const discussion = useSelector((state: RootState) => state.discussion)
    const firebaseAuth = useFirebaseAuth()
    const send = useCallback((message: { type: string, data: string }, discussionId?: string) => {
        const disId = discussionId || discussion.currentDiscussionId
        if (disId) {
            switch (message?.type) {
                case '1':
                    return (
                        set({
                            discussionId: disId,
                            sentById: mainUserId,
                            sentByFbUserId: firebaseAuth?.fbUid || '',
                            sentByName: userName,
                            type: '1',
                            sentToId: '',
                            sentToName: '',
                            sentAt: Date.now(),
                            messageText: message.data,

                        })
                    )
                case '2':
                    return (
                        set({
                            discussionId: disId,
                            sentById: mainUserId,
                            sentByFbUserId: firebaseAuth?.fbUid || '',
                            sentByName: userName,
                            type: '2',
                            sentToId: 'k_id',
                            sentToName: 'v_name',
                            sentAt: Date.now(),
                            messageText: '',
                            status: '1'
                        })
                    )
                case '3':
                    return (
                        set({
                            discussionId: disId,
                            sentById: mainUserId,
                            sentByFbUserId: firebaseAuth?.fbUid || '',
                            sentByName: userName,
                            type: '3',
                            sentToId: '',
                            sentToName: '',
                            sentAt: Date.now(),
                            messageText: message.data,

                        })
                    )
                case '4':
                    return (
                        set({
                            discussionId: disId,
                            sentById: mainUserId,
                            sentByFbUserId: firebaseAuth?.fbUid || '',
                            sentByName: userName,
                            type: '4',
                            sentToId: '',
                            sentToName: '',
                            sentAt: Date.now(),
                            messageText: '',

                        })
                    )
                case '5':
                    return (
                        set({
                            discussionId: disId,
                            sentById: mainUserId,
                            sentByFbUserId: firebaseAuth?.fbUid || '',
                            sentByName: userName,
                            type: '5',
                            sentToId: 'doctor_id',
                            sentToName: "name",
                            sentAt: Date.now(),
                            messageText: '',

                        })
                    )
                case '6':
                    return (
                        set({
                            discussionId: 'result.dissc_id',
                            sentById: 'result.logged_id',
                            sentByName: 'result.logged_name',
                            type: '6',
                            //sentToId,
                            //sentToName,
                            sentAt: Date.now(),

                        })
                    )
                case '7':
                    return (
                        set({
                            discussionId: disId,
                            sentById: mainUserId,
                            sentByFbUserId: firebaseAuth?.fbUid || '',
                            sentByName: userName,
                            type: '7',
                            sentAt: Date.now(),
                            objectText: "",
                            oldObjectText: "",
                            status: '1'

                        })
                    )

                default: console.log('test')
                    break;
            }

        }



    }, [discussion.currentDiscussionId, firebaseAuth?.fbUid, set])

    return {
        send
    }

}

export const useOtherFunctionality = () => {

    const db = getFirestore()
    const discussionId = useSelector((state: RootState) => state.discussion.currentDiscussionId)

    const updateUrgent = useCallback((state: boolean) => {
        const patch = writeBatch(db);
        patch.update(doc(db, `Discussion/${discussionId}`), {
            discussionStatus: state,
            // timestamp: Date.now() // Don't need to update
        })

        patch.commit()

    }, [discussionId])

    const updatePin = useCallback((state: boolean) => {
        const patch = writeBatch(db);
        patch.update(doc(db, `Discussion/${discussionId}`), {
            discu: state,
            // timestamp: Date.now() // Don't need to update
        })

        patch.commit()
    }, [discussionId])

    const updateDiscussionMarkStatus = useCallback((state: Number) => {
        const patch = writeBatch(db);
        patch.update(doc(db, `Discussion/${discussionId}`), {
            discussionMarkStatus: state,
            // timestamp: Date.now() // Don't need to update
        })

        patch.commit()
    }, [discussionId])


    return {
        updateUrgent, updatePin, updateDiscussionMarkStatus
    }
}

export const useArchiveDelete = () => {

    const db = getFirestore()
    const firebaseAuth = useFirebaseAuth()
    const updateArchive = useCallback((discussionId: number, state: boolean) => {
        const patch = writeBatch(db);
        patch.update(doc(db, `Discussion/${discussionId}`), {
            [`participants.${firebaseAuth.fbUid}.discussionStatus`]: state ? '1' : '2',

        })
        patch.commit()
    }, [firebaseAuth.fbUid])

    const deleteDiscussion = useCallback((discussionId: number) => {
        const patch = writeBatch(db);
        patch.update(doc(db, `Discussion/${discussionId}`), {
            [`participants.${firebaseAuth.fbUid}.participantStatus`]: 0
        });
        patch.commit();

    }, [firebaseAuth.fbUid]);


    return {
        updateArchive, deleteDiscussion
    }
}

export const useParticipantAddRemoveHook = () => {
    const sendMessageHook = useSendMessageHook()
    const addNewAssignee = usePost<'/discussion/assignee-add'>({
        'endpoint': '/discussion/assignee-add'
    })
    const removeAssignee = usePost<'/discussion/assignee-delete'>({
        'endpoint': '/discussion/assignee-delete'
    })
    const discussionId = useSelector((state: RootState) => state.discussion.currentDiscussionId)
    const discussionGuid = useSelector((state: RootState) => state.discussion.currentFBDiscussionInfo)?.guid
    const firebaseAuth = useFirebaseAuth()

    const remove = useCallback((data: (FBParticipants & DiscussionUser)): Promise<void> => {

        return new Promise((resolve, reject) => {

            const participant = {
                [`${(data.fbUserId || data.fb_uid)}`]: {
                    participantStatus: 3,
                    timestamp: Date.now()
                }
            }
            removeAssignee.post?.({
                reqBody: {
                    participant,
                    'fb_uid': data.fbUserId || data.fb_uid,
                    'disscussion_id': discussionGuid || ''
                }
            }).then(() => {
                sendMessageHook.set({
                    discussionId: discussionId?.toString() || '',
                    sentById: mainUserId,
                    sentByFbUserId: firebaseAuth.fbUid!,
                    sentByName: userName,
                    type: '4',
                    sentToId: data.id.toString(),
                    sentToName: `${data.prenom} ${data.nom}`,
                    sentAt: Date.now(),
                    messageText: '',
                })
                resolve()
            })
                .catch(() => {
                    reject()
                })
        })
    }, [discussionId, firebaseAuth.fbUid, discussionGuid])


    const add = useCallback((data: ChatUserProfile): Promise<void> => {

        return new Promise((resolve, reject) => {

            const participant = {
                [`${data.fb_uid.toString()}`]: {
                    userId: data.id?.toString() || '',
                    fbUserId: data.fb_uid?.toString() || '',
                    timestamp: Date.now(),
                    userType: data.user_type || '',
                    participantStatus: 1,
                    discussionMarkStatus: 1,
                }
            }
            addNewAssignee.post?.({
                reqBody: {
                    participant,
                    fb_uid: data.fb_uid?.toString() || '',
                    disscussion_id: discussionGuid || '',
                    doctor_id: data.fb_uid?.toString() || '',
                    type: '1'
                }
            }).then(() => {
                sendMessageHook.set({
                    discussionId: discussionId?.toString(),
                    sentById: mainUserId!,
                    sentByFbUserId: firebaseAuth.fbUid!,
                    sentByName: userName,
                    type: '2',
                    sentToId: data.fb_uid.toString(),
                    sentToName: data.name,
                    sentAt: Date.now(),
                    messageText: '',
                    status: '1'
                }, discussionId?.toString())
                resolve()
            }).catch(() => {
                reject()
            })
        })
    }, [discussionId, firebaseAuth.fbUid, discussionGuid])


    return {
        add,
        remove
    }
}

export const useChatFileUpload = () => {
    const [loader, setLoader] = useState(false)
    const fileUpload = usePost<'/discussion/upload-attachment'>({
        'endpoint': '/discussion/upload-attachment',
        formData: true
    })
    const sendMessage = useSendMessageHook()
    const firebaseAuth = useFirebaseAuth()
    const upload = useCallback(
        async ({ file, discussion_id, type, participants, discussionGuid }: { discussionGuid: VarChar, file: File | Files, discussion_id?: string, type: '1' | '2', participants?: Record<number, FBParticipants> | undefined }) => new Promise((resolve, reject) => {
            ScreenLoader(true);
            let isDoc: boolean, url: string, filetype: string
            if (type == '1') {
                if ((file as File).type.includes('image/tiff')) {
                    isDoc = true
                }
                else {
                    isDoc = (file as File).type.includes('image') ? false : true
                }
                url = URL.createObjectURL((file as File))
                filetype = (file as File).type

            } else {
                console.log(file)
                isDoc = (ImageCheckReg.test((file as Files).file_display_name)) ? false : true
                url = (file as Files).file_path
                filetype = (file as Files).file_ext
            }
            fileUpload.post?.({
                reqBody: objectToFormData({
                    ...(type == '1' ? {
                        file: file
                    } : {}),
                    'discussion_id': discussionGuid || '',
                    'attachment_select_type': type,
                    'attachment_selected_file_id': (file as Files).file_id || ''
                })
            }).then(async (res) => new Promise((resolve: (res: FileRes & { width?: number, height?: number }) => void, _) => {
                if (isDoc) {
                    resolve(res.data)
                    return
                }
                getImageSize(url).then((imageSize) => {
                    resolve({
                        ...res.data as any,
                        ...imageSize as any
                    })
                })
            })).then(async (result) => {
                return new Promise((resolve, _) => {
                    sendMessage.set(
                        isDoc ?
                            {
                                attachment: {
                                    id: result.attachment_id,
                                    uuid: result.attachment_unique_id,
                                    fileName: result.attachment_name,
                                    name: result.attachment_disp_name,
                                    type: filetype,
                                },
                                messageText: 'doc',
                                discussionId: discussion_id,
                                sentAt: Date.now(),
                                sentById: mainUserId,
                                sentByFbUserId: firebaseAuth.fbUid || '',
                                sentByName: userName,
                                sentToId: '',
                                sentToName: '',
                                status: '1',
                                type: '3',

                            } : {
                                attachment: {
                                    id: result.attachment_id,
                                    uuid: result.attachment_unique_id,
                                    fileName: result.attachment_name,
                                    name: result.attachment_disp_name,
                                    type: filetype,
                                    width: result?.width,
                                    height: result?.height
                                },
                                messageText: 'photo',
                                discussionId: discussion_id,
                                sentAt: Date.now(),
                                sentById: mainUserId,
                                sentByFbUserId: firebaseAuth.fbUid || '',
                                sentByName: userName,
                                sentToId: '',
                                sentToName: '',
                                status: '1',
                                type: '3',

                            }

                        , discussion_id, participants
                    ).then(() => {
                        ScreenLoader(false);
                        resolve(result)
                    })

                })

            }).then((value) => {
                resolve(value)
            }).catch((err) => {
                reject(err)
            }).finally(() => {
                setLoader(false)
            })

        })
        , [firebaseAuth.fbUid, sendMessage.set])


    return {
        upload
    }

}

export const useMessageDelete = () => {
    const db = getFirestore()



    const messageDelete = useCallback((messageId: string, discussionId: string, callBack: () => void) => {

        const q = query(
            collection(db, `Discussion/${discussionId}/messages`),
            orderBy('sentAt', 'desc'),
            limit(1)
        );
        getDocs(q).then((snapshot) => {
            const patch = writeBatch(db);
            if (snapshot.docs[0].id == messageId) {
                getDoc(doc(db, `Discussion/${discussionId}`)).then((discussionSnap) => {
                    if (discussionSnap.exists()) {
                        const discussionData = discussionSnap.data()
                        const unreadCount = {}
                        //  const readStatus = {}

                        discussionData.unreadCount && Object.keys(discussionData.unreadCount).forEach((key) => {
                            unreadCount[key] = discussionData.unreadCount[key] - 1 > 0 ? discussionData.unreadCount[key] - 1 : 0
                        })

                        /*   discussionData.readStatus && Object.keys(discussionData.readStatus).forEach((key) => {
                               readStatus[key] = 0
                           }) */
                        patch.update(doc(db, `Discussion/${discussionId}`), {
                            lastMessage: '',
                            lastUserId: discussionData.lastUserId,
                            timestamp: discussionData.timestamp,
                            ...(!!discussionData.unreadCount && { unreadCount }),
                        })
                    }
                    patch.update(doc(db, `Discussion/${discussionId}/messages/${messageId}`), {
                        status: 0,
                        type: 0
                    })
                    patch.commit().then(callBack)
                })
            } else {
                patch.update(doc(db, `Discussion/${discussionId}/messages/${messageId}`), {
                    status: 0,
                    type: 0
                })
                patch.commit().then(callBack)
            }
        })
    }, [db])

    return {
        messageDelete
    }
}
