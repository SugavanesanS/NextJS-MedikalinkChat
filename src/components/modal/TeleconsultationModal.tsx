import React, { FC, useEffect, useMemo, useState } from 'react'
import { Modal, Spinner } from 'react-bootstrap'
import Minicalendar from '../molecules/Minicalendar';
import i18n, { getLocalization } from '../../services/i18next/i18next';
import ChooseTime from '../molecules/ChooseTime';
import moment from 'moment';
import { useGet, usePost } from '../../api/API';
import { GetLoggedOwnerOfMcId, GetLoggedUserId, GetLoggedUserName, GetMediCenterId } from '../../services/Constants';
import AppSelectDropdown from '../molecules/AppSelectDropdown';
import { sortArrrayAlphabetically } from '../../services/CommonFunction';
import { AgendListResType, CategoryResType, DiscussionRDVDetails, DiscussionUser, FBParticipants, Service } from '../../types/data';
import { RootState } from '../../redux/store';
import { useSelector } from 'react-redux';
import { showError, showSuccess } from '../../services/Toastify';

type TeleconsultationModalProps = {
    show: boolean;
    handleClose: (data?: DiscussionRDVDetails) => void
}
const LoggedUserName = GetLoggedUserName();
const LoggedUserId = GetLoggedUserId();
const LoggedMedicalId = GetMediCenterId();
const LoggedOwnerMClId = GetLoggedOwnerOfMcId();

type FormUserType = {
    showForm: boolean;
    selectedDate: Date;
    selectedTime: string;
    agenda: AgendListResType | null;
    category: CategoryResType | null;
    service: Service | null;
    agendaList: AgendListResType[];
    categoryList: CategoryResType[];
    serviceList: Service[] | null;
    price: number
}

type FormErrorType = {
    date: string;
    time: string;
    agenda: string;
    category: string;
    service: string;
    price: string
}

const TeleconsultationModal: FC<TeleconsultationModalProps> = ({ show, handleClose }) => {

    const getAgendaList = useGet<'/agenda/list'>({
        endpoint: '/agenda/list',
    })
    const getCategoryList = useGet<'/ouverture/service/list'>({
        endpoint: '/ouverture/service/list',
    })
    const postInvitePatient = usePost<'/appointment/invite-patient'>({
        endpoint: '/appointment/invite-patient'
    })

    const currentDiscussionInfo = useSelector((state: RootState) => state.discussion.currentFBDiscussionInfo)

    const PatientId = useMemo(() => {
        return Object.values(currentDiscussionInfo?.participantsWithDetails as (FBParticipants & DiscussionUser))
            ?.find((participant: (FBParticipants & DiscussionUser)) => participant?.userType == '5')
            ?.unique_id
    }, [currentDiscussionInfo?.participants])


    const [state, setState] = useState<FormUserType>({
        showForm: true,
        selectedDate: new Date(),
        selectedTime: '',
        agenda: null,
        service: null,
        category: null,
        price: 0,
        agendaList: [],
        categoryList: [],
        serviceList: [],
    });
    const [errors, setErrors] = useState<FormErrorType>({
        date: '',
        time: '',
        agenda: '',
        category: '',
        service: '',
        price: ''
    });

    useEffect(() => {
        getAgendaList.get?.({
            'reqBody': {
                'logged_user_id': String(LoggedUserId),
                'medical_center_id': Number(LoggedMedicalId),
                'owner_of_logged_mc_id': LoggedOwnerMClId,
                'consultation_type': 2,
                filter_ouverture: '1'
            }
        })
            .then((res) => {
                const AgendaList = res.data?.map((item) => ({ ...item, name: item?.agenda_nom }))
                if (AgendaList.length == 1) {
                    setState(prev => ({ ...prev, agenda: AgendaList[0] }))
                    handleClickAgenda(AgendaList[0])
                }
                setState(prev => ({ ...prev, agendaList: AgendaList }))
            })
            .catch((err) => {
                console.log('err-->', err)
            })
    }, [])

    const handleClickAgenda = (data: any) => {
        setErrors(prev => ({ ...prev, agenda: '' }))
        setState(prev => ({
            ...prev,
            agenda: data,
            category: null,
            service: null,
            serviceList: [],
            categoryList: []
        }))
        getCategoryList.get?.({
            'reqBody': {
                'agenda_id': data?.agenda_id,
                'consultation_type': 2
            }
        })
            .then((res) => {
                const cateMap = res.data?.reduce((acc: any, item: any) => {
                    if (acc[item?.category_id]) {
                        acc[item?.category_id] = { ...item, name: item?.category_nom, service: [...acc[item?.category_id]?.service, { ...item?.service, name: item?.service?.nom }] }
                    } else {
                        acc[item?.category_id] = { ...item, name: item?.category_nom, service: [{ ...item?.service, name: item?.service?.nom }] }
                    }
                    return acc
                }, {})

                if (Object.values(cateMap).length == 1) {
                    handleClickCategory(Object.values(cateMap)[0])
                }

                setState(prev =>
                    ({ ...prev, categoryList: Object.values(cateMap) })
                )
            })
    }

    const handleClickCategory = (data: any) => {
        setErrors(prev => ({ ...prev, category: '' }))
        setState(prev => ({
            ...prev,
            category: data,
            service: data?.service?.length == 1 ? data?.service[0] : null,
            serviceList: data?.service
        }))
    }

    const handleValidate = (): boolean => {
        const newErrors: FormErrorType = {};

        if (!state.agenda) {
            newErrors.agenda = i18n.t('select_agenda');
        }

        if (!state.category) {
            newErrors.category = i18n.t('choose_an_exam_reason');
        }

        if (!state.service) {
            newErrors.service = i18n.t('choose_a_subcategory');
        }

        if (!state.selectedDate) {
            newErrors.date = i18n.t('please_select_a_date');
        }

        if (!state.selectedTime) {
            newErrors.time = i18n.t('please_select_a_time');
        }

        if (state.price <= 0) {
            newErrors.price = i18n.t('choose_price');
        }

        // If any errors exist, set them and stop
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return false;
        }
        return true;
    }

    const handleSubmit = () => {


        if (!handleValidate()) {
            return
        }
        // setState(prev => ({
        //     ...prev,
        //     showForm: false,
        // }))
        handleConfirm()
    };

    const handleConfirm = () => {

        const startDateTime = `${moment(state.selectedDate).format('YYYY-MM-DD')} ${state.selectedTime}:00`;

        postInvitePatient.post?.({
            'reqBody': {
                'consultation_type': 2,
                'agenda_id': state.agenda?.agenda_id!,
                'service_id': state.service?.id!,
                'rdv_start_date': startDateTime,
                'doctor_id': String(LoggedUserId),
                'price': String(state.price),
                'patient_id': PatientId,
                'discussion_id': currentDiscussionInfo?.guid!
            }
        })
            .then((res) => {
                setState(prev => ({
                    ...prev,
                    showForm: false,
                }))
                showSuccess(i18n.t('teleconsultation_invitation_sent_successfully'))
                handleClose(res.data)
            })
            .catch((err) => {
                showError(err?.data?.message || i18n.t('something_went_wrong'))
                handleClose()
            })
            .finally(() => {

            })
    }


    return (
        <Modal className="teleconsultationmodal" show={show} onHide={handleClose} aria-labelledby="contained-modal-title-vcenter" >

            <Modal.Header closeButton />
            <Modal.Body>
                {
                    state.showForm
                        ?
                        <div className="teleconsultationmodal-body">
                            <span className=''>{i18n.t('at_what_time_would_you_like_to_schedule_the_teleconsultation')} </span>

                            <div className='select-agenda-container'>
                                <h6>{i18n.t('agenda')}</h6>
                                <AppSelectDropdown
                                    title={state?.agenda ? state.agenda?.agenda_nom : i18n.t('select_agenda')}
                                    Data={sortArrrayAlphabetically(state.agendaList)}
                                    onSelect={handleClickAgenda}
                                    showPlaceholder={!state?.agenda}
                                />
                                {errors.agenda && <p className='error-text'>{errors.agenda}</p>}
                            </div>
                            <div className='modif-exam-container'>
                                <h6>{i18n.t('reason_for_examination')}</h6>
                                <div className='d-flex gap-2'>
                                    <div style={{ flex: 1 }}>
                                        <AppSelectDropdown
                                            title={state?.category ? state.category?.category_nom : i18n.t('choose_an_exam_reason')}
                                            Data={state.categoryList}
                                            onSelect={(data: any) => {
                                                handleClickCategory(data)
                                            }}
                                            disabled={!state.agenda}
                                        />
                                        {errors.category && <p className='error-text'>{errors.category}</p>}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <AppSelectDropdown
                                            title={state?.service ? state.service?.nom : i18n.t('choose_a_subcategory')}
                                            Data={state.serviceList}
                                            onSelect={(data: any) => {
                                                setState(prev => ({ ...prev, service: data }))
                                                setErrors(prev => ({ ...prev, service: '' }))
                                            }}
                                            disabled={!state.category}
                                        />
                                        {errors.service && <p className='error-text'>{errors.service}</p>}
                                    </div>
                                </div>

                            </div>
                            <div>
                                <h6>{i18n.t('date_and_time')}</h6>
                                <div className='date-time-picker-conatiner '>
                                    <div style={{ flex: 1 }}>
                                        <Minicalendar
                                            currentDate={state?.selectedDate}
                                            dateCallBack={(date: any) => {
                                                setErrors(prev => ({ ...prev, date: '' }));
                                                setState(prev => ({ ...prev, selectedDate: date }))
                                            }}
                                        />
                                        {errors.date && <p className='error-text'>{errors.date}</p>}
                                    </div>

                                    <div style={{ flex: 1 }} >
                                        <ChooseTime
                                            time={state?.selectedTime}
                                            onChange={(time: string) => {
                                                setErrors(prev => ({ ...prev, time: '' }));
                                                setState(prev => ({ ...prev, selectedTime: time }))
                                            }}
                                            selectedDate={state?.selectedDate}
                                        />
                                        {errors.time && <p className='error-text'>{errors.time}</p>}
                                    </div>

                                </div>
                            </div>

                            <div className='price-container' >
                                <h6>{i18n.t('price')}</h6>
                                <input type="number" placeholder='' className='price-element me-2' style={{}} value={state?.price}
                                    onChange={(e) => {
                                        setErrors(prev => ({ ...prev, price: '' }));
                                        const price = e.target.value
                                        if (parseInt(price) >= 0 || price == '') {
                                            setState(prev => ({ ...prev, price: price }))
                                        }
                                    }}
                                />
                                <span className=''>{i18n.t('currency')}</span>
                                {errors.price && <p className='error-text'>{errors.price}</p>}
                            </div>

                            <button className='btn btn-primary mt-3 px-3' style={{ margin: '0 auto' }} disabled={postInvitePatient?.loader} onClick={handleSubmit}>
                                {postInvitePatient?.loader ? <span> <Spinner animation="border" size="sm" className='me-2' />{i18n.t('to_validate')} </span> : i18n.t('to_validate')}
                            </button>

                        </div>
                        :

                        <div className='teleconsultation-confirm-body'>

                            <div className='title-container'>
                                <span className=''>{i18n.t('invite_to_continue_discussion', {
                                    doctor_name: `Dr ${LoggedUserName}`,
                                    date: moment(state.selectedDate).locale(getLocalization()).format("DD MMMM YYYY"),
                                    time: state.selectedTime
                                })} </span>
                                <p className='sub-title'>{i18n.t('the_fee_is', { fee: state.price })}</p>
                                <p className='sub-title'>{i18n.t('do_you_accept')}</p>
                            </div>

                            <div className='teleconsultation-confirm-buttons-container'>
                                <button className='btn-cancel' disabled={postInvitePatient?.loader} onClick={() => handleClose()}>{i18n.t('cancle')}</button>
                                <button className='btn btn-primary' disabled={postInvitePatient?.loader} onClick={handleConfirm}>{
                                    postInvitePatient?.loader ? <span> <Spinner animation="border" size="sm" className='me-1' />{i18n.t('confirm')} </span> : i18n.t('confirm')
                                }</button>
                            </div>

                        </div>
                }
            </Modal.Body>

        </Modal>
    )
}

export default TeleconsultationModal