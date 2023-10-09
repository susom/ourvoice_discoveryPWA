import { useState, useEffect } from "react";
import { auth, firestore } from "../database/Firebase";

const useFirestore = (collectionName) => {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const querySnapshot = await firestore.collection(collectionName).get();
                const items = querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
                setData(items);
            } catch (error) {
                console.error("Error fetching data from Firestore:", error);
            }
        };

        if (auth.currentUser) {
            fetchData();
        }
    }, [auth.currentUser, collectionName]);

    const setDataToFirestore = async (item) => {
        try {
            await firestore.collection(collectionName).add(item);
        } catch (error) {
            console.error("Error adding data to Firestore:", error);
        }
    };

    return { data, setDataToFirestore };
};

export default useFirestore;