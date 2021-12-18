const express = require('express');
const router = new express.Router();
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user')
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account');
const CAST_ERROR = 'CastError';

router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        res.status(201).send( {user, token} );
    } catch (e) {
        res.status(400).send(e);
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send( {user, token} );
    } catch (e) {
        console.log(e);
        res.status(400).send();
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        // const user = req.user;
        // const tokenToRemoveIndex = user.tokens.findIndex(tokenElement => tokenElement.token === req.token);
        // user.tokens.splice(tokenToRemoveIndex, 1);
        // await user.save();

        req.user.tokens = req.user.tokens.filter((tokenElement) => {
            return tokenElement.token !== req.token;
        })
        await req.user.save();
        res.send();
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
})

router.patch('/users/me', auth, async (req, res) => {
    const allowedUpdated = ['name', 'age', 'email', 'password'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every((update) => allowedUpdated.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates !' });
    }

    try {
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        // const user = await User.findById(req.params.id);
        // if (!user) {
        //     return res.status(404).send();
        // }

        updates.forEach((fieldToUpdate) => req.user[fieldToUpdate] = req.body[fieldToUpdate]);
        await req.user.save();
        res.send(req.user);
    } catch (e) {
        res.status(400).send(e);
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        sendCancellationEmail(req.user.email, req.user.name);
        res.send(req.user);
    } catch (e) {
        res.status(500).send();
    }
})

const upload = multer({
    // dest: 'avatars',
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'));
        }
        
        // cb(new Error('File must be a PDF'));
        // cb(undefined, false)
        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        if (req.user.avatar) {
            req.user.avatar = undefined;
            await req.user.save();
        }
        res.send();
    } catch (e) {
        res.status(500).send();
    }
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) {
            throw new Error('User was not found or does not have ana avatar');
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (e) {
        res.status(404).send();
    }
})

module.exports = router;