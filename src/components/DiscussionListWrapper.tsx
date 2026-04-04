'use client';
import { Icon } from '@iconify/react';
import { useEffect, useRef, useState } from 'react';
import { Button, Dropdown, DropdownButton, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { ChatFilterTags, useChatDiscussionContext } from '../contextAndProvider/ChatProviderWrapper';
import { usePostCall } from '../hooks/ChatHooks';
import { RootState } from '../redux/store';
import { changeFirstLetterToLowerCase, clm } from '../services/CommonFunction';
import { GetCurrentUserTypeInt } from '../services/Constants';
import i18n from '../services/i18next/i18next';
import { useGet } from '../api/API';
import { intAdminType } from '../types/data';
import { DiscussionActions } from '../redux/reducer/DiscussionReducer';

function DiscussionListWrapper({ children }) {
    const chatContext = useChatDiscussionContext();
    const timer = useRef<NodeJS.Timeout | null>(null);
    const archiveCount = useSelector((state: RootState) => state.discussion.archiveCount);
    const [isOpen, setIsOpen] = useState(false);
    const postCall = usePostCall()
    const dispatch = useDispatch()

    const addAdminInfoCall = () => {
        window.postMessage?.({
            type: 'OPEN_CHAT_CREATE_WITH_ADMIN'
        });
    }

    return (
        <div className='react-chat-msglisting'>
            <div className='react-chat-listhead'>
                <div className='react-chat-heading'>
                    <h3 children={i18n.t('email_list')} />
                    <div className='react-chat-search'>
                        <Form.Control onChange={(e) => {
                            e.persist();
                            if (timer.current) clearTimeout(timer.current);
                            timer.current = setTimeout(() => {
                                chatContext.setSearch(e.target.value);
                            }, 400);
                        }} type="text" placeholder="Recherche" />
                    </div>
                    {
                        ChatFilterTags.map((tag) => {
                            if (GetCurrentUserTypeInt() == '5' && tag.value == 'patient') {
                                return null
                            }
                            return (
                                <div key={tag.value} onClick={() => {
                                    chatContext.setTag(tag.value);
                                }} className={clm({
                                    'react-chat-filter-tags cursor-pointer': true,
                                    'active': tag.value == chatContext.tag
                                })} children={tag.label} />
                            )
                        })
                    }
                </div>
                <div className='react-chat-actions'>
                    <div className='indi-box'>
                        <div className='inter-box box'>
                            <span className="color-box" />
                            <span children={i18n.t('contact')} />
                        </div>
                        <div className='group-box box'>
                            <span className="color-box" />
                            <span children={i18n.t('band')} />
                        </div>
                    </div>

                    {chatContext.archive ? <Button onClick={() => {
                        chatContext.setArchive(false)
                    }} className='btn btn-green' children={i18n.t("back_to_message")} />
                        :
                        GetCurrentUserTypeInt() == '5'
                            ?
                            <DropdownButton id="dropdown-basic-button" className='chat-create-dropdown' title={i18n.t("send_msg")}>
                                <Dropdown.Item onClick={addAdminInfoCall}>{i18n.t('to_support')}</Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => postCall.open(0, 'all', true)}>{i18n.t('to_another_correspondent')}</Dropdown.Item>
                            </DropdownButton>
                            :
                            <DropdownButton id="dropdown-basic-button" className='chat-create-dropdown pe-3' title={i18n.t("send_msg")} >
                                <Dropdown.Item onClick={addAdminInfoCall}>{i18n.t('to_support')}</Dropdown.Item>
                                <Dropdown.Divider />
                                <div>
                                    <p className='dropdown-title text-black'>{i18n.t('to_my_team')}</p>
                                    <div className='px-3'>
                                        <Dropdown.Item onClick={() => postCall.open(0, 'secretraite', true)}>{i18n.t('secretariat')}</Dropdown.Item>
                                        <Dropdown.Item onClick={() => postCall.open(0, 'telesecretaire', true)}>{i18n.t('telesecretary')}</Dropdown.Item>
                                        <Dropdown.Item onClick={() => postCall.open(0, 'medecin', true)}>{`${i18n.t('doctors')} (${changeFirstLetterToLowerCase(i18n.t('team'))})`}</Dropdown.Item>
                                    </div>
                                </div>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => postCall.open(0, 'all', true)}>{`${i18n.t('patients')}/${changeFirstLetterToLowerCase(i18n.t('doctors'))}`}</Dropdown.Item>
                            </DropdownButton>
                    }

                    <div onClick={() => chatContext.setArchive(!chatContext.archive)}
                        className={clm({
                            'arc-btn': true,
                            //'unarchive': chatContext.archive,
                            //'archive': !chatContext.archive
                        })}>
                        {
                            chatContext.archive ? (
                                <OverlayTrigger delay={{ show: 100, hide: 300 }} overlay={<Tooltip style={{ position: "fixed" }} children={i18n.t('archive_access')} />}>
                                    <Icon icon="ic:outline-unarchive" />
                                </OverlayTrigger>
                            ) : (
                                <OverlayTrigger delay={{ show: 100, hide: 300 }} overlay={<Tooltip style={{ position: "fixed" }} children={i18n.t('archive_access')} />}>
                                    <Icon icon="ic:outline-archive" />
                                </OverlayTrigger>
                            )
                        }
                        {!!archiveCount && <div className='arc-count'>{archiveCount}</div>}
                    </div>

                </div>
            </div>
            {/* title, searchbar, send message button grid and list view switch, archive button  */}

            {
                // list view
                children
            }
        </div>
    )
}

export default DiscussionListWrapper