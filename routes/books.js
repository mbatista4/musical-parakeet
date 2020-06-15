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
        res.redirect(`books/${newBook.id}`);

    } catch (err) {
        renderNewPage(res, book, err);
    }

});

// Show Single Book Route
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id).populate('author').exec();
        res.render('books/show', {
            book: book
        });

    } catch {

    }
})

//Edit Book Route
router.get('/:id/edit', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        renderEditPage(res, book);
    } catch {
        res.redirect('/');
    }
});

//Update Book route
router.put('/:id', async (req, res) => {
    let book;

    try {
        book = await Book.findById(req.params.id);

        book.title = req.body.title
        book.author = req.body.author
        book.publishDate = new Date(req.body.publishDate)
        book.pageCount = req.body.pageCount
        book.description = req.body.description

        if (req.body.cover != null && req.body.cover !== '')
            saveCover(book, req.body.cover);


        await book.save();
        res.redirect(`/books/${book.id}`);

    } catch (err) {
        if (book != null) {
            renderEditPage(res, book, err);
        } else {
            res.redirect('/');
        }
    }

});

router.delete('/:id', async (req, res) => {
    let book;

    try {
        book = await Book.findById(req.params.id);
        await book.remove();
        res.redirect('/books');
    } catch {
        if (book != null) {
            res.render('books/show', {
                book: book,
                errorMessage: 'Could not remove Book'
            });
        } else {
            res.redirect('/');
        }
    }
});


// used as middleWare to render new Page
async function renderNewPage(res, book, err = null) {
    renderFormPage(res, book, 'new', err)
}


// used as middleWare to render new Page
async function renderEditPage(res, book, err = null) {
    renderFormPage(res, book, 'edit', err);
}


// used as middleWare to render Pages
async function renderFormPage(res, book, form, err = null) {
    try {
        const authors = await Author.find({});
        let locals = {
            authors: authors,
            book: book
        };
        if (err != null) locals.errorMessage = err;

        res.render(`books/${form}`, locals);
    } catch {
        res.redirect('books');
    }
}


// Save Cover Image To DB
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