import { Request } from 'express';
export interface XRequest extends Request {
    user: XAuthUser;
    headers: Request['headers'] & {
        files?: Array<{
            fileName: string;
            fileType: string;
        }>;
    };
}
export interface XAuthUser {
    id: number;
    email: string;
    displayName: string;
    phoneNumber: string;
    clientId: number;
    companyId: number;
    isMaster: boolean;
    isActive: boolean;
}
