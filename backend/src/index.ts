import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import session from 'express-session';

dotenv.config();
const app: Express = express();

const MongoStore = require('connect-mongodb-session')(session);
const store = new MongoStore({
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
    databaseName: 'test',
    collection: 'sessions',
});
app.use(express.urlencoded({ extended: true }));

const checkUser = (req: Request, res: Response, next: any) => {
    if (req.session.user) {
        next();
    } else {
        res.sendStatus(401);
    }
};
app.use(
    session({
        resave: false,
        saveUninitialized: false, // Only send a cookie when the session has been modified
        secret: 'SECRET',
        store: store, // Sessions are stored in the database and checked against on each request
    })
);

const port = 3000;

async function main() {
    await mongoose.connect(
        process.env.MONGODB_URI || 'mongodb://localhost:27017/test'
    );
}

main().catch((err) => console.log(err));

const userSchema = new mongoose.Schema(
    {
        username: String,
        email: String,
        password: String,
        id: String,
    },
    { timestamps: true }
);

interface User {
    username: string;
    email: string;
    password: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const userModel = mongoose.model('User', userSchema);

declare module 'express-session' {
    interface SessionData {
        views: number;
        user: User;
    }
}

app.post('/register', async (req: Request<{}, {}, User>, res: Response) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        res.sendStatus(400);
        return;
    }

    const existingUser = await userModel.findOne({
        $or: [{ email: req.body.email }, { username: req.body.username }],
    });
    if (existingUser) {
        const error =
            existingUser.email === req.body.email
                ? 'Email already exists'
                : 'Username already exists';
        return res.status(409).send({
            error: error,
        });
    }

    const registrationData: User = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
    };

    const newUser = new userModel({
        username: username,
        email: email,
        password: password,
    });
    // do we need to pull out an id here if we don't initiate a session?
    const { _id } = await newUser.save();

    if (!_id) return res.sendStatus(500);

    registrationData.id = _id.toString();
    req.session.user = registrationData;
    res.sendStatus(200);
});

app.post('/login', async (req: Request, res: Response) => {
    if (!(req.body.username || req.body.email) || !req.body.password) {
        res.sendStatus(400);
        return;
    }

    const user = await userModel.findOne({
        $or: [{ email: req.body.email }, { username: req.body.username }],
    });

    console.log(user);

    if (!user) return res.sendStatus(401);

    if (user.password !== req.body.password) return res.sendStatus(401);

    if (!user._id || !user.username || !user.email || !user.password)
        return res.sendStatus(500);
    const sessionUser: User = {
        username: user.username,
        email: user.email,
        password: user.password,
        id: user._id.toString(),
    };
    // grants session
    req.session.user = sessionUser;
    res.sendStatus(200);
});

app.post('/logout', checkUser, (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
    });
    res.clearCookie('connect.sid');
    res.sendStatus(200);
});

app.get('/user:userId', checkUser, async (req: Request, res: Response) => {
    const result = await userModel.findOne({ _id: req.params.userId });
    if (!result) return res.sendStatus(404);

    if (
        !result.username ||
        !result.email ||
        !result.createdAt ||
        !result.updatedAt
    )
        return res.sendStatus(500);

    // How do I define a User type when in some contexts it needs a password and in others it doesn't?
    const user: User = {
        username: result.username,
        email: result.email,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        password: '',
    };
    res.send(user);
    // userId, username, email, created_at, updated_at
});

app.post('/user:userId/update', (req: Request, res: Response) => {});
app.post('/user:userId/delete', checkUser, (req: Request, res: Response) => {
    // must be logged in
    // must be the user
    // But what about admin users?
    //if (req.params.userId === req.session.user.id) {
    // console.log('delete user');
    // }
    // delete user
});

app.post('/generate/deck', (req: Request, res: Response) => {
    if (!req.body.sourceContent) {
        res.sendStatus(400);
        return;
    }
    // create message and send to queue
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
