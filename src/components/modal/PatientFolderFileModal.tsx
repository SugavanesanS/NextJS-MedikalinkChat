import { Icon } from "@iconify/react"
import { createSelector } from "@reduxjs/toolkit"
import { FC, useEffect, useRef, useState } from "react"
import { Button, Col, Dropdown, Form, Modal, Row } from "react-bootstrap"
import { useDispatch, useSelector } from "react-redux"
import { Virtuoso } from "react-virtuoso"
import { usePost } from "../../api/API"
import { OtherURL } from "../../api/AppURL"
import { useTimeout } from "../../hooks/hooks"
import { PatientListActions } from "../../redux/reducer/PatientListReducer"
import { RootState } from "../../redux/store"
import { PDFToBase64, ReduceFileName } from "../../services/CommonFunction"
import { GetCurrentUserName, GetCurrentUserTypeInt, GetLoggedUserId } from "../../services/Constants"
import i18n from "../../services/i18next/i18next"
import { ChatUserProfile, DiscussionUser, FBParticipants, Files, Folders, Patients } from "../../types/data"
import { BlockLoader } from "../BlockLoader"
import { NoDataView } from "../NoDataView"
import { useFirebaseAuth } from "../../contextAndProvider/FirebaseAuthWrapper"
import { usePostCall } from "../../hooks/ChatHooks"
import { useMessageContext } from "../../contextAndProvider/MessageProviderWrapper"


const getPatientId = createSelector(
    [(state: RootState) => state.discussion.currentFBDiscussionInfo],
    (info) => {
        let result: Partial<(FBParticipants & DiscussionUser) & { masterName: string }> = {}
        if (info?.participantsWithDetails) {
            const data = Object.values(info.participantsWithDetails).filter(p => p?.userType == '5')
            if (data.length > 0) {
                result = {
                    ...data[0],
                    masterName: `${data[0].prenom} ${data[0].nom}`
                }
            }
        }
        return result
    }
)

const loggedUserType = GetCurrentUserTypeInt()
const loggedUserId = GetLoggedUserId()
const loggedUserName = GetCurrentUserName()

const selector = loggedUserType == '5' ? () => {
    const firebaseAuth = useFirebaseAuth()
    return {
        id: firebaseAuth.fbUid,
        masterName: loggedUserName
    }
} : useSelector

export const PatientFolderFileModal: FC<{ handleClose: (file?: Files) => void, patientDetails?: { id: string; name: string } | null }> = ({ handleClose, patientDetails }) => {
    const messageContext = useMessageContext()
    let patient = selector(getPatientId)
    if (patientDetails?.id) {
        patient = {
            id: patientDetails.id,
            masterName: patientDetails.name
        }
    }
    const [patientId, setPatientId] = useState({
        id: patientDetails?.id || patient.id?.toString() || '',
        name: patientDetails?.name || patient.masterName
    })

    let title = ''
    let back = false
    const [folder, setFolder] = useState<Folders | null>(null)
    const [viewType, setViewType] = useState<'patientSelect' | 'folderSelect' | 'fileSelect'>(patient.id ? 'folderSelect' : 'patientSelect')
    const useCall = usePostCall()
    useEffect(() => {
        setPatientId({
            id: patient.id?.toString() || '',
            name: patient.masterName
        })
    }, [patient.id])

    switch (viewType) {
        case 'patientSelect':
            title = i18n.t('select_a_patient')
            back = false
            break;
        case "folderSelect":
            title = i18n.t('select_a_file_from', {
                patient: patientId.name
            })
            if (!patient.id) {
                back = true
            } else {
                back = false
            }
            break;
        case "fileSelect":
            title = i18n.t('select_a_file_from', {
                patient: patientId.name
            })
            back = true
            break;
        default:
            break;
    }

    return (
        <Modal className="cht-modal" show={true} onHide={handleClose} size="lg" aria-labelledby="contained-modal-title-vcenter" centered>
            <Modal.Header className="justify-content-between" closeButton={!back}>
                <Modal.Title className="h6"
                    children={title}
                />
                {
                    back && <div
                        className="cursor-pointer"
                        onClick={() => {
                            switch (viewType) {
                                case 'fileSelect':
                                    setFolder(null)
                                    setViewType('folderSelect')
                                    break;
                                case 'folderSelect':
                                    if (!patient.id) {
                                        setPatientId({ id: '', name: '' })
                                        setViewType('patientSelect')
                                    }
                                    break;

                                default:
                                    break;
                            }
                        }}>
                        <Icon icon="akar-icons:arrow-left" /><span children={i18n.t('back')} />
                    </div>
                }
            </Modal.Header>
            <Modal.Body style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column'
            }}>
                {
                    viewType == 'patientSelect' &&
                    <PatientSelection patientSelection={(patient) => {
                        setPatientId({
                            id: patient.patient_id.toString(),
                            name: patient.patient_name
                        })
                        setViewType('folderSelect')
                    }} />
                }
                {
                    viewType == 'folderSelect' &&
                    <PatientFolderSelection patientId={patientId as any} folderSelection={(folder) => {
                        setFolder(folder)
                        setViewType('fileSelect')
                    }} />
                }
                {
                    (viewType == 'fileSelect' && folder) &&
                    <PatientFileSelection
                        patientId={patientId.id}
                        folder={folder}
                        fileSelection={(data) => {
                            if (messageContext.isCreate) {
                                useCall.createInternalWithUser({
                                    dob: "",
                                    fb_uid: patientId.id,
                                    id: patientId.id as any,
                                    name: patientId.name,
                                    user_type: 5,
                                    profile: ""
                                } as ChatUserProfile)
                            }

                            handleClose(data)
                        }} />
                }

            </Modal.Body>
            <Modal.Footer className="justify-content-center">
                <Button className="btn-transparent" onClick={() => handleClose()} children={i18n.t('cancle')} />
            </Modal.Footer>
        </Modal>
    )
}

export const PatientSelection: FC<{ patientSelection: (patient: Patients) => void }> = ({ patientSelection }) => {
    const getPatient = usePost<'/medecin/patients-list'>({
        endpoint: '/medecin/patients-list',
    })
    const patientList = useSelector((state: RootState) => state.patientList)
    const timeoutHook = useTimeout({ duration: 300 })
    const [search, setSearch] = useState('')
    const [filteredPatient, setFilteredPatient] = useState(patientList)
    const dispatch = useDispatch()

    useEffect(() => {
        getPatient.post?.({
            reqBody: {
                fb_flag: 1
            }
        }).then((data) => {
            dispatch(PatientListActions.update(data.data))
        })
    }, [])

    useEffect(() => {
        if (search) {
            const filtered = patientList.filter(p => p.patient_name.toLowerCase().includes(search.toLowerCase()))
            setFilteredPatient(
                [...filtered]
            )
        } else {
            setFilteredPatient(patientList)
        }
    }, [search, patientList])

    return (
        <div className="ddl-block">
            <Dropdown show>
                <Dropdown.Toggle
                    className="btn-transparent">
                    <Form.Control type="text" onChange={(e) => {
                        e.persist();
                        timeoutHook.delay(() => {
                            setSearch(e.target.value)
                        })
                    }} />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    <Virtuoso
                        style={{ height: 300 }}
                        totalCount={filteredPatient.length}
                        itemContent={(index) => {
                            const patient = filteredPatient[index]
                            return (
                                <Dropdown.Item onClick={() => patientSelection(patient)} key={patient.patient_id}>{patient.patient_name}</Dropdown.Item>
                            )
                        }}
                    />
                </Dropdown.Menu>
            </Dropdown>
        </div>

    )
}

export const PatientFolderSelection: FC<{ patientId: { id: string; name: string }; folderSelection: (folder: Folders) => void }> = ({ patientId, folderSelection }) => {

    const getFolder = usePost<'/patient-folders'>({
        endpoint: '/patient-folders',
    })
    const [filteredFolder, setFilteredFolder] = useState<Folders[]>([])
    const afterApi = useRef(false)

    useEffect(() => {
        getFolder.post?.({
            reqBody: {
                patient_id: patientId.id,
                fb_flag: 1
            }
        }).then((data) => {
            afterApi.current = true
            setFilteredFolder(data.data)
        })
    }, [patientId.id])

    return (
        <div className="folder-box-outer">
            {
                filteredFolder.length > 0 && <Row className="m-0">
                    {
                        filteredFolder.map((folder, index) => {
                            return (
                                <Col onClick={() => folderSelection(folder)} md={3} sm={2} className="p-0" key={index}>
                                    <div className="fol-box-main">
                                        <div className="fol-img"><img src={folder.folder_image} /></div>
                                        <div className="fol-cont"><span className="fol-name">{folder.folder_name}</span><span className="fol-count">{`(${folder.file_count})`}</span></div>
                                    </div>
                                </Col>
                            )
                        })
                    }
                </Row>
            }
            <BlockLoader isLoading={getFolder.loader} />
            {(filteredFolder.length == 0 && !getFolder.loader && afterApi.current) && <NoDataView />}
        </div>
    )
}

export const PatientFileSelection: FC<{ folder: Folders; fileSelection: (file: Files) => void, patientId: string }> = ({ folder, fileSelection, patientId }) => {
    const getFiles = usePost<'/folder-files'>({
        endpoint: '/folder-files',
    })
    const [filteredFiles, setFilteredFiles] = useState<Files[]>([])
    const afterApi = useRef(false)

    useEffect(() => {
        getFiles.post?.({
            reqBody: {
                folder_id: folder.folder_id,
                patient_id: patientId,
                fb_flag: 1
            }
        }).then((res) => {
            afterApi.current = true
            setFilteredFiles(res.data)
        })
    }, [patientId, folder.folder_id])

    return (
        <div className="folder-box-outer">
            <h6 className="folder-name">{folder.folder_name}</h6>
            {
                filteredFiles.length > 0 &&
                <Row className="m-0">
                    {
                        filteredFiles.map((file, _) => {
                            if (!file.file_name) {
                                return null
                            }
                            return (
                                <PdfPreview
                                    key={file.file_id}
                                    file={file}
                                    isPdf={file.file_ext.toLowerCase().includes('pdf')}
                                    fileExt = {file.file_ext.toLocaleLowerCase()}
                                    onClick={fileSelection} />
                            )
                        })
                    }
                </Row>
            }
            <BlockLoader isLoading={getFiles.loader} />
            {!!(filteredFiles.length == 0 && !getFiles.loader && afterApi.current) && <NoDataView />}
        </div>
    )
}


const PdfPreview: FC<{ file: Files, isPdf: boolean, fileExt: string, onClick: (file: Files) => void }> = ({ file, isPdf, fileExt, onClick }) => {
    const ref = useRef<HTMLImageElement | null>(null);
    
    useEffect(() => {
        if (ref.current) {
            if (fileExt == 'pdf' || fileExt == 'doc' ) {
                PDFToBase64(file.pdf_path, ref).then(() => {
                    if (ref.current) {
                        ref.current.setAttribute('style', 'padding: 0; object-fit: cover;')
                        ref.current.classList.add('cursor-pointer')
                    }

                }).catch((e) => {
                    console.log('Error ', e)
                })

            } else {
                ref.current.src = file.pdf_path
                ref.current.setAttribute('style', 'padding: 0; object-fit: cover;')
                ref.current.classList.add('cursor-pointer')
            }
        }
    }, [file.pdf_path]);
    return (
        <Col onClick={() => onClick(file)} md={3} sm={2} className="p-0">
            <div className="ecg-outer folder-boxes">
                <div className="folder-preview">
                    <img ref={ref} style={{
                        padding: 60,
                        objectFit: 'contain'
                    }} src={OtherURL.loader} alt="" />
                    <span className={`pdf_preview_detail ${GetCurrentUserTypeInt() == "5" && fileExt == 'doc' ? 'pdf' : fileExt}`} />
                </div>
                <div>
                    <span className="file-name">{ReduceFileName(file?.file_display_name, 28)}</span></div>
            </div>
        </Col>
    )
}