'use client';
import { lazy, Suspense, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { LoadingComp } from '../components/CommonComponents';
import Logout from '../components/Logout';
import { GetCurrentUserType, GetCurrentUserTypeInt, GetLoggedUserId } from '../services/Constants';
import { DomainSubPath } from '../api/AppURL';

const ChatDiscussionListPortal = lazy(() => import('../portals/ChatDiscussionItemPortal'));
const ChatHomePagePortal = lazy(() => import('../portals/ChatHomePagePortal'));

const MainRoute = () => {
    const pathname = usePathname();
    const [userLoaded, setUserLoaded] = useState(false);
    const [userType, setUserType] = useState('');
    const [userId, setUserId] = useState<string | number>('');

    useEffect(() => {
        if (GetLoggedUserId() !== '') {
            setUserType(GetCurrentUserType());
            setUserId(GetLoggedUserId());
            setUserLoaded(true);
            return;
        }

        const interval = setInterval(() => {
            const sessionUserType = GetCurrentUserType();
            const sessionUserId = GetLoggedUserId();
            if (sessionUserType && sessionUserId) {
                setUserType(sessionUserType);
                setUserId(sessionUserId);
                setUserLoaded(true);
                clearInterval(interval);
            }
        }, 200);
        return () => clearInterval(interval);
    }, []);

    if (!userLoaded) return null;

    const isAdmin = GetCurrentUserTypeInt() === '1';
    const chatHomePath = isAdmin
        ? `${DomainSubPath}/${userType}/accueil`
        : `${DomainSubPath}/${userType}/${userId}/accueil`;
    const chatEndPoint = isAdmin
        ? `${DomainSubPath}/${userType}/boite-de-reception`
        : `${DomainSubPath}/${userType}/${userId}/boite-de-reception`;

    console.log({ pathname, chatHomePath, chatEndPoint });

    // Dev fallback: when running standalone (not embedded in Laravel)
    // render ChatDiscussionListPortal by default so you can test locally
    if (process.env.NODE_ENV === 'development' && (pathname === '/' || pathname === '')) {
        return (
            <Suspense fallback={<LoadingComp />}>
                <ChatDiscussionListPortal />
            </Suspense>
        );
    }

    if (pathname === chatHomePath) {
        return <Suspense fallback={<LoadingComp />}><ChatHomePagePortal /></Suspense>;
    }

    if (pathname === chatEndPoint) {
        return (
            <Suspense fallback={<LoadingComp />}>
                <ChatDiscussionListPortal />
            </Suspense>
        );
    }

    if (process.env.NODE_ENV === 'development' && pathname === `${DomainSubPath}/logout`) {
        return <Logout />;
    }

    return null;
};

export default MainRoute;
