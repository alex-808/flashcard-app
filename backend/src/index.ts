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
        store: store,
    })
);

const port = 3000;

async function main() {
    await mongoose.connect(
        process.env.MONGODB_URI || 'mongodb://localhost:27017/test'
    );
}

main().catch((err) => console.log(err));

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});

interface User {
    name: string;
    email: string;
    password: string;
}

const userModel = mongoose.model('User', userSchema);

declare module 'express-session' {
    interface SessionData {
        views: number;
        user: User;
    }
}
app.get('/', function (req, res) {
    var body = '';
    if (req.session.views) {
        ++req.session.views;
    } else {
        req.session.views = 1;
        body +=
            '<p>First time visiting? view this page in several browsers :)</p>';
    }
    res.send(
        body + '<p>viewed <strong>' + req.session.views + '</strong> times.</p>'
    );
});

app.post('/register', (req: Request, res: Response) => {
    if (!req.body.name || !req.body.email || !req.body.password) {
        res.sendStatus(400);
        return;
    }

    const user = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
    };
    const newUser = new userModel({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
    });
    newUser.save().then(() => console.log('User saved!'));
    req.session.user = user;
    res.sendStatus(200);
});
app.get('/user', checkUser, (req: Request, res: Response) => {
    userModel.find().then((users) => res.send(users));
});

// Requires auth
app.post('/login', (req: Request, res: Response) => {
    if (!req.body.email || !req.body.password) {
        res.sendStatus(400);
        return;
    }
    const user = {
        email: req.body.email,
        password: req.body.password,
    };
    userModel.findOne({ email: req.body.email }).then((user) => {
        if (user) {
            const existingUser = user as User;
            if (user.password === req.body.password) {
                req.session.user = existingUser;
                res.sendStatus(200);
            } else {
                res.sendStatus(401);
            }
        } else {
            res.sendStatus(401);
        }
    });
});
app.post('/logout', checkUser, (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
    });
    res.send('Logged out');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

app.post('/user:userId/update', (req: Request, res: Response) => {});
app.post('/user:userId/delete', (req: Request, res: Response) => {});
