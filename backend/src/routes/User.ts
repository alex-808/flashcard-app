import { Schema } from 'mongoose';
import express, { Request, Response } from 'express';
import { hasSession, isSameUser } from '../middlewares/auth';
import { userModel } from '../models/User';
import validator from 'validator';

const router = express.Router();

declare module 'express-session' {
    interface SessionData {
        sessionId: Schema.Types.ObjectId;
    }
}

// I'll need to add validations to limit the length of the username and password and enforce a certain password strength

router.post('/register', async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        res.status(400).send('Username, email, and password required');
        return;
    }

    if (!validator.isEmail(email)) {
        res.status(400).send('Invalid email');
        return;
    }

    try {
        if (await userModel.isUsernameTaken(username))
            return res.status(400).send('Username already exists');
        if (await userModel.isEmailTaken(email))
            return res.status(400).send('Email already exists');

        const newUser = new userModel({
            username: username,
            email: email,
            password: password,
        });

        await newUser.save();
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
});

router.post('/login', async (req: Request, res: Response) => {
    if (req.session.sessionId) return res.status(200).send('Already logged in');

    const { username, email, password } = req.body;

    if (!(username || email) || !password) {
        res.status(400).send('Username/email and password required');
        return;
    }

    let result;
    try {
        const query = email ? { email: email } : { username: username };
        result = await userModel.findOne(query);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
        return;
    }
    if (!result) return res.status(401).send('Invalid credentials');

    const user = new userModel(result);

    if (!user.comparePassword(req.body.password))
        return res.status(401).send('Invalid credentials');

    // grants session
    req.session.sessionId = user._id;
    res.sendStatus(200);
});

router.post('/logout', (req: Request, res: Response) => {
    if (!req.session.sessionId) return res.status(401).send('Not logged in');
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
            return;
        }
    });
    res.clearCookie('connect.sid');
    res.sendStatus(200);
});

router.get('/:userId', hasSession, async (req: Request, res: Response) => {
    let result;
    try {
        result = await userModel.findOne({ _id: req.params.userId });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
        return;
    }

    if (!result) return res.sendStatus(404);

    result = result.toObject();

    const user = {
        _id: result._id,
        username: result.username,
        createdAt: result.createdAt,
    };
    res.send(user);
});

router.post(
    '/:userId/delete',
    [hasSession, isSameUser],
    async (req: Request, res: Response) => {
        let result;
        try {
            result = await userModel.deleteOne({ _id: req.params.userId });
        } catch (err) {
            console.error(err);
            res.sendStatus(500);
            return;
        }
        if (result.deletedCount === 0) return res.sendStatus(404);

        req.session.destroy((err) => {
            if (err) {
                console.error(err);
                res.sendStatus(500);
                return;
            }
        });
        res.clearCookie('connect.sid');
        res.sendStatus(200);
    }
);

router.post(
    '/:userId/update',
    [hasSession, isSameUser],
    async (req: Request, res: Response) => {
        const { userId } = req.params;
        const { username, email, password } = req.body;

        let user;
        try {
            user = await userModel.findOne({ _id: userId });

            if (!user) return res.sendStatus(404);

            if (email) {
                if (!validator.isEmail(email)) {
                    res.status(400).send('Invalid email');
                    return;
                }
                const emailIsTaken = await userModel.isEmailTaken(email);
                if (emailIsTaken)
                    return res.status(400).send('Email already exists');
                user.email = email;
            }

            if (username) {
                const usernameIsTaken = await userModel.isUsernameTaken(
                    username
                );
                if (usernameIsTaken)
                    return res.status(400).send('Username already exists');
                user.username = username;
            }

            if (password) user.password = password;

            await user.save();
        } catch (err) {
            console.error(err);
            res.sendStatus(500);
            return;
        }
        return res.sendStatus(200);
    }
);

export default router;
