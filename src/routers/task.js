const express = require('express');
const Task = require('../models/task')
const router = new express.Router();
const auth = require('../middleware/auth')
const CAST_ERROR = 'CastError';

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt_desc
router.get('/tasks', auth, async (req, res) => {
    const match = {};
    const sort = {};
    if (req.query.completed) {
        match.completed = req.query.completed === 'true';
    }

    if (req.query.sortBy) {
        const splitSortBy = req.query.sortBy.split(':');
        sort[splitSortBy[0]] = splitSortBy[1] === 'desc' ? -1 : 1;
    }
    
    try {
        // const tasks = await Task.find({ owner: req.user._id });
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        });
        res.send(req.user.tasks);
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;

    try {
        // const task = await Task.findById(_id);
        const task = await Task.findOne({_id, owner: req.user._id});
        if (!task) {
            return res.status(404).send();
        }

        res.send(task);
    } catch (e) {
        let statusCode = e.name === CAST_ERROR ? 400 : 500;
        let errorMessage = e.name === CAST_ERROR ? 'Invalid id (should be 12 characters)' : '';
        res.status(statusCode).send(errorMessage);
    }
})

router.post('/tasks', auth, async (req, res) => {
    try {
        // const task = new Task(req.body);
        // task.owner = req.user._id;
        const task = new Task({
            ...req.body,
            owner: req.user._id
        })
        await task.save();
        res.status(201).send(task);
    } catch (e) {
        res.status(400).send(e);
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const allowedUpdated = ['description', 'completed'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every((update) => allowedUpdated.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates !' });
    }

    try {
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        // const task = await Task.findById(req.params.id);
        const task = await Task.findOne( { _id: req.params.id, owner: req.user._id} );
        if (!task) {
            return res.status(404).send();
        }

        updates.forEach((fieldToUpdate) => task[fieldToUpdate] = req.body[fieldToUpdate]);
        await task.save();
        res.send(task);

    } catch (e) {
        res.status(400).send(e);
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        // const task = await Task.findByIdAndDelete(req.params.id);
        const task = await Task.findOneAndDelete( {_id: req.params.id, owner: req.user._id} );
        if (!task) {
            res.status(404).send();
        }

        res.send(task);
    } catch (e) {
        res.status(500).send();
    }
})

module.exports = router;