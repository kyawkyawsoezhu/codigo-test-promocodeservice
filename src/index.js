require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const qrcode = require("qrcode");
const CodeRain = require('coderain');
const Queue = require('bee-queue');

const db = require('./db');

const app = express();

app.use(bodyParser.json());

const queueOptions = {
    redis: {
        host: process.env.REDIS_HOST,
    },
};

const promoCodeGeneratorQueue = new Queue('promoCodeGenerator', queueOptions);

promoCodeGeneratorQueue.process(async (job, done) => {
    var cr = new CodeRain("99999-AAAAA");
    await Promise.all(Array(job.data.quantity).fill(undefined).map(async () => {
        const code = cr.next();
        const qrImage = await qrcode.toDataURL(code, { version: 2 });

        const data = {
            voucherId: job.data.id,
            code,
            qrImage
        };

        db().query('INSERT INTO items SET ?', data);
    }));
    console.log("queue done")
    done();
});

app.post('/promocodes', async (req, res) => {
    db().query('SELECT * FROM vouchers WHERE `id` = ?', [req.body.voucherId], function (error, results, fields) {
        if (error) throw error;

        if (!results.length) return res.send('Not Found');

        promoCodeGeneratorQueue.createJob({
            id: results[0].id,
            quantity: results[0].quantity,
        }).save().then(() => {
            res.json({ done: true });
        }).catch(() => {
            res.json({ done: false, fail: true });
        });
    });
});

const port = process.env.APP_PORT;
app.listen(port, () => {
    console.log(`Promocode Service listening at http://localhost:${port}`);
});
