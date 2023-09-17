import { Request, Response } from 'express';
export const hasSession = (req: Request, res: Response, next: any) => {
    if (req.session.sessionId) {
        next();
    } else {
        res.sendStatus(401);
    }
};

export const isSameUser = (req: Request, res: Response, next: any) => {
    if (req.session.sessionId!.toString() === req.params.userId) {
        next();
    } else {
        res.sendStatus(401);
    }
};
