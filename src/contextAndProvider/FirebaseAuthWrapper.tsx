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
    const [render, setRender] = useState(false);
    const [loading, setLoading] = useState(true);
    const userId = GetLoggedUserId();
    const isLoggingOut = useRef(false); // Track logout state 
    const getFirebaseRefreshToken =  useGet<'/firebase/token'>({
        endpoint: '/firebase/token',
    })


           
    

        const getFcmToken = async () => {
            console.log("get FCM Token")
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                console.log("granted ------")
                const { getMessaging, getToken } = await import('firebase/messaging');
                import('../services/firebaseConfig').then(({ default: Auth }) => {
                    const msg = getMessaging(Auth.app);
                    getToken(msg, {
                        vapidKey: 'BEI7fWu8AhkZsD4_JXok7pLHYJ9kDZhiFftLgjFbgXfGEBDGBer3l4dJqri-AzJZ9kRCQuB90qXfy97EDcJJGoI',
                    });
                });
            } else if (permission === "denied") {
                alert("You denied for the notification");
            }
        };



    useEffect(() => {
        const unsubscribe = onAuthStateChanged(Auth, (user) => {

            getFcmToken()


            if (user) {

                setData((d) => ({
                    ...d,
                    auth: true,
                    fbUid: user.uid,
                    user: user
                }));
            } else {

            /*    let fbUid = sessionStorage.getItem("fb_uid")
                if(fbUid){
                    
                    setData((d) => ({
                        auth: true,
                        fbUid: fbUid,
                        user: user
                    }));
                    return
                } */
                
                    console.log("track is logged out")
                if (!isLoggingOut.current && GetFirebaseToken()) {
                    signInWithCustomToken(Auth, GetFirebaseToken()).catch(() => 
                        { 
                            console.log("error - from signinwith custom token ") //2 hour expire
                        
                            getFirebaseRefreshToken.get?.({
                                      
                            }).then((data) => {
                                signInWithCustomToken(Auth, data.data.fb_token)

                                console.log("output - result ", data.data)
                            })
                        });
                }
                setData((d) => ({
                    ...d,
                    auth: false,
                    fbUid: null,
                    user: null
                }))
            }
        });

    console.log('Requesting permission...');
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
        console.log('Notification permission granted.');
        }
    });

    /*  getToken(messaging, { vapidKey: 'BEI7fWu8AhkZsD4_JXok7pLHYJ9kDZhiFftLgjFbgXfGEBDGBer3l4dJqri-AzJZ9kRCQuB90qXfy97EDcJJGoI' }).then((currentToken) => {
        if (currentToken) {
            console.log("Token --- get ", currentToken)
            // Send the token to your server and update the UI if necessary
            // ...
        } else {
            // Show permission request UI
            console.log('No registration token available. Request permission to generate one.');
            // ...
        }
        }).catch((err) => {
        console.log('An error occurred while retrieving token. ', err);
        // ...
        }); */



        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!userId) {
            setTimeout(() => {
                setRender(_ => !_);
            }, 500);
        } else {
            setLoading(false);
        }
    }, [render]);

    return (
        <FirebaseContext.Provider value={{ ...data, onLogout: () => isLoggingOut.current = true }}>
            {!!data.fbUid && !loading && children}
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
