const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const sleep = require("util").promisify(setTimeout);
const { userOneId, userOne, setupDatabase } = require('./fixtures/db');

const nonExistentUser = {
    name: 'NoSuchUser',
    email: 'noSuchUser@example.com',
    password: 'NoSuchUserPassword'
}

beforeEach(setupDatabase);

test('Should signup a new user', async () => {
    await request(app).post('/users').send({
        name: 'Andrew',
        email: 'andrew@example.com',
        password: 'MyPass777!'
    }).expect(201);
})

test('Should login existing user', async () => {
    await sleep(1000);
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200);

    const user = await User.findById(userOneId);
    expect(response.body.token).toBe(user.tokens[1].token);
})

test('Should not login nonexistent user', async () => {
    await request(app).post('/users/login').send({
        email: nonExistentUser.email,
        password: nonExistentUser.password
    }).expect(400);
})

test('Should get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);
})

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401);
})

test('Should delete account for user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);

    const user = await User.findById(userOneId);
    expect(user).toBeNull();
})

test('Should not delete account for unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401);
})

test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200);
    
    const user = await User.findById(userOneId);
    expect(user.avatar).toEqual(expect.any(Buffer));
})

test('Should update valid user fields', async () => {
    const name = 'Test Name';
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name,
        })
        .expect(200);
    
    const user = await User.findById(userOneId);
    expect(user.name).toBe(name);
})

test('Should not update invalid user fields', async () => {
    const location = 'Test Location';
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            location,
        })
        .expect(400);
})