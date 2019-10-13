export interface ProfileModel {
    primaryKey?: string;
    userPrimaryKey: string;
    longName?: string;
    mailAddress?: string;
    phone?: string;
    isMainRecord?: boolean;
    passwords?: string;
    insertDate: number;
}
