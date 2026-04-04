import { FC, Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, FloatingLabel, Form, Modal, Overlay, Popover } from 'react-bootstrap'
import i18n from '../../services/i18next/i18next'
import { useGet, usePost } from '../../api/API'
import { AllFolder, shareFileReqType } from '../../types/data'
import { Icon } from '@iconify/react'
import { Virtuoso } from 'react-virtuoso'
import { useTimeout } from '../../hooks/hooks'
import { showSuccess } from '../../services/Toastify'
import { GetCurrentUserTypeInt, GetMediCenterId } from '../../services/Constants'

export type shareFileType = {
    addFile: boolean,
    uuid?: string,
    attachmentId?: string
}

type CreateFolderModalProps = {
    show: boolean,
    callback: (data?: shareFileReqType) => void,
    shareFile?: shareFileType
}

const CreateFolderModal: FC<CreateFolderModalProps> = ({ show, callback, shareFile }) => {

    const [state, setState] = useState({
        fromList: true,
        value: '',
        folderId: '',
        error: '',
        searchText: ''
    })
    const [foldersData, setFoldersData] = useState<AllFolder[]>([])
    const targetRef = useRef(null);
    const [showPopover, setShowPopover] = useState(false);
    const timeOut = useTimeout({ duration: 300 })

    const medicalCenterId = GetMediCenterId()
    const userType = GetCurrentUserTypeInt()

    const createFolder = usePost<'/patient/upload-file'>({
        endpoint: '/patient/upload-file',
    })

    const folders = useGet<'/list/folders'>({
        'endpoint': '/list/folders',
    })

    const searchNewFolder = useCallback((text: string) => {
        timeOut.delay(() => {
            if (text) {
                folders.get?.({
                    reqBody: {
                        'folder_name': text,
                    }
                }).then((response) => {
                    setFoldersData(response.data)
                })
            } else {
                setFoldersData([])
            }
        })
    }, [])

    useEffect(() => {
        if (!state.fromList) return
        folders?.get?.({})
            .then((res) => {
                setFoldersData(res.data)
            }).catch((err) => {
                console.log(err)
            })
    }, [state.fromList])

    const handleCreate = () => {

        if (state.value.trim() === '') {
            setState(prev => ({
                ...prev,
                error: i18n.t('enter_the_folder_name') + ' *'
            }))
            return
        }

        const params: shareFileReqType = {
            patient_id: shareFile?.uuid || '',
            folder_name: state.value,
            folder_id: state.folderId,
            attachment_id: shareFile?.attachmentId!,
            medical_center_id: medicalCenterId,
            attachment_flag: '1',
        }

        if (userType == '4') {
            callback(params)
            return
        }

        createFolder.post?.({
            reqBody: params
        }).then((res) => {
            handleClose()
            setState({
                fromList: true,
                value: '',
                folderId: '',
                error: '',
                searchText: ''
            })
            showSuccess(i18n.t('file_uploaded_successfully'))
        }).catch((err) => {
            console.log(err)
        })
    }

    const handleClose = useCallback(() => {
        setState({
            fromList: true,
            value: '',
            folderId: '',
            error: '',
            searchText: ''
        })
        callback()
    }, [])



    const filteredFolders = useMemo(() => {
        return foldersData?.filter?.(folder =>
            folder?.name
                ?.toLowerCase?.()
                ?.includes?.(state?.searchText?.toLowerCase?.())
        )
    }, [foldersData, state.searchText]);



    return (
        <Modal className="cht-modal select-folder-modal" backdrop="static" show={show} onHide={handleClose} aria-labelledby="contained-modal-title-vcenter" >
            <Modal.Header closeButton>{state.fromList ? i18n.t('move_this_document') : i18n.t('create_new_folder')}</Modal.Header>
            <Modal.Body>
                <div className="create-folder-modal">
                    {
                        state.fromList ?
                            <>
                                {/* Search Input */}
                                <Form.Control
                                    ref={targetRef}
                                    type="text"
                                    placeholder={i18n.t('select_the_folder_name')}
                                    value={state.searchText}
                                    onFocus={() => setShowPopover(true)}
                                    onChange={(e) => {
                                        if (e.target.value.trim() !== '') {
                                            setState(prev => ({
                                                ...prev,
                                                error: ''
                                            }))
                                        }
                                        setShowPopover(true)
                                        setState(prev => ({
                                            ...prev,
                                            searchText: e.target.value
                                        }))
                                    }}
                                    onBlur={() => setShowPopover(false)}
                                />

                                {/* Popover */}
                                <Overlay
                                    target={targetRef.current}
                                    show={showPopover}
                                    placement="bottom-start"
                                    onHide={() => setShowPopover(false)}

                                >
                                    <Popover className='create-folder-popover' style={{ width: '600px', maxWidth: 'none' }}>
                                        <Popover.Body style={{ padding: 0, width: '100%' }}
                                            onMouseDown={(e) => e.preventDefault()}
                                        >
                                            <div
                                                style={{
                                                    maxHeight: "50vh",
                                                    height: filteredFolders?.length ? "45vh" : "auto"
                                                }}
                                            >
                                                <Virtuoso
                                                    data={filteredFolders}
                                                    style={{ display: 'flex', gap: '6px' }}
                                                    itemContent={(index, folder) => (
                                                        <div
                                                            key={folder.id}
                                                            className="dropdown-item d-flex align-items-center p-2"
                                                            onClick={() => {
                                                                setState(prev => ({
                                                                    ...prev,
                                                                    value: folder.name,
                                                                    folderId: folder.id.toString(),
                                                                    searchText: folder.name
                                                                }));
                                                                setShowPopover(false);
                                                            }}
                                                            style={{ cursor: "pointer" }}
                                                        >
                                                            <img
                                                                src={folder.folder_icon}
                                                                alt={folder.name}
                                                                style={{
                                                                    width: 120,
                                                                    height: 100,
                                                                }}
                                                            />
                                                            {folder.name}
                                                        </div>
                                                    )}
                                                />
                                            </div>
                                        </Popover.Body>
                                    </Popover>
                                </Overlay>
                            </>
                            :
                            <Fragment>
                                <FloatingLabel
                                    label={i18n.t('enter_the_folder_name') + ' *'}
                                    style={{}}
                                >
                                    <Form.Control
                                        ref={targetRef}
                                        type={'text'}
                                        value={state.value}
                                        onFocus={() => setShowPopover(true)}
                                        onBlur={() => setShowPopover(false)}
                                        onChange={(e) => {
                                            if (e.target.value.trim() !== '') {
                                                setState(prev => ({
                                                    ...prev,
                                                    error: ''
                                                }))
                                            }
                                            searchNewFolder(e.target.value)
                                            setState(prev => ({
                                                ...prev,
                                                value: e.target.value,
                                                searchText: e.target.value
                                            }))
                                        }}
                                        maxLength={30}
                                        style={{
                                            border: '1px solid #CED4DA',
                                            borderRadius: 6
                                        }}

                                    />
                                    <span className='close-icon' onClick={() => {
                                        setFoldersData([])
                                        setState(prev => ({ ...prev, fromList: !prev.fromList, value: '', folderId: '', error: '', searchText: '' }))
                                    }} >
                                        <Icon icon="ep:close-bold" />
                                    </span>
                                </FloatingLabel>
                                {/* Popover */}
                                <Overlay
                                    target={targetRef.current}
                                    show={showPopover && foldersData?.length > 0}
                                    placement="bottom-start"
                                    onHide={() => setShowPopover(false)}

                                >
                                    <Popover className='create-folder-popover' style={{ width: '600px', maxWidth: 'none' }}>
                                        <Popover.Body style={{ padding: 0, width: '100%' }} onMouseDown={(e) => e.preventDefault()}>
                                            <div
                                                style={{
                                                    maxHeight: "50vh",
                                                    height: filteredFolders?.length ? "45vh" : "auto"
                                                }}
                                            >
                                                <Virtuoso
                                                    data={filteredFolders}
                                                    style={{ display: 'flex', gap: '6px' }}
                                                    itemContent={(index, folder) => (
                                                        <div
                                                            key={folder.id}
                                                            className="dropdown-item d-flex align-items-center p-2"
                                                            onClick={() => {
                                                                setState(prev => ({
                                                                    ...prev,
                                                                    value: folder.name,
                                                                    folderId: folder.id.toString(),
                                                                    searchText: folder.name
                                                                }));
                                                                setShowPopover(false);
                                                            }}
                                                            style={{ cursor: "pointer" }}
                                                        >
                                                            <img
                                                                src={folder.folder_icon}
                                                                alt={folder.name}
                                                                style={{
                                                                    width: 120,
                                                                    height: 100,
                                                                }}
                                                            />
                                                            {folder.name}
                                                        </div>
                                                    )}
                                                />
                                            </div>
                                        </Popover.Body>
                                    </Popover>
                                </Overlay>
                            </Fragment>
                    }
                    {state.error && (
                        <Form.Text style={{ fontSize: '12px', color: 'rgb(220,53,69)' }}>
                            {i18n.t('folder_name_required')}
                        </Form.Text>
                    )}
                    {state.fromList && <div className="create-folder-option">
                        <span className='create-folder-option-item cursor-pointer' onClick={() => {
                            setFoldersData([])
                            setState(prev => ({ ...prev, fromList: !prev.fromList, value: '', folderId: '', error: '' }))
                        }} >
                            <Icon icon="ic:sharp-plus" width="18" height="18" />{i18n.t('or_create_a_new_folder')}
                        </span>
                    </div>}
                </div>
            </Modal.Body>
            <Modal.Footer >
                {(!!state?.value?.length || !state?.fromList) &&
                    <Fragment>
                        {!createFolder?.loader && <Button className="btn-transparent" onClick={() => {
                            handleClose()
                        }} children={i18n.t('cancle')} />}
                        <Button className="btn-primary dos-loader-btn" onClick={handleCreate} disabled={createFolder?.loader} children={createFolder?.loader ?
                            <span style={{ color: 'white' }}><Icon icon="codex:loader" width="24" height="24" />{i18n.t('to_validate')}</span>
                            : i18n.t('to_validate')} />
                    </Fragment>
                }
            </Modal.Footer>
        </Modal>
    )
}


export default memo(CreateFolderModal)