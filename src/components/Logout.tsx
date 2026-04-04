'use client';
import { getAuth, signOut } from "firebase/auth";
import { useEffect } from "react";

const Logout = () => {

    useEffect(() => {
        const auth = getAuth();
        signOut(auth).then(() => {
            console.log('sign out')
        }).catch((error) => {
            console.log(error)
        })
    }, [])
    return <div>Logout</div>
}

export default Logout