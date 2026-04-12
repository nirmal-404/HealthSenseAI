import { Request } from "express";

export interface XAuthUser {
    id: string;
    role: string;
}

export interface XRequest extends Request {
    user?: XAuthUser;
}
