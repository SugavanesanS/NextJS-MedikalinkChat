import { Icon } from "@iconify/react";
import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import Dropdown from "react-bootstrap/esm/Dropdown";
import i18n from "../../services/i18next/i18next";

interface FilterItem {
    id: number;
    label: string;
    checked: boolean;
}

interface CheckboxDropdownProps {
    items: FilterItem[];
    setItems: (item: Omit<FilterItem, 'label'>) => void;
}

const CheckboxDropdown: React.FC<CheckboxDropdownProps> = ({ items, setItems }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const modalBodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                modalBodyRef.current &&
                !modalBodyRef.current.contains(event.target as Node)
            ) {
                setIsModalVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleChecked = (id: number, isChecked: boolean) => {
        setItems({
            id: id,
            checked: isChecked
        })
    };

    const CheckboxList = () => (
        <Dropdown.Menu autoFocus show className="rem-ass">
            {items.map((item) => (
                <Dropdown.Item
                    key={item.id}
                    as="div"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="d-flex justify-content-between align-items-center gap-1">
                        <span>{item.label}</span>

                        <div className='form-check'>
                            <input
                                className="from-check-input ms-0 form-check-input"
                                type={"checkbox"}
                                checked={item.checked}
                                onChange={(e) => { handleChecked(item.id, e.target.checked); }}
                            />
                        </div>
                    </div>
                </Dropdown.Item>
            ))}
        </Dropdown.Menu>
    );

    return (
        <div className="d-flex justify-content-between align-items-center" ref={dropdownRef}>
            <div className="assigne-dd rem-des th-dd d-flex justify-content-between align-items-center gap-2">
                <span>{i18n.t("priority")}</span>
                <Icon
                    onClick={() => { setIsModalVisible(true) }}
                    className="arc-icon-options"
                    icon="bi:three-dots-vertical"
                />
            </div>

            <Modal
                backdropClassName="search-filter-class"
                backdrop="static"
                show={isModalVisible}
                animation={false}
                onHide={() => setIsModalVisible(false)}
                className="search_filter_modal"
            >
                <div style={{
                    position: 'absolute',
                    top: dropdownRef.current?.getBoundingClientRect().x,
                    left: dropdownRef.current?.getBoundingClientRect().y,
                }} ref={modalBodyRef} className="portal-container"
                >
                    <CheckboxList />
                </div>
            </Modal>

        </div >
    );
};

export default CheckboxDropdown;