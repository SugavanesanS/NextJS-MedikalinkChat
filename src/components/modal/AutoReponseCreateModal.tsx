import { Icon } from "@iconify/react";
import { Button, Form, FormControl, Modal, ModalHeader } from "react-bootstrap";
import i18n from "../../services/i18next/i18next";
import { useRef, useState } from "react";
import { usePost } from "../../api/API";
import { Colors } from "../../utils/resources/Colors";

type AutoReponseCreateModalProps = {
    handleClose: () => void
    back?: boolean
    title: string
    snippets?: { id: number, snippet: string, description: string }[]
}

const AutoReponseCreateModal = ({ handleClose, back = true, title, snippets = [] }: AutoReponseCreateModalProps) => {
    const maximumCharacter = 1000
    const titleMaxChar = 300
    const itemRefs = useRef({});

    //useState
    const [snippet, setSnippet] = useState({
        id: 0,
        snippet: '',
        showField: false,
        description: ''
    })
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [snippetList, setSnippetList] = useState<{ id: number, snippet: string, description: string }[]>(snippets)
    const [charLength, setCharLength] = useState(0)
    const [charTilteLength, setCharTitleLength] = useState(0)
    const [snippetError, setSnippetError] = useState('')

    //api
    const addSnippet = usePost<'/chat-snippet/add'>({
        endpoint: '/chat-snippet/add'
    })
    const editSnippet = usePost<'/chat-snippet/edit'>({
        endpoint: '/chat-snippet/edit'
    })
    const deleteSnippet = usePost<'/chat-snippet/delete'>({
        endpoint: '/chat-snippet/delete'
    })

    //apicall
    const CreateEditSnip = () => {
        setSelectedId(null)
        setCharLength(0)
        if (snippet.id > 0) {
            editSnippet.post?.({
                reqBody: {
                    snippet: snippet.snippet,
                    snippet_id: snippet.id,
                    description: snippet.description
                }
            })
                .then((res) => {
                    setSnippet({ showField: false, id: 0, snippet: '', description: '' })
                    setSnippetList((state) => state.map(s => s.id == snippet.id ? { ...s, snippet: snippet.snippet, description: snippet.description } : s))
                }).catch(err => {
                    setSnippetError(err?.message || 'Something went wrong')
                })
        } else {
            addSnippet.post?.({
                reqBody: {
                    snippet: snippet.snippet,
                    description: snippet.description
                }
            })
                .then((res) => {
                    setSnippet({ showField: false, id: 0, snippet: '', description: '' })
                    setSnippetList((state) => [...state, { id: res.data.id, snippet: res.data.snippet, description: snippet.description }])
                }).catch(err => {
                    setSnippetError(err?.message || 'Something went wrong')
                })
        }
        // setSnippet({ showField: false, id: 0, snippet: '' })
    }

    const deleteSnip = (id: number) => {
        deleteSnippet.post?.({
            reqBody: {
                snippet_id: id
            }
        })
            .then((res) => {
                setSnippetList((state) => state.filter(s => s.id != id))
            })
    }

    return (
        <Modal className="cht-modal" show={true} onHide={handleClose} size="lg" aria-labelledby="contained-modal-title-vcenter" centered>
            <ModalHeader className="justify-content-between" closeButton={!back} >
                <Modal.Title className="h6 d-flex justify-content-center" style={{ flex: 1 }} children={title} />
                {
                    back && <div
                        className="cursor-pointer"
                        onClick={handleClose}>
                        <Icon icon="fa6-solid:xmark" width="25" height="25" />
                    </div>
                }
            </ModalHeader>

            <Modal.Body style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
            }}>
                {!snippet.showField && <Button
                    className={`btn align-self-end p-2 pt-1 pb-1`}
                    style={{ marginBottom: 20 }}
                    children={i18n.t("add_new_snippet")}
                    onClick={() => {
                        setSnippet(prev => ({
                            ...prev, showField: true, id: 0, snippet: ''
                        }))
                        // setSnippet({ showField: true, id: 0, snippet: '' })
                    }}
                />}
                <div>
                    {snippet.showField &&
                        <div className="snippet-edit">
                            <div style={{ gap: 6, display: 'flex', flexDirection: 'column' }}>

                                <FormControl
                                    placeholder={`${i18n.t('title')}......`}
                                    as="textarea"
                                    value={snippet.snippet}
                                    onChange={(e) => {
                                        const value = e.target.value || ''
                                        setSnippet({ ...snippet, snippet: value })
                                        setCharTitleLength(e.target.value.length)
                                    }}
                                    style={{
                                        border: `1px solid ${snippetError ? Colors.errColor : Colors.calHeadBG}`, overflow: 'hidden',
                                        resize: 'none'
                                    }}
                                />
                                <p className="char-length">{`${snippet.snippet?.length !== 0 ? snippet.snippet?.length : charTilteLength}/${titleMaxChar}`}</p>
                                <FormControl placeholder={`${i18n.t('description')}......`}
                                    as="textarea"
                                    rows={5}
                                    value={snippet.description}
                                    onChange={(e) => {
                                        const value = e.target?.value || ''
                                        setSnippet({ ...snippet, description: value })
                                        setCharLength(e.target.value.length)
                                        setSnippetError('')
                                        itemRefs.current[snippet.id]?.scrollIntoView({
                                            behavior: 'smooth',
                                            block: 'nearest',
                                        });
                                    }}
                                    style={{
                                        border: `1px solid ${snippetError ? Colors.errColor : Colors.calHeadBG}`,
                                        resize: 'none', height: 'auto'
                                    }}
                                />
                            </div>

                            <p className="char-length">{`${(snippet.description?.length !== 0 ? snippet.description?.length : charLength) || 0}/${maximumCharacter}`}</p>
                            {
                                snippetError &&
                                <p className="error-text">{snippetError}</p>
                            }

                            <div className="snippet-btn">
                                <Button
                                    className="cancel-btn"
                                    children={i18n.t('cancle')}
                                    style={{ cursor: 'pointer', backgroundColor: Colors.delColor, border: 'none' }}
                                    title={i18n.t('cancle')}
                                    onClick={() => {
                                        setSelectedId(null)
                                        setCharLength(0)
                                        setSnippet({ showField: false, id: 0, snippet: '', description: '' })
                                    }}
                                />
                                <Button children={i18n.t('to_register')}
                                    disabled={snippet.snippet?.trim().length == 0 || snippet.description?.trim()?.length == 0 || editSnippet.loader || addSnippet.loader}
                                    className="me-2 edit-btn"
                                    onClick={CreateEditSnip}
                                />
                            </div>
                        </div>
                    }
                </div>
                <div style={{ overflowY: 'auto' }} >
                    {snippetList.map((snip) => {
                        return (
                            <div key={snip.id} className="mb-2 p-2 snippet-overlay" style={{
                                border: `1px solid ${snip.id == selectedId ? Colors.primary : Colors.greyOpac}`,
                                cursor: 'pointer',
                                borderRadius: 8
                            }}
                            >
                                <span style={{fontSize:13}}>{snip.snippet}</span>
                                <div className="snippet-view" >
                                    <Icon
                                        icon="iconamoon:edit-fill"
                                        width="18"
                                        height="18"
                                        className="edit"
                                        color={Colors.primary}
                                        onClick={() => {
                                            setSnippet({ ...snip, showField: true })
                                            setSelectedId(snip.id)
                                        }}
                                    />
                                    <Icon icon="si:bin-duotone" width="18" height="18" className="delete"
                                        onClick={() => deleteSnip(snip.id)}
                                        color="red"
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Modal.Body>
            <Modal.Footer className="justify-content-center">
                {/* <Button className="btn-transparent" onClick={() => handleClose()} children={i18n.t('cancle')} /> */}
            </Modal.Footer>
        </Modal >
    )
}

export default AutoReponseCreateModal;