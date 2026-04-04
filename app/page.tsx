'use client';

import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import { useState } from 'react';
import { ChatPopupComponent } from "@/src/components/ChatPopupComponent";
import MainChatListenerWrapper from "@/src/components/MainChatListenerComp";
import { MessageProviderWrapper } from "@/src/contextAndProvider/MessageProviderWrapper";
import Store from '@/src/redux/store';
import MainRoute from "@/src/routes/MainRoute";

const ChatWidget = () => {
  const [userId] = useState(() =>
    typeof window !== 'undefined' ? sessionStorage.getItem("logged_user_uuid") : null
  );
  const { configStore } = Store(userId);

  return (
    <>
      <ToastContainer />
      <Provider store={configStore}>
        <MainChatListenerWrapper>
          <MessageProviderWrapper>
            <ChatPopupComponent />
          </MessageProviderWrapper>
          <MainRoute />
        </MainChatListenerWrapper>
      </Provider>
    </>
  );
};

export default function Home() {
  return <ChatWidget />;
}
