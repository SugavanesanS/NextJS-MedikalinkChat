import React, { FC, memo, useState } from 'react'
import { Button, Form, Modal, Toast } from 'react-bootstrap'
import i18n from '../../services/i18next/i18next'
import { shareFileReqType } from '../../types/data';
import { usePost } from '../../api/API';
import { showSuccess } from '../../services/Toastify';
import { Icon } from '@iconify/react';

type CheckBoxCompProps = {
    label: string,
    label2: string,
    name: 'group1' | 'group2' | 'group3',
    value: 'yes' | 'no';
    onChange: (name: 'group1' | 'group2' | 'group3', value: 'yes' | 'no') => void;
}

export type formStateType = {
    group1: 'yes' | 'no';
    group2: 'yes' | 'no';
    group3: 'yes' | 'no';
}

const CheckBoxComp: FC<CheckBoxCompProps> = ({ label, label2, name, value, onChange }) => {
    return (
        <div>
            <Form.Check
                id={label}
                inline
                label={label}
                type="radio"
                name={name}
                value="yes"
                checked={value === 'yes'}
                onChange={() => onChange(name, 'yes')}
                style={{ 'cursor': 'pointer' }}

            />
            <Form.Check
                id={label}
                inline
                label={label2}
                type="radio"
                name={name}
                value="no"
                checked={value === 'no'}
                onChange={() => onChange(name, 'no')}
                style={{ 'cursor': 'pointer' }}
            />
        </div>
    )

}

const UploadModal: FC<{ show: boolean, closeModal?: () => void, params: shareFileReqType }> = ({ show, closeModal, params }) => {

    const createFolder = usePost<'/patient/upload-file'>({
        endpoint: '/patient/upload-file',
    })

    const [formState, setFormState] = useState<formStateType>({
        group1: 'no',
        group2: 'yes',
        group3: 'no',
    });

    const handleRadioChange = (name: 'group1' | 'group2' | 'group3', value: 'yes' | 'no') => {
        setFormState(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const uploadFileToFolder = () => {
        createFolder.post?.({
            reqBody: {
                ...params,
                hide_from_others: formState.group1 === 'yes' ? '1' : '0',
                mail_patient: formState.group2 === 'yes' ? '1' : '0',
                mail_assoc_docs: formState.group3 === 'yes' ? '1' : '0',
            }
        }).then((res) => {
            closeModal?.()
            showSuccess(i18n.t('file_uploaded_successfully'))
        }).catch((err) => {
            console.log(err)
        })
    }

    return (
        <Modal className="cht-modal dossier-upload-modal"  backdrop="static" show={show} onHide={closeModal} aria-labelledby="contained-modal-title-vcenter" >
            <Modal.Header closeButton>{i18n.t('file_added')}</Modal.Header>
            <Modal.Body>
                <div className="d-flex flex-column gap-3">
                    <div>
                        <label>
                            {i18n.t('would_you_like_to_hide_this_file_from_the_patient_and_other_physicians')}
                        </label>
                        <CheckBoxComp
                            label={i18n.t('yes')}
                            label2={i18n.t('no')}
                            name="group1"
                            value={formState.group1}
                            onChange={handleRadioChange}
                        />
                    </div>

                    <div>
                        <label>
                            {i18n.t('do_you_want_an_email_to_be_sent_to_the_patient_informing_them_of_this_newly_uploaded_document?')}
                        </label>
                        <CheckBoxComp
                            label={i18n.t('yes')}
                            label2={i18n.t('no')}
                            name="group2"
                            value={formState.group2}
                            onChange={handleRadioChange}
                        />
                    </div>

                    <div>
                        <label>
                            {i18n.t('do_you_want_an_email_to_be_sent_to_physicians_associated_with_this_patient?')}
                        </label>
                        <CheckBoxComp
                            label={i18n.t('yes')}
                            label2={i18n.t('no')}
                            name="group3"
                            value={formState.group3}
                            onChange={handleRadioChange}
                        />
                    </div>
                </div>

            </Modal.Body>
            <Modal.Footer className="gap-2">
                {!createFolder?.loader && <Button className="btn-transparent" onClick={closeModal} children={i18n.t('cancle')} />}
                <Button className="btn-primary dos-loader-btn" onClick={uploadFileToFolder} disabled={createFolder?.loader} children={createFolder?.loader ?
                    <span style={{ color: 'white' }}><Icon icon="codex:loader" width="24" height="24" />{i18n.t('upload')}</span>
                    : i18n.t('upload')} />
            </Modal.Footer>
        </Modal>
    )
}

export default memo(UploadModal)