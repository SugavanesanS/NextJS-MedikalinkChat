import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import i18n from "../../services/i18next/i18next";
import { Colors } from "../../utils/resources/Colors";
import { Icon } from "@iconify/react";

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    text: string
    placeholder: string
    value: string
    onChange: (e: any) => void
    title: string
    error: string
    isSubmit: boolean

};

const TextBoxModal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    text,
    placeholder,
    value,
    onChange,
    title,
    error,
    isSubmit
}) => {

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <div style={{ display: 'flex', flexDirection: 'row', flex: 1 }} >
                    <h6 style={{ display: 'flex', flex: 1, textAlign: 'center', justifyContent: 'center' }}>{title}</h6>
                    <Icon onClick={onClose} icon="ep:close-bold" />
                </div>
                <div style={{ display: 'flex', gap: 20, flexDirection: 'column', flex: 3 }}>
                    <div>
                        <Form.Control
                            type={text}
                            placeholder={placeholder}
                            value={value}
                            onChange={onChange}
                        />
                        {isSubmit && error && (
                            <p style={{ color: Colors.errColor, fontSize: 12 }}>
                                {error}
                            </p>
                        )}
                    </div>
                    <div style={{ marginTop: 15, display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
                        <Button
                            onClick={onClose}
                            children={i18n.t("cancle")}
                            style={{ backgroundColor: Colors.redBGColor, border: 'none' }}
                        />
                        <Button
                            onClick={onSubmit}
                            className={`btn`}
                            children={i18n.t("to_register")}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TextBoxModal

const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
};

const modalStyle: React.CSSProperties = {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 8,
    width: 300,
};
