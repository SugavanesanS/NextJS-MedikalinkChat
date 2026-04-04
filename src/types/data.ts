import { FieldValue, Timestamp } from "firebase/firestore"
export type VarChar = string | number
export interface FBParticipants {
    userType: number | string
    participantStatus: number
    userId: number
    fbUserId: string
    discussionStatus: number
    timestamp: number
    unique_id: string
}

export interface FBDiscussionList {
    discussionId: number
    guid: VarChar
    subject: string
    discussionType: number
    lastUserId: number
    createdUserId: number
    lastMessage: string
    timestamp: number
    participants: Record<VarChar, FBParticipants>
    unreadCount: Record<number, number>
    deadChat: number
    isGroup: boolean
    individualPersonDetail: FBParticipants
    participantsWithDetails: Record<number, (FBParticipants & DiscussionUser)> | undefined | null
    urgent: boolean
    pin: boolean
    discussionMarkStatus: Number
}
export interface ChatMessageFireBase {
    id: string
    attachment: {
        id: number
        uuid: string
        fileName: string
        name: string
        type?: string
        width?: number
        height?: number
    }
    messageText: string
    discussionId: number | string
    sentAt: number | Timestamp | FieldValue
    sentById: string | number
    sentByFbUserId: string
    sentByName: string
    sentToId: string
    sentToName: string
    status: string
    type: string
    objectText: string
    oldObjectText: string
}

export interface DiscussionDetails {
    access_file_id: string
    addresse: string
    age: string
    allergy: any
    antecedents: any
    detail_url: string
    dis_sent_by: number
    dis_sent_to: number
    disc_create_by: DiscCreateBy[]
    discussion_id: string
    disscussion_type: number
    dob: string
    email: string
    file: string
    file_display_name: string
    file_flag: string
    filename: string
    folder_id: string
    gender: string
    name: string
    number_urgence: any
    object: string
    patient_file_extention: string
    patient_file_name: string
    patient_folder_name: string
    patient_id: number
    pdf_url: string
    pin_flag: number
    port: any
    postal_code: string
    profile: string
    risk_factor: any
    sub_doctor: Record<number, SubDoctor>
    sub_doctor_assigne: Record<number, SubDoctorAssigne>
    sub_doctor_assigne_count: number
    tag_id: number
    telephone: any
    ville: any
    rdv_invitation: DiscussionRDVDetails
}

export interface DiscussionRDVDetails {
    rdv_start_date: string
    status: number //   1-invited;  2-accepted; 3-rejected
    price: string
    doctor_name: string
    invitation_id: string
    rdv: RDV_Meeting
}

export interface RDV_Meeting {
    patient_meeting_url: string
    doctor_meeting_url: string
    id: string

}
export interface DiscCreateBy {
    doctor_name: string
    fk_assignedoctor_id: number
}
export interface SubDoctorAssigne {
    assg_doct_id: number
    disp_short_name: string
    doctor_assign_type: number
    doctor_name: string
    doctor_profile: string
    doctor_profile_name: string
    fk_assigned_by_id: number
    fk_assignedoctor_id: number
    user_type: number
}

export interface ChatUserProfile {
    type?: string;
    id: number;
    fb_uid: string | number;
    name: string
    user_type: any
    profile: string
    dob: string
    unique_id?: string

}

export interface DiscussionUser {
    gender: number
    id: number
    fb_uid: string
    nom: string
    prenom: string
    user_type: number
    user_profile_photo: any
    name_title: any
    blocked_date: Date,
    blocked_flag: boolean
    unique_id?: string


}

export interface CreateDiscussionReq {
    sent_to: string,
    associated_user_id: string,
    associated_user_name: string,
    object: string,
    logged_med_center_id: number,
    discussionData: {
        timestamp: number;
        pin: boolean | undefined;
        urgent: boolean | undefined;
        discussionType: number;
        subject: string;
    }

}

export interface CreateDiscussionRes {
    attachment_id: string,
    attachment_name: string
    discussion_id: number,
    type: number,
    success: number,
    associate_users: any,
    exist_discussion: number,
    is_deleted: number,
    is_archived: number,
    attachment_display_name: string,
    send_to: string,
    send_to_name: string
}

export interface FileRes {
    attachment_disp_name: string
    attachment_id: number
    attachment_unique_id: string
    attachment_name: string
}

export interface Files {
    file_display_name: string
    file_ext: string
    file_flag: number
    file_id: number
    file_name: string
    file_path: string
    folder_id: number
    pdf_path: string
    image_size: {
        height: number
        width: number
    }
    uri?: string
}

export interface Patients {
    patient_id: string | number
    patient_name: string
}

export interface Folders {
    folder_id: number
    folder_name: string
    folder_image: string
    file_count: number
    img_exists: number
}

export interface Files {
    file_display_name: string
    file_ext: string
    file_flag: number
    file_id: number
    file_name: string
    file_path: string
    folder_id: number
    pdf_path: string
    image_size: {
        height: number
        width: number
    }
    uri?: string
}

export interface SubDoctor {
    pat_doct_id: number
    fk_doctor_id: number
    fk_patient_id: number
    doctor_name: any
    doctor_email: any
    doctor_address: any
    doctor_pays: any
    doctor_ville: any
    doctor_postal_code: any
    disp_doctor_fulladdress: string
    doctor_invite_sts: number
}

export interface AttachmentData {
    file_path: string
    preview_path: string
}

export interface profileImage {
    url: string
}
export type AllFolder = {
    id: number;
    name: string;
    folder_icon: string;
};

export type shareFileReqType = {
    patient_id: string,
    folder_name: string,
    folder_id: string,
    attachment_id: string,
    medical_center_id: string
    attachment_flag: '1',
    hide_from_others?: '0' | '1',
    mail_patient?: '0' | '1',
    mail_assoc_docs?: '0' | '1',
}

export interface intAdminType {
    id: string
    name: string
    dob: string
    user_type: number
    gender: number
    fb_uid: string
    profile: string
}

export type assigneeSearchUserType = 'all' | 'secretraite' | 'telesecretaire' | 'medecin' | 'admin'

export enum AssigneeSearchEnum {
    all = 0,
    admin = 1,
    secretraite = 2,
    telesecretaire = 7,
    medecin = 4
}

export type Snippet = {
    user_id: number
    snippet: string
    updated_at: string
    created_at: string
    id: number
}
export type EditSnippetReq = {
    snippet_id: number,
    snippet: string,
    description: string
}

export enum enumUserType {
    ALL = 0,
    ADMIN = 1,
    SECRETARY = 2,
    SECRETARIAT = 3,
    DOCTOR = 4,
    PATIENT = 5,
    TELESECRETARY = 7
}
export type AgendListReqTypes = {
    logged_user_id: string
    medical_center_id: number
    owner_of_logged_mc_id: string
    consultation_type: number
    filter_ouverture: '1'
}

export type AgendListResType = {
    agenda_id: number
    fk_medical_center_id: number
    agenda_nom: string
    step: any
    speciality_id: string
    speciality_nom: string
    doctor_id: string
    location_id: number
    location_name: string
    location_address: string
    created_by: number
    doctor_name: string
    doctor_ville: string
    doctor_address: string
    doctor_telephone: any
    doctor_email: string
    profile_photo: any
    agenda_setting_id: any
    slot_timing: any
    sharing_user_id: any
    sharing_access: any
    sharing_sda: any
}

export type CategoryResType = {
    id: number
    doctor_id: string
    opening_id: number
    agenda_id: number
    nom: string
    color: string
    status: number
    duration: number
    created_by: number
    admin_category_id: number
    category_id: number
    category_nom: string
    icon_file: string
    specialisation_id: number
    specialisation_nom: string
    reservation_open: number
    reservation_close: number
    consultation_type: string
    price: string
    notification: number
    online_booking: string
    admin_service_id: number
    service: Service
    tarif: Tarif
}

export interface Service {
    id: number
    nom: string
}

export interface Tarif {
    duration: number
    price_from: number
    price_to: number
}

export interface AppointmentInvitePatientReq {
    agenda_id: number
    consultation_type: number
    doctor_id: string
    patient_id: string
    service_id: number
    rdv_start_date: string
    discussion_id: string // uuid can be used 
    price: string
}

export interface AppointmentInvitePatientRes {
    patient_id: number
    discussion_id: number
    agenda_id: number
    service_id: number
    rdv_start_date: string
    rdv_end_date: string
    rdv_time: number
    consultation_type: number
    price: string
    updated_by: number
    created_by: number
    unique_id: string
    updated_at: string
    created_at: string
    id: number
}