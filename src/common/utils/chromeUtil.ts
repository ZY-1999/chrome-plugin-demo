export const getCurrentJsType = () => {
    const currentJsType = globalThis.currentJsType;
    if (currentJsType === undefined) {
        throw new Error('未初始化jsType');
    }
    return currentJsType;
};