import { Snippet, AllFolder, AttachmentData, ChatUserProfile, CreateDiscussionReq, DiscussionDetails, EditSnippetReq, FileRes, Files, Folders, intAdminType, profileImage, shareFileReqType, VarChar, AgendListReqTypes, AgendListResType, CategoryResType, AppointmentInvitePatientReq, AppointmentInvitePatientRes, DiscussionRDVDetails } from "./data";

export type useGetReturnType<T extends APIEnum> = {
    loader: boolean;
    get?: ({ reqBody }: Pick<PickApiType<T>, 'reqBody'>) => Promise<Pick<PickApiType<T>, 'data'>>
}

export type usePostReturnType<T extends APIEnum> = {
    loader: boolean;
    post?: ({ reqBody }: Pick<PickApiType<T>, 'reqBody'>) => Promise<Pick<PickApiType<T>, 'data'>>
}

export type PickApiType<T extends APIEnum> = T extends infer U ? (U extends keyof AllApiTypes ? AllApiTypes[U] : never) : never;

export type useGetType = <T extends APIEnum>({ endpoint }: { endpoint: APIEnum, formData?: boolean, xml?: boolean }) => useGetReturnType<T>

export type usePostType = <T extends APIEnum>({ endpoint }: { endpoint: APIEnum, formData?: boolean, xml?: boolean }) => usePostReturnType<T>

export type APIEnum = '/discussion/assignee'
    | '/v1/discussion/participants-list'
    | '/discussion/initiate'
    | '/discussion/assignee-add'
    | '/discussion/assignee-delete'
    | '/discussion/upload-attachment'
    | '/medecin/patients-list'
    | '/patient-folders'
    | '/folder-files'
    | '/get-attachment'
    | '/get_user/profile_path'
    | '/discussion/patient-detail'
    | '/firebase/token'
    | '/discussion/notify-participants'
    | '/patient/upload-file'
    | '/list/folders'
    | '/init-admin-chat'
    | '/chat-snippet/add'
    | '/chat-snippet/edit'
    | '/chat-snippet/delete'
    | '/chat-snippet/list'
    | '/agenda/list'
    | '/ouverture/service/list'
    | '/appointment/invite-patient'
    | '/appointment/respond-to-invitation'

export type AllApiTypes = {
    '/discussion/assignee': {
        reqBody?: {
            search: string
            type: number
            discussion_id?: VarChar, // Work
            search_user_type?: number | string
            logged_med_center_id?: number | string
        }
        data: ChatUserProfile[]
    }
    '/v1/discussion/participants-list': {
        reqBody?: undefined;
        data: ChatUserProfile[]
    },
    '/discussion/initiate': {
        reqBody?: Partial<CreateDiscussionReq>
        data: {
            discussion_id: VarChar // work (change unique id)
            discussionGuid: VarChar
            isNewChat: boolean
        }
    }
    '/discussion/assignee-add': {
        reqBody?: {
            participant: any;
            fb_uid: string
            doctor_id: string
            type: '1' | '2' // transfer - 2 or association - 1
            disscussion_id: VarChar
        }
        data: any
    }
    '/discussion/assignee-delete': {
        reqBody?: {
            participant: any;
            rec_id?: string,
            fb_uid: string,
            disscussion_id: VarChar // work
        }
        data: any
    },
    '/discussion/upload-attachment': {
        reqBody?: {
            file: any,
            discussion_id?: any // work
            attachment_select_type: any
            attachment_selected_file_id?: any
        } | FormData
        data: FileRes
    },
    '/medecin/patients-list': {
        reqBody?: {
            fb_flag: 1
        }
        data: any
    },
    '/patient-folders': {
        reqBody?: {
            patient_id: number | string
            fb_flag: 1
        }
        data: Folders[]
    },
    '/folder-files': {
        reqBody?: {
            patient_id: number | string, // work
            fb_flag: 1  // work
            folder_id: number | string
        }
        data: Files[]
    },
    '/get-attachment': {
        reqBody?: {
            aid: string | number
        }
        data: AttachmentData
    },
    '/get_user/profile_path': {
        reqBody?: {
            aid: string | number
        }
        data: profileImage
    },
    '/discussion/patient-detail': {
        reqBody?: {
            "id": string | number,
            discussion_id: string | number // work
        }
        data: DiscussionDetails // work discussion id
    },
    '/firebase/token': {
        reqBody?: {
        }
        data: {
            fb_token: string
        }
    },
    '/discussion/notify-participants': {
        reqBody: {
            discussion_id: string
            message: string
        },
        data: any
    },
    '/patient/upload-file': {
        reqBody?: shareFileReqType
        data: any
    },
    '/list/folders': {
        reqBody?: {}
        data: AllFolder[]
    },
    '/init-admin-chat': {
        reqBody?: {}
        data: intAdminType
    },
    '/chat-snippet/add': {
        reqBody: {
            snippet: string,
            description: string
        }
        data: Snippet
    },
    '/chat-snippet/edit': {
        reqBody: EditSnippetReq
        data: Snippet
    },
    '/chat-snippet/delete': {
        reqBody?: { snippet_id: number }
        data: any
    },
    '/chat-snippet/list': {
        reqBody?: {}
        data: Snippet[]
    },
    '/agenda/list': {
        reqBody?: AgendListReqTypes
        data: AgendListResType[]
    },
    '/ouverture/service/list': {
        reqBody?: { agenda_id: number, consultation_type: number }
        data: CategoryResType[]
    },
    '/appointment/invite-patient': {
        reqBody: AppointmentInvitePatientReq
        data: DiscussionRDVDetails
    },
    '/appointment/respond-to-invitation': {
        reqBody: {
            invitation_id: string,
            status: number,
        }
        data: DiscussionRDVDetails
    }

}

export type ChatDiscussionUsers = {
    loader: boolean,
    get: ({ reqBody }: {
        reqBody: {
            logged_user_id: string
            logged_user_type: string
            search: string
            discussion_id?: string,
            patient_id?: string,
        }
    }) => Promise<ChatUserProfile[]>
}