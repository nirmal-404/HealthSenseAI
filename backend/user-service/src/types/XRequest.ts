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
    role: string;
    displayName: string;
    phoneNumber: string;
}
