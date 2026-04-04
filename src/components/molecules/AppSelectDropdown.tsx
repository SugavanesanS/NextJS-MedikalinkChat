import React, { FC, memo } from 'react'
import { Dropdown } from 'react-bootstrap'
import { clm } from '../../services/CommonFunction'

type AppSelectDropdownProps = {
    title: string
    Data: {
        id: number
        name: string
    }[]
    onSelect: (data: any) => void
    disabled?: boolean
    showPlaceholder?: boolean
}

const AppSelectDropdown: FC<AppSelectDropdownProps> = ({ title, Data, onSelect, disabled = false, showPlaceholder = false }) => {

    return (
        <div className='app-select-dropdown'>
            <Dropdown >
                <Dropdown.Toggle variant="primary" className={clm({
                    placeholder: showPlaceholder
                })} disabled={disabled} >
                    {title}
                </Dropdown.Toggle>

                <Dropdown.Menu
                    style={{
                        maxHeight: "250px",
                        overflowY: "auto"
                    }}
                >
                    {Data?.map((item, index) => (
                        <Dropdown.Item
                            key={index}
                            onClick={() => onSelect(item)}
                        >
                            {item?.name}
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown>
        </div>
    )
}

export default memo(AppSelectDropdown)