'use client';
import { Button, OverlayTrigger, Popover } from "react-bootstrap";
import i18n from "../services/i18next/i18next"
import { MutableRefObject, useCallback, useState } from "react";
import AutoReponseCreateModal from "./modal/AutoReponseCreateModal";
import { useGet, usePost } from "../api/API";
import { GetCurrentUserTypeInt } from "../services/Constants";
import { Colors } from "../utils/resources/Colors";
import TextBoxModal from "./modal/TextBoxModal";
import { OutSideClickHandler } from "../services/OutSideClickHandler";

const AutopResponses = ({ onSelect, containerRef }: { onSelect: (text: string) => void; containerRef: MutableRefObject<HTMLDivElement | null> }) => {
    const userType = GetCurrentUserTypeInt()

    //useState
    const [snippets, setSnippets] = useState<any[]>([]);
    const [isCreateMode, setIsCreateMode] = useState<boolean>(false)
    const [title, setTilte] = useState('')
    const [error, setError] = useState("")
    const [isSubmitted, setIsSubmitted] = useState(false);

    //api
    const snippetListAPI = useGet<'/chat-snippet/list'>({ endpoint: '/chat-snippet/list' })

    const addSnippet = usePost<'/chat-snippet/add'>({
        endpoint: '/chat-snippet/add'
    })

    //apicall
    const snippetApi = () => {
        snippetListAPI.get?.({
            reqBody: {}
        })
            .then(res => {
                setSnippets(res.data)
            })
            .catch(err => console.log(err))
    }

    //function
    const onEnter = useCallback((setShow: (state: boolean) => void) => {
        setShow(true)
        snippetApi()
    }, [])

    const onClick = useCallback(({ description, id, setShow }: { description: string, id: number, setShow: (state: boolean) => void }) => {
        if (id <= -1) {
            setShow(false)
            setIsCreateMode(true)
            return
        }
        // else if (id == -1) {
        //     setIsModifyMode(true)
        // }
        else {
            onSelect?.(description);
            setShow(false)
        }
    }, [])

    return (
        <>
            <OutSideClickHandler className="auto-response-container">
                {
                    ({ show, setShow }) =>
                    (
                        <OverlayTrigger show={show} placement="top" container={containerRef}
                            overlay={
                                <Popover className="auto-response-popover">
                                    <div className="auto-response-list">
                                        {
                                            // [
                                            //     ...(Array.isArray(snippets) ? snippets : []),
                                            //     { snippet: i18n.t('modify_a_template'), id: -1 },
                                            //     ...(text?.trim()
                                            //         ? [{ snippet: i18n.t('save_draft_template'), id: -2 }]
                                            //         : [])
                                            // ]
                                            [
                                                ...(Array.isArray(snippets) ? snippets : []),
                                                { snippet: i18n.t('create_or_modify_a_template'), id: -1 }
                                            ]
                                                .map(
                                                    (itm, idx) => {
                                                        const isCreate = itm.id === -1
                                                        return (
                                                            <div key={idx}
                                                                style={{
                                                                    marginLeft: 10, marginRight: 10, ...(isCreate ?
                                                                        { position: 'sticky', bottom: 0, backgroundColor: 'white', paddingBottom: 10 } : {})
                                                                }}>
                                                                <div className="auto-response-list-container  auto-response-item"
                                                                    style={{ color: isCreate ? Colors.primary : undefined, fontWeight: isCreate ? 600 : undefined }}
                                                                    onClick={() => onClick({ ...itm, setShow })}
                                                                >
                                                                    {/* <span> */}
                                                                    {itm.snippet}
                                                                    {/* </span> */}
                                                                </div>
                                                                {
                                                                    !isCreate &&
                                                                    <div className="snippet-underline"></div>
                                                                }
                                                            </div>
                                                        )
                                                    }
                                                )
                                        }
                                    </div>
                                </Popover>
                            }
                        >
                            {
                                userType == '4' ?
                                    <Button
                                        onClick={() => onEnter(setShow)}
                                        className={`outline-btn btn-sm`}
                                        children={i18n.t("auto_responses")}
                                        style={{position:'absolute',left:10}}                   
                                    />
                                    : <></>
                            }
                        </OverlayTrigger>
                    )
                }
            </OutSideClickHandler>

            {isCreateMode &&
                <AutoReponseCreateModal
                    handleClose={() => setIsCreateMode(false)}
                    snippets={snippets.filter(r => r.id > 0)}
                    title={i18n.t("auto_responses")}
                    back={true}
                />
            }
            {/* {
                isCreateMode &&
                <TextBoxModal
                    title={i18n.t('enter_a_new_template_name')}
                    isOpen={isCreateMode}
                    onClose={() => {
                        setIsCreateMode(false);
                        setTilte('');
                        setError('')
                    }}
                    onSubmit={() => onSubmit()}
                    text={"nn"}
                    placeholder={i18n.t('enter_title')}
                    value={title}
                    onChange={(e) => {
                        setTilte(e.target.value);
                    }} error={error}
                    isSubmit={isSubmitted} />
            } */}
        </>
    )
}


export default AutopResponses;