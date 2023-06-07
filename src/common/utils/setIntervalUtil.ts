/**
 * fn()报错会直接停止
 */
export const setInter = (fn: () => void, ms: number): void => {
    setTimeout(fn, 1);
    const timeOut = (fn: () => void, ms: number) => {
        setTimeout(() => {
            fn();
            timeOut(fn, ms);
        }, ms)
    }
    timeOut(fn, ms);
}