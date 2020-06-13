const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Author = require('../models/author');
const Book = require('../models/book');
const imageMimeTypes = ['image/jpeg', 'image/png', 'images/gif'];
const uploadPath = path.join('public', Book.coverImageBasePath);
const upload = multer({
    dest: uploadPath,
    fileFilter: (req, file, callback) => {
        callback(null, imageMimeTypes.includes(file.mimetype));
    }
})

// All books
router.get('/', async (req, res) => {
    let query = Book.find();
    if (req.query.title != null && req.query.title != '') {
        query = query.regex('title', new RegExp(req.query.title, 'i'));
    }
    if (req.query.publishedBefore != null && req.query.publishBefore != '') {
        query = query.lte('publishDate', req.query.publishBefore);
    }

    if (req.query.publishedAfter != null && req.query.publishedAfter != '') {
        query = query.lte('publishDate', req.query.publishedAfter);
    }

    try {
        const books = await query.exec();

        res.render('books/index', {
            books: books,
            searchOptions: req.query
        });
    } catch {
        res.redirect('/');
    }
});

//New Book Route
router.get('/new', async (req, res) => {
    renderNewPage(res, new Book());

});

//Create Book route
router.post('/', upload.single('cover'), async (req, res) => {
    const fileName = req.file != null ? req.file.filename : null;
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        coverImageName: fileName,
        description: req.body.description
    });

    try {
        const newBook = await book.save();
        //res.redirect(`books/${newBook.id}`);
        res.redirect('books');
    } catch (err) {
        if (book.coverImageName != null) {
            removeBookCover(book.coverImageName);
        }
        renderNewPage(res, book, err);
    }

});

function removeBookCover(fileName) {
    fs.unlink(path.join(uploadPath, fileName), err => {
        if (err) console.log(err);
    });
}

async function renderNewPage(res, book, err = null) {
    try {
        const authors = await Author.find({});
        let locals = {
            authors: authors,
            book: book
        };
        if (err != null) locals.errorMessage = err;

        res.render('books/new', locals);
    } catch {
        res.redirect('books');
    }
}


module.exports = router;