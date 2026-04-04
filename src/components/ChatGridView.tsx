
import { Icon } from '@iconify/react';
import moment from 'moment';
import { Col, OverlayTrigger, Row, Tooltip } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useChatDiscussionContext } from '../contextAndProvider/ChatProviderWrapper';
import { useFirebaseAuth } from '../contextAndProvider/FirebaseAuthWrapper';
import { usePostCall } from '../hooks/ChatHooks';
import { RootState } from '../redux/store';
import { UserInfoExtract } from '../services/CommonFunction';
import i18n from '../services/i18next/i18next';

function ChatGridView() {
  const firebaseAuth = useFirebaseAuth()
  const { list } = useChatDiscussionContext()
  const discussionData = useSelector((state: RootState) => state.discussion.userList)
  const postCall = usePostCall()
  return (
    <Row className='SHOW-BOX'>
      {
        list?.map((item) => {
          const extractData = UserInfoExtract(item, discussionData!, true, firebaseAuth!.fbUid!);
          return (
            <Col onClick={() => { postCall.open(item.discussionId) }} key={item.discussionId} xl={3} lg={4} sm={6} >
              <div className='grid-card card'>
                <div className='grid-outerimage'>
                  {item.urgent && <span className="data-badge">Urgent</span>}
                  {false && <img src={'https://pbs.twimg.com/media/FzIZipjaYAEV6D0.jpg'} />}
                  {false && <div className='file-pdf'>
                    <div className='bg'>
                      <span className='pdf'></span>
                    </div>
                  </div>}
                </div>
                <div className='grid-body'>
                  <div className='grid-top'>
                    <div className='dissc_name'>
                      <div>
                        <span className='dissc-lable'>{`${i18n.t('from')} : `}</span>
                        <span className='dissc-value'> {extractData.from}</span>
                      </div>
                      <div className='disc_eny'>
                        <span className='dissc-lable'>{`${i18n.t('sent_to')} : `}</span>
                        <span title={extractData.to} className='dissc-value'> {extractData.to}</span>
                      </div>
                    </div>
                  </div>
                  <div className='grid-btm'>
                    <div className='left-part'>
                      <div className='usr-icon'>
                        <img src={extractData.img} />
                      </div>
                      <span>{moment(item.timestamp).format("DD/MM/YYYY HH:MM")}</span>
                    </div>
                    <div className='right-part'>
                      <OverlayTrigger delay={{ show: 100, hide: 300 }} overlay={<Tooltip style={{ position: "fixed" }} children={i18n.t('view')} />}><Icon icon="akar-icons:eye" /></OverlayTrigger>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          )
        })
      }
    </Row>
  )
}

export default ChatGridView