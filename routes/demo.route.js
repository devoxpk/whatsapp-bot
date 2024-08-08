const express = require('express');
const router = express.Router();

// Define your demo routes here
router.get('/', (req, res) => {
    res.status(200).json({
        title: 'Demo Route',
        message: 'This is the demo route!',
    });
});

module.exports = router;
