import { useEffect, useState } from "react";
import { auth } from "../database/Firebase";
import { signInAnonymously } from "firebase/auth";

const useAnonymousSignIn = () => {
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const signIn = async () => {
            try {
                if(!auth.currentUser){
                    const userCredential = await signInAnonymously(auth);
                    const user = userCredential.user;
                    console.log("userCredential", userCredential);
                    setUserId(user.uid);
                }
            } catch (error) {
                console.error("Error signing in anonymously:", error);
                setUserId(null);
            }
        };

        signIn();
    }, []);

    console.log("anonymous USERID ", userId);
    return userId;
};


export default useAnonymousSignIn;