import { GetCurrentUserType, GetLoggedUserId } from "../services/Constants"

export const MainURL = process.env.NEXT_PUBLIC_BASE_URL
export const DomainSubPath = process.env.NEXT_PUBLIC_SUB_PATH
export const MainWithSub = `${MainURL}${DomainSubPath}`
export const ImageResource = '/resources/images/'

export const AppURL = {
    BASE_URL: `${MainWithSub}/api`,
    get folderEndPoint() {
        const userType = GetCurrentUserType()
        const userId = GetLoggedUserId()
        return `${MainWithSub}/${userType}/${userId}/patient/dossier/*id*?fb_flag=1`
    },
    PatientDetailURL: `${MainWithSub}/patient-detail/`
}

export const OtherURL = {
    icon: `${MainWithSub}${ImageResource}favicon.ico`,
    loader: `${MainWithSub}${ImageResource}load.gif`,
    get chatEndPoint() {
        const userType = GetCurrentUserType()
        const userId = GetLoggedUserId()
        return `${DomainSubPath}/${userType}/${userId}/boite-de-reception`
    },
    get chatEndPointAdmin() {
        const userType = GetCurrentUserType()
        return `${DomainSubPath}/${userType}/boite-de-reception`
    },
    get chatHome() {
        const userType = GetCurrentUserType()
        const userId = GetLoggedUserId()
        return `${DomainSubPath}/${userType}/${userId}/accueil`
    },
    get chatWelcome() {
        const userType = GetCurrentUserType()
        const userId = GetLoggedUserId()
        return `${DomainSubPath}/${userType}/${userId}/accueil`
    },
    logout: `${DomainSubPath}/logout`,
}

export function GetChatEndpoint() {
    const userType = GetCurrentUserType()
    const userId = GetLoggedUserId()
    return `${DomainSubPath}/${userType}/${userId}/boite-de-reception`
}

export const UserDefImage = {
    admin: `${MainWithSub}${ImageResource}icons/support.svg`,
    '1': `${MainWithSub}${ImageResource}icons/support.svg`,
    doctor: `${MainWithSub}${ImageResource}def-doc.png`,
    '4': `${MainWithSub}${ImageResource}def-doc.png`,
    patientF: `${MainWithSub}${ImageResource}def-fem.png`,
    '5f': `${MainWithSub}${ImageResource}def-fem.png`,
    patientM: `${MainWithSub}${ImageResource}def-hom.png`,
    '5m': `${MainWithSub}${ImageResource}def-hom.png`,
    secretary: `${MainWithSub}${ImageResource}def-secr.png`,
    '3': `${MainWithSub}${ImageResource}def-secr.png`,
    '2': `${MainWithSub}${ImageResource}def-secr.png`,
}

export const FileExtToImage = {
    "pdf": `${MainWithSub}${ImageResource}pdf.svg`,
    "doc": `${MainWithSub}${ImageResource}doc.svg`,
    "docx": `${MainWithSub}${ImageResource}docx.svg`,
    "xls": `${MainWithSub}${ImageResource}xls.svg`,
    "xlsx": `${MainWithSub}${ImageResource}xls.svg`,
    "tiff": `${MainWithSub}${ImageResource}Tiff.svg`,
    "tif": `${MainWithSub}${ImageResource}Tiff.svg`,
}
