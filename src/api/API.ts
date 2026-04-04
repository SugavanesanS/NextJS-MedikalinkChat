'use client';
import { useCallback, useState } from "react";
import { LocalStorageKey } from "../services/Constants";
import { AllApiTypes, useGetType, usePostType } from "../types/ApiTypes";
import { AppURL } from "./AppURL";



export const GetReferenceKey = () => {
    const id = window.sessionStorage.getItem(LocalStorageKey.REFERENCE_KEY) || ('8974|9COQumdp9X4kRZnSfFbGarQuhjeA80eOGI5bNfHt') //'36|hKmLdGPogthAtjrqe6VnHAmSfOgs1flhGyJ7J8d1'
    return id
}


const PostHeaders = {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    'credentials': 'include'
};

const GetHeaders = {
    method: "GET",
    headers: {
        "Content-Type": "application/json",
    },
    'credentials': 'include'
};

export const AppFetch = async (url, requestBody) => {
    requestBody?.headers ? requestBody.headers.Authorization = `Bearer ${GetReferenceKey()}` : requestBody.headers = { Authorization: `Bearer ${GetReferenceKey()}` }
    if (requestBody?.method == "POST") {
        const csrf = (document.head.querySelector('meta[name="csrf-token"]') as any)?.content || '58tJ1SuopeSc7uOwqzNV4fy8IV7YZjOaU4fr2yJB'
        if (requestBody?.body instanceof FormData) {
            requestBody?.body.append('_token', csrf)
        } else {
            const tokenedBody = requestBody?.body ? requestBody?.body : {}
            requestBody.body = JSON.stringify({
                ...tokenedBody,
                _token: csrf
            })
        }
    }
    return fetch(url, requestBody)
}

export const useGet: useGetType = ({ endpoint }: { endpoint: keyof AllApiTypes }) => {
    const [loader, setLoader] = useState(false);
    const [body, setBody] = useState<{
        reqBody?: any;
    }>();
    const get = useCallback(async (newBody) => {
        const apiBody = newBody || body;
        setBody(apiBody);
        const params = new URLSearchParams({
            ...(apiBody?.reqBody ? JSON.parse(JSON.stringify(apiBody?.reqBody)) : {})
        });

        setLoader(true);

        try {
            const response = await AppFetch(
                `${AppURL.BASE_URL}${endpoint}?${params}`,
                { ...GetHeaders }
            );

            if (!response.ok) {
                const error = await response.json();
                throw error;
            }

            const data = await response.json();
            return data;
        } catch (error: any

        ) {
            throw error?.response?.data || error;
        } finally {
            setLoader(false);
        }
    }, [body]);

    return { get, loader };
};


export const usePost: usePostType = ({ endpoint, formData }) => {
    const [loader, setLoader] = useState(false);
    const post = useCallback(async (apiBody) => {
        setLoader(true);

        try {
            const response = await AppFetch(
                `${AppURL.BASE_URL}${endpoint}`,
                formData ?
                    {
                        method: 'POST',
                        body: apiBody.reqBody,
                        credentials: 'include'
                    } :
                    {

                        body: apiBody.reqBody,
                        ...PostHeaders,
                    }
            );

            if (!response.ok) {
                const error = await response.json();
                throw error;
            }

            const data = await response.json();
            return data;
        } catch (error: any) {
            console.log(error)
            throw error
        } finally {
            setLoader(false);
        }
    }, []);

    return { post, loader };
};
