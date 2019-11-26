export class ProfileModel {
    primaryKey?: string;
    userPrimaryKey: string;
    longName?: string;
    mailAddress?: string;
    phone?: string;
    isMainRecord?: boolean;
    passwords?: string;
    type?: string; // admin, manager, user
    isActive?: boolean;
    birthDate?: number;
    insertDate: number;
}
