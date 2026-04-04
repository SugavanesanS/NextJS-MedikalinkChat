import { createContext, RefObject, useContext, useImperativeHandle, useRef, useState } from "react";


const data: {
    topRef: RefObject<(state: "A" | "B") => void | null>,
    bottomRef: RefObject<(state: "A" | "B") => void | null>,
    changeFunction: (state: "A" | "B") => void
}
    =
{
    topRef: { current: null },
    bottomRef: { current: null },
    changeFunction: (state: "A" | "B") => { },
}


export const TestContext = createContext({
    ...data
});

export const useTextContext = () => useContext(TestContext);

export const TestPage = () => {
    const topRef = useRef<(state: "A" | "B") => void | null>(null);
    const bottomRef = useRef<(state: "A" | "B") => void | null>(null);
    const [mainState, setMainState] = useState<"A" | "B">("A");
    const render = useRef(0);

    render.current = render.current + 1;
    console.log('render parent', render.current);


    return (
        <TestContext.Provider value={{
            topRef,
            bottomRef,
            changeFunction: (state: "A" | "B") => {
                if (topRef.current && bottomRef.current) {
                    topRef.current(state);
                    bottomRef.current(state);
                }
            }
        }}>
            <div className="react-multi-chat">
                <TopUI />
                <Between />
                <BottomUI />
            </div>
        </TestContext.Provider>
    )
}

export const TopUI = () => {
    const [state, setState] = useState<"A" | "B">("A");
    const testContext = useTextContext();
    useImperativeHandle(testContext.topRef, () => setState, []);
    console.log('render TopUI');
    return (
        <div onClick={() => testContext.changeFunction(state == "A" ? "B" : "A")} style={{
            cursor: 'pointer',
            padding: 20
        }}>
            {
                state
            }
        </div>
    )
}
export const BottomUI = () => {
    const [state, setState] = useState<"A" | "B">("A");
    const testContext = useTextContext();
    useImperativeHandle(testContext.bottomRef, () => setState, []);
    console.log('render BottomUI');
    return (
        <div onClick={() => testContext.changeFunction(state == "A" ? "B" : "A")} style={{
            cursor: 'pointer',
            padding: 20
        }}>
            {
                state
            }
        </div>
    )
}
export const Between = () => {
    console.log('render', 'Between');
    return (
        <div style={{
            padding: 20
        }}>
            Between
        </div>
    )
}