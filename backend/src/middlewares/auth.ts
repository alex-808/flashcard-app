import { Request, Response } from 'express';
const checkUser = (req: Request, res: Response, next: any) => {
    if (req.session.user) {
        next();
    } else {
        res.sendStatus(401);
    }
};

export default checkUser;
