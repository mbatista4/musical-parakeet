const express = require('express');
const router = express.Router();
const Author = require('../models/author');
const Book = require('../models/book');
const imageMimeTypes = ['image/jpeg', 'image/png', 'images/gif'];

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
        query = query.gte('publishDate', req.query.publishedAfter);
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
router.post('/', async (req, res) => {
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        description: req.body.description
    });

    saveCover(book, req.body.cover);

    try {
        const newBook = await book.save();
        //res.redirect(`books/${newBook.id}`);
        res.redirect('books');
    } catch (err) {
        renderNewPage(res, book, err);
    }

});

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

function saveCover(book, coverEncoded) {

    if (coverEncoded == null)
        return;

    const cover = JSON.parse(coverEncoded);

    if (cover != null && imageMimeTypes.includes(cover.type)) {
        book.coverImage = new Buffer.from(cover.data, 'base64');
        book.coverImageType = cover.type;
    }
}
module.exports = router;