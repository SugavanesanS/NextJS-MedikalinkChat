import React, { FC, useState } from 'react'
import { Dropdown } from 'react-bootstrap'
import i18n from '../../services/i18next/i18next';
import { Colors } from '../../utils/resources/Colors';
import moment from 'moment';
import { clm } from '../../services/CommonFunction';

type ChooseTimeProps = {
    time: string;
    interval?: number; // in minutes
    onChange: (time: string) => void;
    selectedDate?: Date;
}
const ChooseTime: FC<ChooseTimeProps> = ({ interval = 5, time, onChange, selectedDate }) => {

    const generateTimes = (selectedDate: string | Date) => {
        const times: string[] = [];
        const now = moment();
        const isToday = moment(selectedDate).isSame(now, "day");

        for (let hour = 0; hour < 24; hour++) {
            for (let min = 0; min < 60; min += interval) {
                const time = moment(selectedDate)
                    .hour(hour)
                    .minute(min)
                    .second(0);

                if (!isToday || time.isSameOrAfter(now)) {
                    times.push(time.format("HH:mm"));
                }
            }
        }

        return times;
    };

    const handleSelect = (time) => {
        onChange(time);
        if (onChange) onChange(time);
    };

    return (
        <div className='time-picker-container'>
            <Dropdown >
                <Dropdown.Toggle variant="primary" className={clm({ placeholder: !time })} >
                    {time || i18n.t('select_time')}
                </Dropdown.Toggle>

                <Dropdown.Menu
                    style={{
                        maxHeight: "250px",
                        overflowY: "auto"
                    }}
                >
                    {generateTimes(selectedDate || new Date()).map((time) => (
                        <Dropdown.Item
                            key={time}
                            onClick={() => handleSelect(time)}
                        >
                            {time}
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown>
        </div>
    )
}

export default ChooseTime