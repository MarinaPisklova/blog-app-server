const fs = require('fs');
const jsonServer = require('json-server');
const path = require('path');

const server = jsonServer.create();

const router = jsonServer.router(path.resolve(__dirname, 'db.json'));

server.use(jsonServer.defaults({}));
server.use(jsonServer.bodyParser);

server.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'db.json'), 'UTF-8'));
        const { users = [] } = db;

        const userFromBd = users.find(
            (user) => user.username === username && user.password === password,
        );

        if (userFromBd) {
            return res.json(userFromBd);
        }

        return res.status(403).json({ message: 'User not found' });
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: e.message });
    }
});

server.put('/profiles/:id', (req, res) => {
    const profileId = req.params.id;
    const updates = req.body;

    const profile = router.db.get('profiles').find({ id: profileId }).value();

    if (!profile) {
        return res.status(404).send({ error: 'Profile not found' });
    }

    router.db.get('profiles').find({ id: profileId }).assign(updates).write();

    const userUpdates = {
        avatar: updates.avatar,
        name: updates.name,
    };
    router.db.get('users').find({ id: profileId }).assign(userUpdates).write();

    res.send(updates);
});

server.use((req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(403).json({ message: 'AUTH ERROR' });
    }
    next();
});

server.use(router);
server.listen(8000, () => {
    console.log('server is running on 8000 port');
});
