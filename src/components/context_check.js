import React, { useContext, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import MyContext from './MyContext';

function ContextCheck() {
    const { myValue } = useContext(MyContext);
    const history = useHistory();

    useEffect(() => {
        if (!myValue) {
            history.push('/');
        }
    }, [myValue, history]);
}