import { Schema } from 'mongoose';
import express, { Request, Response } from 'express';
import checkUser from '../middlewares/auth';
import { userModel } from '../models/User';

const router = express.Router();

type SessionUser = {
    id: Schema.Types.ObjectId;
    username: string;
    email: string;
};
declare module 'express-session' {
    interface SessionData {
        views: number;
        user: SessionUser;
    }
}

router.post('/register', async (req: Request, res: Response) => {
    // TODO validate email
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        res.sendStatus(400);
        return;
    }

    const newUser = new userModel({
        username: username,
        email: email,
        password: password,
    });

    try {
        await newUser.save();
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
        return;
    }

    res.sendStatus(200);
});

router.post('/login', async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    if (!(username || email) || !password) {
        res.sendStatus(400);
        return;
    }

    const result = await userModel.findOne({
        $or: [{ email: req.body.email }, { username: req.body.username }],
    });

    // I was able to get rid of valiation here by fixing the typing of userModel
    const user = new userModel(result);

    if (!user) return res.sendStatus(401);

    // just successfully added a method to the schema
    if (!user.comparePassword(req.body.password)) return res.sendStatus(401);

    const sessionUser: SessionUser = {
        id: user._id,
        username: user.username,
        email: user.email,
    };
    // grants session
    req.session.user = sessionUser;
    res.sendStatus(200);
});

router.post('/logout', checkUser, (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
            res.sendStatus(500);
            return;
        }
    });
    res.clearCookie('connect.sid');
    res.sendStatus(200);
});

router.param(
    'userId',
    (req: Request, res: Response, next: any, userId: string) => {
        //TODO find user by id and create model
        next();
    }
);

router.get('/:userId', checkUser, async (req: Request, res: Response) => {
    // this functionality should be in the model
    const result = await userModel.findOne({ _id: req.params.userId });
    if (!result) return res.sendStatus(404);

    const user = {
        _id: result._id,
        username: result.username,
        email: result.email,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
    };

    // userId, username, email, created_at, updated_at
    res.send(user);
});

router.post('/user:userId/update', (req: Request, res: Response) => {});
router.post('/user:userId/delete', checkUser, (req: Request, res: Response) => {
    // must be logged in
    // must be that user
    // if (req.params.userId === req.session.user.id) {
    // console.log('delete user');
    // }
    // delete user;
});

export default router;
