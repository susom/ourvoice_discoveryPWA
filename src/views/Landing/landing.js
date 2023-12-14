import {useContext, useState} from "react";
import {Navigate} from "react-router-dom";

import {updateContext} from "../../components/util";
import {SessionContext} from "../../contexts/Session";

import "../../assets/css/view_splash.css";

export function Landing(){
    const session_context = useContext(SessionContext);
    const [redirectNow, setRedirectNow] = useState(false);

    // accessSecret();

    setTimeout(() => {
        updateContext(session_context, {"splash_viewed" : true});
        setRedirectNow(true);
    }, 3000); //3 secs

    return redirectNow ?
        (
            <Navigate to={{pathname: '/home'}} />
        )
        :
        (
            <div id="splashScreen">
                <h1>Our Voice Discovery Tool</h1>
            </div>
        );
}
