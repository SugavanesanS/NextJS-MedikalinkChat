import moment from "moment"
import i18n from "./i18next/i18next"
import { MainWithSub } from "../api/AppURL"

// Safe sessionStorage accessor — returns '' on server
const ss = (key: string): string =>
    typeof window !== 'undefined' ? (window.sessionStorage.getItem(key) || '') : ''

export const LocalStorageKey = {
    LOGGED_USER_ID: 'logged_user_uuid',
    LOGGED_MED_CENTER_ID: 'logged_med_center_id',
    LOGGED_USER_TYPE: 'logged_user_type',
    LOGGED_USER_NAME: 'logged_user_name',
    OWNER_OF_LOGGED_MC_ID: 'owner_of_logged_mc_id',
    REFERENCE_KEY: 'reference_key',
    FIREBASE_TOKEN: 'fb_token',
    FIREBASE_LOGGED: 'fb_logged'
}

export const ChatPostMessageKey = {
    OPEN_CHAT: 'OPEN_CHAT',
    OPEN_CHAT_CREATE: 'OPEN_CHAT_CREATE',
    OPEN_CHAT_CREATE_WITH_USER: 'OPEN_CHAT_CREATE_WITH_USER',
    OPEN_CHAT_CREATE_WITH_ADMIN: 'OPEN_CHAT_CREATE_WITH_ADMIN',
    OPEN_CHAT_INTERNAL: 'OPEN_CHAT_INTERNAL',
    OPEN_CHAT_FILE: 'OPEN_CHAT_FILE',
    FIREBASE_LOGOUT: 'FIREBASE_LOGOUT'
}

export enum enumDiscussionStatus {
    NORMAL = 1,
    URGENT = 2,
    ENCOURS = 3,
    FAIT = 4,
    NONTRAITE = 5,
}

export const disStatusOptions = [
    { label: "Normal", value: enumDiscussionStatus.NORMAL, color: 'blue' },
    { label: "Non Traité", value: enumDiscussionStatus.NONTRAITE, color: 'gray' },
    { label: "Urgent", value: enumDiscussionStatus.URGENT, color: 'red' },
    { label: "Encours", value: enumDiscussionStatus.ENCOURS, color: 'orange' },
    { label: "Traité", value: enumDiscussionStatus.FAIT, color: 'green' },
]

export const IDs = {
    chatWrapper: 'react-chat-open-wrapper',
    multiBubbleView: 'multi-bubble-view',
    unreadCount: 'total_unread_counter',
    overallCount: 'overall_unread_counter',
    msCount: 'mssante_unread_counter',
    imapCount: 'imaptotal_unread_counter'
}

export const GetLoggedUserId = (optional = false): string | number => {
    if (typeof window === 'undefined') return ''
    const urlParams = new URLSearchParams(window.location.search)
    const urlId = urlParams.get('userId')
    const id = optional
        ? window.sessionStorage.getItem(LocalStorageKey.LOGGED_USER_ID)
        : window.sessionStorage.getItem(LocalStorageKey.LOGGED_USER_ID) || (urlId || '')
    return id as string
}

export const GetLoggedUserUUID = (optional = false) => {
    if (typeof window === 'undefined') return null
    return optional
        ? sessionStorage.getItem(LocalStorageKey.LOGGED_USER_ID)
        : sessionStorage.getItem(LocalStorageKey.LOGGED_USER_ID)
}

export const GetCurrentUserTypeInt = (): string =>
    ss(LocalStorageKey.LOGGED_USER_TYPE) || "4"

export const GetCurrentUserType = () =>
    UserList[ss(LocalStorageKey.LOGGED_USER_TYPE) as any] || UserList["4"]

export const GetLoggedUserName = () =>
    ss(LocalStorageKey.LOGGED_USER_NAME)

export const GetLoggedOwnerOfMcId = () =>
    ss(LocalStorageKey.OWNER_OF_LOGGED_MC_ID)

export const GetFirebaseToken = () =>
    ss(LocalStorageKey.FIREBASE_TOKEN)

export const SectionTitle: Record<'1' | '2' | '3' | '4' | '5' | '7', string> = {
    "1": i18n.t('administrator'),
    "2": i18n.t('secretariat'),
    "3": i18n.t('secretary'),
    "4": i18n.t('doctor'),
    "5": i18n.t('patient'),
    "7": i18n.t('telesecretary'),
}

export const UserList = {
    "1": 'admin',
    "2": 'secretariat',
    "3": 'secretaire',
    "4": 'medecin',
    "5": 'patient',
    "7": 'telesecretary',
    'admin': "1",
    'secretariat': "2",
    'secretaire': "3",
    'medecin': "4",
    'patient': "5",
    'telesecretary': "7"
}

export const UserPrefix = {
    "1": '',
    "2": 'Sec ',
    "3": 'Sec ',
    "4": 'Dr ',
    "5": '',
    "7": 'TelSec '
}

export const GetMediCenterId = () => {
    const id = ss(LocalStorageKey.LOGGED_MED_CENTER_ID) || '79'
    return id as string
}

export const GetCurrentUserName = () =>
    ss(LocalStorageKey.LOGGED_USER_NAME)

export const getImageSize = (imageUrl: string): Promise<Object> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve({ width: img.width, height: img.height })
        img.onerror = (error) => reject(new Error(`Failed to load image: ${error.toString()}`))
        img.src = imageUrl
    })
}

export const objectToFormData = (obj: any, form?: any): FormData => {
    const formData = form || new FormData()
    for (const property in obj) {
        if (obj.hasOwnProperty(property)) {
            const value = obj[property]
            if (Array.isArray(value)) {
                value.forEach((item) => formData.append(`${property}[]`, item))
            } else {
                formData.append(property, value)
            }
        }
    }
    return formData
}

export const chatDatetimeFormat = (datetimeInput: number): string => {
    const Datevalue = moment(datetimeInput).format('DD/MM/YYYY')
    const Datetimevalue = moment(datetimeInput).format('HH:mm')
    return `${Datevalue + ' à ' + Datetimevalue}`
}

export const FileType = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/png', 'image/tiff',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
]

export const AudioType = ['audio/mpeg', 'audio/aac', 'audio/x-m4a', 'audio/aiff']

export const AcceptedFiles = [...FileType, ...AudioType]

export const AllowedAudioExtensions = ["mp3", "m4a", "wav", "aac", "aif", "audio/wav"]

export const AllFileTypes = [
    ".jpg", ".jpeg", ".png", ".doc", ".docx", ".pdf", ".xlsx", ".xls", ".tiff", ".tif",
    ...AllowedAudioExtensions.map(ext => `.${ext}`)
]

export const ImageCheckReg = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/

export const URLRegex = /(https?:\/\/[^\s]+)/g
