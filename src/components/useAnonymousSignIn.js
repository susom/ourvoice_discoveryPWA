import { useEffect, useState } from "react";
import { auth } from "../database/Firebase";
import { signInAnonymously } from "firebase/auth";

const useAnonymousSignIn = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const signIn = async () => {
            try {
                if(!auth.currentUser){
                    await signInAnonymously(auth);
                    console.log("anonymous sign in!!");
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error("Error signing in anonymously:", error);
                setIsAuthenticated(false);
            }
        };

        signIn();
    }, []);

    return isAuthenticated;
};


export default useAnonymousSignIn;