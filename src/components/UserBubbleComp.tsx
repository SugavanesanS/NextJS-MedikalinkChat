'use client';
import React, { FC, memo } from 'react'
import { ChatUserProfile, DiscussionUser, FBParticipants } from '../types/data'
import { useProfileURLFromIndexDB, useUserImagePath } from '../hooks/ChatHooks'
import { clm } from '../services/CommonFunction'
import { OtherURL } from '../api/AppURL'
import { Spinner } from 'react-bootstrap'

// Example types — adjust as needed
type User = (FBParticipants & DiscussionUser) | ChatUserProfile

interface UserBubbleProps {
  user: User
  defaultImage: string | undefined
}

export const UserBubbleComp = React.memo(({ user, defaultImage }: UserBubbleProps) => {

  const userPath = useProfileURLFromIndexDB(user?.unique_id!)

  return (
    <>
      {
        !!userPath ? <img
          src={ user?.profile || user?.has_profile_pic == 1 ? userPath?.url : defaultImage}
          // alt={user?.nom}
          className={clm({
            'sender_icon': true,
            'doctor': user.user_type == '4'
          })}
        /> : <Spinner as="img" size='sm' animation="border" role="status" aria-hidden="true" /> }
    </>

  )
})
