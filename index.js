// import packages
const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');
const multer = require('multer');
const bcrypt = require('bcrypt');

const File = require('./models/File');
const { urlencoded } = require('express');
const dotenv = require('dotenv').config();

const upload = multer({ dest: 'uploads/' });

// initialize express
const app = express();

app.use(express.urlencoded({ extended: true }));

// express static files
app.use(express.static('public'));



// set view engine
app.set('view engine', 'ejs');

// connect to database
mongoose.connect("mongodb+srv://test:test@filedb.tpz8xp7.mongodb.net/?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true }, () => {
    console.log('connected to db');
}
);

// test route
app.get('/', (req, res) => {
    res.render('index');
});

app.post("/upload", upload.single('file'), async (req, res) => {
    const fileData = new File({
        path: req.file.path,
        originalname: req.file.originalname
    });

    if (req.body.password != "") {
        fileData.password = await bcrypt.hashSync(req.body.password, 10);
    }

    const file = await File.create(fileData);
    res.render('link', { url: `${req.headers.origin}/file/${file.id}` });
});

app.route('/file/:id').get(getFile).post(postFile);

function getFile(req, res) {
    File.findById(req.params.id, (err, file) => {
        if (err) {
            res.send('File not found');
        } else {
            if (file.parasword != null) {
                res.render('password', { id: file.id });
            } else {
                res.download(file.path, file.originalname);
            }
        }
    });
}

function postFile(req, res) {
    File.findById(req.params.id, (err, file) => {
        if (err) {
            res.send('File not found');
        } else {
            if (bcrypt.compareSync(req.body.password, file.password)) {
                res.download(file.path, file.originalname);
            } else {
                res.send('wrong password');
            }
        }
    });
}

const port = process.env.PORT || 3000;

// listen to port
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}
);
