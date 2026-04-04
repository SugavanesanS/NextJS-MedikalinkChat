'use client';
import { Icon } from "@iconify/react"
import { FC, useEffect, useRef, useState } from "react"
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { MainWithSub } from "../api/AppURL";
import i18n from "../services/i18next/i18next";

type DictaphoneType = {
    fieldRef: HTMLTextAreaElement | null
    liveVoiceToText: (transcript: string) => void
}
const Dictaphone: FC<DictaphoneType> = ({ liveVoiceToText, fieldRef }) => {

    const { transcript, resetTranscript, isMicrophoneAvailable, browserSupportsContinuousListening } = useSpeechRecognition()
    const [listening, setListening] = useState(false)
    const [initialText, setInitialText] = useState(fieldRef?.value || '')
    const mikeRef = useRef<HTMLSpanElement | null>(null)

    useEffect(() => {
        function handleClickOutside(event: any) {
            if (mikeRef.current && !mikeRef.current.contains(event.target)) {
                SpeechRecognition.stopListening()
                resetTranscript()
                setListening(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            SpeechRecognition.abortListening()
            resetTranscript()
        }
    }, [])

    useEffect(() => {
        if (!transcript) return
        liveVoiceToText?.((initialText || '')?.trim() + ' ' + (transcript || ''))
    }, [transcript])

    return (
        <span
            className="mike"
            ref={mikeRef}
            title={listening ? i18n.t('stop_Recording') : i18n.t('start_recording')}
            onClick={() => {
                if (!(browserSupportsContinuousListening && isMicrophoneAvailable)) {
                    alert(i18n.t(isMicrophoneAvailable ? 'feature_not_supported' : 'microphone_not_available'))
                    // return
                }
                if (listening) {
                    SpeechRecognition.stopListening()
                        .catch((error) => {
                            console.log({ error })
                        })
                        .finally(() => {
                            resetTranscript()
                        })
                } else {
                    const locale = getLocalization()
                    SpeechRecognition.startListening({ 'language': locale == 'fr' ? 'fr-FR' : locale == 'en' ? 'en-US' : 'fr-FR', continuous: true })
                        .catch((error) => {
                            console.log({ error });
                            alert(i18n.t(!browserSupportsContinuousListening ? 'feature_not_supported' : !isMicrophoneAvailable ? 'microphone_not_available' : 'something_went_wrong'))
                        })
                    setInitialText(fieldRef?.value || '')
                }
                setListening(_ => !_)
            }}
            children={
                (browserSupportsContinuousListening && isMicrophoneAvailable) ?
                    listening ?
                        <img src={`${MainWithSub}/resources/images/mic_speaking.gif`} height={25} width={25} /> : // Mike active
                        <Icon icon="streamline-plump:voice-typing-word-convert-solid" width="20" height="20" /> : // Mike start
                    <Icon icon="mage:microphone-mute-fill" width="20" height="20" /> // No Mike
            } />
    )
}

export default Dictaphone