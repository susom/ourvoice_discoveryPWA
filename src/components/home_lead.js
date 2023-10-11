import {useState, useEffect, useContext} from "react";
import {SessionContext} from "../contexts/Session";

function HomeLead(props){
    const [signedIn, setSignedIn]   = useState(false);
    const session_context           = useContext(SessionContext);

    const discovery_text            = session_context.getTranslation("discovery_tool");
    const copyright_text            = session_context.getTranslation("copyright");
    const version                   = session_context.version;



    useEffect(() => {
        setSignedIn(props.signedIn);
    },[props.signedIn]);

    return  signedIn ? (
        <div className="view_lead">
            <h2>{discovery_text}</h2>
            <p>{version}</p>
            <cite>{copyright_text}</cite>
        </div>
    ) : (
        <div className="view_lead">
            <p>Thank you for your interest in the Discovery Tool</p>
            <p>The Discovery Tool is only available for use in approved projects.</p>
            <p>For more information please visit<br/><a href="https://ourvoice.stanford.edu">https://ourvoice.stanford.edu</a></p>
            <p>{version}</p>
            <cite>{copyright_text}</cite>
        </div>
    );
}

export default HomeLead;