'use client';
import { onAuthStateChanged, signInWithCustomToken, User } from "firebase/auth";
import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from "react";
import { GetFirebaseToken, GetLoggedUserId } from "../services/Constants";
import Auth from "../services/firebaseConfig";
import { } from "../redux/store"
import { useGet, usePost } from "../api/API";
// Source - https://stackoverflow.com/a/70317336
// Posted by Anubhab Maji
// Retrieved 2026-03-17, License - CC BY-SA 4.0

type FirebaseContextType = {
    auth: boolean | null,
    fbUid: string | null,
    user: User | null,
    onLogout?: () => void
}

const initialState: FirebaseContextType = {
    auth: null,
    fbUid: null,
    user: null
}

export const FirebaseContext = createContext<FirebaseContextType>(initialState);

const FirebaseAuthWrapper: React.FC<PropsWithChildren> = ({ children }) => {

    const [data, setData] = useState<FirebaseContextType>(initialState);
    const [authResolved, setAuthResolved] = useState(false);
    const isLoggingOut = useRef(false);
    const getFirebaseRefreshToken =  useGet<'/firebase/token'>({
        endpoint: '/firebase/token',
    })


           
    

        const getFcmToken = async () => {
            try {
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    const { getMessaging, getToken } = await import('firebase/messaging');
                    const { default: AuthApp } = await import('../services/firebaseConfig');
                    const msg = getMessaging(AuthApp.app);
                    await getToken(msg, {
                        vapidKey: 'BEI7fWu8AhkZsD4_JXok7pLHYJ9kDZhiFftLgjFbgXfGEBDGBer3l4dJqri-AzJZ9kRCQuB90qXfy97EDcJJGoI',
                    });
                }
            } catch (err: any) {
                // FCM token subscription failed - non-critical, chat still works
                console.warn('FCM token error (non-critical):', err?.code || err?.message);
            }
        };



    useEffect(() => {
        const unsubscribe = onAuthStateChanged(Auth, (user) => {

            getFcmToken()


            if (user) {
                setData((d) => ({ ...d, auth: true, fbUid: user.uid, user: user }));
            } else {
                console.log("track is logged out")
                if (!isLoggingOut.current && GetFirebaseToken()) {
                    signInWithCustomToken(Auth, GetFirebaseToken()).catch(() => {
                        console.log("error - from signinwith custom token ")
                        getFirebaseRefreshToken.get?.({}).then((data) => {
                            signInWithCustomToken(Auth, data.data.fb_token)
                        })
                    });
                }
                setData((d) => ({ ...d, auth: false, fbUid: null, user: null }))
            }
            setAuthResolved(true);
            setAuthResolved(true);
        });

        return () => unsubscribe();
    }, []);

    return (
        <FirebaseContext.Provider value={{ ...data, onLogout: () => isLoggingOut.current = true }}>
            {authResolved && children}
        </FirebaseContext.Provider>
    );
};

export const useFirebaseAuth = () => {
    const context = useContext(FirebaseContext);
    if (context == undefined) {
        throw new Error('useFirebaseAuth must be used within a FirebaseProvider');
    }
    return context;
}

export default FirebaseAuthWrapper;
