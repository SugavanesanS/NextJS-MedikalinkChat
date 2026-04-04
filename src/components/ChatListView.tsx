'use client';
import { DataGrid } from '@mui/x-data-grid';
import moment from 'moment';
import { Fragment, useCallback, useMemo, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useChatDiscussionContext } from '../contextAndProvider/ChatProviderWrapper';
import { useFirebaseAuth } from '../contextAndProvider/FirebaseAuthWrapper';
import { useArchiveDelete, usePostCall } from '../hooks/ChatHooks';
import { RootState } from '../redux/store';
import { clm, TimeCheckAndConvert, UserInfoExtract } from '../services/CommonFunction';
import i18n from '../services/i18next/i18next';
import { DiscussionDetails, FBDiscussionList } from '../types/data';
import { LoadingComp } from './CommonComponents';
import { PriorityCell, SentToCell, SubjectCell, ViewArchive } from './DataGridCells';
import CheckboxDropdown from './modal/CheckBoxDropDown';
import { Icon } from '@iconify/react';
import { disStatusOptions, enumDiscussionStatus, GetCurrentUserTypeInt } from '../services/Constants';


const modelSwitchData = {
    archive: {
        message: i18n.t('AUS_archive_discussion'),
        button: i18n.t('archive'),
        color: 'warning'
    },
    delete: {
        message: i18n.t('AUS_delete_discussion'),
        button: i18n.t('delete'),
        color: 'danger'
    },
    unarchive: {
        message: i18n.t('AUS_unarchive_discussion'),
        button: i18n.t('unarchive'),
        color: 'warning'
    }
}

const pageSize = 100
function ChatListView() {
    const { list, archive, setArchive, setUrgent, setPin, setUnreadCount, setUrgentAndPin, setDisStatus, sortModel, setSortModel, ...rest } = useChatDiscussionContext()

    const discussionData = useSelector((state: RootState) => state.discussion.userList);
    const archiveCount = useSelector((state: RootState) => state.discussion.archiveCount);
    
    const firebaseAuth = useFirebaseAuth()
    const [delArchiveModal, setDelArchiveModal] = useState<{
        type: 'archive' | 'delete' | 'unarchive',
        discussionId: number
    } | null>(null)
    const postCall = usePostCall()
    const archiveDelete = useArchiveDelete()

    const setFilter = useCallback((item) => {
        switch (item.id) {
            case  enumDiscussionStatus.URGENT:
                item.checked ? setDisStatus(item.id) : setDisStatus(0)

                break;
            case enumDiscussionStatus.ENCOURS:
                 item.checked ? setDisStatus(item.id) : setDisStatus(0)
                break;
            case enumDiscussionStatus.FAIT:
                 item.checked ? setDisStatus(item.id) : setDisStatus(0)
                break;
             case enumDiscussionStatus.NONTRAITE:
                 item.checked ? setDisStatus(item.id) : setDisStatus(0)
                break;
            case 6:
                setUnreadCount(item.checked); 
                break;
        
            default:
                break;
        }
    }, []);


    const dataList = useMemo(() => {
        if (!list) return list;

        let filteredList = [...list];
        if (sortModel?.[0]?.field == 'date') {
            filteredList.sort((a, b) => {
                if (sortModel?.[0]?.sort == 'asc') return a?.timestamp - b?.timestamp;
                if (sortModel?.[0]?.sort == 'desc') return b?.timestamp - a?.timestamp;
                return 0;
            });
        }

        if(!archive && archiveCount > 0)
        {
            const archiveRow: FBDiscussionList = { discussionId: 0 , guid:"000" , discussionType: 0, createdUserId: 0, subject: '', lastMessage: '', lastUserId:0, pin: false, urgent: false, discussionMarkStatus: 1, deadChat: 0, isGroup: false, timestamp: 0}
            filteredList = [archiveRow, ...filteredList]; // Insert at the beginning
        }

        switch (rest.tag) {
            case 'all':
                return filteredList;
            case 'group':
                return filteredList.filter((item) => item?.isGroup);
            case 'patient':
                return filteredList.filter((item) => Object.values(item.participants).some(p => p.userType == "5"));
            case 'sec':
                return filteredList.filter((item) => Object.values(item.participants).some(p => p.userType == "2"));
            case 'telesec':
                return filteredList.filter((item) => Object.values(item.participants).some(p => p.userType == "7"));
            case 'doctor':
                return filteredList.filter((item) => Object.values(item.participants).some(p => p.userType == "4"));
            default:
                return filteredList;
        }

    }, [list, rest.tag, sortModel]);


    if (!list) {
        return null
    }
    return (
        <Fragment>
            <Modal className="cht-modal" show={!!delArchiveModal} onHide={() => {
                setDelArchiveModal(null);
            }} aria-labelledby="contained-modal-title-vcenter" >
                <Modal.Header closeButton />
                <Modal.Body>
                    <div className="delete-msg">
                        <h6 children={delArchiveModal ? modelSwitchData[delArchiveModal?.type].message : ""} />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button className="btn-transparent" onClick={() => {
                        setDelArchiveModal(null);
                    }} children={i18n.t('cancle')} />
                    <Button className={
                        clm({
                            'red-btn': modelSwitchData[delArchiveModal?.type || 'archive'].color == 'danger',
                        })
                    } onClick={() => {
                        switch (delArchiveModal?.type) {
                            case 'archive':
                                archiveDelete.updateArchive(delArchiveModal?.discussionId, false)
                                break;
                            case 'unarchive':
                                archiveDelete.updateArchive(delArchiveModal?.discussionId, true)
                                break;
                            case 'delete':
                                archiveDelete.deleteDiscussion(delArchiveModal?.discussionId)
                                break;
                            default:
                                break;
                        }
                        setDelArchiveModal(null);
                    }} children={delArchiveModal ? modelSwitchData[delArchiveModal?.type].button : ""} />
                </Modal.Footer>
            </Modal>
         
            {
                (discussionData && dataList) ?
                    <DataGrid
                        className={clm({
                            'patient-calendar-list SHOW-BOX': true,
                            'archive': archive
                        })}
                        style={{
                            flex: 1,
                        }}
                        getRowSpacing={() => ({ top: 5, left: 0, bottom: 5, right: 0 })}
                        getRowHeight={() => 65}
                        getRowClassName={(props) => {
                            return props.row.discussionId != 0 ?  clm({ 'cursor-pointer': true, 'message-unread': props.row.unreadCount[firebaseAuth.fbUid!] > 0, 'react-message-group': props.row.isGroup }) : 'super-app-theme--inactive'; //clm({ 'cursor-pointer': true })
                        }}

                        sx={{
                     
                            '.MuiDataGrid-iconButtonContainer': {
                                visibility: 'visible',
                                paddingLeft: '15px'
                            },
                             '.super-app-theme--inactive': {
                                backgroundColor: '#d1d0d0ff'
                                
                            },
                            '.MuiDataGrid-sortIcon': {
                                opacity: 'inherit !important',
                            },
                            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                                outline: 'none',
                            },
                            '& .MuiTablePagination-root': {
                                flexDirection: 'start',
                                display: 'flex'
                            },
                            '& .MuiToolbar-root': {
                                paddingLeft: '0 !important',
                                display: 'flex',
                                flexDirection: 'row-reverse'
                            },
                            '& .MuiTablePagination-actions': {
                                margin: '0 !important'
                            },
                            '& .MuiTablePagination-displayedRows': {
                                margin: '0 !important'
                            },
                            '& .MuiDataGrid-sortIcon': {
                                color: sortModel?.[0]?.sort == 'asc' ? 'white !important' : sortModel?.[0]?.sort == 'desc' ? 'white !important' : '#bfbfbf !important',
                            },

                        }}

                        onCellClick={({ row }: { row: FBDiscussionList }) => {
                            if(row.discussionId != 0)
                            {
                                postCall.open(row.discussionId)
                            }
                            else{
                                setArchive(true)
                            }
                        }}
                        slots={{
                            noRowsOverlay: () => {
                                return (
                                    <div className="w-100 h-100 d-flex no-data justify-content-center align-items-center " >
                                        {i18n.t('no_discussion')}
                                    </div>
                                )
                            }
                        }}

                        columns={[
                            {
                                field: 'priority',
                                width: GetCurrentUserTypeInt() != '5' ? 230 : 100,
                                filterable: true,
                                headerName: GetCurrentUserTypeInt() != '5' ? i18n.t("priority") : '',
                                renderHeader() {
                                    if(GetCurrentUserTypeInt() != '5')
                                    {
                                        return (
                                            <CheckboxDropdown items={
                                                [
                                                    { id: enumDiscussionStatus.URGENT, label: disStatusOptions.filter(p=> p.value == enumDiscussionStatus.URGENT)[0].label, checked: (rest.disStatus ==  enumDiscussionStatus.URGENT) ? true : false},
                                                    { id: enumDiscussionStatus.ENCOURS, label: disStatusOptions.filter(p=> p.value == enumDiscussionStatus.ENCOURS)[0].label, checked: rest.disStatus ==  enumDiscussionStatus.ENCOURS },
                                                    { id: enumDiscussionStatus.FAIT, label: disStatusOptions.filter(p=> p.value == enumDiscussionStatus.FAIT)[0].label, checked: rest.disStatus ==  enumDiscussionStatus.FAIT },
                                                    { id: enumDiscussionStatus.NONTRAITE, label: disStatusOptions.filter(p=> p.value == enumDiscussionStatus.NONTRAITE)[0].label, checked: rest.disStatus ==  enumDiscussionStatus.NONTRAITE },
                                                    { id: 6, label: i18n.t("unread"), checked: rest.unreadCount }
                                                ]
                                            } setItems={setFilter} />
                                        );
                                    }
                                },
                                
                                renderCell: (props) => 
                                    {
                                   
                                        if(props.row.discussionId == 0)
                                        {
                                            return ( 
                                            <div className='arc-cell'><Icon className="arc-icon-unarchive" icon="ic:outline-unarchive" pointerEvents={'none'} /> Archived <span className='msg_col_count'>{archiveCount}</span></div>)
                                        }
                                        else
                                        {
                                        return (
                                            <PriorityCell
                                                {...props}
                                                discussionData={discussionData}
                                                fbUid={firebaseAuth.fbUid!}
                                            /> 
                                        )
                                    }
                                    
                                }
                                ,
                                sortable: false,
                                headerAlign: "center",
                                headerClassName: "grid-cell tag-th",
                                cellClassName: "grid-cell tag-td",
                            }
                            ,

                            {
                                field: 'date',
                                width: 180,
                                filterable: false,
                                headerName: i18n.t('date'),
                                renderCell: (d) => {
                                     if(d.row.discussionId == 0)
                                    {
                                        return null
                                    }
                                    else{
                                        return (
                                            <div>{moment(TimeCheckAndConvert(parseInt(d.row.timestamp), true)).format("DD/MM/YYYY HH:mm")}</div>
                                        )
                                    }
                                },
                                sortable: true,
                                headerAlign: 'center',
                                headerClassName: 'grid-cell',
                                cellClassName: 'grid-cell'
                            },
                            {
                                field: 'from',
                                flex: 1.2,
                                filterable: false,
                                headerName: i18n.t("from"),
                                renderCell: ({ row }) => {
                                    if(row.discussionId == 0)
                                    {
                                        return null
                                    }
                                    else 
                                    {
                                        const extractData =  UserInfoExtract(row, discussionData, false, firebaseAuth.fbUid!)
                                        return (
                                        <div>
                                            {row.deadChat == 0 && <span className='object'>{extractData.from}</span>}
                                        </div>
                                    )
                                
                                    }
                                },
                                sortable: false,
                                headerAlign: 'center',
                                headerClassName: 'grid-cell',
                                cellClassName: 'grid-cell'
                            },
                            {
                                field: 'send_to',
                                width: 350,
                                filterable: false,
                                headerName: i18n.t("sent_to"),
                                renderCell: (props) => <SentToCell {...props} discussionData={discussionData} />,
                                sortable: false,
                                headerAlign: 'center',
                                headerClassName: 'grid-cell',
                                cellClassName: 'grid-cell send-td'
                            },
                            {
                                field: 'subject',
                                flex: 4,
                                filterable: false,
                                headerName: i18n.t("subject"),
                                renderCell: (props) => <SubjectCell {...props} discussionData={discussionData} />,
                                sortable: false,
                                headerAlign: 'center',
                                headerClassName: 'grid-cell',
                                cellClassName: 'grid-cell text-left'
                            },
                            {
                                field: 'viewShareArchive',
                                width: 135,
                                filterable: false,
                                headerName: !archive ? `${i18n.t('archive')}` : `${i18n.t('unarchive')} / ${i18n.t('delete')}`,
                                renderCell: (props) => props.row.discussionId != 0 ? <ViewArchive openFun={() => {
                                    postCall.open(props.row.discussionId)
                                }} deleteFun={() => {
                                    setDelArchiveModal({ discussionId: props.row.discussionId, type: 'delete' })
                                }} archiveFun={(id, type) => {
                                    setDelArchiveModal({ discussionId: id, type })
                                }} {...props} discussionData={discussionData} /> : null,
                                sortable: false,
                                headerAlign: 'center',
                                headerClassName: 'grid-cell action-th',
                                cellClassName: 'grid-cell action-td'
                            },

                        ]}

                        sortModel={sortModel}
                        onSortModelChange={(newSortModel) => {
                            //  console.log('newSortModel ', newSortModel)
                            setSortModel(newSortModel)
                        }}
                        sortingOrder={['desc', 'asc']}
                        hideFooterSelectedRowCount={true}
                        onRowClick={(e) => {
                        }}
                        getRowId={(row) => row.discussionId}
                        rows={dataList || []}
                        pageSizeOptions={[pageSize]}

                        initialState={{
                            pagination: {
                                paginationModel: {
                                    pageSize: pageSize,
                                    page: 0,
                                }
                            }
                        }}
                    />
                    :
                    <LoadingComp />
            }
        </Fragment>
    )
}

export default ChatListView