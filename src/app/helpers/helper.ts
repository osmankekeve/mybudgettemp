
export const isInteger = (value: any): value is number => typeof value === 'number' && isFinite(value) && Math.floor(value) === value;

export const isExistIn = (f: string, s: string): boolean =>
    s.replace(/İ/, 'i')
        .toLowerCase()
        .indexOf(f.replace(/İ/, 'i')
            .toLowerCase()) > -1;

export const getFixedVersionNumber = (versionNo: string): number => {
    if (versionNo) {
        const vParts = versionNo.replace(/,/g, '.')
            .split('.');
        let version = '';
        for (const part of vParts) {
            version += part.padStart(3, '0');
        }

        const versionNumber = Number(version);
        if (versionNumber && Number.isInteger(versionNumber)) {
            return versionNumber;
        }
    }

    return 0;
};

export const removeItemFromArray = (array: Array<any>, item: any): void => {
    const index = array.indexOf(item, 0);
    if (index > -1) {
        array.splice(index, 1);
    }
};

export const removeItemFromArrayByFieldValue = (array: Array<any>, fieldName: string, fieldValue: any): void => {
    for (const item of array) {
        if (item[fieldName] === fieldValue) {
            removeItemFromArray(array, item);
            break;
        }
    }
};

export const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);

    return result;
};
