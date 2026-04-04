import { Icon } from '@iconify/react';
import React, { FC, memo, useEffect } from 'react'
import Calendar_picker from 'react-calendar';
import i18n, { getLocalization } from '../../services/i18next/i18next';
import { Colors } from '../../utils/resources/Colors';
import moment from 'moment';
import "moment/locale/fr";

type MinicalendarProps = {
    dateCallBack?: (date: string) => void
    currentDate?: Date
}

const Minicalendar: FC<MinicalendarProps> = ({ dateCallBack, currentDate = '' }) => {

    const [isCalendar, setIsCalendar] = React.useState(false)
    const calendarRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const calendarOutsideClick = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setIsCalendar(false)
            }
        };
        document.addEventListener("mousedown", calendarOutsideClick);
        return () => {
            document.removeEventListener("mousedown", calendarOutsideClick);
        };
    }, []);

    return (
        <div className='minicalendar-container'>
            <div onClick={() => { setIsCalendar(true) }} className="date-container"
                style={{ }}>
                <Icon icon="bx:calendar" width="18" height="18" className='me-2' />
                <p className=" m-0 p-1 ps-0" style={{ fontSize: '14px', color: currentDate ? Colors.black : Colors.textSubColor }}>{currentDate ? moment(currentDate).locale(getLocalization()).format('dddd D MMMM YYYY').replace(/\b\w/g, c => c.toUpperCase()) : i18n.t('dd_mm_yyyy')}</p>
            </div>

            {
                isCalendar && <div ref={calendarRef} className="date-picker position-absolute">
                    <Calendar_picker
                        onChange={(date: any) => {
                            setIsCalendar(false)
                            dateCallBack?.(moment(date).format('YYYY-MM-DD'))
                        }}
                        value={new Date()}
                        locale={getLocalization()}
                        {
                        ...({
                            'minDate': new Date(),
                        })
                        }
                    />
                </div>
            }

        </div>
    )
}

export default memo(Minicalendar)